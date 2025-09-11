import { TRPCError } from "@trpc/server";
import { issueRepo } from "~/server/db/repo/issueRepo";
import { newsletterSequenceRepo } from "~/server/db/repo/newsletterSequenceRepo";
import { deliveryRepo } from "~/server/db/repo/deliveryRepo";
import { emailService } from "~/server/email/emailService";
import {
  convertContentJsonToHtml,
  convertContentJsonToText,
} from "~/server/email/templates/newsletterTemplate";
import type { NewsletterResponse } from "~/server/llm/schemas/newsletter";
import type {
  EmailSendRequest,
  BulkEmailSendRequest,
  MessageTag,
} from "~/server/email/types";
import {
  generateOneClickUnsubscribeUrl,
  generateUnsubscribePageUrl,
} from "~/lib/unsubscribe";
import { env } from "~/env";

import { topicRepo } from "~/server/db/repo/topicRepo";
import { userRepo } from "~/server/db/repo/userRepo";
import type { User } from "~/server/db/schema/users";
import type { NewsletterSequence } from "~/server/db/schema/newsletterSequence";
import type { Issue } from "~/server/db/schema/issues";
import type { Topic } from "~/server/db/schema/topics";
import { DB_FETCH_SIZE } from "~/server/email/constants/bulkEmailConstants";
import { MESSAGE_TAG_NAMES } from "~/server/email/constants/messageTagNames";

/**
 * Get today's newsletter by current sequence for a subject
 */
export async function getTodaysNewsletter(
  subjectId: number,
): Promise<{ issue: Issue; sequence: NewsletterSequence; topic: Topic }> {
  console.log("getTodaysNewsletter - subjectId:", subjectId);
  const sequence = await newsletterSequenceRepo.getOrCreate(subjectId);
  if (!sequence) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Failed to get or create newsletter sequence",
    });
  }
  console.log(
    "getTodaysNewsletter - sequence.currentSequence:",
    sequence.currentSequence,
  );
  const topic = await topicRepo.findBySubjectIdAndSequence(
    subjectId,
    sequence.currentSequence,
  );

  if (!topic) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `No topic found for subjectId ${subjectId} and sequence ${sequence.currentSequence}`,
    });
  }
  const issue = await issueRepo.findByTopicId(topic.id);
  canSendIssue(issue);
  return { issue: issue!, sequence, topic };
}

/**
 * Generate email headers including unsubscribe headers
 */
export function generateEmailHeaders(userId: string) {
  const oneClickUnsubscribeUrl = generateOneClickUnsubscribeUrl(userId);
  return {
    "List-Unsubscribe": `<${oneClickUnsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/**
 * Generate HTML content with template substitutions
 */
function generateHtmlContentWithSubstitutions(
  issue: Issue,
  substitutions: Record<string, string>,
): string {
  if (issue.rawHtml) {
    let html = issue.rawHtml;
    Object.entries(substitutions).forEach(([key, value]) => {
      html = html.replace(new RegExp(`{{${key}}}`, "g"), value);
    });
    return html;
  } else if (issue.contentJson) {
    let htmlTemplate = convertContentJsonToHtml(
      issue.contentJson as NewsletterResponse,
      issue.title,
    );
    Object.entries(substitutions).forEach(([key, value]) => {
      htmlTemplate = htmlTemplate.replace(new RegExp(`{{${key}}}`, "g"), value);
    });
    return htmlTemplate;
  } else {
    throw new Error(
      `Issue ${issue.id} is missing both rawHtml and contentJson - cannot generate email content`,
    );
  }
}

/**
 * Generate plain text content with template substitutions
 */
function generateTextContentWithSubstitutions(
  issue: Issue,
  substitutions: Record<string, string>,
): string {
  //TODO: We should store rawText in issues table and just do substitutions
  if (issue.contentJson) {
    let textTemplate = convertContentJsonToText(
      issue.contentJson as NewsletterResponse,
      issue.title,
    );
    Object.entries(substitutions).forEach(([key, value]) => {
      textTemplate = textTemplate.replace(new RegExp(`{{${key}}}`, "g"), value);
    });
    return textTemplate;
  } else {
    throw new Error(
      `Issue ${issue.id} is missing contentJson - cannot generate email text content`,
    );
  }
}

/**
 * Generate EmailSendRequest object for a single user
 */
export function generateEmailSendRequest(
  user: User,
  issue: Issue,
  subjectId: number,
  sequenceNumber: number,
): EmailSendRequest {
  const unsubscribePageUrl = generateUnsubscribePageUrl(user.id);
  const headers = generateEmailHeaders(user.id);
  const tags = generateStandardTags(user.id, subjectId, sequenceNumber);

  const substitutions = {
    UNSUBSCRIBE_URL: unsubscribePageUrl,
  };

  return {
    to: user.email,
    from: env.AWS_SES_FROM_EMAIL,
    subject: issue.title,
    html: generateHtmlContentWithSubstitutions(issue, substitutions),
    text: generateTextContentWithSubstitutions(issue, substitutions),
    headers,
    userId: user.id,
    deliveryConfiguration: env.AWS_SES_CONFIGURATION_SET,
    tags,
  };
}

/**
 * Generate EmailSendRequest objects for a batch of users
 */
export async function generateEmailSendRequests(
  users: User[],
  issue: Issue,
  subjectId: number,
  sequenceNumber: number,
): Promise<EmailSendRequest[]> {
  return users.map((user) =>
    generateEmailSendRequest(user, issue, subjectId, sequenceNumber),
  );
}

/**
 * Process a single batch of users for newsletter delivery
 */
export async function processBatch(
  users: User[],
  issue: Issue,
  subjectId: number,
  sequenceNumber: number,
) {
  if (users.length === 0) {
    return { totalSent: 0, totalFailed: 0, failedUserIds: [] };
  }
  const userIds = users.map((u) => u.id);
  try {
    console.log("processBatch - Generating EmailSendRequests for user batch");
    const emailRequests = await generateEmailSendRequests(
      users,
      issue,
      subjectId,
      sequenceNumber,
    );
    const bulkRequest: BulkEmailSendRequest = {
      entries: emailRequests,
      from: env.AWS_SES_FROM_EMAIL,
      issue_id: issue.id,
    };
    const bulkResults = await emailService.sendBulkNewsletterIssue(bulkRequest);
    return bulkResults;
  } catch (error) {
    console.error("Batch processing error:", error);

    //TODO: figure out if updating deliver repo here is a good idea for error handling
    const failedUpdates = userIds.map((userId) => ({
      userId,
      status: "failed" as const,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    }));

    deliveryRepo
      .bulkUpdateStatuses(issue.id, failedUpdates)
      .catch((updateError) => {
        console.error(
          "Failed to update failed delivery statuses:",
          updateError,
        );
      });

    return {
      totalSent: 0,
      totalFailed: users.length,
      failedUserIds: userIds,
    };
  }
}

export function canSendIssue(issue: Issue | undefined) {
  if (!issue) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Newsletter not found for this topic",
    });
  }

  if (issue.status !== "approved") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `Cannot send newsletter with status: ${issue.status}. Newsletter must be approved first.`,
    });
  }

  // TODO: Update validation to check contentJson instead of content
  if (!issue.contentJson) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Newsletter content is empty",
    });
  }
}

export interface BatchAggregatedResults {
  totalSent: number;
  totalFailed: number;
  failedUserIds: string[];
  processedUsers: number;
}

/**
 * Helper function to aggregate batch results
 */
export function aggregateBatchResults(
  currentResults: BatchAggregatedResults,
  batchResults: {
    totalSent: number;
    totalFailed: number;
    failedUserIds: string[];
  },
): BatchAggregatedResults {
  return {
    totalSent: currentResults.totalSent + batchResults.totalSent,
    totalFailed: currentResults.totalFailed + batchResults.totalFailed,
    failedUserIds: [
      ...currentResults.failedUserIds,
      ...batchResults.failedUserIds,
    ],
    processedUsers:
      currentResults.processedUsers +
      batchResults.totalSent +
      batchResults.totalFailed,
  };
}

/**
 * Process all users in batches using pagination
 */
export async function processAllUsersInBatches(
  issue: Issue,
  sequenceNumber: number,
  subjectId: number,
): Promise<BatchAggregatedResults> {
  let results: BatchAggregatedResults = {
    totalSent: 0,
    totalFailed: 0,
    failedUserIds: [],
    processedUsers: 0,
  };

  let page = 1;

  while (true) {
    const start = (page - 1) * DB_FETCH_SIZE + 1;
    const end = page * DB_FETCH_SIZE;
    console.log(
      `processAllUsersInBatches - Getting user batch ${start}-${end}...`,
    );

    const users = await userRepo.findWithPagination(page, DB_FETCH_SIZE);

    // No more users to process
    if (users.length === 0) {
      break;
    }
    const batchResults = await processBatch(
      users,
      issue,
      subjectId,
      sequenceNumber,
    );
    results = aggregateBatchResults(results, batchResults);
    page++;

    // End if current batch is less than fetch size
    if (users.length < DB_FETCH_SIZE) {
      break;
    }
  }

  return results;
}

function generateStandardTags(
  userId: string,
  subjectId: number,
  issueNumber: number,
): MessageTag[] {
  const tags: MessageTag[] = [
    { name: MESSAGE_TAG_NAMES.USER_ID, value: userId },
    { name: MESSAGE_TAG_NAMES.SUBJECT_ID, value: subjectId.toString() },
    { name: MESSAGE_TAG_NAMES.ISSUE_NUMBER, value: issueNumber.toString() },
  ];
  return tags;
}
