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

  const sendToAdminMutation = api.newsletter.sendToAdmin.useMutation({
    onSuccess: (data) => {
      console.log("Newsletter sent successfully:", data);
      // Could show a success toast here
    },
    onError: (error) => {
      console.error("Failed to send newsletter:", error);
      // Could show an error toast here
    },
  });

  const approveMutation = api.newsletter.approve.useMutation({
    onSuccess: () => {
      void refetch(); // Refetch to show updated status
    },
    onError: (error) => {
      console.error("Failed to approve newsletter:", error);
    },
  });

  const unapproveMutation = api.newsletter.unapprove.useMutation({
    onSuccess: () => {
      void refetch(); // Refetch to show updated status
    },
    onError: (error) => {
      console.error("Failed to unapprove newsletter:", error);
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
          <div className="flex items-center gap-2">
            {/* Approval Actions - Only show for draft and approved status */}
            {issue.status === "draft" && issue.content && (
              <button
                onClick={() => approveMutation.mutate({ topicId: topicId })}
                disabled={approveMutation.isPending}
                className="inline-flex items-center rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed"
                title="Approve newsletter for sending"
              >
                {approveMutation.isPending ? (
                  <>
                    <svg className="mr-1.5 h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Approving...
                  </>
                ) : (
                  <>
                    <svg className="mr-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    Approve
                  </>
                )}
              </button>
            )}

            {issue.status === "approved" && (
              <button
                onClick={() => unapproveMutation.mutate({ topicId: topicId })}
                disabled={unapproveMutation.isPending}
                className="inline-flex items-center rounded bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-700 disabled:bg-yellow-300 disabled:cursor-not-allowed"
                title="Move back to draft status"
              >
                {unapproveMutation.isPending ? (
                  <>
                    <svg className="mr-1.5 h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Moving to Draft...
                  </>
                ) : (
                  <>
                    <svg className="mr-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                    </svg>
                    Back to Draft
                  </>
                )}
              </button>
            )}

            {/* Send Email Button - Only show for approved newsletters */}
            {issue.status === "approved" && issue.content && (
              <button
                onClick={() => sendToAdminMutation.mutate({ topicId: topicId })}
                disabled={sendToAdminMutation.isPending}
                className="inline-flex items-center rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                title="Send newsletter to admin email for testing"
              >
                {sendToAdminMutation.isPending ? (
                  <>
                    <svg className="mr-1.5 h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="mr-1.5 h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    Send Email
                  </>
                )}
              </button>
            )}
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
        </div>
        <div className="mt-1 text-xs text-gray-500">
          Created: {new Date(issue.createdAt).toLocaleDateString()}
          {issue.updatedAt && (
            <> • Updated: {new Date(issue.updatedAt).toLocaleDateString()}</>
          )}
        </div>
        {/* Show feedback for actions */}
        {sendToAdminMutation.isSuccess && (
          <div className="mt-2 rounded bg-green-50 px-2 py-1 text-xs text-green-700">
            ✓ Newsletter sent successfully to admin email!
          </div>
        )}
        {sendToAdminMutation.error && (
          <div className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">
            ✗ Failed to send: {sendToAdminMutation.error.message}
          </div>
        )}
        {approveMutation.isSuccess && (
          <div className="mt-2 rounded bg-green-50 px-2 py-1 text-xs text-green-700">
            ✓ Newsletter approved successfully!
          </div>
        )}
        {approveMutation.error && (
          <div className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">
            ✗ Failed to approve: {approveMutation.error.message}
          </div>
        )}
        {unapproveMutation.isSuccess && (
          <div className="mt-2 rounded bg-green-50 px-2 py-1 text-xs text-green-700">
            ✓ Newsletter moved back to draft!
          </div>
        )}
        {unapproveMutation.error && (
          <div className="mt-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">
            ✗ Failed to move to draft: {unapproveMutation.error.message}
          </div>
        )}
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
