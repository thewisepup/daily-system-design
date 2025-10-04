import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import MessageValidator from "sns-validator";
import { subscriptionRepo } from "~/server/db/repo/SubscriptionRepo";
import { env } from "~/env";

const validator = new MessageValidator();

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
    bounceSubType?: string;
    bouncedRecipients: Array<{
      emailAddress: string;
      status?: string;
      diagnosticCode?: string;
    }>;
  };
}

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

// TODO: Helper function to handle unsubscribe confirmation
function handleUnsubscribeConfirmation(): NextResponse {
  console.log("SNS unsubscribe confirmed");
  return NextResponse.json({ message: "Unsubscribe confirmed" });
}

function shouldCancelSubscription(bounce: SESBounceMessage["bounce"]): boolean {
  if (bounce.bounceType === "Permanent") {
    return true;
  }

  return bounce.bouncedRecipients.some((recipient) => {
    const status = recipient.status;
    const diagnosticCode = recipient.diagnosticCode?.toLowerCase() ?? "";

    // Cancel for any 5.x.x status code (permanent failures)
    if (status?.startsWith("5.")) {
      return true;
    }

    // Cancel for 4.4.7 with DNS lookup failures (permanent DNS issues)
    if (status === "4.4.7" && diagnosticCode.includes("Unable to lookup DNS")) {
      return true;
    }

    return false;
  });
}

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
    }
  }

  return totalCancelled;
}

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

  if (!shouldCancelSubscription(bounce)) {
    console.log(
      "Ignoring bounce - not permanent or invalid domain:",
      bounce.bounceType,
      bounce.bounceSubType,
    );
    return NextResponse.json({ message: "Bounce ignored" });
  }

  const totalCancelled = await processPermanentBounce(bounce);

  return NextResponse.json({
    message: "Bounce processed",
    cancelledSubscriptions: totalCancelled,
    bounceType: bounce.bounceType,
    bounceSubType: bounce.bounceSubType,
  });
}

function parseRequestBody(body: string): SNSMessage {
  try {
    return JSON.parse(body) as SNSMessage;
  } catch (parseError) {
    console.error("Failed to parse SNS message:", parseError);
    throw new Error("Invalid JSON");
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    console.log("/api/webhook/ses-bounce: " + body);
    const message = parseRequestBody(body);

    await validateSNSMessage(message);
    validateTopicArn(message);

    console.log("Processing SNS message type:", message.Type);
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
