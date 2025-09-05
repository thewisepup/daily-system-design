import { type NextRequest, NextResponse } from "next/server";
import { validateUnsubscribeToken } from "~/lib/unsubscribe";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Validate token
    const tokenData = validateUnsubscribeToken(decodeURIComponent(token));

    if (!tokenData) {
      return NextResponse.json(
        { error: "Invalid or expired unsubscribe link." },
        { status: 400 },
      );
    }

    // TODO: Mark user as inactive in database
    // await userRepo.markInactive(tokenData.userId);
    console.log(`TODO: Mark user ${tokenData.userId} as inactive`);

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
