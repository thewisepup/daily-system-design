"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { useNotifications } from "~/hooks/useNotifications";

export default function GenerateTopicsButton() {
  const [batchSize, setBatchSize] = useState(10);
  const { addNotification } = useNotifications();

  const generateTopics = api.topics.generate.useMutation({
    onSuccess: (data) => {
      addNotification({
        type: "success",
        title: "Success",
        message: `Generated ${data.topicsCreated} topics successfully!`,
      });
    },
    onError: (error) => {
      addNotification({
        type: "error",
        title: "Topics Error",
        message: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generateTopics.mutate({ batchSize });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="batchSize"
          className="block text-sm font-medium text-gray-700"
        >
          Batch Size
        </label>
        <input
          type="number"
          id="batchSize"
          min="1"
          max="100"
          value={batchSize}
          onChange={(e) => setBatchSize(parseInt(e.target.value) || 1)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          placeholder="Enter number of topics to generate"
        />
        <p className="mt-1 text-sm text-gray-500">
          Number of topics to generate in this batch (1-100)
        </p>
      </div>

      <button
        type="submit"
        disabled={generateTopics.isPending}
        className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {generateTopics.isPending
          ? "Generating..."
          : `Generate ${batchSize} Topics`}
      </button>
    </form>
  );
}
