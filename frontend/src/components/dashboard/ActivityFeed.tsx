import type { DashboardActivity } from '@/stores/dashboardStore';
import { CheckSquare, Briefcase, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
    activities: DashboardActivity[];
    isLoading?: boolean;
}

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-accent" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-accent w-3/4 rounded" />
                            <div className="h-3 bg-accent w-1/4 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground text-sm">
                No recent activity.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {activities.map((activity) => (
                <div key={activity.id} className="flex gap-3 relative">
                    {/* Timeline connector (if list) - simpler version just icons */}
                    <div className="relative z-10">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center border border-border">
                            <span className="text-xs font-bold text-muted-foreground">{activity.userInitial}</span>
                        </div>
                        {/* Icon Badge */}
                        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 border border-border">
                            {activity.type === 'Task' && <CheckSquare className="w-3 h-3 text-blue-500" />}
                            {activity.type === 'Deal' && <Briefcase className="w-3 h-3 text-green-500" />}
                            {activity.type === 'Comment' && <MessageSquare className="w-3 h-3 text-yellow-500" />}
                        </div>
                    </div>

                    <div className="flex-1 pt-1">
                        <p className="text-sm text-foreground">
                            {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
