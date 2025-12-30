import type { Metadata } from "next";
import { LogoutButton } from "~/app/_components/LogoutButton";
import NewsletterGenerator from "~/app/_components/NewsletterGenerator";
import TopicsManagement from "~/app/_components/TopicsManagement";
import TopicsViewer from "~/app/_components/TopicsViewer";
import UserManagement from "~/app/_components/UserManagement";
import MarketingCampaigns from "~/app/_components/MarketingCampaigns";
import NewsletterMetricsDashboard from "~/app/_components/NewsletterMetricsDashboard";
import AdvertisementTester from "~/app/_components/AdvertisementTester";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin panel for managing newsletters, topics, and users",
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <LogoutButton />
          </div>
        </div>
        {/* Newsletter Delivery Metrics */}
        <NewsletterMetricsDashboard />
        {/* Management Tools */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <TopicsManagement />
          </div>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <NewsletterGenerator />
          </div>
        </div>
        {/* Advertisement Tester */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <AdvertisementTester />
        </div>
        {/* Marketing Campaigns */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <MarketingCampaigns />
        </div>
        {/* Topics Viewer */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <TopicsViewer />
        </div>
        User Management
        <div className="rounded-lg bg-white p-6 shadow-md">
          <UserManagement />
        </div>
      </div>
    </div>
  );
}
