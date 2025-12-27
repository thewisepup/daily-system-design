"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "~/trpc/react";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

/**
 * Displays a preview section of recent newsletters on the home page.
 * Shows the 3 most recent sent newsletters with a call-to-action to view all newsletters.
 */
export default function NewsletterPreviewSection() {
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
      <div className="mb-16">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-bold text-gray-900">
            Recent Newsletters
          </h2>
          <p className="text-gray-600">
            Explore our latest system design insights
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-3/4 rounded bg-gray-200"></div>
              </CardHeader>
              <CardContent>
                <div className="mb-2 h-4 w-full rounded bg-gray-200"></div>
                <div className="h-4 w-5/6 rounded bg-gray-200"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!newsletters || newsletters.length === 0) {
    return null;
  }

  return (
    <div className="mb-16">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-3xl font-bold text-gray-900">
          Recent Newsletters
        </h2>
        <p className="text-gray-600">
          Explore our latest system design insights
        </p>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        {newsletters.map((newsletter) => {
          const isLoading = loadingIssueId === newsletter.issueId;

          return (
            <Link
              key={newsletter.issueId}
              href={`/newsletter/${newsletter.issueId}`}
              className="group"
              onClick={() => {
                setLoadingIssueId(newsletter.issueId);
              }}
            >
              <Card
                className={`h-full transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
                  isLoading ? "opacity-75" : ""
                }`}
              >
                <CardHeader>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
                      #{newsletter.issueNumber}
                    </span>
                    {isLoading && (
                      <div className="flex-shrink-0">
                        <svg
                          className="h-4 w-4 animate-spin text-indigo-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          aria-label="Loading"
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
                  <CardTitle className="line-clamp-2 text-lg transition-colors group-hover:text-indigo-600">
                    {newsletter.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    {isLoading ? "Loading..." : "Click to read full article →"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="text-center">
        <Button
          asChild
          size="lg"
          className="bg-indigo-600 px-8 text-white hover:bg-indigo-700"
        >
          <Link href="/newsletter">View All Newsletters</Link>
        </Button>
      </div>
    </div>
  );
}
