interface EmailSignupSuccessProps {
  email: string;
  onReset: () => void;
}

export default function EmailSignupSuccess({
  email,
  onReset,
}: EmailSignupSuccessProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          You&apos;re Subscribed!
        </h2>
        <p className="mb-6 text-gray-600">
          Thank you for subscribing! We&apos;ve sent a welcome email to{" "}
          <span className="font-semibold text-indigo-600">{email}</span> with
          more details about what to expect.
        </p>
        <button
          onClick={onReset}
          className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition duration-200 hover:bg-indigo-700"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
