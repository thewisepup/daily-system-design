"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import CopyButton from "./CopyButton";
import ConfirmationModal from "./ConfirmationModal";

// Newsletter metrics type matches the tRPC return type

export default function NewsletterMetricsDashboard() {
  const [expandedIssueId, setExpandedIssueId] = useState<number | null>(null);
  const [showResendConfirmation, setShowResendConfirmation] = useState<
    number | null
  >(null);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  // Fetch recent newsletter metrics
  const {
    data: metricsData,
    isLoading: metricsLoading,
    refetch: refetchMetrics,
  } = api.newsletter.getRecentMetrics.useQuery({
    limit: 5,
  });

  // Fetch failed user IDs for expanded issue
  const { data: failedUserIds, isLoading: failedUsersLoading } =
    api.newsletter.getFailedDeliveryUsers.useQuery(
      { issueId: expandedIssueId! },
      { enabled: expandedIssueId !== null },
    );

  const utils = api.useUtils();

  // Resend mutation
  const resendMutation = api.newsletter.resendToFailedUsers.useMutation({
    onSuccess: (result) => {
      console.log("Resend successful:", result);
      // Refetch metrics to update the UI
      void refetchMetrics();
      // Invalidate failed users query for the specific issueId
      if (expandedIssueId) {
        void utils.newsletter.getFailedDeliveryUsers.invalidate({
          issueId: expandedIssueId,
        });
      }
      setShowResendConfirmation(null);
      setExpandedIssueId(null);
    },
    onError: (error) => {
      console.error("Resend failed:", error);
      alert(`Resend failed: ${error.message}`);
    },
  });

  const handleCardClick = (issueId: number) => {
    if (expandedIssueId === issueId) {
      setExpandedIssueId(null);
    } else {
      setExpandedIssueId(issueId);
    }
  };

  const handleResendClick = (issueId: number) => {
    setShowResendConfirmation(issueId);
  };

  const handleConfirmResend = () => {
    if (showResendConfirmation) {
      resendMutation.mutate({ issueId: showResendConfirmation });
      setShowResendConfirmation(null);
    }
  };

  const handleCopyUserId = async (userId: string) => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopiedUserId(userId);
      setTimeout(() => setCopiedUserId(null), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error("Failed to copy userId:", error);
    }
  };

  const getCardBackgroundColor = (successRate: number) => {
    return successRate === 1.0
      ? "bg-green-50 border-green-200"
      : "bg-red-50 border-red-200";
  };

  const getSuccessRateColor = (successRate: number) => {
    return successRate === 1.0 ? "text-green-700" : "text-red-700";
  };

  if (metricsLoading) {
    return (
      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">
          Newsletter Delivery Metrics
        </h2>
        <div className="text-gray-500">Loading metrics...</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="mb-6 text-lg font-semibold">
        Newsletter Delivery Metrics
      </h2>

      {metricsData && metricsData.length > 0 ? (
        <div className="space-y-4">
          {metricsData.map((metrics) => (
            <div key={metrics.issueId}>
              {/* Main metrics card */}
              <div
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md ${getCardBackgroundColor(metrics.successRate)}`}
                onClick={() => handleCardClick(metrics.issueId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {metrics.issueTitle}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {metrics.sentAt
                        ? new Date(metrics.sentAt).toLocaleDateString()
                        : "Not sent"}
                    </p>
                  </div>

                  <div className="flex gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">
                        {metrics.total}
                      </div>
                      <div className="text-gray-600">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-green-600">
                        {metrics.sent}
                      </div>
                      <div className="text-gray-600">Sent</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-yellow-600">
                        {metrics.pending}
                      </div>
                      <div className="text-gray-600">Pending</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-red-600">
                        {metrics.failed}
                      </div>
                      <div className="text-gray-600">Failed</div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`font-semibold ${getSuccessRateColor(metrics.successRate)}`}
                      >
                        {(metrics.successRate * 100.0).toFixed(2)}%
                      </div>
                      <div className="text-gray-600">Success</div>
                    </div>
                  </div>

                  <div className="ml-4">
                    {expandedIssueId === metrics.issueId ? "▼" : "▶"}
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              {expandedIssueId === metrics.issueId && (
                <div className="mt-2 rounded-lg border bg-gray-50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="font-medium">Failed Deliveries</h4>
                    {failedUserIds && failedUserIds.length > 0 && (
                      <button
                        onClick={() => handleResendClick(metrics.issueId)}
                        disabled={resendMutation.isPending}
                        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {resendMutation.isPending
                          ? "Resending..."
                          : "Resend to Failed Users"}
                      </button>
                    )}
                  </div>

                  {failedUsersLoading ? (
                    <div className="text-gray-500">Loading failed users...</div>
                  ) : failedUserIds && failedUserIds.length > 0 ? (
                    <div>
                      <p className="mb-3 text-sm text-gray-600">
                        {failedUserIds.length} users with failed or pending
                        deliveries:
                      </p>
                      <div className="max-h-40 space-y-1 overflow-y-auto">
                        {failedUserIds.map((userId: string) => (
                          <div
                            key={userId}
                            className="flex items-center gap-2 text-sm"
                          >
                            <CopyButton
                              isActive={copiedUserId === userId}
                              onClick={() => handleCopyUserId(userId)}
                              title="Copy user ID"
                            />
                            <span className="font-mono text-gray-800">
                              {userId}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      No failed deliveries found.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500">No newsletter metrics available.</div>
      )}

      {/* Resend Confirmation Modal */}
      <ConfirmationModal
        isOpen={showResendConfirmation !== null}
        onClose={() => setShowResendConfirmation(null)}
        onConfirm={handleConfirmResend}
        title="Confirm Newsletter Resend"
        message="Are you sure you want to resend this newsletter to all users with failed or pending deliveries? This action cannot be undone."
        confirmText="Resend Newsletter"
        confirmButtonColor="yellow"
        requiredInput="RE SEND NEWSLETTER"
        isLoading={resendMutation.isPending}
      />
    </div>
  );
}
