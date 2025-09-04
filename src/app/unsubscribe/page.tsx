"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import {
  LoadingSpinner,
  InvalidLinkError,
  UnsubscribeConfirmation,
  SuccessModal,
} from "~/app/_components/Unsubscribe";

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Validate the token and get email
  const {
    data: validation,
    isLoading: isValidating,
    error: validationError,
  } = api.emailSubscription.validateUnsubscribe.useQuery(
    { token: token ?? "" },
    { enabled: !!token },
  );

  // Confirm unsubscribe mutation
  const confirmUnsubscribe =
    api.emailSubscription.confirmUnsubscribe.useMutation({
      onSuccess: () => {
        setShowSuccessModal(true);
      },
      onError: (error) => {
        console.error("Unsubscribe failed:", error);
      },
    });

  const handleUnsubscribe = () => {
    if (token) {
      confirmUnsubscribe.mutate({ token });
    }
  };

  const handleCloseSuccessModal = () => {
    window.location.href = "/";
  };

  // Show loading state
  if (isValidating) {
    return <LoadingSpinner message="Loading email subscriptions..." />;
  }

  // Show error state
  if (!token || validationError || !validation?.valid) {
    return (
      <InvalidLinkError
        message={
          validation?.message ??
          "This unsubscribe link is invalid or has expired."
        }
      />
    );
  }

  return (
    <>
      <UnsubscribeConfirmation
        email={validation.email!}
        onUnsubscribe={handleUnsubscribe}
        isUnsubscribing={confirmUnsubscribe.isPending}
        error={confirmUnsubscribe.error?.message}
      />

      {showSuccessModal && (
        <SuccessModal
          email={validation.email!}
          onClose={handleCloseSuccessModal}
        />
      )}
    </>
  );
}
