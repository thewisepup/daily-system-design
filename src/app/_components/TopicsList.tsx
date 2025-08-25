"use client";

import { api } from "~/trpc/react";

interface TopicsListProps {
  subjectId: number;
  selectedTopicId: number | null;
  onTopicSelect: (topicId: number) => void;
}

export default function TopicsList({
  subjectId,
  selectedTopicId,
  onTopicSelect,
}: TopicsListProps) {
  const {
    data: topics,
    isLoading,
    error,
  } = api.topics.getWithIssues.useQuery({ subjectId });

  const getStatusColor = (
    status: "generating" | "draft" | "approved" | "sent" | null,
  ) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status) {
      case "generating":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "sent":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (
    status: "generating" | "draft" | "approved" | "sent" | null,
  ) => {
    return status ?? "No Issue";
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-gray-500">Loading topics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-red-600">
          Error loading topics: {error.message}
        </div>
      </div>
    );
  }

  if (!topics || topics.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-gray-500">
          No topics found. Generate topics first.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <h3 className="text-sm font-medium text-gray-900">
          Topics ({topics.length})
        </h3>
      </div>

      <div className="h-full overflow-y-auto">
        {topics.map((topic) => (
          <div
            key={topic.id}
            onClick={() => onTopicSelect(topic.id)}
            className={`cursor-pointer border-b border-gray-100 px-4 py-3 hover:bg-gray-50 ${
              selectedTopicId === topic.id
                ? "border-indigo-200 bg-indigo-50"
                : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center space-x-2">
                  <span className="inline-flex items-center rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                    #{topic.sequenceOrder}
                  </span>
                  <span
                    className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${getStatusColor(
                      topic.issueStatus,
                    )}`}
                  >
                    {getStatusText(topic.issueStatus)}
                  </span>
                </div>
                <h4 className="truncate text-sm font-medium text-gray-900">
                  {topic.title}
                </h4>
                {topic.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                    {topic.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
