"use client";

import { useEffect } from "react";
import { api } from "~/trpc/react";
import ConfirmationModal from "./ConfirmationModal";
import { useConfirmationModal } from "~/hooks/useConfirmationModal";
import { useNotifications, createNotification } from "~/hooks/useNotifications";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { NewsletterPreviewHeader } from "./NewsletterPreview/";

interface NewsletterPreviewProps {
  topicId: number | null;
}

export default function NewsletterPreview({ topicId }: NewsletterPreviewProps) {
  const utils = api.useUtils();

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
      void refetch();
      // Invalidate topics list to show updated status
      void utils.topics.getWithIssues.invalidate({
        subjectId: SYSTEM_DESIGN_SUBJECT_ID,
      });
    },
  });

  // Reset mutation state when topicId changes
  useEffect(() => {
    generateMutation.reset();
  }, [topicId, generateMutation]);

  const sendToAdminMutation = api.newsletter.sendToAdmin.useMutation({
    onSuccess: () => {
      addNotification(
        createNotification.success(
          "Newsletter sent successfully to admin email!",
        ),
      );
      void refetch();
      // Invalidate topics list to show updated status
      void utils.topics.getWithIssues.invalidate({
        subjectId: SYSTEM_DESIGN_SUBJECT_ID,
      });
    },
    onError: (error) => {
      addNotification(
        createNotification.error(`Failed to send: ${error.message}`),
      );
    },
  });

  const approveMutation = api.newsletter.approve.useMutation({
    onSuccess: () => {
      void refetch();
      addNotification(
        createNotification.success("Newsletter approved successfully!"),
      );
      // Invalidate topics list to show updated status
      void utils.topics.getWithIssues.invalidate({
        subjectId: SYSTEM_DESIGN_SUBJECT_ID,
      });
    },
    onError: (error) => {
      addNotification(
        createNotification.error(`Failed to approve: ${error.message}`),
      );
    },
  });

  const unapproveMutation = api.newsletter.unapprove.useMutation({
    onSuccess: () => {
      void refetch();
      addNotification(
        createNotification.success("Newsletter moved back to draft!"),
      );
      // Invalidate topics list to show updated status
      void utils.topics.getWithIssues.invalidate({
        subjectId: SYSTEM_DESIGN_SUBJECT_ID,
      });
    },
    onError: (error) => {
      addNotification(
        createNotification.error(`Failed to move to draft: ${error.message}`),
      );
    },
  });

  // Confirmation modal hook
  const { modalState, openModal, closeModal } = useConfirmationModal();

  // Notifications hook
  const { addNotification } = useNotifications();

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
      <NewsletterPreviewHeader
        issue={issue}
        topicId={topicId}
        approveMutation={approveMutation}
        unapproveMutation={unapproveMutation}
        sendToAdminMutation={sendToAdminMutation}
        openModal={openModal}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {issue.contentJson ? (
          <div className="prose prose-sm max-w-none">
            <pre className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
              {/* TODO: Convert contentJson to readable format */}
              {JSON.stringify(issue.contentJson, null, 2)}
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={() => {
          modalState.onConfirm();
          closeModal();
        }}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        confirmButtonColor={modalState.confirmButtonColor}
        isLoading={
          modalState.type === "approve"
            ? approveMutation.isPending
            : modalState.type === "unapprove"
              ? unapproveMutation.isPending
              : modalState.type === "sendEmail"
                ? sendToAdminMutation.isPending
                : false
        }
      />
    </div>
  );
}
