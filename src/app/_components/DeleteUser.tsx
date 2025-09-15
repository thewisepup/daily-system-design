"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import ConfirmationModal from "./ConfirmationModal";

export default function DeleteUser() {
  const [userId, setUserId] = useState("");
  const [queryUserId, setQueryUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    email: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: user, isLoading: isLookingUp, error: queryError } = api.user.getUserById.useQuery(
    { id: queryUserId },
    {
      enabled: !!queryUserId,
    }
  );

  const deleteUserMutation = api.user.deleteUser.useMutation({
    onSuccess: (data) => {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setSelectedUser(null);
      setSuccessMessage(data.message);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    },
    onError: (error) => {
      setIsDeleting(false);
      setError(error.message);
    },
  });

  useEffect(() => {
    if (user && queryUserId) {
      setSelectedUser({ id: user.id, email: user.email });
      setDeleteModalOpen(true);
      setUserId(""); 
      setQueryUserId("");
      setError(null);
    }
  }, [user, queryUserId]);

  useEffect(() => {
    if (queryError) {
      setError(queryError.message);
      setQueryUserId(""); 
    }
  }, [queryError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId.trim()) {
      setError("Please enter a user ID");
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId.trim())) {
      setError("Please enter a valid UUID format");
      return;
    }

    setError(null);
    setQueryUserId(userId.trim()); 
  };

  const handleConfirmDelete = () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    deleteUserMutation.mutate({ id: selectedUser.id });
  };

  const handleCloseModal = () => {
    if (isDeleting) return; // Prevent closing while deleting
    setDeleteModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">Delete User</h3>
        <p className="mt-1 text-sm text-gray-500">
          Enter a user ID to delete the user and all associated data.
        </p>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="mb-4 rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
            User ID
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user UUID (e.g., 123e4567-e89b-12d3-a456-426614174000)"
              className="flex-1 rounded-l-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              disabled={isLookingUp}
            />
            <button
              type="submit"
              disabled={isLookingUp || !userId.trim()}
              className="inline-flex items-center rounded-r-md border border-l-0 border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLookingUp ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600"
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Looking up...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete User
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Help text */}
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                ⚠️ Warning: Permanent Deletion
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                This will permanently delete the user and all associated data including:
                subscriptions, deliveries, audit logs, and transactional emails. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* Delete confirmation modal */}
      {selectedUser && (
        <ConfirmationModal
          isOpen={deleteModalOpen}
          onClose={handleCloseModal}
          onConfirm={handleConfirmDelete}
          title="Delete User"
          message={`Are you sure you want to delete user ${selectedUser.email} (ID: ${selectedUser.id})? This will permanently remove the user and all associated data including subscriptions, deliveries, audit logs, and transactional emails.`}
          confirmText="Delete User"
          confirmButtonColor="red"
          requiredInput="DELETE"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}