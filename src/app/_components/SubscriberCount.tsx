"use client";

import { api } from "~/trpc/react";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";

interface SubscriberCountProps {
  badge?: boolean;
}

export default function SubscriberCount({
  badge = false,
}: SubscriberCountProps) {
  const { data: count, isLoading, error } = api.user.getTotalCount.useQuery();

  if (error) {
    // Don't show anything if there's an error to avoid breaking the page
    return null;
  }

  if (badge) {
    if (isLoading) {
      return <Skeleton className="h-6 w-24 bg-emerald-500/20" />;
    }

    if (!count || count === 0) {
      return (
        <Badge variant="outline" className="text-accent">
          Join us
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="text-accent">
        {count.toLocaleString()} subscribers
      </Badge>
    );
  }

  if (isLoading) {
    return (
      <div className="inline-flex items-center space-x-2">
        <div className="bg-accent/20 h-4 w-16 animate-pulse rounded"></div>
        <span className="text-accent text-lg font-medium">subscribers</span>
      </div>
    );
  }

  if (!count || count === 0) {
    return (
      <div className="inline-flex items-center space-x-2">
        <span className="text-accent text-lg font-bold">Join our</span>
        <span className="text-accent text-lg font-medium">subscribers</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center space-x-2">
      <span className="text-accent text-xl font-bold">
        {count.toLocaleString()}
      </span>
      <span className="text-accent text-lg font-medium">
        active subscribers
      </span>
    </div>
  );
}
