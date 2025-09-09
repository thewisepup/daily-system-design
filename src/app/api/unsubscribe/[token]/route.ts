import { type NextRequest, NextResponse } from "next/server";
import { validateUnsubscribeToken } from "~/lib/unsubscribe";
import { userRepo } from "~/server/db/repo/userRepo";

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
    await userRepo.markInactive(tokenData.userId);
    console.log(`TODO: Marked user ${tokenData.userId} as inactive`);

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
