interface EmailSignupSuccessProps {
  email: string;
  onReset: () => void;
}

export default function EmailSignupSuccess({
  email,
  onReset,
}: EmailSignupSuccessProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 text-center shadow-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <svg
            className="h-8 w-8 text-accent"
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
        <h2 className="mb-4 text-2xl font-bold text-foreground">
          You&apos;re Subscribed!
        </h2>
        <p className="mb-6 text-muted-foreground">
          Thank you for subscribing! We&apos;ve sent a welcome email to{" "}
          <span className="font-semibold text-accent">{email}</span> with
          more details about what to expect.
        </p>
        <button
          onClick={onReset}
          className="w-full rounded-lg bg-accent px-6 py-3 font-semibold text-accent-foreground transition duration-200 hover:bg-accent/90"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
