import type { IssueSummary as IssueSummaryType } from "~/server/api/routers/issue";

export interface IssueSummaryProps {
  issueSummary: IssueSummaryType;
  isSelected?: boolean;
  key: number;
  onIssueSummaryClick: (issueId: number) => void;
}

export default function IssueSummary({
  issueSummary,
  isSelected = false,
  onIssueSummaryClick,
}: IssueSummaryProps) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => onIssueSummaryClick(issueSummary.issueId)}
        className={`w-full p-3 text-left transition-colors hover:bg-gray-50 ${
          isSelected ? "border-r-2 border-blue-500 bg-blue-50" : ""
        }`}
      >
        <div className="text-sm font-medium text-gray-900">
          Issue #{issueSummary.issueNumber}
        </div>
        <div className="mt-1 text-sm text-gray-600">{issueSummary.title}</div>
      </button>
    </div>
  );
}
