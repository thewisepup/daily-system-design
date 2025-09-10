import { topicRepo } from "~/server/db/repo/topicRepo";
import { issueRepo } from "~/server/db/repo/issueRepo";
import { newsletterPrompt } from "~/server/llm/prompts.ts/newsletterPrompt";
import { generateNewsletter } from "../llm/requests/generateNewsletter";

export async function generateNewsletterForTopic(topicId: number) {
  const startTime = Date.now();

  try {
    // Step 1: Fetch topic details
    console.log(`Fetching topic with ID ${topicId}...`);
    const topic = await topicRepo.findById(topicId);
    if (!topic) {
      throw new Error(`Topic with ID ${topicId} does not exist`);
    }

    // Step 2: Check if newsletter already exists for this topic
    console.log("Checking for existing newsletter...");
    const existingIssue = await issueRepo.findByTopicId(topicId);

    if (existingIssue) {
      console.log(
        `Newsletter already exists for topic ${topicId} (Issue ID: ${existingIssue.id}, Status: ${existingIssue.status})`,
      );
      return { success: true };
    }

    // Step 3: Create newsletter issue with generating status
    console.log("Creating newsletter issue with generating status...");
    const createdIssue = await issueRepo.create({
      topicId: topic.id,
      title: `${topic.title}`,
      content: null, // No content yet - will be populated after generation
      status: "generating",
    });

    if (!createdIssue) {
      throw new Error("Failed to create newsletter issue in database");
    }

    // Step 4: Generate newsletter content
    const newsletterStartTime = Date.now();
    console.log(`Generating newsletter for topic: "${topic.title}"`);

    try {
      const prompt = newsletterPrompt(topic.title);
      const content = await generateNewsletter({
        prompt,
      });

      const newsletterDuration = Date.now() - newsletterStartTime;
      console.log(`Newsletter generation completed (${newsletterDuration}ms)`);

      // Step 5: Validate newsletter content
      //TODO: add more validation here
      //console.log("Validating newsletter content...");

      // Step 6: Update issue with generated content and draft status
      console.log("Updating newsletter in database with generated content...");
      const updatedIssue = await issueRepo.update(createdIssue.id, {
        content: content,
        status: "draft",
      });

      if (!updatedIssue) {
        throw new Error(
          "Failed to update newsletter issue with generated content",
        );
      }
    } catch (generateError) {
      // Update issue status to failed on generation error
      console.error(
        "Newsletter generation failed, updating status to failed:",
        generateError,
      );
      await issueRepo.update(createdIssue.id, {
        status: "failed",
        content: `Generation failed: ${generateError instanceof Error ? generateError.message : "Unknown error"}`,
      });
      throw generateError;
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(
      `Newsletter generation completed successfully. Issue ID: ${createdIssue.id}, Duration: ${duration}ms`,
    );

    return { success: true, issueId: createdIssue.id };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error(`Newsletter generation failed after ${duration}ms:`, error);
    throw error;
  }
}
