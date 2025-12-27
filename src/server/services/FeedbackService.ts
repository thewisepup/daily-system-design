import z from "zod";
import { feedbackRepo } from "../db/repo/FeedbackRepo";
import { sanitizeInput } from "~/lib/sanitize";

const SubmitFeedbackInput = z.object({
  userId: z.string().uuid(),
  issueId: z.number(),
  feedback: z.string(),
  rating: z.number().min(0).max(5).optional(),
});
type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackInput>;

class FeedbackService {
  async submitFeedback(feedback: SubmitFeedbackInput) {
    SubmitFeedbackInput.parse(feedback);

    // Sanitize feedback input to prevent XSS attacks
    const sanitizedFeedback = sanitizeInput(feedback.feedback);

    return await feedbackRepo.submitFeedback({
      ...feedback,
      feedback: sanitizedFeedback,
    });
  }
}

export const feedbackService = new FeedbackService();
