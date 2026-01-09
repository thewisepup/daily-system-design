import { MessageSquare } from "lucide-react";
import { StarRating } from "./StarRating";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Textarea } from "~/components/ui/textarea";

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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-lg shadow-lg">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold">Share Your Feedback</CardTitle>
            <CardDescription className="text-base">
              Tell us what you like and don&apos;t like about the newsletter
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              How would you rate this newsletter?
            </label>
            <div className="flex justify-center">
              <StarRating
                rating={rating}
                setRating={onRatingChange}
                hasHovered={hasHovered}
                setHasHovered={onHasHoveredChange}
              />
            </div>
          </div>
          <div className="space-y-3">
            <label htmlFor="feedback-textarea" className="text-sm font-medium text-foreground">
              Your feedback
            </label>
            <Textarea
              id="feedback-textarea"
              value={feedback}
              onChange={(e) => onFeedbackChange(e.target.value)}
              placeholder="Share your thoughts, suggestions, or any issues you encountered..."
              rows={6}
              className="min-h-[120px] resize-y"
            />
          </div>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !feedback.trim() || !hasHovered}
            className="w-full"
            variant="default"
            size="lg"
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </Button>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
