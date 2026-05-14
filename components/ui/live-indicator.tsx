import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
  color?: "success" | "brand" | "white";
  size?: "sm" | "md";
  label?: string;
  className?: string;
}

const colorMap: Record<string, string> = {
  success: "bg-success",
  brand: "bg-brand",
  white: "bg-white",
};

const sizeMap: Record<string, string> = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
};

export function LiveIndicator({
  color = "success",
  size = "sm",
  label,
  className,
}: LiveIndicatorProps) {
  const colorClass = colorMap[color];
  const sizeClass = sizeMap[size];

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="relative flex">
        <span
          className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            colorClass
          )}
        />
        <span
          className={cn(
            "relative inline-flex rounded-full",
            colorClass,
            sizeClass
          )}
        />
      </span>
      {label && (
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
      )}
    </span>
  );
}
