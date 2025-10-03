import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { api } from "~/trpc/react";

export function useFeedback() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [feedback, setFeedback] = useState<string>("");
  const submitFeedbackMutation = api.feedback.submitFeedback.useMutation();

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
