"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function AdvertisementTester() {
  const [title, setTitle] = useState("Awesome SaaS Tool");
  const [content, setContent] = useState("Transform your workflow with our cutting-edge platform. Get 50% off your first month!");
  const [imageUrl, setImageUrl] = useState("https://example.com/logo.png");
  const [campaignId, setCampaignId] = useState("test-campaign-001");
  const [issueId, setIssueId] = useState(1);

  const sendTestMutation = api.newsletter.sendTestWithAdvertisement.useMutation({
    onSuccess: (data) => {
      alert(`✅ Success: ${data.message}`);
    },
    onError: (error) => {
      alert(`❌ Error: ${error.message}`);
    },
  });

  const handleSendTest = () => {
    sendTestMutation.mutate({
      advertisement: {
        title,
        content,
        imageUrl,
        campaignId,
        issueId,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Advertisement Tester
        </h3>
        <p className="text-sm text-gray-600">
          Test newsletters with embedded advertisements. The ad will appear after the overview section.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Advertisement Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter advertisement title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Campaign ID
          </label>
          <input
            type="text"
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter campaign ID for tracking"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Issue ID
          </label>
          <input
            type="number"
            value={issueId}
            onChange={(e) => setIssueId(parseInt(e.target.value) || 1)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Issue ID (hardcoded to 1 for testing)"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Image URL
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="CloudFront URL for advertiser logo"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Advertisement Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter advertisement content"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Email will be sent to the admin email address with both HTML and text versions
        </div>
        <button
          onClick={handleSendTest}
          disabled={sendTestMutation.isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sendTestMutation.isPending ? "Sending..." : "Send Test Newsletter"}
        </button>
      </div>

      {sendTestMutation.data && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-800">
            <strong>Success!</strong> {sendTestMutation.data.message}
            <br />
            <strong>Issue:</strong> {sendTestMutation.data.issueTitle}
            <br />
            <strong>Campaign ID:</strong> {sendTestMutation.data.campaignId}
            {sendTestMutation.data.messageId && (
              <>
                <br />
                <strong>Message ID:</strong> {sendTestMutation.data.messageId}
              </>
            )}
          </div>
        </div>
      )}

      {sendTestMutation.error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">
            <strong>Error:</strong> {sendTestMutation.error.message}
          </div>
        </div>
      )}
    </div>
  );
}