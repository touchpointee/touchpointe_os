import {
    ListTodo,
    Calendar,
    AlertCircle,
    AtSign,
    Flame,
    MessageSquareText
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function MyTasksSidebar() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Default to ALL if not specified
    const currentFilter = searchParams.get('filter') || 'ALL';
    const urgencyMode = searchParams.get('urgency') === 'true';

    const setFilter = (filter: string) => {
        setSearchParams(prev => {
            prev.set('filter', filter);
            return prev;
        });
    };

    const toggleUrgency = () => {
        setSearchParams(prev => {
            if (urgencyMode) prev.delete('urgency');
            else prev.set('urgency', 'true');
            return prev;
        });
    };

    const navItems = [
        { id: 'ALL', label: 'All Tasks', icon: ListTodo },
        { id: 'TODAY', label: 'Due Today', icon: Calendar },
        { id: 'OVERDUE', label: 'Overdue', icon: AlertCircle },
        { id: 'COMMENT_MENTIONS', label: 'Comment Mentions', icon: AtSign },
        { id: 'CHAT_MENTIONS', label: 'Chat Mentions', icon: MessageSquareText },
    ];

    return (
        <div className="flex flex-col h-full bg-card">
            <div className="p-4 border-b border-border/50">
                <h2 className="text-lg font-semibold tracking-tight">My Tasks</h2>
                <div
                    style={{ backgroundColor: 'hsl(var(--sidebar-accent))' }}
                    className="mt-4 flex items-center justify-between px-3 py-2 border border-sidebar-border/50 rounded-md"
                >
                    <div className="flex items-center gap-2 text-sm text-foreground/80 font-medium">
                        <Flame className={cn("w-4 h-4", urgencyMode ? "text-red-500 fill-red-500" : "text-muted-foreground")} />
                        <span>Urgency Mode</span>
                    </div>

                    <button
                        onClick={toggleUrgency}
                        className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                            urgencyMode ? "bg-red-500" : "bg-muted"
                        )}
                    >
                        <span
                            style={{
                                borderWidth: '2px',
                                borderStyle: 'solid',
                                borderColor: 'hsl(var(--primary))'
                            }}
                            className={cn(
                                "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out",
                                urgencyMode ? "translate-x-4" : "translate-x-0"
                            )}
                        />
                    </button>
                </div>
            </div>

            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setFilter(item.id)}
                        className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                            currentFilter === item.id
                                ? "nav-item-selected font-medium"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                    >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                    </button>
                ))}
            </nav>
        </div>
    );
}
