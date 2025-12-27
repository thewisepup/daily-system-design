import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import NewsletterContent from "~/app/_components/Newsletter/NewsletterContent";
import NewsletterJsonContent from "~/app/_components/Newsletter/NewsletterJsonContent";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function NewsletterPage({ params }: Props) {
  const { id } = await params;
  const issueId = parseInt(id);

  if (isNaN(issueId)) {
    notFound();
  }

  try {
    const issue = await api.issue.getSentIssueById({ issueId });

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
