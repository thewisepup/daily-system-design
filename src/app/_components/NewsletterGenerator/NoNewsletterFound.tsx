interface NoNewsletterFoundProps {
  topicId: number;
  onRetry?: () => void;
}

export default function NoNewsletterFound({
  topicId,
  onRetry,
}: NoNewsletterFoundProps) {
  return (
    <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            No Newsletter Found
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            No newsletter was found for Topic ID {topicId}. This could mean:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-yellow-700">
            <li>The topic doesn&apos;t exist</li>
            <li>The newsletter hasn&apos;t been generated yet</li>
            <li>There was an issue during generation</li>
          </ul>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center rounded-md border border-transparent bg-yellow-100 px-3 py-2 text-sm leading-4 font-medium text-yellow-800 hover:bg-yellow-200 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
