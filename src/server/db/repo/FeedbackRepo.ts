import { feedback } from "../schema/feedback";
import { db } from "~/server/db";

export interface SubmitFeedbackDao {
  userId: string;
  issueId: number;
  feedback: string;
}

class FeedbackRepo {
  async submitFeedback(submitFeedback: SubmitFeedbackDao) {
    return await db.insert(feedback).values(submitFeedback).returning();
  }
}

export const feedbackRepo = new FeedbackRepo();
