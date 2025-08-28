"use client";

import { api } from "~/trpc/react";
import { useNotifications } from "~/hooks/useNotifications";

export default function GenerateTopicsButton() {
  const { addNotification } = useNotifications();

  const generateTopics = api.topics.generate.useMutation({
    onSuccess: () => {
      addNotification({
        type: "success",
        title: "Success",
        message: "Topics generated successfully!",
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
    generateTopics.mutate();
  };

  return (
    <button
      type="submit"
      disabled={generateTopics.isPending}
      onClick={handleSubmit}
      className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      {generateTopics.isPending ? "Generating..." : "Generate Topics"}
    </button>
  );
}
