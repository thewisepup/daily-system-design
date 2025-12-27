"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "~/trpc/react";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";

export default function RecentNewsletters() {
  const [loadingIssueId, setLoadingIssueId] = useState<number | null>(null);
  const pathname = usePathname();

  const { data: newsletters, isLoading } = api.issue.getIssueSummaries.useQuery(
    {
      subjectId: SYSTEM_DESIGN_SUBJECT_ID,
      page: 1,
      resultsPerPage: 3,
    },
  );

  useEffect(() => {
    setLoadingIssueId(null);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse bg-white/50">
            <CardHeader className="p-4">
              <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!newsletters || newsletters.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4">
      {newsletters.map((newsletter) => {
        const isLoading = loadingIssueId === newsletter.issueId;

        return (
          <Link
            key={newsletter.issueId}
            href={`/newsletter/${newsletter.issueId}`}
            className="group block"
            onClick={() => {
              setLoadingIssueId(newsletter.issueId);
            }}
          >
            <Card
              className={`transition-all duration-200 hover:border-accent/20 hover:bg-accent/5 hover:shadow-sm ${
                isLoading ? "opacity-75" : ""
              }`}
            >
              <CardHeader className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="flex-shrink-0 rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      #{newsletter.issueNumber}
                    </span>
                    <CardTitle className="truncate text-sm font-medium text-foreground group-hover:text-accent">
                      {newsletter.title}
                    </CardTitle>
                  </div>
                  {isLoading && (
                    <div className="flex-shrink-0">
                      <svg
                        className="h-3 w-3 animate-spin text-accent"
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
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

