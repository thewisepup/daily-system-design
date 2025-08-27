import StatisticsCard from "./StatisticsCard";

interface SignupStatistics {
  today: number;
  week: number;
  month: number;
  total: number;
  avgDaily: number;
}

interface StatisticsCardsProps {
  signupStats?: SignupStatistics;
}

export default function StatisticsCards({ signupStats }: StatisticsCardsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StatisticsCard
        title="Total Users"
        value={signupStats?.total ?? 0}
        bgColor="border-blue-200 bg-blue-50"
        textColor="text-blue-600"
        valueTextColor="text-blue-900"
      />
      <StatisticsCard
        title="Today"
        value={signupStats?.today ?? 0}
        bgColor="border-green-200 bg-green-50"
        textColor="text-green-600"
        valueTextColor="text-green-900"
      />
      <StatisticsCard
        title="This Week"
        value={signupStats?.week ?? 0}
        bgColor="border-purple-200 bg-purple-50"
        textColor="text-purple-600"
        valueTextColor="text-purple-900"
      />
      <StatisticsCard
        title="This Month"
        value={signupStats?.month ?? 0}
        bgColor="border-orange-200 bg-orange-50"
        textColor="text-orange-600"
        valueTextColor="text-orange-900"
      />
      <StatisticsCard
        title="Avg/Day (7d)"
        value={signupStats?.avgDaily ?? 0}
        bgColor="border-gray-200 bg-gray-50"
        textColor="text-gray-600"
        valueTextColor="text-gray-900"
      />
    </div>
  );
}
