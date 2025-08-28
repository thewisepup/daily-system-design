"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function NewsletterGenerator() {
  const [topicId, setTopicId] = useState<string>("");

  const generateNewsletter = api.newsletter.generate.useMutation({
    onSuccess: () => {
      alert("Newsletter generated successfully!");
      setTopicId("");
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleGenerateNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    const topicIdNum = parseInt(topicId, 10);
    if (isNaN(topicIdNum) || topicIdNum <= 0) {
      alert("Please enter a valid Topic ID (positive number)");
      return;
    }
    generateNewsletter.mutate({ topicId: topicIdNum });
  };

  return (
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

      {/* Error State */}
      {generateNewsletter.error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">
            <strong>Newsletter Error:</strong>{" "}
            {generateNewsletter.error.message}
          </div>
        </div>
      )}

      {/* Success State */}
      {generateNewsletter.isSuccess && (
        <div className="mt-4 rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-700">
            <strong>Success:</strong> Newsletter generated successfully!
          </div>
        </div>
      )}
    </div>
  );
}
