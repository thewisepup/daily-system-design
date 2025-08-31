import { type NextRequest, NextResponse } from "next/server";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { topicRepo } from "~/server/db/repo/topicRepo";
import { newsletterSequenceRepo } from "~/server/db/repo/newsletterSequenceRepo";
import { sendNewsletterToAdmin } from "~/server/newsletter/sendNewsletter";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting daily newsletter cron job...");

    // 1. Get or create newsletter sequence tracker for System Design
    const sequenceTracker = await newsletterSequenceRepo.getOrCreate(
      SYSTEM_DESIGN_SUBJECT_ID,
    );
    if (!sequenceTracker) {
      console.error("Failed to get or create newsletter sequence tracker");
      return NextResponse.json(
        { error: "Failed to initialize newsletter sequence" },
        { status: 500 },
      );
    }

    const currentSequence = sequenceTracker.currentSequence;

    console.log(`Current sequence for System Design: ${currentSequence}`);

    // 2. Find topic with the current sequence number
    const currentTopic = await topicRepo.findBySubjectIdAndSequence(
      SYSTEM_DESIGN_SUBJECT_ID,
      currentSequence,
    );

    if (!currentTopic) {
      console.error(
        `No topic found for sequence #${currentSequence} in System Design subject`,
      );
      return NextResponse.json(
        { error: `No topic found for sequence #${currentSequence}` },
        { status: 404 },
      );
    }

    console.log(
      `Found topic for sequence #${currentSequence}: ${currentTopic.title} (ID: ${currentTopic.id})`,
    );

    // 3. Send newsletter to admin using existing function
    const result = await sendNewsletterToAdmin({
      topicId: currentTopic.id,
    });

    console.log("Newsletter sent successfully:", result);

    // 4. Increment sequence counter and update timestamp
    await newsletterSequenceRepo.incrementSequence(SYSTEM_DESIGN_SUBJECT_ID);
    await newsletterSequenceRepo.update(SYSTEM_DESIGN_SUBJECT_ID, {
      lastSentAt: new Date(),
    });

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
          topicId: currentTopic.id,
          topicTitle: currentTopic.title,
          deliveryId: result.deliveryId,
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
