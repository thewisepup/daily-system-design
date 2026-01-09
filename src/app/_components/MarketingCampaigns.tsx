"use client";

import { api } from "~/trpc/react";
import { useNotifications } from "~/hooks/useNotifications";
import { useConfirmationModal } from "~/hooks/useConfirmationModal";
import NotificationList from "~/app/_components/NotificationList";
import ViewHTMLButton from "~/app/_components/ViewHTMLButton";
import ConfirmationModal from "~/app/_components/ConfirmationModal";
import { MARKETING_CAMPAIGNS } from "~/lib/constants/campaigns";

export default function MarketingCampaigns() {
  const { notifications, addNotification, removeNotification } =
    useNotifications();
  const { modalState, openModal, closeModal } = useConfirmationModal();

  const previewQuery =
    api.marketing.previewJanuary2026UpdateAnnouncement.useQuery();

  const sendCampaignMutation =
    api.marketing.sendJanuary2026UpdateAnnouncement.useMutation({
      onSuccess: (result) => {
        addNotification({
          type: "success",
          title: "Campaign Sent Successfully!",
          message: `January 2026 update announcement sent to ${result.totalSent} users. ${result.totalFailed} failed.`,
        });
        closeModal();
      },
      onError: (error) => {
        addNotification({
          type: "error",
          title: "Campaign Failed",
          message: error.message,
        });
        closeModal();
      },
    });

  const handleSendCampaign = () => {
    openModal({
      type: "sendEmail",
      title: "Send January 2026 Update Announcement",
      message:
        "Are you sure you want to send the January 2026 update announcement to all active subscribers? This action cannot be undone. Type 'SEND JANUARY 2026 UPDATE' to confirm.",
      confirmText: "Send Campaign",
      confirmButtonColor: "green",
      onConfirm: () => {
        sendCampaignMutation.mutate({
          campaignId: MARKETING_CAMPAIGNS.JANUARY_2026_UPDATE,
        });
      },
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        Marketing Campaigns
      </h2>

      {/* January 2026 Update Announcement Section */}
      <div className="space-y-4 border-t border-gray-200 pt-4">
        <h3 className="text-md font-medium text-gray-800">
          🎉 January 2026 Update Announcement
        </h3>

        {/* Preview Section - Displayed on page load */}
        <div className="space-y-3 rounded-md bg-gray-50 p-4 text-sm">
          {previewQuery.isLoading ? (
            <p className="text-gray-500">Loading campaign preview...</p>
          ) : previewQuery.error ? (
            <p className="text-red-600">
              Error loading preview: {previewQuery.error.message}
            </p>
          ) : previewQuery.data ? (
            <>
              <div className="space-y-1">
                <p className="text-gray-600">
                  Recipients:{" "}
                  <span className="font-medium">
                    {previewQuery.data.recipientCount}
                  </span>
                </p>
                <p className="text-gray-600">
                  Subject:{" "}
                  <span className="font-medium">
                    {previewQuery.data.subject}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ViewHTMLButton
                  htmlContent={previewQuery.data.htmlContent ?? ""}
                  variant="small"
                  title="View email HTML in new window"
                />
              </div>
            </>
          ) : null}
        </div>

        {/* Send Campaign Section */}
        <div className="space-y-2">
          <button
            onClick={handleSendCampaign}
            disabled={sendCampaignMutation.isPending || previewQuery.isLoading}
            className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sendCampaignMutation.isPending
              ? "Sending Campaign..."
              : "Send January 2026 Update Announcement"}
          </button>
        </div>

        {/* Results Display */}
        {sendCampaignMutation.data && (
          <div className="rounded-md border border-green-200 bg-green-50 p-4">
            <h4 className="mb-2 text-sm font-medium text-green-800">
              Campaign Results
            </h4>
            <div className="space-y-1 text-sm text-green-700">
              <p>
                Total Sent:{" "}
                <span className="font-medium">
                  {sendCampaignMutation.data.totalSent}
                </span>
              </p>
              <p>
                Total Failed:{" "}
                <span className="font-medium">
                  {sendCampaignMutation.data.totalFailed}
                </span>
              </p>
              <p>
                Success Rate:{" "}
                <span className="font-medium">
                  {sendCampaignMutation.data.totalSent +
                    sendCampaignMutation.data.totalFailed >
                  0
                    ? `${Math.round((sendCampaignMutation.data.totalSent / (sendCampaignMutation.data.totalSent + sendCampaignMutation.data.totalFailed)) * 100)}%`
                    : "0%"}
                </span>
              </p>
              {sendCampaignMutation.data.failedUserIds.length > 0 && (
                <p className="text-xs">
                  Failed User IDs:{" "}
                  {sendCampaignMutation.data.failedUserIds
                    .slice(0, 5)
                    .join(", ")}
                  {sendCampaignMutation.data.failedUserIds.length > 5 && "..."}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notification List */}
      <NotificationList
        notifications={notifications}
        onDismiss={removeNotification}
        position="inline"
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        confirmButtonColor={modalState.confirmButtonColor}
        requiredInput="SEND JANUARY 2026 UPDATE"
        isLoading={sendCampaignMutation.isPending}
      />
    </div>
  );
}
