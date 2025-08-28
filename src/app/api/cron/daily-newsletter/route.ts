import { type NextRequest, NextResponse } from "next/server";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { topicRepo } from "~/server/db/repo/topicRepo";
import { sendNewsletterToAdmin } from "~/server/newsletter/sendNewsletter";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting daily newsletter cron job...");

    // 2. Get all topics for System Design subject (ordered by sequence)
    const topics = await topicRepo.findBySubjectId(SYSTEM_DESIGN_SUBJECT_ID);
    if (topics.length === 0) {
      console.error("No topics found for System Design subject");
      return NextResponse.json(
        { error: "No topics found for System Design subject" },
        { status: 404 },
      );
    }

    // 3. Get the first topic (sequenceOrder = 1)
    const firstTopic = topics.find((topic) => topic.sequenceOrder === 1);
    if (!firstTopic) {
      console.error("Topic #1 not found for System Design subject");
      return NextResponse.json(
        { error: "Topic #1 not found for System Design subject" },
        { status: 404 },
      );
    }

    console.log(
      `Found first topic: ${firstTopic.title} (ID: ${firstTopic.id})`,
    );

    // 4. Send newsletter to admin using existing function
    const result = await sendNewsletterToAdmin({
      topicId: firstTopic.id,
    });

    console.log("Newsletter sent successfully:", result);

    return NextResponse.json(
      {
        success: true,
        message: "Daily newsletter sent successfully",
        data: {
          topicId: firstTopic.id,
          topicTitle: firstTopic.title,
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
