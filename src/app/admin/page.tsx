"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { isAdmin, clearAdminAuth } from "~/lib/auth";
import ConfirmationModal from "~/app/_components/ConfirmationModal";
import AdminLogin from "~/app/_components/AdminLogin";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";

export default function AdminPage() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [topicId, setTopicId] = useState<string>("");

  // Check authentication status on component mount and when it might change
  useEffect(() => {
    setIsAuthenticated(isAdmin());
  }, []);

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

  const generateNewsletter = api.newsletter.generate.useMutation({
    onSuccess: () => {
      alert("Newsletter generated successfully!");
      setTopicId("");
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

  const handleGenerateNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    const topicIdNum = parseInt(topicId, 10);
    if (isNaN(topicIdNum) || topicIdNum <= 0) {
      alert("Please enter a valid Topic ID (positive number)");
      return;
    }
    generateNewsletter.mutate({ topicId: topicIdNum });
  };

  const handleLogin = () => {
    // Re-check authentication status after successful login
    setIsAuthenticated(isAdmin());
  };

  const handleLogout = () => {
    clearAdminAuth();
    setIsAuthenticated(false);
  };

  // Show AdminLogin component if user is not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 focus:outline-none"
          >
            Logout
          </button>
        </div>

        <div className="space-y-6">
          {/* Topics Section */}
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
          </div>

          {/* Newsletter Section */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Newsletter Generation
            </h2>
            <form onSubmit={handleGenerateNewsletter} className="space-y-4">
              <div>
                <label
                  htmlFor="topicId"
                  className="block text-sm font-medium text-gray-700"
                >
                  Topic ID
                </label>
                <input
                  type="number"
                  id="topicId"
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  min="1"
                  step="1"
                  required
                  placeholder="Enter topic ID (e.g., 1)"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={generateNewsletter.isPending || !topicId}
                className="flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generateNewsletter.isPending
                  ? "Generating Newsletter..."
                  : "Generate Newsletter"}
              </button>
            </form>
          </div>
        </div>

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

        {generateNewsletter.error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">
              <strong>Newsletter Error:</strong>{" "}
              {generateNewsletter.error.message}
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

        {generateNewsletter.isSuccess && (
          <div className="mt-4 rounded-md bg-green-50 p-4">
            <div className="text-sm text-green-700">
              <strong>Success:</strong> Newsletter generated successfully!
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
    </div>
  );
}
