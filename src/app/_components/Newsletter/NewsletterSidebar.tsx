"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";

export default function NewsletterSidebar() {
  const params = useParams();
  const currentIssueId = params.id ? parseInt(params.id as string) : null;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = api.issue.getIssueSummariesInfinite.useInfiniteQuery(
    {
      subjectId: SYSTEM_DESIGN_SUBJECT_ID,
      limit: 20,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );

  // Intersection observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-destructive text-sm">
          Failed to load newsletters
        </div>
      </div>
    );
  }

  const allItems = data?.pages.flatMap((page) => page.items) ?? [];

  if (allItems.length === 0) {
    return (
      <div className="p-4">
        <div className="text-muted-foreground text-sm">
          No newsletters available yet
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-4">
        {allItems.map((item) => {
          const isActive = currentIssueId === item.issueId;

          return (
            <div key={item.issueId}>
              <Link
                href={`/newsletter/${item.issueId}`}
                scroll={false}
                className={`hover:bg-sidebar-accent block rounded-lg p-4 transition-all duration-200 ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground ring-sidebar-primary ring-2"
                    : "text-sidebar-foreground hover:ring-sidebar-border hover:ring-1"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 pt-0.5">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "bg-sidebar-accent text-sidebar-accent-foreground"
                      }`}
                    >
                      #{item.issueNumber}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      className={`line-clamp-2 text-[15px] leading-snug font-semibold ${
                        isActive ? "text-sidebar-primary" : ""
                      }`}
                    >
                      {item.title}
                    </h3>
                  </div>
                </div>
              </Link>
            </div>
          );
        })}

        {/* Loading indicator for next page */}
        {hasNextPage && (
          <div ref={loadMoreRef} className="py-4 text-center">
            <div className="text-muted-foreground text-sm">
              {isFetchingNextPage ? "Loading more..." : "Load more"}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
