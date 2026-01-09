import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    trend?: string; // e.g., "+5% vs last week"
    trendUp?: boolean; // true = green, false = red
    className?: string;
    onClick?: () => void;
    isLoading?: boolean;
    colorClass?: string; // "text-blue-500", etc.
}

export function MetricCard({
    title,
    value,
    icon: Icon,
    trend,
    trendUp,
    className,
    onClick,
    isLoading,
    colorClass = "text-primary"
}: MetricCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "bg-white dark:bg-zinc-900 border border-border p-4 rounded-xl shadow-sm transition-all hover:shadow-md cursor-pointer",
                className
            )}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
                <div className={cn("p-2 rounded-lg bg-accent/50", colorClass)}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>

            {isLoading ? (
                <div className="h-8 w-24 bg-accent/50 rounded animate-pulse" />
            ) : (
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{value}</span>
                    {trend && (
                        <span className={cn("text-xs font-medium", trendUp ? "text-green-600" : "text-red-600")}>
                            {trend}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
