import { type NextRequest, NextResponse } from "next/server";
import { SYSTEM_DESIGN_SUBJECT_ID } from "~/lib/constants";
import { validateUnsubscribeToken } from "~/lib/unsubscribe";
import { subscriptionService } from "~/server/services/SubscriptionService";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const tokenData = validateUnsubscribeToken(decodeURIComponent(token));
    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired unsubscribe link." },
        { status: 400 },
      );
    }

    const subscription = await subscriptionService.unsubscribe(
      tokenData.userId,
      SYSTEM_DESIGN_SUBJECT_ID,
    );
    console.log(
      `Unsubscribed user ${subscription.userId} successfully via one-click`,
    );

    return NextResponse.json({
      success: true,
      message: "You have been successfully unsubscribed.",
    });
  } catch (error) {
    console.error("One-click unsubscribe error:", error);
    return NextResponse.json(
      {
        error: "Unable to process unsubscribe request. Please try again later.",
      },
      { status: 500 },
    );
  }
}
