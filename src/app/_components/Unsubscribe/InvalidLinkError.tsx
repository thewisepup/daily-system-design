import Link from "next/link";

interface InvalidLinkErrorProps {
  message?: string;
}

export function InvalidLinkError({ 
  message = "This unsubscribe link is invalid or has expired." 
}: InvalidLinkErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md rounded-lg bg-card p-6 text-center shadow-md">
        <div className="mb-4 text-destructive">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="mb-4 text-2xl font-bold text-foreground">
          Invalid Link
        </h1>
        <p className="mb-6 text-muted-foreground">{message}</p>
        <Link
          href="/"
          className="inline-block rounded-md bg-accent px-4 py-2 text-accent-foreground hover:bg-accent/90"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}