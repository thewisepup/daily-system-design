"use client";

import { api } from "~/trpc/react";
import { useNotifications, createNotification } from "~/hooks/useNotifications";
import {
  useConfirmationModal,
  MODAL_CONFIGS,
} from "~/hooks/useConfirmationModal";
import ConfirmationModal from "~/app/_components/ConfirmationModal";
import type { IssueStatus } from "~/server/db/schema/issues";

interface DeleteIssueButtonProps {
  topicId: number;
  issueStatus?: IssueStatus | null;
  onSuccess?: () => void;
  variant?: "inline" | "header";
  showModal?: boolean;
  className?: string;
}

export default function DeleteIssueButton({
  topicId,
  issueStatus,
  onSuccess,
  variant = "inline",
  showModal = true,
  className = "",
}: DeleteIssueButtonProps) {
  const { addNotification } = useNotifications();
  const { modalState, openModal, closeModal } = useConfirmationModal();
  const utils = api.useUtils();

  // Check if the issue can be deleted
  const isDeletable =
    issueStatus &&
    (issueStatus === "draft" ||
      issueStatus === "failed" ||
      issueStatus === "generating");

  const deleteMutation = api.newsletter.delete.useMutation({
    onSuccess: () => {
      addNotification(
        createNotification.success("Newsletter deleted successfully!"),
      );
      // Invalidate relevant queries to refresh the UI
      void utils.topics.getWithIssues.invalidate();
      void utils.newsletter.getByTopicId.invalidate({ topicId });
      // Call custom success callback if provided
      onSuccess?.();
    },
    onError: (error) => {
      addNotification(
        createNotification.error(
          `Failed to delete newsletter: ${error.message}`,
        ),
      );
    },
  });

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent parent click events
    }

    if (showModal) {
      openModal({
        type: "delete" as const,
        title: MODAL_CONFIGS.delete.title,
        message: MODAL_CONFIGS.delete.message,
        confirmText: MODAL_CONFIGS.delete.confirmText,
        confirmButtonColor: MODAL_CONFIGS.delete.confirmButtonColor,
        onConfirm: () => deleteMutation.mutate({ topicId }),
      });
    } else {
      deleteMutation.mutate({ topicId });
    }
  };

  // Don't render button if issue cannot be deleted
  if (!isDeletable) {
    return null;
  }

  const baseClasses =
    "inline-flex items-center rounded bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300";

  const variantClasses = {
    inline:
      "px-2 py-1 text-xs font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100",
    header: "px-3 py-1.5 text-xs font-medium",
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={deleteMutation.isPending}
        className={buttonClasses}
        title="Delete newsletter and all related data"
      >
        {deleteMutation.isPending ? (
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Deleting...
          </>
        ) : (
          <>
            <svg
              className={variant === "inline" ? "h-3 w-3" : "mr-1.5 h-3 w-3"}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
            {variant === "header" && "Delete"}
          </>
        )}
      </button>

      {/* Confirmation Modal - only render if showModal is true */}
      {showModal && (
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
          isLoading={deleteMutation.isPending}
        />
      )}
    </>
  );
}
