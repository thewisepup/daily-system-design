"use client";
import { validateFeedbackToken } from "~/lib/jwt/FeedbackTokenService";
import type { Feedback } from "~/server/db/schema/feedback";
import { useFeedback } from "~/hooks/useFeedback";
import { FeedbackForm } from "./FeedbackForm";

export default function Feedback() {
  const { token, setFeedback, handleSubmit } = useFeedback();
  const tokenPayload = token ? validateFeedbackToken(token) : null;

  if (!token) {
    return <div>No Token Provided</div>;
  }
  if (!tokenPayload) {
    return <div>Invalid token</div>;
  }

  return (
    <FeedbackForm
      handleSubmit={handleSubmit}
      setFeedback={(e) => setFeedback(e.target.value)}
    />
  );
}
