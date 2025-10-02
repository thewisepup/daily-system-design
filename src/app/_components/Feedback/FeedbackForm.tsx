interface FeedbackFormProps {
  feedback: string;
  onFeedbackChange: (feedback: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error?: string;
}

export function FeedbackForm({
  feedback,
  onFeedbackChange,
  onSubmit,
  isSubmitting,
  error,
}: FeedbackFormProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md">
        <div className="text-center">
          <div className="mb-4 text-blue-500">
            <svg
              className="mx-auto h-16 w-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
          </div>
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Feedback Form
          </h1>
          <p className="mb-6 text-gray-600">
            Tell us what you like and don&apos;t like about the newsletter
          </p>
          <div className="space-y-4">
            <textarea
              value={feedback}
              onChange={(e) => onFeedbackChange(e.target.value)}
              placeholder="Share your thoughts..."
              rows={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={onSubmit}
              disabled={isSubmitting || !feedback.trim()}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
          {error && (
            <p className="mt-4 text-sm text-red-600">Error: {error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
