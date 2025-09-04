"use client";

import { api } from "~/trpc/react";

export default function SubscriberCount() {
  const { data: count, isLoading, error } = api.user.getTotalCount.useQuery();

  if (error) {
    // Don't show anything if there's an error to avoid breaking the page
    return null;
  }

  if (isLoading) {
    return (
      <div className="inline-flex items-center space-x-2">
        <div className="h-4 w-16 animate-pulse rounded bg-indigo-200"></div>
        <span className="text-lg font-medium text-indigo-600">subscribers</span>
      </div>
    );
  }

  if (!count || count === 0) {
    return (
      <div className="inline-flex items-center space-x-2">
        <span className="text-lg font-bold text-indigo-600">Join our</span>
        <span className="text-lg font-medium text-indigo-600">subscribers</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center space-x-2">
      <span className="text-xl font-bold text-indigo-600">
        {count.toLocaleString()}
      </span>
      <span className="text-lg font-medium text-indigo-600">
        active subscribers
      </span>
    </div>
  );
}
