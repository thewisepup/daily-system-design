import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface DailySignupsChartProps {
  dailyStats?: Array<{
    date: string;
    count: number;
  }>;
}

export default function DailySignupsChart({
  dailyStats,
}: DailySignupsChartProps) {
  // Format chart data with PST timezone
  const chartData =
    dailyStats?.map((stat) => ({
      date: new Date(stat.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "America/Los_Angeles",
      }),
      signups: stat.count,
      fullDate: stat.date,
    })) ?? [];

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Daily Signups (Last 7 Days - PST)
      </h3>
      <div style={{ width: "100%", height: "300px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#666" fontSize={12} />
            <YAxis stroke="#666" fontSize={12} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#f8f9fa",
                border: "1px solid #dee2e6",
                borderRadius: "6px",
              }}
              labelFormatter={(label, payload) => {
                if (payload?.[0]?.payload) {
                  const payloadData = payload[0].payload as {
                    fullDate?: string;
                  };
                  const fullDate = payloadData.fullDate;
                  if (fullDate && typeof fullDate === "string") {
                    return new Date(fullDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "America/Los_Angeles",
                    });
                  }
                }
                return label as string;
              }}
              formatter={(value: number) => [value, "Signups"]}
            />
            <Bar dataKey="signups" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
