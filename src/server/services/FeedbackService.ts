import z from "zod";
import { feedbackRepo } from "../db/repo/FeedbackRepo";

const SubmitFeedbackInput = z.object({
  userId: z.string(),
  issueId: z.number(),
  feedback: z.string(),
  rating: z.number().min(0).max(5).optional(),
});
type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackInput>;

class FeedbackService {
  async submitFeedback(feedback: SubmitFeedbackInput) {
    SubmitFeedbackInput.parse(feedback);
    //validate userId exists: throw NotFoundError('userId not found')
    // validate issueId exists: throw NotFoundError('issueId not found')
    // validate string (make sure we sanitze feedback to avoid sql injection)

    //TODO: const sanitizedString = sanitzeInput(feedback);
    return await feedbackRepo.submitFeedback(feedback);
  }
}

export const feedbackService = new FeedbackService();
