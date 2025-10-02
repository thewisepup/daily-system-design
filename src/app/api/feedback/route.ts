import { type NextRequest, NextResponse } from "next/server";
import { validateFeedbackToken } from "~/lib/jwt/FeedbackTokenService";
import { feedbackService } from "~/server/services/FeedbackService";

export interface SubmitFeedbackRequest {
  token: string;
  feedback: string;
}
export async function POST(request: NextRequest) {
  try {
    console.log("/api/feedback");
    const { token, feedback } = (await request.json()) as SubmitFeedbackRequest;
    console.log(token, feedback);
    const tokenPayload = validateFeedbackToken(token);
    if (!tokenPayload) {
      return NextResponse.json(
        {
          error: "Invalid feedback token." + token,
        },
        { status: 401 }, //TODO: whats response code for invalid token
      );
    }
    const { userId, issueId } = tokenPayload;
    const submittedFeedback = await feedbackService.submitFeedback(
      userId,
      issueId,
      feedback,
    );
    return NextResponse.json(submittedFeedback, { status: 201 }); //TODO: make sure no PII is returned back to user
  } catch (error) {
    console.error("Unable to submit feedback:", error);
    return NextResponse.json(
      {
        error: "Unable to submit feedback." + error.message,
      },
      { status: 500 },
    );
  }
}
