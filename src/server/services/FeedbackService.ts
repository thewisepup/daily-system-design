import z from "zod";
import { feedbackRepo } from "../db/repo/FeedbackRepo";
import { sanitizeInput } from "~/lib/sanitize";
import { isValidCampaignId } from "~/lib/constants/campaigns";

const SubmitFeedbackInput = z
  .object({
    userId: z.string().uuid(),
    issueId: z.number().optional(),
    campaignId: z.string().optional(),
    feedback: z.string(),
    rating: z.number().min(0).max(5).optional(),
  })
  .refine((data) => data.issueId != null || data.campaignId != null, {
    message: "Either issueId or campaignId must be provided",
  });
type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackInput>;

class FeedbackService {
  async submitFeedback(feedback: SubmitFeedbackInput) {
    SubmitFeedbackInput.parse(feedback);

    if (
      feedback.campaignId != null &&
      !isValidCampaignId(feedback.campaignId)
    ) {
      throw new Error(`Invalid campaign ID: ${feedback.campaignId}`);
    }

    const sanitizedFeedback = sanitizeInput(feedback.feedback);

    return await feedbackRepo.submitFeedback({
      ...feedback,
      feedback: sanitizedFeedback,
    });
  }
}

export const feedbackService = new FeedbackService();
