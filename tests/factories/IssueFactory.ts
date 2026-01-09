import type { Issue } from "~/server/db/schema/issues";
import type { IssueSummary } from "~/server/api/routers/issue";

/**
 * Factory for creating Issue-related test data. */
export class IssueFactory {
  private static defaultIssue(): Issue {
    const now = new Date();
    return {
      id: 1,
      topicId: 1,
      title: "Test Issue Title",
      contentJson: { content: "Test content" },
      rawHtml: "<p>Test content</p>",
      status: "sent",
      createdAt: now,
      updatedAt: now,
      approvedAt: now,
      sentAt: now,
    };
  }

  /**
   * Creates a mock Issue with Date objects.
   * Used for database responses.
   */
  static createIssue(overrides?: Partial<Issue>): Issue {
    return {
      ...this.defaultIssue(),
      ...overrides,
    };
  }

  /**
   * Creates a mock Issue with string dates (ISO format).
   * Used to simulate Redis cached responses where dates are serialized as strings.
   */
  static createIssueWithStringDates(
    overrides?: Partial<Issue>,
  ): Record<string, unknown> {
    const issue = this.createIssue(overrides);
    return {
      ...issue,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt?.toISOString() ?? null,
      approvedAt: issue.approvedAt?.toISOString() ?? null,
      sentAt: issue.sentAt?.toISOString() ?? null,
    };
  }

  private static defaultIssueSummary(): IssueSummary {
    return {
      issueId: 1,
      title: "Test Issue",
      issueNumber: 1,
    };
  }

  /**
   * Creates an array of mock IssueSummary objects.
   */
  static createIssueSummaries(
    count: number,
    overrides?: Partial<IssueSummary>,
  ): IssueSummary[] {
    return Array.from({ length: count }, (_, index) => ({
      ...this.defaultIssueSummary(),
      issueId: index + 1,
      issueNumber: index + 1,
      title: `Test Issue ${index + 1}`,
      ...overrides,
    }));
  }
}
