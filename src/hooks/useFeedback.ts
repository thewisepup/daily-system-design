import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import type { SubmitFeedbackRequest } from "~/app/api/feedback/route";

export function useFeedback() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [feedback, setFeedback] = useState<string>("");
  const submitFeedbackMutation = useMutation({
    mutationFn: async (payload: SubmitFeedbackRequest) => {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback. Please try again.");
      }
    },
  });

  const handleSubmit = useCallback(async () => {
    //form handling here React Hook Form
    const payload = {
      token: token ?? "",
      feedback: feedback,
    };
    submitFeedbackMutation.mutate(payload);
  }, [token, feedback, submitFeedbackMutation]);

  return { token, feedback, setFeedback, handleSubmit, submitFeedbackMutation };
}
