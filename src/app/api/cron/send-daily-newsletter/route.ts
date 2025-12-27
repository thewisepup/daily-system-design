import { type NextRequest, NextResponse } from "next/server";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { sendNewsletterToAllSubscribers } from "~/server/newsletter/sendNewsletter";

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Validate Vercel cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn(
        `[${new Date().toISOString()}] [WARN] Unauthorized cron request attempt`,
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(
      `[${new Date().toISOString()}] [INFO] Cron job triggered - starting newsletter delivery`,
      {
        subjectId: SYSTEM_DESIGN_SUBJECT_ID,
      },
    );

    const result = await sendNewsletterToAllSubscribers(
      SYSTEM_DESIGN_SUBJECT_ID,
    );

    if (result.success) {
      const duration = Date.now() - startTime;
      console.log(
        `[${new Date().toISOString()}] [INFO] Cron job completed successfully`,
        {
          totalSent: result.totalSent,
          totalFailed: result.totalFailed,
          issueId: result.issueId,
          sequenceNumber: result.sequenceNumber,
          duration: `${duration}ms`,
        },
      );

      return NextResponse.json(
        {
          success: true,
          message: "Newsletter delivered to all subscribers",
          data: result,
        },
        { status: 200 },
      );
    } else {
      const duration = Date.now() - startTime;
      console.error(`[${new Date().toISOString()}] [ERROR] Cron job failed`, {
        error: result.error,
        duration: `${duration}ms`,
      });
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
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] [ERROR] Cron job exception`, {
      error: error instanceof Error ? error.message : String(error),
      duration: `${duration}ms`,
    });

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
