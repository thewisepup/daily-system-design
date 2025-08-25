"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import ConfirmationModal from "~/app/_components/ConfirmationModal";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";

export default function TopicsManagement() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const generateTopics = api.topics.generate.useMutation({
    onSuccess: () => {
      alert("Success!");
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const deleteTopics = api.topics.deleteAll.useMutation({
    onSuccess: () => {
      alert("All topics deleted successfully!");
      setIsDeleteModalOpen(false);
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateTopics.mutate();
  };

  const handleDeleteConfirm = () => {
    deleteTopics.mutate({ subjectId: SYSTEM_DESIGN_SUBJECT_ID });
  };

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Topics Management
        </h2>
        <button
          type="submit"
          disabled={generateTopics.isPending}
          onClick={handleSubmit}
          className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generateTopics.isPending ? "Generating..." : "Generate Topics"}
        </button>

        <button
          type="button"
          disabled={deleteTopics.isPending}
          onClick={() => setIsDeleteModalOpen(true)}
          className="flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleteTopics.isPending ? "Deleting..." : "Delete All Topics"}
        </button>

        {/* Error States */}
        {generateTopics.error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">
              <strong>Topics Error:</strong> {generateTopics.error.message}
            </div>
          </div>
        )}

        {deleteTopics.error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">
              <strong>Delete Error:</strong> {deleteTopics.error.message}
            </div>
          </div>
        )}

        {/* Success States */}
        {generateTopics.isSuccess && (
          <div className="mt-4 rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">
              <strong>Success:</strong> Topics generated successfully!
            </div>
          </div>
        )}

        {deleteTopics.isSuccess && (
          <div className="mt-4 rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">
              <strong>Success:</strong> All topics deleted successfully!
            </div>
          </div>
        )}
      </div>

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