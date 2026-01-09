import { notFound } from "next/navigation";
import NewsletterContent from "~/app/_components/Newsletter/NewsletterContent";
import NewsletterJsonContent from "~/app/_components/Newsletter/NewsletterJsonContent";
import { issueRepo } from "~/server/db/repo/issueRepo";
import { issueService } from "~/server/services/IssueService";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";

export const revalidate = 43200; // 12 hours in seconds

/**
 * Generate static params for all sent newsletter issues at build time.
 * This pre-generates pages for all sent newsletters, making navigation instant.
 *
 * @returns Array of params objects with issue IDs
 */
export async function generateStaticParams() {
  try {
    const issueIds = await issueRepo.getAllSentIssueIds(
      SYSTEM_DESIGN_SUBJECT_ID,
    );
    return issueIds.map((id) => ({ id: String(id) }));
  } catch (error) {
    console.error("Failed to generate static params for newsletters:", error);
    return [];
  }
}

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Render a newsletter issue page identified by the route `id` parameter.
 *
 * Fetches the sent issue for the parsed integer `id` and renders it:
 * when the issue includes `contentJson` it renders the JSON-based newsletter component, otherwise it renders the HTML-based newsletter component. Calls `notFound()` if `id` is not a valid integer or the issue cannot be loaded.
 *
 * @param params - A promise resolving to route parameters containing `id` (string).
 * @returns A JSX element that displays the requested newsletter issue; uses the JSON renderer when `contentJson` is present, otherwise the HTML renderer.
 */
export default async function NewsletterPage({ params }: Props) {
  const { id } = await params;
  const issueId = parseInt(id);

  if (isNaN(issueId)) {
    notFound();
  }

  try {
    const issue = await issueService.getSentIssueById(issueId);

    if (!issue) {
      notFound();
    }

    // Use contentJson if available (will render sections dynamically based on what exists)
    if (issue.contentJson) {
      return (
        <NewsletterJsonContent
          title={issue.title ?? "Newsletter"}
          sentAt={issue.sentAt}
          contentJson={issue.contentJson}
        />
      );
    }

    // Fallback to HTML rendering if contentJson is missing
    return (
      <NewsletterContent
        title={issue.title ?? "Newsletter"}
        sentAt={issue.sentAt}
        rawHtml={issue.rawHtml}
      />
    );
  } catch (error) {
    console.error("Failed to load newsletter:", error);
    notFound();
  }
}
