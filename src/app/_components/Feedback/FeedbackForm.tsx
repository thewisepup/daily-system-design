import { MessageSquare } from "lucide-react";
import { StarRating } from "./StarRating";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { cn } from "~/lib/utils";

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
      <Card className="mx-auto max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center text-accent">
            <MessageSquare className="h-16 w-16" />
          </div>
          <CardTitle className="text-2xl">Feedback Form</CardTitle>
          <CardDescription>
            Tell us what you like and don&apos;t like about the newsletter
          </CardDescription>
        </CardHeader>
        <CardContent>
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
              className={cn(
                "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                "text-foreground placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            />
            <Button
              onClick={onSubmit}
              disabled={isSubmitting || !feedback.trim() || !hasHovered}
              className="w-full"
              variant="default"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>Error: {error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
