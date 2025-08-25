"use client";

import { useState, useEffect } from "react";
import { isAdmin, clearAdminAuth } from "~/lib/auth";
import AdminLogin from "~/app/_components/AdminLogin";
import NewsletterGenerator from "~/app/_components/NewsletterGenerator";
import TopicsManagement from "~/app/_components/TopicsManagement";
import TopicsViewer from "~/app/_components/TopicsViewer";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on component mount and when it might change
  useEffect(() => {
    setIsAuthenticated(isAdmin());
  }, []);

  const handleLogin = () => {
    // Re-check authentication status after successful login
    setIsAuthenticated(isAdmin());
  };

  const handleLogout = () => {
    clearAdminAuth();
    setIsAuthenticated(false);
  };

  // Show AdminLogin component if user is not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="rounded-md bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 focus:outline-none"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Management Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <TopicsManagement />
          </div>
          <div className="rounded-lg bg-white p-6 shadow-md">
            <NewsletterGenerator />
          </div>
        </div>

        {/* Topics Viewer */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <TopicsViewer />
        </div>
      </div>
    </div>
  );
}
