import { type NextRequest, NextResponse } from "next/server";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { newsletterSequenceRepo } from "~/server/db/repo/newsletterSequenceRepo";
import { sendNewsletterToAdmin } from "~/server/newsletter/sendNewsletter";
import { getTodaysNewsletter } from "~/server/newsletter/utils/newsletterUtils";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log(`Starting daily newsletter cron job... [${new Date().toLocaleDateString('en-US', {month: '2-digit', day: '2-digit', year: 'numeric'})}]`);
    const { sequence, topic } = await getTodaysNewsletter(
      SYSTEM_DESIGN_SUBJECT_ID,
    );
    const currentSequence = sequence.currentSequence;
    const result = await sendNewsletterToAdmin({
      topicId: topic.id,
    });
    console.log("Newsletter sent successfully:", result);
    await newsletterSequenceRepo.incrementSequence(SYSTEM_DESIGN_SUBJECT_ID);
    console.log(
      `Incremented sequence to ${currentSequence + 1} for next delivery`,
    );
    return NextResponse.json(
      {
        success: true,
        message: "Daily newsletter sent successfully",
        data: {
          sequence: currentSequence,
          nextSequence: currentSequence + 1,
          topicId: topic.id,
          topicTitle: topic.title,
          messageId: result.messageId,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in daily newsletter cron job:", error);

    // Return different status codes based on error type
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Check for specific TRPC errors that might indicate expected failures
    if (errorMessage.includes("NOT_FOUND")) {
      return NextResponse.json(
        { error: "Resource not found", details: errorMessage },
        { status: 404 },
      );
    }

    if (errorMessage.includes("PRECONDITION_FAILED")) {
      return NextResponse.json(
        { error: "Precondition failed", details: errorMessage },
        { status: 400 },
      );
    }

    // For all other errors (email failures, database errors, etc.)
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 },
    );
  }
}
