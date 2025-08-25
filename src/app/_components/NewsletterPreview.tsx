"use client";

import { api } from "~/trpc/react";

interface NewsletterPreviewProps {
  topicId: number | null;
}

export default function NewsletterPreview({ topicId }: NewsletterPreviewProps) {
  const {
    data: issue,
    isLoading,
    error,
    refetch,
  } = api.newsletter.getByTopicId.useQuery(
    { topicId: topicId! },
    {
      enabled: !!topicId,
      retry: (failureCount, error) => {
        // Don't retry NOT_FOUND errors
        if (error?.data?.code === "NOT_FOUND") {
          return false;
        }
        // Default retry behavior for other errors (max 3 retries)
        return failureCount < 3;
      },
    },
  );

  const generateMutation = api.newsletter.generate.useMutation({
    onSuccess: () => {
      // Refetch the newsletter data after successful generation
      void refetch();
    },
  });

  if (!topicId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-sm text-gray-500">No topic selected</div>
          <div className="text-xs text-gray-400">
            Click on a topic from the left to preview its newsletter
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-gray-500">Loading newsletter...</div>
      </div>
    );
  }

  if (error) {
    // Handle NOT_FOUND as "no content" rather than error
    if (error.data?.code === "NOT_FOUND") {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mb-2 text-sm text-gray-500">
              No newsletter found
            </div>
            <div className="mb-4 text-xs text-gray-400">
              This topic doesn&apos;t have a newsletter generated yet
            </div>
            <button
              onClick={() => generateMutation.mutate({ topicId: topicId })}
              disabled={generateMutation.isPending}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              {generateMutation.isPending
                ? "Generating..."
                : "Generate Newsletter"}
            </button>
            {generateMutation.error && (
              <div className="mt-2 text-xs text-red-600">
                Error: {generateMutation.error.message}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Show actual errors
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-sm text-red-600">
            Error: {error.message}
          </div>
          <div className="text-xs text-gray-400">
            Failed to load newsletter content
          </div>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-sm text-gray-500">No newsletter found</div>
          <div className="mb-4 text-xs text-gray-400">
            Generate a newsletter for this topic first
          </div>
          <button
            onClick={() => generateMutation.mutate({ topicId: topicId })}
            disabled={generateMutation.isPending}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
          >
            {generateMutation.isPending
              ? "Generating..."
              : "Generate Newsletter"}
          </button>
          {generateMutation.error && (
            <div className="mt-2 text-xs text-red-600">
              Error: {generateMutation.error.message}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="truncate text-sm font-medium text-gray-900">
            {issue.title}
          </h3>
          <span
            className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${
              issue.status === "generating"
                ? "bg-yellow-100 text-yellow-800"
                : issue.status === "draft"
                  ? "bg-blue-100 text-blue-800"
                  : issue.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : issue.status === "sent"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-gray-100 text-gray-800"
            }`}
          >
            {issue.status}
          </span>
        </div>
        <div className="mt-1 text-xs text-gray-500">
          Created: {new Date(issue.createdAt).toLocaleDateString()}
          {issue.updatedAt && (
            <> • Updated: {new Date(issue.updatedAt).toLocaleDateString()}</>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {issue.content ? (
          <div className="prose prose-sm max-w-none">
            <pre className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
              {issue.content}
            </pre>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="mb-2 text-sm text-gray-500">
              No content available
            </div>
            <div className="text-xs text-gray-400">
              The newsletter content is still being generated
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
