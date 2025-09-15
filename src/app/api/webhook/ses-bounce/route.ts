import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import MessageValidator from "sns-validator";
import { subscriptionRepo } from "~/server/db/repo/SubscriptionRepo";
import { env } from "~/env";

const validator = new MessageValidator();

// Types for SNS messages
interface SNSMessage {
  Type: string;
  TopicArn: string;
  Message: string;
  SubscribeURL?: string;
  [key: string]: unknown;
}

interface SESBounceMessage {
  eventType: string;
  bounce: {
    bounceType: string;
    bouncedRecipients: Array<{
      emailAddress: string;
    }>;
  };
}

// Helper function to validate SNS message signature
async function validateSNSMessage(message: SNSMessage): Promise<void> {
  return new Promise((resolve, reject) => {
    validator.validate(message, (error) => {
      if (error) {
        console.error("SNS message validation failed:", error);
        reject(new Error("Invalid SNS signature"));
      } else {
        resolve();
      }
    });
  });
}

// Helper function to validate topic ARN
function validateTopicArn(message: SNSMessage): void {
  if (message.TopicArn !== env.SNS_SES_BOUNCES_TOPIC_ARN) {
    console.error(
      "SNS message from unexpected topic:",
      message.TopicArn,
      "Expected: SNS_SES_BOUNCES_TOPIC_ARN from .env file",
    );
    throw new Error("Unauthorized topic");
  }
}

// Helper function to handle subscription confirmation
async function handleSubscriptionConfirmation(
  message: SNSMessage,
): Promise<NextResponse> {
  if (!message.SubscribeURL) {
    throw new Error("Missing SubscribeURL in confirmation message");
  }

  console.log("Auto-confirming SNS subscription:", message.SubscribeURL);

  try {
    const response = await fetch(message.SubscribeURL, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Failed to confirm subscription: ${response.statusText}`);
    }

    console.log("Successfully confirmed SNS subscription");
    return NextResponse.json({ message: "Subscription confirmed" });
  } catch (error) {
    console.error("Error confirming SNS subscription:", error);
    throw error;
  }
}

// Helper function to handle unsubscribe confirmation
function handleUnsubscribeConfirmation(): NextResponse {
  console.log("SNS unsubscribe confirmed");
  return NextResponse.json({ message: "Unsubscribe confirmed" });
}

// Helper function to process permanent bounces
async function processPermanentBounce(
  bounce: SESBounceMessage["bounce"],
): Promise<number> {
  console.log(
    "Processing permanent bounce for recipients:",
    bounce.bouncedRecipients,
  );

  let totalCancelled = 0;

  for (const recipient of bounce.bouncedRecipients) {
    const emailAddress = recipient.emailAddress;
    console.log("Cancelling subscriptions for bounced email:", emailAddress);

    try {
      const cancelledCount =
        await subscriptionRepo.cancelSubscriptionsByEmail(emailAddress);
      totalCancelled += cancelledCount;
      console.log(
        `Cancelled ${cancelledCount} subscriptions for ${emailAddress}`,
      );
    } catch (dbError) {
      console.error(
        `Error cancelling subscriptions for ${emailAddress}:`,
        dbError,
      );
      // Continue processing other recipients even if one fails
    }
  }

  return totalCancelled;
}

// Helper function to handle SES bounce notifications
async function handleBounceNotification(
  message: SNSMessage,
): Promise<NextResponse> {
  let sesMessage: SESBounceMessage;

  try {
    sesMessage = JSON.parse(message.Message) as SESBounceMessage;
  } catch (parseError) {
    console.error(
      "Failed to parse SES message within SNS notification:",
      parseError,
    );
    throw new Error("Invalid SES message format");
  }

  console.log("Processing SES event type:", sesMessage.eventType);

  // Only process bounce events
  if (sesMessage.eventType !== "Bounce") {
    console.log("Ignoring non-bounce SES event:", sesMessage.eventType);
    return NextResponse.json({ message: "Non-bounce event ignored" });
  }

  const bounce = sesMessage.bounce;

  // Only process permanent bounces, not temporary ones
  if (bounce.bounceType !== "Permanent") {
    console.log("Ignoring non-permanent bounce:", bounce.bounceType);
    return NextResponse.json({ message: "Non-permanent bounce ignored" });
  }

  const totalCancelled = await processPermanentBounce(bounce);
  console.log(`Total subscriptions cancelled: ${totalCancelled}`);

  return NextResponse.json({
    message: "Bounce processed",
    cancelledSubscriptions: totalCancelled,
  });
}

// Helper function to parse and validate request body
function parseRequestBody(body: string): SNSMessage {
  try {
    return JSON.parse(body) as SNSMessage;
  } catch (parseError) {
    console.error("Failed to parse SNS message:", parseError);
    throw new Error("Invalid JSON");
  }
}

// Main POST handler
export async function POST(request: NextRequest) {
  try {
    console.log("Webhook called");

    const body = await request.text();
    console.log(body);
    const message = parseRequestBody(body);

    // Validate SNS message signature
    await validateSNSMessage(message);

    // Validate topic ARN
    //validateTopicArn(message);

    console.log("Processing SNS message type:", message.Type);

    // Handle different message types
    switch (message.Type) {
      case "SubscriptionConfirmation":
        return await handleSubscriptionConfirmation(message);

      case "UnsubscribeConfirmation":
        return handleUnsubscribeConfirmation();

      case "Notification":
        return await handleBounceNotification(message);

      default:
        console.warn("Unknown SNS message type:", message.Type);
        return NextResponse.json({ message: "Unknown message type" });
    }
  } catch (error) {
    console.error("Error processing SNS webhook:", error);

    // Return appropriate error response based on error type
    if (error instanceof Error) {
      if (error.message === "Invalid JSON") {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }
      if (error.message === "Invalid SNS signature") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      if (error.message === "Unauthorized topic") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      if (error.message === "Invalid SES message format") {
        return NextResponse.json(
          { error: "Invalid SES message format" },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PATCH() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
