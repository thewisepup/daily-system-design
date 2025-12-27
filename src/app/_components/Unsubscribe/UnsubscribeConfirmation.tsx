import Link from "next/link";

interface UnsubscribeConfirmationProps {
  onUnsubscribe: () => void;
  isUnsubscribing: boolean;
  error?: string;
}

export function UnsubscribeConfirmation({
  onUnsubscribe,
  isUnsubscribing,
  error,
}: UnsubscribeConfirmationProps) {
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
                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Unsubscribe</h1>
          <p className="mb-6 text-gray-600">
            Are you sure you want to unsubscribe from our newsletter?
          </p>
          <div className="space-y-3">
            <button
              onClick={onUnsubscribe}
              disabled={isUnsubscribing}
              className="w-full rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUnsubscribing ? "Unsubscribing..." : "Unsubscribe"}
            </button>
            <Link
              href="/"
              className="block w-full rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Keep Subscription
            </Link>
          </div>
          {error && <p className="mt-4 text-sm text-red-600">Error: {error}</p>}
        </div>
      </div>
    </div>
  );
}
