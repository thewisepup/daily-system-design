"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useNotifications } from "~/hooks/useNotifications";

export default function BulkNewsletterGenerator() {
  const [bulkCount, setBulkCount] = useState<number>(5);
  const { addNotification } = useNotifications();

  const generateBulkNewsletters = api.newsletter.generateBulk.useMutation({
    onSuccess: (data) => {
      addNotification({
        type: "success",
        title: "Bulk Generation Complete",
        message: data.message,
      });
      setBulkCount(5);
    },
    onError: (error) => {
      addNotification({
        type: "error",
        title: "Bulk Generation Error",
        message: error.message,
      });
    },
  });

  const handleGenerateBulk = (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkCount <= 0 || bulkCount > 50) {
      addNotification({
        type: "error",
        title: "Validation Error",
        message: "Please enter a valid count between 1 and 50",
      });
      return;
    }

    generateBulkNewsletters.mutate({
      subjectId: 1, // System Design
      count: bulkCount,
    });
  };

  return (
    <div className="space-y-4 border-t border-gray-200 pt-6">
      <h3 className="text-md font-semibold text-gray-900">
        Bulk Newsletter Generation
      </h3>
      <form onSubmit={handleGenerateBulk} className="space-y-4">
        <div>
          <label
            htmlFor="bulkCount"
            className="block text-sm font-medium text-gray-700"
          >
            Number of Newsletters to Generate (1-50)
          </label>
          <input
            type="number"
            id="bulkCount"
            value={bulkCount}
            onChange={(e) => setBulkCount(parseInt(e.target.value) || 0)}
            min="1"
            max="50"
            step="1"
            required
            placeholder="Enter count (e.g., 5)"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            Generates newsletters for the next available System Design topics
            without existing issues
          </p>
        </div>
        <button
          type="submit"
          disabled={generateBulkNewsletters.isPending || bulkCount <= 0}
          className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generateBulkNewsletters.isPending
            ? "Generating Newsletters..."
            : "Generate Bulk Newsletters"}
        </button>
      </form>

      {/* Bulk Generation Results */}
      {generateBulkNewsletters.data && (
        <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4">
          <h4 className="mb-2 text-sm font-medium text-gray-900">
            Bulk Generation Results
          </h4>
          <div className="mb-3 text-sm text-gray-700">
            <p>
              Total Requested: {generateBulkNewsletters.data.totalRequested}
            </p>
            <p className="text-green-600">
              Successful: {generateBulkNewsletters.data.successful}
            </p>
            <p className="text-red-600">
              Failed: {generateBulkNewsletters.data.failed}
            </p>
          </div>

          {generateBulkNewsletters.data.results.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                View Individual Results (
                {generateBulkNewsletters.data.results.length})
              </summary>
              <div className="mt-2 space-y-2">
                {generateBulkNewsletters.data.results.map((result) => (
                  <div
                    key={result.topicId}
                    className={`rounded p-2 text-sm ${
                      result.success
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    <div className="font-medium">
                      #{result.sequenceOrder} - {result.title}
                    </div>
                    {result.success ? (
                      <div>✓ Newsletter generated successfully</div>
                    ) : (
                      <div>✗ Failed: {result.error}</div>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}