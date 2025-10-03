"use client";

import { Suspense, useState } from "react";
import { useFeedback } from "~/hooks/useFeedback";
import { FeedbackForm, FeedbackSuccessModal } from "~/app/_components/Feedback";
import { LoadingSpinner } from "~/app/_components/LoadingSpinner";

function FeedbackContent() {
  const { feedback, setFeedback, handleSubmit, submitFeedbackMutation } =
    useFeedback();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleFeedbackSubmit = async () => {
    await handleSubmit();
    if (submitFeedbackMutation.isSuccess) {
      setShowSuccessModal(true);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    window.location.href = "/";
  };

  // Show success modal
  if (submitFeedbackMutation.isSuccess || showSuccessModal) {
    return <FeedbackSuccessModal onClose={handleCloseSuccessModal} />;
  }

  return (
    <FeedbackForm
      feedback={feedback}
      onFeedbackChange={setFeedback}
      onSubmit={handleFeedbackSubmit}
      isSubmitting={submitFeedbackMutation.isPending}
      error={submitFeedbackMutation.error?.message}
    />
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading..." />}>
      <FeedbackContent />
    </Suspense>
  );
}
