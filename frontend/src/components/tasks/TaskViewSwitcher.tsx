import { LayoutList, KanbanSquare, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TaskViewType = 'list' | 'board' | 'calendar';

interface TaskViewSwitcherProps {
    currentView: TaskViewType;
    onViewChange: (view: TaskViewType) => void;
}

export function TaskViewSwitcher({ currentView, onViewChange }: TaskViewSwitcherProps) {
    const views: { id: TaskViewType; label: string; icon: React.ElementType }[] = [
        { id: 'list', label: 'List', icon: LayoutList },
        { id: 'board', label: 'Board', icon: KanbanSquare },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
    ];

    return (
        <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
            {views.map((view) => {
                const Icon = view.icon;
                return (
                    <button
                        key={view.id}
                        onClick={() => onViewChange(view.id)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                            currentView === view.id
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                        )}
                    >
                        <Icon className="w-4 h-4" />
                        {view.label}
                    </button>
                );
            })}
        </div>
    );
}
