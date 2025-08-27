interface StatisticsCardProps {
  title: string;
  value: number;
  bgColor: string;
  textColor: string;
  valueTextColor: string;
}

export default function StatisticsCard({
  title,
  value,
  bgColor,
  textColor,
  valueTextColor,
}: StatisticsCardProps) {
  return (
    <div className={`rounded-lg border p-4 ${bgColor}`}>
      <p className={`text-sm font-medium ${textColor}`}>{title}</p>
      <p className={`text-2xl font-bold ${valueTextColor}`}>{value}</p>
    </div>
  );
}
