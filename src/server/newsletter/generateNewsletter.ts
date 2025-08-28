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
    //TODO: add better validation that since newsletter:issue mapping is 1:1
    console.log("Checking for existing newsletter...");
    const existingIssue = await issueRepo
      .findByStatus("draft")
      .then((issues) => issues.find((issue) => issue.topicId === topicId));

    if (existingIssue) {
      console.log(
        `Newsletter already exists for topic ${topicId} (Issue ID: ${existingIssue.id})`,
      );
      return { success: true };
    }

    // Step 3: Generate newsletter content
    const newsletterStartTime = Date.now();
    console.log(`Generating newsletter for topic: "${topic.title}"`);

    const prompt = newsletterPrompt(topic.title);
    const content = await generateNewsletter({
      prompt,
    });

    const newsletterDuration = Date.now() - newsletterStartTime;
    console.log(`Newsletter generation completed (${newsletterDuration}ms)`);

    // Step 4: Validate newsletter content
    //TODO: add more validation here
    console.log("Validating newsletter content...");

    // Step 5: Save to database
    console.log("Saving newsletter to database...");
    const createdIssue = await issueRepo.create({
      topicId: topic.id,
      title: `${topic.title} - System Design Newsletter`,
      content: content,
      status: "draft",
    });

    if (!createdIssue) {
      throw new Error("Failed to create newsletter issue in database");
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(
      `Newsletter generation completed successfully. Issue ID: ${createdIssue.id}, Duration: ${duration}ms`,
    );

    return { success: true };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error(`Newsletter generation failed after ${duration}ms:`, error);
    throw error;
  }
}
