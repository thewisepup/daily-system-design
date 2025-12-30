import { topicRepo } from "~/server/db/repo/topicRepo";
import { issueRepo } from "~/server/db/repo/issueRepo";
import { newsletterPrompt } from "~/server/llm/prompts.ts/newsletterPrompt";
import { newsletterService } from "../services/NewsletterService";
import { convertContentJsonToHtml } from "~/server/email/templates/newsletterTemplate";
import { TopicResponseSchema } from "~/server/llm/schemas/topics";

export async function generateNewsletterForTopic(topicId: number) {
  const startTime = Date.now();
  const logPrefix = `[Topic ${topicId}]`;

  try {
    // Step 1: Fetch topic details
    console.log(`${logPrefix} Fetching topic details...`);
    const topic = await topicRepo.findById(topicId);
    if (!topic) {
      console.error(`${logPrefix} Topic not found`);
      throw new Error(`Topic with ID ${topicId} does not exist`);
    }

    // Step 2: Check if newsletter already exists for this topic
    console.log(`${logPrefix} Checking for existing newsletter...`);
    const existingIssue = await issueRepo.findByTopicId(topicId);

    if (existingIssue) {
      console.log(
        `${logPrefix} Newsletter already exists (Issue ID: ${existingIssue.id}, Status: ${existingIssue.status})`,
      );
      return { success: true };
    }

    // Step 3: Create newsletter issue with generating status
    console.log(
      `${logPrefix} Creating newsletter issue with generating status...`,
    );
    const createdIssue = await issueRepo.create({
      topicId: topic.id,
      title: `${topic.title}`,
      status: "generating",
    });

    if (!createdIssue) {
      console.error(
        `${logPrefix} Failed to create newsletter issue in database`,
      );
      throw new Error("Failed to create newsletter issue in database");
    }
    console.log(`${logPrefix} Created issue ID: ${createdIssue.id}`);

    // Step 4: Generate newsletter content
    const newsletterStartTime = Date.now();
    console.log(`${logPrefix} Generating newsletter content...`);

    try {
      // Validate and parse topicData from JSON column
      const validatedTopicData = TopicResponseSchema.parse(topic.topicData);
      const prompt = newsletterPrompt(validatedTopicData);
      const response = await newsletterService.generateContent(prompt);

      const newsletterDuration = Date.now() - newsletterStartTime;
      console.log(
        `${logPrefix} Newsletter generation completed (${newsletterDuration}ms)`,
      );

      // Step 5: Validate newsletter content
      //TODO: add more validation here

      // Step 6: Update issue with generated content and draft status
      console.log(`${logPrefix} Generating rawHtml and updating database...`);

      // Generate rawHtml from contentJson for template-based email sending
      const rawHtml = convertContentJsonToHtml(response, `${topic.title}`);
      const updatedIssue = await issueRepo.update(createdIssue.id, {
        contentJson: response,
        rawHtml: rawHtml,
        status: "draft",
      });

      if (!updatedIssue) {
        console.error(
          `${logPrefix} Failed to update newsletter issue with generated content`,
        );
        throw new Error(
          "Failed to update newsletter issue with generated content",
        );
      }
      console.log(`${logPrefix} Successfully updated issue to draft status`);
    } catch (generateError) {
      // Update issue status to failed on generation error
      console.error(
        `${logPrefix} Newsletter generation failed, updating status to failed:`,
        generateError,
      );
      await issueRepo.update(createdIssue.id, {
        status: "failed",
      });
      throw generateError;
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(
      `${logPrefix} Newsletter generation completed successfully. Issue ID: ${createdIssue.id}, Total duration: ${duration}ms`,
    );

    return { success: true, issueId: createdIssue.id };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error(
      `${logPrefix} Newsletter generation failed after ${duration}ms:`,
      error,
    );
    throw error;
  }
}
