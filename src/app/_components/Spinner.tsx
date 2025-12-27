import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-6 w-6",
};

export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-accent", sizeClasses[size], className)}
      aria-label="Loading"
    />
  );
}
