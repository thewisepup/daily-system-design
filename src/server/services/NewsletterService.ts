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
    const logContext: Record<string, unknown> = {
      topicId,
      status: "generating",
      startTime: Date.now(),
    };

    try {
      const topic = await this.fetchAndValidateTopic(topicId);
      logContext.topicTitle = topic.title;

      await this.ensureNoExistingNewsletter(topicId);

      const issue = await this.createGeneratingIssue(topic);
      logContext.issueId = issue.id;

      await this.generateAndSaveContent(issue, topic);

      logContext.status = "success";
      return { success: true, issueId: issue.id };
    } catch (error) {
      logContext.status = "error";
      logContext.error = error instanceof Error ? error.message : String(error);
      logContext.errorType =
        error instanceof Error ? error.constructor.name : "unknown";

      if (logContext.issueId) {
        try {
          await issueRepo.update(logContext.issueId as number, {
            status: "failed",
          });
        } catch (statusUpdateError) {
          console.error(
            `Failed to update issue status to 'failed':`,
            statusUpdateError,
          );
        }
      }
      throw error;
    } finally {
      this.logNewsletterGenerationContext(logContext);
    }
  }

  /**
   * Fetches a topic by ID and validates it exists.
   * @throws {Error} When topic does not exist
   */
  private async fetchAndValidateTopic(topicId: number): Promise<Topic> {
    const topic = await topicRepo.findById(topicId);

    if (!topic) {
      throw new Error(`Topic with ID ${topicId} does not exist`);
    }

    return topic;
  }

  /**
   * Ensures no newsletter exists for this topic.
   * @throws {Error} When a newsletter already exists for this topic
   */
  private async ensureNoExistingNewsletter(topicId: number): Promise<void> {
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
    const createdIssue = await issueRepo.create({
      topicId: topic.id,
      title: topic.title,
      status: "generating",
    });

    if (!createdIssue) {
      throw new Error("Failed to create newsletter issue in database");
    }

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
    const validatedTopicData = TopicResponseSchema.parse(topic.topicData);
    const prompt = newsletterPrompt(validatedTopicData);

    const response = await complete<NewsletterResponse>({
      prompt,
      schema: NewsletterResponseSchema,
      schemaName: "newsletter_response",
      reasoning: {
        effort: Effort.Medium,
      },
      model: "anthropic/claude-opus-4.5",
    });

    const rawHtml = convertContentJsonToHtml(response, topic.title);

    const updatedIssue = await issueRepo.update(issue.id, {
      contentJson: response,
      rawHtml: rawHtml,
      status: "draft",
    });

    if (!updatedIssue) {
      throw new Error(
        "Failed to update newsletter issue with generated content",
      );
    }
  }

  /**
   * Logs newsletter generation context with duration and status.
   */
  private logNewsletterGenerationContext(
    logContext: Record<string, unknown>,
  ): void {
    logContext.duration = Date.now() - (logContext.startTime as number);
    const duration = logContext.duration as number;

    if (logContext.status === "success") {
      console.log(
        `[NewsletterService] Generation successful (${duration}ms)`,
        logContext,
      );
    } else {
      console.error(
        `[NewsletterService] Generation failed (${duration}ms)`,
        logContext,
      );
    }
  }
}

export const newsletterService = new NewsletterService();
