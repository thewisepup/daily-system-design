"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useNotifications } from "~/hooks/useNotifications";
import ConfirmationModal from "~/app/_components/ConfirmationModal";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";

export default function DeleteAllTopicsButton() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { addNotification } = useNotifications();

  const deleteTopics = api.topics.deleteAll.useMutation({
    onSuccess: () => {
      addNotification({
        type: "success",
        title: "Success",
        message: "All topics deleted successfully!",
      });
      setIsDeleteModalOpen(false);
    },
    onError: (error) => {
      addNotification({
        type: "error",
        title: "Delete Error",
        message: error.message,
      });
    },
  });

  const handleDeleteConfirm = () => {
    deleteTopics.mutate({ subjectId: SYSTEM_DESIGN_SUBJECT_ID });
  };

  return (
    <>
      <button
        type="button"
        disabled={deleteTopics.isPending}
        onClick={() => setIsDeleteModalOpen(true)}
        className="flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deleteTopics.isPending ? "Deleting..." : "Delete All Topics"}
      </button>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete All Topics"
        message="This will permanently delete ALL topics for Subject ID 1. This action cannot be undone."
        confirmText="Delete All Topics"
        requiredInput="i am sure"
        isLoading={deleteTopics.isPending}
      />
    </>
  );
}
