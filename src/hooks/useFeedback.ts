import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { api } from "~/trpc/react";

export function useFeedback() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [feedback, setFeedback] = useState<string>("");
  const [rating, setRating] = useState<number>(0);
  const [hasHovered, setHasHovered] = useState<boolean>(false);
  const submitFeedbackMutation = api.feedback.submitFeedback.useMutation();

  const handleSubmit = useCallback(async () => {
    //form handling here React Hook Form
    const payload = {
      token: token ?? "",
      feedback: feedback,
      rating: rating,
    };
    submitFeedbackMutation.mutate(payload);
  }, [token, feedback, rating, submitFeedbackMutation]);

  return {
    token,
    feedback,
    setFeedback,
    rating,
    setRating,
    hasHovered,
    setHasHovered,
    handleSubmit,
    submitFeedbackMutation,
  };
}
