interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
}

export default function FeatureCard({
  title,
  description,
  icon,
  bgColor,
  iconColor,
}: FeatureCardProps) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-lg">
      <div
        className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${bgColor}`}
      >
        <div className={iconColor}>{icon}</div>
      </div>
      <h3 className="mb-2 text-xl font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
