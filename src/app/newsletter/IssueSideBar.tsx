"use client";
import { useCallback, useEffect, useState } from "react";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { api } from "~/trpc/react";
import IssueSummary from "./IssueSummary";

export interface IssueSideBarProps {
  onSideBarClick: (issueId: number | undefined) => void;
}
export default function IssueSideBar({ onSideBarClick }: IssueSideBarProps) {
  const [issueId, setIssueId] = useState<number>();

  const { data: issueSummaries, isFetching } =
    api.issue.getIssueSummaries.useQuery({
      subjectId: SYSTEM_DESIGN_SUBJECT_ID,
      page: 1,
      resultsPerPage: 10,
    });

  const onIssueSummaryClick = useCallback(
    (newIssueId: number) => {
      setIssueId(newIssueId);
      onSideBarClick(newIssueId);
    },
    [onSideBarClick],
  );

  useEffect(() => {
    if (issueSummaries && issueSummaries.length > 0 && issueId === undefined) {
      const firstIssueId = issueSummaries[0]?.issueId;
      if (firstIssueId) {
        setIssueId(firstIssueId);
        onSideBarClick(firstIssueId);
      }
    }
  }, [issueSummaries, issueId, onSideBarClick]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Newsletter Issues
        </h2>
      </div>
      {isFetching && (
        <div className="p-4 text-center text-gray-500">Loading issues...</div>
      )}
      {issueSummaries?.map((issueSummary) => (
        <IssueSummary
          issueSummary={issueSummary}
          key={issueSummary.issueId}
          isSelected={issueId === issueSummary.issueId}
          onIssueSummaryClick={onIssueSummaryClick}
        />
      ))}
      {!isFetching && issueSummaries?.length === 0 && (
        <div className="p-4 text-center text-gray-500">No issues found</div>
      )}
    </div>
  );
}
