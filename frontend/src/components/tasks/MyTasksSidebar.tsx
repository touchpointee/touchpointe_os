import {
    ListTodo,
    Calendar,
    AlertCircle,
    AtSign,
    Flame,
    MessageSquareText,
    Layout
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useHierarchyStore } from '@/stores/hierarchyStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { useEffect } from 'react';

export function MyTasksSidebar() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Default to ALL if not specified
    const currentFilter = searchParams.get('filter') || 'ALL';
    const currentSpaceFilter = searchParams.get('spaceFilter');
    const urgencyMode = searchParams.get('urgency') === 'true';

    const { activeWorkspace } = useWorkspaces();
    const { spaces, fetchHierarchy } = useHierarchyStore();

    useEffect(() => {
        if (activeWorkspace?.id) {
            fetchHierarchy(activeWorkspace.id);
        }
    }, [activeWorkspace?.id]);

    const handleSpaceClick = (spaceId: string) => {
        setSearchParams(prev => {
            if (currentSpaceFilter === spaceId) {
                prev.delete('spaceFilter');
            } else {
                prev.set('spaceFilter', spaceId);
            }
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
                        <Flame
                            className={cn("w-4 h-4", urgencyMode ? "fill-[#925FF8] text-[#925FF8]" : "text-muted-foreground")}
                            style={urgencyMode ? { stroke: 'url(#flame-gradient)' } : undefined}
                        />
                        <svg width="0" height="0">
                            <linearGradient id="flame-gradient" x1="100%" y1="100%" x2="0%" y2="0%">
                                <stop stopColor="#4175E4" offset="0%" />
                                <stop stopColor="#925FF8" offset="100%" />
                            </linearGradient>
                        </svg>
                        <span>Urgency Mode</span>
                    </div>

                    <button
                        onClick={toggleUrgency}
                        className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                            urgencyMode ? "" : "bg-muted"
                        )}
                        style={urgencyMode ? { background: 'linear-gradient(94.03deg, #925FF8 -8.9%, #4175E4 100%)' } : undefined}
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

            <nav className="p-2 space-y-1">
                {(() => {
                    const activeItem = navItems.find(item => item.id === currentFilter) || navItems[0];
                    const Icon = activeItem.icon;
                    return (
                        <div
                            style={{ background: 'linear-gradient(94.03deg, #925FF8 -8.9%, #4175E4 100%)' }}
                            className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors font-medium text-white shadow-sm"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {activeItem.label}
                        </div>
                    );
                })()}
            </nav>

            {/* Spaces Section - Only show for Task views (Card/List), hide for Mentions */}
            {!['COMMENT_MENTIONS', 'CHAT_MENTIONS'].includes(currentFilter) && (
                <div className="p-4 border-t border-border/50">
                    <div className="space-y-1 max-h-[200px] overflow-y-auto no-scrollbar">
                        {spaces.map(space => (
                            <button
                                key={space.id}
                                onClick={() => handleSpaceClick(space.id)}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                                    currentSpaceFilter === space.id
                                        ? "font-medium text-white shadow-sm"
                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                )}
                                style={currentSpaceFilter === space.id ? { background: 'linear-gradient(94.03deg, #925FF8 -8.9%, #4175E4 100%)' } : undefined}
                            >
                                {space.icon ? (
                                    <span className="w-4 h-4 flex items-center justify-center text-[10px]">{space.icon}</span>
                                ) : (
                                    <Layout className="w-4 h-4" />
                                )}
                                <span className="truncate">{space.name}</span>
                            </button>
                        ))}
                        {spaces.length === 0 && (
                            <div className="text-xs text-muted-foreground px-3 py-2 italic opacity-50">
                                No spaces found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
