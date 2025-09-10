"use client";

import { useEffect, useRef } from "react";
import { api } from "~/trpc/react";

interface TopicsListProps {
  subjectId: number;
  selectedTopicId: number | null;
  onTopicSelect: (topicId: number) => void;
}

// TODO: add a button to generate a newsletter for a topic
export default function TopicsList({
  subjectId,
  selectedTopicId,
  onTopicSelect,
}: TopicsListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = api.topics.getWithIssues.useInfiniteQuery(
    { subjectId, limit: 10 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  const topics = data?.pages.flatMap((page) => page.topics) ?? [];

  // Infinite scroll effect
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;

      // Trigger fetch when user scrolls to within 200px of bottom
      if (
        scrollHeight - scrollTop - clientHeight < 200 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        void fetchNextPage();
      }
    };

    scrollElement.addEventListener("scroll", handleScroll);
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const getStatusColor = (
    status: "generating" | "draft" | "failed" | "approved" | "sent" | null,
  ) => {
    if (!status) return "bg-gray-100 text-gray-800";
    switch (status) {
      case "generating":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "sent":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (
    status: "generating" | "draft" | "failed" | "approved" | "sent" | null,
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
          Topics ({topics.length}){isFetchingNextPage && " • Loading more..."}
        </h3>
      </div>

      <div ref={scrollRef} className="h-full overflow-y-auto">
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
                {/* {topic.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                    {topic.description}
                  </p>
                )} */}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator for infinite scroll */}
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <svg
                className="h-4 w-4 animate-spin"
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
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Loading more topics...</span>
            </div>
          </div>
        )}

        {/* End of list indicator */}
        {!hasNextPage && topics.length > 0 && (
          <div className="flex items-center justify-center py-4">
            <span className="text-xs text-gray-400">
              All topics loaded ({topics.length} total)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
