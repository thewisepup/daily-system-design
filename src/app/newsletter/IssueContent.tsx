import { api } from "~/trpc/react";

export interface IssueContentProps {
  issueId: number;
}

export default function IssueContent({ issueId }: IssueContentProps) {
  const {
    data: issue,
    isLoading,
    error,
  } = api.issue.getSentIssueById.useQuery({
    issueId: issueId,
  });

  // if (isLoading) {
  //   return <div className="text-lg text-gray-600">Loading newsletter...</div>;
  // }

  if (error) {
    return (
      <div className="text-red-600">
        Error loading newsletter: {error.message}
      </div>
    );
  }

  if (!issue) {
    return <div className="text-gray-500">No newsletter content found</div>;
  }

  return (
    <div
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: issue.rawHtml ?? "" }}
    />
  );
}
