import { complete } from "../llm/openRouterClient";
import {
  NewsletterResponseSchema,
  type NewsletterResponse,
} from "../llm/schemas/newsletter";
import { TopicResponseSchema } from "../llm/schemas/topics";
import { topicRepo } from "../db/repo/topicRepo";
import { issueRepo } from "../db/repo/issueRepo";
import { newsletterPrompt } from "../llm/prompts.ts/newsletterPrompt";
import { convertContentJsonToHtml } from "../email/templates/newsletterTemplate";
import type { Topic } from "../db/schema/topics";
import type { Issue } from "../db/schema/issues";
import { Effort } from "@openrouter/sdk/models";

interface GenerateNewsletterResult {
  success: boolean;
  issueId?: number;
}

class NewsletterService {
  /**
   * Generates a newsletter for a given topic.
   * @param topicId - The topic ID to generate a newsletter for
   * @returns Result containing success status and issueId
   *
   * @throws {Error} When topic does not exist
   * @throws {Error} When newsletter already exists for this topic
   * @throws {Error} When database operations fail
   * @throws {Error} When LLM generation fails (issue status set to "failed")
   */
  async generateNewsletterForTopic(
    topicId: number,
  ): Promise<GenerateNewsletterResult> {
    const topic = await this.fetchAndValidateTopic(topicId);

    await this.ensureNoExistingNewsletter(topicId);

    const issue = await this.createGeneratingIssue(topic);

    try {
      await this.generateAndSaveContent(issue, topic);
      return { success: true, issueId: issue.id };
    } catch (error) {
      console.error(
        `[Topic ${topicId}] Newsletter generation failed, updating status to failed:`,
        error,
      );

      try {
        await issueRepo.update(issue.id, {
          status: "failed",
        });
      } catch (statusUpdateError) {
        console.error(
          `[Topic ${topicId}] Failed to update issue status to 'failed':`,
          statusUpdateError,
        );
      }

      throw error;
    }
  }

  /**
   * Fetches a topic by ID and validates it exists.
   * @throws {Error} When topic does not exist
   */
  private async fetchAndValidateTopic(topicId: number): Promise<Topic> {
    console.log(`[Topic ${topicId}] Fetching topic details...`);
    const topic = await topicRepo.findById(topicId);

    if (!topic) {
      console.error(`[Topic ${topicId}] Topic not found`);
      throw new Error(`Topic with ID ${topicId} does not exist`);
    }

    return topic;
  }

  /**
   * Ensures no newsletter exists for this topic.
   * @throws {Error} When a newsletter already exists for this topic
   */
  private async ensureNoExistingNewsletter(topicId: number): Promise<void> {
    console.log(`[Topic ${topicId}] Checking for existing newsletter...`);
    const existingIssue = await issueRepo.findByTopicId(topicId);

    if (existingIssue) {
      throw new Error(
        `Newsletter already exists for topic ${topicId} (Issue ID: ${existingIssue.id}, Status: ${existingIssue.status})`,
      );
    }
  }

  /**
   * Creates a new issue with "generating" status.
   * @throws {Error} When issue creation fails
   */
  private async createGeneratingIssue(topic: Topic): Promise<Issue> {
    console.log(
      `[Topic ${topic.id}] Creating newsletter issue with generating status...`,
    );

    const createdIssue = await issueRepo.create({
      topicId: topic.id,
      title: topic.title,
      status: "generating",
    });

    if (!createdIssue) {
      console.error(
        `[Topic ${topic.id}] Failed to create newsletter issue in database`,
      );
      throw new Error("Failed to create newsletter issue in database");
    }

    console.log(`[Topic ${topic.id}] Created issue ID: ${createdIssue.id}`);
    return createdIssue;
  }

  /**
   * Generates newsletter content via LLM, converts to HTML, and saves to database.
   * @throws {Error} When LLM generation or database update fails
   */
  private async generateAndSaveContent(
    issue: Issue,
    topic: Topic,
  ): Promise<void> {
    const startTime = Date.now();
    console.log(
      `${topic.title} [Topic ${topic.id}] Generating newsletter content`,
    );

    const validatedTopicData = TopicResponseSchema.parse(topic.topicData);
    const prompt = newsletterPrompt(validatedTopicData);

    const response = await complete<NewsletterResponse>({
      prompt,
      schema: NewsletterResponseSchema,
      schemaName: "newsletter_response",
      reasoning: {
        effort: Effort.Medium,
      },
    });

    const duration = Date.now() - startTime;
    console.log(
      `[Topic ${topic.id}] Newsletter generation completed (${duration}ms)`,
    );

    console.log(
      `[Topic ${topic.id}] Generating rawHtml and updating database...`,
    );
    const rawHtml = convertContentJsonToHtml(response, topic.title);

    const updatedIssue = await issueRepo.update(issue.id, {
      contentJson: response,
      rawHtml: rawHtml,
      status: "draft",
    });

    if (!updatedIssue) {
      console.error(
        `[Topic ${topic.id}] Failed to update newsletter issue with generated content`,
      );
      throw new Error(
        "Failed to update newsletter issue with generated content",
      );
    }

    console.log(
      `${topic.title} [Topic ${topic.id}] Successfully updated issue to draft status`,
    );
  }
}

export const newsletterService = new NewsletterService();
