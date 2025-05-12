interface StatsCardProps {
  title: string;
  value: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  change: number;
  changeDirection?: "up" | "down";
  changeText: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  change,
  changeDirection = "up",
  changeText,
}: StatsCardProps) {
  // If change is negative, force direction to be "down"
  const direction = change < 0 ? "down" : changeDirection;
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-neutral-medium text-sm font-medium">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-md ${iconBgColor} ${iconColor}`}>
          <span className="material-icons">{icon}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center text-sm">
        <span className={`font-medium flex items-center ${direction === "up" ? "text-secondary" : "text-accent"}`}>
          <span className="material-icons text-sm mr-1">
            {direction === "up" ? "arrow_upward" : "arrow_downward"}
          </span>
          {Math.abs(change)}%
        </span>
        <span className="text-neutral-medium ml-2">{changeText}</span>
      </div>
    </div>
  );
}
