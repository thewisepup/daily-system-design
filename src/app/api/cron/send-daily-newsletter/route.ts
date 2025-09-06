import { type NextRequest, NextResponse } from "next/server";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { sendNewsletterToAllSubscribers } from "~/server/newsletter/sendNewsletter";

export async function GET(request: NextRequest) {
  try {
    // Validate Vercel cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting newsletter delivery to all subscribers...");

    const result = await sendNewsletterToAllSubscribers(
      SYSTEM_DESIGN_SUBJECT_ID,
    );

    if (result.success) {
      console.log("Newsletter delivery completed successfully: ", result);

      return NextResponse.json(
        {
          success: true,
          message: "Newsletter delivered to all subscribers",
          data: result,
        },
        { status: 200 },
      );
    } else {
      console.error("Newsletter delivery failed:", result.error);
      return NextResponse.json(
        {
          success: false,
          error: "Newsletter delivery failed",
          details: result.error,
          data: result,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in newsletter delivery cron job:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Check for specific error types
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
