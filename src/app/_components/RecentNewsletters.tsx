"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "~/trpc/react";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Spinner } from "~/app/_components/Spinner";

export default function RecentNewsletters() {
  const [loadingIssueId, setLoadingIssueId] = useState<number | null>(null);
  const pathname = usePathname();

  const { data: newsletters, isLoading, error } = api.issue.getIssueSummaries.useQuery(
    {
      subjectId: SYSTEM_DESIGN_SUBJECT_ID,
      page: 1,
      resultsPerPage: 3,
    },
  );

  useEffect(() => {
    setLoadingIssueId(null);
  }, [pathname]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load recent newsletters. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse bg-card/50">
            <CardHeader className="p-4">
              <div className="h-4 w-3/4 rounded bg-muted"></div>
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
                      <Spinner size="sm" />
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

