"use client";

import { MODAL_CONFIGS } from "~/hooks/useConfirmationModal";
import { useNotifications } from "~/hooks/useNotifications";
import NotificationList from "~/app/_components/NotificationList";

interface NewsletterPreviewHeaderProps {
  issue: {
    title: string;
    status: string;
    content: string | null;
    createdAt: Date;
    updatedAt: Date | null;
  };
  topicId: number;
  approveMutation: {
    mutate: (params: { topicId: number }) => void;
    isPending: boolean;
  };
  unapproveMutation: {
    mutate: (params: { topicId: number }) => void;
    isPending: boolean;
  };
  sendToAdminMutation: {
    mutate: (params: { topicId: number }) => void;
    isPending: boolean;
  };
  openModal: (config: {
    type?: "approve" | "unapprove" | "sendEmail" | "delete" | "custom" | null;
    title: string;
    message: string;
    confirmText?: string;
    confirmButtonColor?: "red" | "green" | "indigo" | "yellow";
    onConfirm: () => void;
  }) => void;
}

export default function NewsletterPreviewHeader({
  issue,
  topicId,
  approveMutation,
  unapproveMutation,
  sendToAdminMutation,
  openModal,
}: NewsletterPreviewHeaderProps) {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 px-4 py-3">
      <div className="flex items-center justify-between">
        <h3 className="truncate text-sm font-medium text-gray-900">
          {issue.title}
        </h3>
        <div className="flex items-center gap-2">
          {/* Approval Actions - Only show for draft and approved status */}
          {issue.status === "draft" && issue.content && (
            <button
              onClick={() =>
                openModal({
                  ...MODAL_CONFIGS.approve,
                  onConfirm: () => approveMutation.mutate({ topicId: topicId }),
                })
              }
              disabled={approveMutation.isPending}
              className="inline-flex items-center rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
              title="Approve newsletter for sending"
            >
              {approveMutation.isPending ? (
                <>
                  <svg
                    className="mr-1.5 h-3 w-3 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
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
                  Approving...
                </>
              ) : (
                <>
                  <svg
                    className="mr-1.5 h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                  Approve
                </>
              )}
            </button>
          )}

          {issue.status === "approved" && (
            <button
              onClick={() =>
                openModal({
                  ...MODAL_CONFIGS.unapprove,
                  onConfirm: () =>
                    unapproveMutation.mutate({ topicId: topicId }),
                })
              }
              disabled={unapproveMutation.isPending}
              className="inline-flex items-center rounded bg-yellow-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-yellow-700 disabled:cursor-not-allowed disabled:bg-yellow-300"
              title="Move back to draft status"
            >
              {unapproveMutation.isPending ? (
                <>
                  <svg
                    className="mr-1.5 h-3 w-3 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
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
                      d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Moving to Draft...
                </>
              ) : (
                <>
                  <svg
                    className="mr-1.5 h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                    />
                  </svg>
                  Back to Draft
                </>
              )}
            </button>
          )}

          {/* Send Email Button - Only show for approved newsletters */}
          {issue.status === "approved" && issue.content && (
            <button
              onClick={() =>
                openModal({
                  ...MODAL_CONFIGS.sendEmail,
                  onConfirm: () =>
                    sendToAdminMutation.mutate({ topicId: topicId }),
                })
              }
              disabled={sendToAdminMutation.isPending}
              className="inline-flex items-center rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              title="Send newsletter to admin email for testing"
            >
              {sendToAdminMutation.isPending ? (
                <>
                  <svg
                    className="mr-1.5 h-3 w-3 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
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
                  <svg
                    className="mr-1.5 h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
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

      {/* Show notifications */}
      <NotificationList
        notifications={notifications}
        onDismiss={removeNotification}
        position="inline"
      />
    </div>
  );
}
