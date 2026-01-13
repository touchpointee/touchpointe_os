import {
    LayoutDashboard,
    Calendar,
    AlertCircle,
    AtSign,
    Flame,
    MessageCircle
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
        { id: 'ALL', label: 'All Tasks', icon: LayoutDashboard },
        { id: 'TODAY', label: 'Due Today', icon: Calendar },
        { id: 'OVERDUE', label: 'Overdue', icon: AlertCircle },
        { id: 'COMMENT_MENTIONS', label: 'Comment Mentions', icon: AtSign },
        { id: 'CHAT_MENTIONS', label: 'Chat Mentions', icon: MessageCircle },
    ];

    return (
        <div className="flex flex-col h-full bg-card">
            <div className="p-4 border-b border-border/50">
                <h2 className="text-lg font-semibold tracking-tight">My Tasks</h2>
                <div
                    onClick={toggleUrgency}
                    className={cn(
                        "mt-4 flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors border",
                        urgencyMode
                            ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                            : "bg-background border-border hover:bg-accent text-muted-foreground"
                    )}
                >
                    <Flame className={cn("w-4 h-4", urgencyMode && "fill-current")} />
                    <span>Urgency Mode</span>
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
                                ? "bg-primary/10 text-primary font-medium"
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
