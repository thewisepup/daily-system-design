"use client";

import { api } from "~/trpc/react";
import StatisticsCards from "./StatisticsCards";
import DailySignupsChart from "./DailySignupsChart";

export default function UserManagement() {
  const { data: dailyStats, isLoading: isLoadingDailyStats } =
    api.user.getDailySignupStats.useQuery({ days: 7 });

  const { data: signupStats, isLoading: isLoadingSignupStats } =
    api.user.getSignupStatistics.useQuery();

  if (isLoadingDailyStats || isLoadingSignupStats) {
    return (
      <div className="animate-pulse">
        <div className="mb-4 h-8 rounded bg-gray-200"></div>
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-16 rounded bg-gray-200"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          User Management Dashboard
        </h2>

        {/* Statistics Cards */}
        <StatisticsCards signupStats={signupStats} />

        {/* Daily Signups Chart */}
        <DailySignupsChart dailyStats={dailyStats} />
      </div>
    </div>
  );
}
