import { feedbackRepo } from "../db/repo/FeedbackRepo";

class FeedbackService {
  async submitFeedback(userId: string, issueId: number, feedback: string) {
    //TODO:
    //validate userId exists: throw NotFoundError('userId not found')
    // validate issueId exists: throw NotFoundError('issueId not found')
    // validate string (make sure we sanitze feedback to avoid sql injection)

    //TODO: const sanitizedString = sanitzeInput(feedback);
    return await feedbackRepo.submitFeedback({ userId, issueId, feedback });
  }
}

export const feedbackService = new FeedbackService();
