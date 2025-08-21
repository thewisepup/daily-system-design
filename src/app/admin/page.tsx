"use client";

import { api } from "~/trpc/react";
import { isAdmin } from "~/lib/auth";

export default function AdminPage() {
  const generateTopics = api.topics.generate.useMutation({
    onSuccess: () => {
      alert("Success!");
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateTopics.mutate();
  };

  // Show unauthorized message if user is not admin
  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md">
          <h1 className="mb-4 text-2xl font-bold text-red-600">
            Access Denied
          </h1>
          <p className="text-gray-700">
            You do not have permission to access this admin page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          Generate Topics
        </h1>

        <button
          type="submit"
          disabled={generateTopics.isPending}
          onClick={handleSubmit}
          className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          Geneerate Topics
        </button>
      </div>
    </div>
  );
}
