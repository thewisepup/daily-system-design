interface SuccessModalProps {
  onClose: () => void;
}

export function SuccessModal({ onClose }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-w-sm rounded-lg bg-card p-6 shadow-xl">
        <div className="text-center">
          <div className="mb-4 text-accent">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mb-4 text-xl font-bold text-foreground">
            Successfully Unsubscribed
          </h2>
          <p className="mb-6 text-muted-foreground">
            You&apos;ve successfully unsubscribed from our newsletter.
          </p>
          <button
            onClick={onClose}
            className="w-full rounded-md bg-accent px-4 py-2 text-accent-foreground hover:bg-accent/90"
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
}