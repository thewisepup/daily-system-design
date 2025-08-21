"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { isAdmin } from "~/lib/auth";

export default function AdminPage() {
  const [formData, setFormData] = useState({
    subjectId: 1,
    subjectName: "System Design",
    count: 150,
    replaceExisting: false,
  });

  const generateTopics = api.topics.generate.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        alert(`Success! Created ${result.topicsCreated} topics.`);
      } else {
        alert(`Error: ${result.error}`);
      }
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateTopics.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    }));
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="subjectId"
              className="block text-sm font-medium text-gray-700"
            >
              Subject ID
            </label>
            <input
              type="number"
              id="subjectId"
              name="subjectId"
              value={formData.subjectId}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="subjectName"
              className="block text-sm font-medium text-gray-700"
            >
              Subject Name
            </label>
            <input
              type="text"
              id="subjectName"
              name="subjectName"
              value={formData.subjectName}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="count"
              className="block text-sm font-medium text-gray-700"
            >
              Topic Count
            </label>
            <input
              type="number"
              id="count"
              name="count"
              value={formData.count}
              onChange={handleInputChange}
              min="1"
              max="500"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="replaceExisting"
              name="replaceExisting"
              checked={formData.replaceExisting}
              onChange={handleInputChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label
              htmlFor="replaceExisting"
              className="ml-2 block text-sm text-gray-700"
            >
              Replace existing topics
            </label>
          </div>

          <button
            type="submit"
            disabled={generateTopics.isPending}
            className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generateTopics.isPending ? "Generating..." : "Generate Topics"}
          </button>
        </form>

        {generateTopics.data && (
          <div className="mt-6 rounded-md bg-gray-50 p-4">
            <h3 className="text-sm font-medium text-gray-900">Result</h3>
            <pre className="mt-2 text-xs whitespace-pre-wrap text-gray-600">
              {JSON.stringify(generateTopics.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
