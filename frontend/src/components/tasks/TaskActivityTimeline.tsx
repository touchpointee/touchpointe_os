import type { TaskActivityDto } from '@/types/task';
import { format } from 'date-fns';

export function TaskActivityTimeline({ activities }: { activities: TaskActivityDto[] }) {
    function formatActivity(activity: TaskActivityDto) {
        switch (activity.activityType) {
            case 'STATUS_CHANGED':
                return <span>changed status from <b>{activity.oldValue}</b> to <b>{activity.newValue}</b></span>;
            case 'PRIORITY_CHANGED':
                return <span>changed priority to <b>{activity.newValue}</b></span>;
            case 'ASSIGNEE_CHANGED':
                return <span>assigned to <b>TODO: Resolve Name</b></span>;
            case 'COMMENT_ADDED':
                return <span>commented</span>;
            case 'SUBTASK_ADDED':
                return <span>added subtask <b>{activity.newValue}</b></span>;
            case 'SUBTASK_COMPLETED':
                return <span>{activity.newValue} <b>{activity.oldValue === 'True' ? 'uncompleted' : 'completed'}</b> subtask</span>;
            default:
                return <span>updated task</span>;
        }
    }

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Activity</h3>
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                <div className="relative border-l border-border ml-2 space-y-4 pb-2">
                    {activities.map(activity => (
                        <div key={activity.id} className="ml-4 flex flex-col relative text-xs">
                            <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-border" />
                            <div className="text-muted-foreground">
                                <span className="font-semibold text-foreground">{activity.changedByName}</span> {formatActivity(activity)}
                            </div>
                            <div className="text-[10px] text-muted-foreground/60">
                                {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
