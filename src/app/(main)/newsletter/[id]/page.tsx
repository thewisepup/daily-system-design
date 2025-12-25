import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import NewsletterContent from "~/app/_components/Newsletter/NewsletterContent";
import NewsletterJsonContent from "~/app/_components/Newsletter/NewsletterJsonContent";
import type { NewsletterResponse } from "~/server/llm/schemas/newsletter";

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
    const issue = await api.issue.getSentIssueById({ issueId });

    if (issue.contentJson) {
      return (
        <NewsletterJsonContent
          title={issue.title ?? "Newsletter"}
          sentAt={issue.sentAt}
          contentJson={issue.contentJson as NewsletterResponse}
        />
      );
    }

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