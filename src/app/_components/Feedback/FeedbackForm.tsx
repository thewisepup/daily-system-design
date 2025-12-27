import { StarRating } from "./StarRating";

interface FeedbackFormProps {
  feedback: string;
  onFeedbackChange: (feedback: string) => void;
  rating: number;
  onRatingChange: (rating: number) => void;
  hasHovered: boolean;
  onHasHoveredChange: (hovered: boolean) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error?: string;
}

export function FeedbackForm({
  feedback,
  onFeedbackChange,
  rating,
  onRatingChange,
  hasHovered,
  onHasHoveredChange,
  onSubmit,
  isSubmitting,
  error,
}: FeedbackFormProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md rounded-lg bg-card p-6 shadow-md">
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
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
          </div>
          <h1 className="mb-4 text-2xl font-bold text-foreground">
            Feedback Form
          </h1>
          <p className="mb-6 text-muted-foreground">
            Tell us what you like and don&apos;t like about the newsletter
          </p>
          <div className="space-y-4">
            <div className="flex justify-center">
              <StarRating
                rating={rating}
                setRating={onRatingChange}
                hasHovered={hasHovered}
                setHasHovered={onHasHoveredChange}
              />
            </div>
            <textarea
              value={feedback}
              onChange={(e) => onFeedbackChange(e.target.value)}
              placeholder="Share your thoughts..."
              rows={6}
              className="w-full rounded-md border border-input px-3 py-2 text-foreground placeholder-muted-foreground focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none"
            />
            <button
              onClick={onSubmit}
              disabled={isSubmitting || !feedback.trim() || !hasHovered}
              className="w-full rounded-md bg-accent px-4 py-2 text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
          {error && <p className="mt-4 text-sm text-destructive">Error: {error}</p>}
        </div>
      </div>
    </div>
  );
}
