// ... imports
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useWorkspaces } from '@/stores/workspaceStore';
import { useTaskStore } from '@/stores/taskStore';
import { useMentionStore } from '@/stores/mentionStore';
import { useHierarchyStore } from '@/stores/hierarchyStore';
import { apiGet, apiPut } from '@/lib/api';
import { useUserStore } from '@/stores/userStore';
import type { MyTask } from '@/types/myTasks';
import type { UserMention } from '@/types/mention';
import { MyTaskCard } from '@/components/tasks/MyTaskCard';
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel';
import { ShareTaskToChatModal } from '@/components/tasks/ShareTaskToChatModal';
import { Loader2, Inbox, Bell, MessageSquare, MessageCircle, CheckCircle, LayoutList, LayoutGrid, AlertCircle } from 'lucide-react';
import { MyTaskListRow } from '@/components/tasks/MyTaskListRow';
import { formatDistanceToNow, format } from 'date-fns';

export const MyTasksPage = () => {
    const { activeWorkspace } = useWorkspaces();
    const { openTaskDetail, isDetailPanelOpen } = useTaskStore();
    const { mentions, fetchMentions, isLoading: mentionsLoading } = useMentionStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const [tasks, setTasks] = useState<MyTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
    const [shareTask, setShareTask] = useState<MyTask | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    const navigate = useNavigate();
    const location = useLocation();

    // Read state from URL
    const filter = (searchParams.get('filter') || 'ALL') as 'ALL' | 'TODAY' | 'OVERDUE' | 'MENTIONS' | 'COMMENT_MENTIONS' | 'CHAT_MENTIONS';
    const statusFilter = searchParams.get('status') || 'ALL';
    const spaceFilterId = searchParams.get('spaceFilter');
    const urgencyMode = searchParams.get('urgency') === 'true';

    const { spaceFilterId: _spaceFilterId } = { spaceFilterId: searchParams.get('spaceFilter') }; // avoiding unused var lint if I don't use it yet
    const { spaces } = useHierarchyStore();
    const { user } = useUserStore(); // Correct store for user info

    const isMentionsView = ['MENTIONS', 'COMMENT_MENTIONS', 'CHAT_MENTIONS'].includes(filter);

    useEffect(() => {
        // Ensure hierarchy is loaded for space filtering name lookup
        if (activeWorkspace?.id && (!spaces || spaces.length === 0)) {
            useHierarchyStore.getState().fetchHierarchy(activeWorkspace.id);
        }
    }, [activeWorkspace?.id, spaces]);

    useEffect(() => {
        if (!activeWorkspace?.id) return;

        // Always fetch mentions for the KPI counts
        if (activeWorkspace?.id) {
            fetchMentions(activeWorkspace.id);
        }

        // Fetch tasks on mount and when navigating to this page
        loadTasks();

        // Refetch tasks when the window regains focus (e.g., user returns from another tab/page)
        const handleFocus = () => {
            if (activeWorkspace?.id) {
                loadTasks();
            }
        };

        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeWorkspace?.id, location.key]);

    // Live Clock Effect
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, []);

    const loadTasks = async () => {
        try {
            setLoading(true);
            const data = await apiGet<any>(`/workspaces/${activeWorkspace!.id}/tasks/my-tasks`);
            // Handle PaginatedList response
            setTasks(data.items || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        // Optimistic update for UI responsiveness
        setTasks(prev => prev.map(t => t.taskId === taskId ? { ...t, status: newStatus } : t));

        try {
            await apiPut(`/workspaces/${activeWorkspace!.id}/tasks/${taskId}`, { status: newStatus });
            // Re-fetch to update urgency and re-sort
            if (filter !== 'MENTIONS') await loadTasks();
        } catch (err) {
            console.error("Failed to update status", err);
            if (filter !== 'MENTIONS') loadTasks(); // Revert on error
        }
    };

    // Derived mentions list based on filter
    const displayedMentions = useMemo(() => {
        if (filter === 'CHAT_MENTIONS') {
            return mentions.filter(m => m.type === 'CHAT');
        }
        if (filter === 'COMMENT_MENTIONS') {
            // Include TASK and COMMENT types
            return mentions.filter(m => m.type === 'TASK' || m.type === 'COMMENT');
        }
        // 'MENTIONS' filter (All)
        return mentions;
    }, [mentions, filter]);

    const handleMentionClick = (mention: UserMention) => {
        if (mention.taskId) {
            openTaskDetail(mention.taskId);
        } else if (mention.channelId) {
            const query = mention.messageId ? `?messageId=${mention.messageId}` : '';
            navigate(`/chat/channel/${mention.channelId}${query}`);
        } else if (mention.dmGroupId) {
            const query = mention.messageId ? `?messageId=${mention.messageId}` : '';
            navigate(`/chat/dm/${mention.dmGroupId}${query}`);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'TASK': return <CheckCircle className="w-4 h-4" />;
            case 'COMMENT': return <MessageSquare className="w-4 h-4" />;
            case 'CHAT': return <MessageCircle className="w-4 h-4" />;
            default: return <Bell className="w-4 h-4" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'TASK': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
            case 'COMMENT': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'CHAT': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
            default: return 'bg-zinc-100 text-zinc-600';
        }
    };

    // --- DASHBOARD METRICS ---
    const stats = useMemo(() => {
        // Only count active tasks assigned to me
        const activeTasks = tasks.filter(t =>
            t.status.toUpperCase() !== 'DONE' &&
            t.status.toUpperCase() !== 'COMPLETED' &&
            t.isAssigned
        );
        const totalTasks = activeTasks.length;
        const dueToday = activeTasks.filter(t => t.isDueToday).length;
        const overdue = activeTasks.filter(t => t.isOverdue).length;
        const totalMentions = mentions.length;

        return { totalTasks, dueToday, overdue, totalMentions };
    }, [tasks, mentions]);

    // Greeting Logic
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    }, []);

    const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Back';

    // Compute unique statuses for filter dropdown
    const availableStatuses = useMemo(() => {
        const statuses = new Set(tasks.map(t => t.status));
        return Array.from(statuses).sort();
    }, [tasks]);

    // Filter & Sort Logic for TASKS (ignored if filter == MENTIONS)
    const filteredTasks = useMemo(() => {
        if (['MENTIONS', 'COMMENT_MENTIONS', 'CHAT_MENTIONS'].includes(filter)) return [];
        let result = [...tasks];

        // 1. Primary Filter
        switch (filter) {
            case 'TODAY':
                result = result.filter(t => t.isDueToday || t.isOverdue);
                break;
            case 'OVERDUE':
                result = result.filter(t => t.isOverdue);
                break;
            case 'ALL':
            default:
                // Only hide DONE tasks if we haven't explicitly selected a status filter
                if (statusFilter === 'ALL') {
                    result = result.filter(t =>
                        t.status.toUpperCase() !== 'DONE' &&
                        t.status.toUpperCase() !== 'COMPLETED' &&
                        t.isAssigned
                    );
                }
                break;
        }

        // 1.2 Status Filter
        if (statusFilter !== 'ALL') {
            result = result.filter(t => t.status === statusFilter);
        }

        // 1.5. Space Filter
        if (spaceFilterId && spaces.length > 0) {
            // Find space name from stored hierarchy
            const space = spaces.find(s => s.id === spaceFilterId);
            if (space) {
                result = result.filter(t => t.spaceName === space.name);
            } else {
                result = [];
            }
        }

        // 2. Urgency Mode (Additional Filter & Sort)
        if (urgencyMode) {
            result.sort((a, b) => (b.urgencyScore || 0) - (a.urgencyScore || 0));
        } else {
            result.sort((a, b) => {
                if (a.isDueToday && !b.isDueToday) return -1;
                if (!a.isDueToday && b.isDueToday) return 1;
                return 0;
            });
        }

        return result;
    }, [tasks, filter, urgencyMode, spaces, spaceFilterId, statusFilter]);

    if (loading && !['MENTIONS', 'COMMENT_MENTIONS', 'CHAT_MENTIONS'].includes(filter)) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }


    return (
        <div className="h-full flex flex-col bg-background relative overflow-hidden pl-4">

            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent -z-10" />
            <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] -z-10" />

            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="py-8 px-6 md:px-8 lg:px-10 max-w-[1600px] mx-auto space-y-8">

                    {/* DASHBOARD HEADER */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                {greeting}, {firstName}
                            </h1>
                            <div className="text-right">
                                <div className="text-2xl font-semibold text-foreground tracking-tight">
                                    {format(currentTime, 'h:mm a')}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {format(currentTime, 'EEEE, MMMM do')}
                                </div>
                            </div>
                        </div>
                        <p className="text-muted-foreground mt-1 text-lg">
                            {(() => {
                                const totalDue = stats.dueToday + stats.overdue;

                                if (totalDue === 0) {
                                    return (
                                        <>Today you have <span className="text-green-500 font-medium">no pending work</span>. Why not try learning something new?</>
                                    );
                                }

                                // Overdue Logic
                                if (stats.overdue > 0) {
                                    return (
                                        <>
                                            You have <span className="font-semibold text-red-500">{stats.overdue} overdue tasks</span>.
                                            <span className="block text-sm mt-1 text-muted-foreground/80">
                                                It happens to the best of us! Let our <span className="text-primary font-medium">AI Assistant</span> help you re-plan and get back on track.
                                            </span>
                                        </>
                                    );
                                }

                                // High Load Logic (Today)
                                if (totalDue > 3) {
                                    return (
                                        <>
                                            You have <span className="font-semibold text-orange-500">{totalDue} tasks</span> due today.
                                            <span className="block text-sm mt-1 text-muted-foreground/80">
                                                Don't worry! Use our <span className="text-primary font-medium">AI Assistant</span> to prioritize and plan your work efficiently.
                                            </span>
                                        </>
                                    );
                                }

                                // Normal Load Logic
                                return (
                                    <>You have <span className="font-semibold text-foreground">{totalDue} tasks</span> due today. Keep up the momentum, you're almost there!</>
                                );
                            })()}
                        </p>
                    </div>

                    {/* KPI Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                            icon={CheckCircle}
                            label="Assigned to Me"
                            value={stats.totalTasks}
                            onClick={() => setSearchParams({ filter: 'ALL' })}
                            active={filter === 'ALL'}
                        />
                        <KpiCard
                            icon={LayoutList}
                            label="Due Today"
                            value={stats.dueToday}
                            color="text-orange-500"
                            bg="bg-orange-500/10"
                            onClick={() => setSearchParams({ filter: 'TODAY' })}
                            active={filter === 'TODAY'}
                        />
                        <KpiCard
                            icon={AlertCircle}
                            label="Overdue"
                            value={stats.overdue}
                            color="text-red-500"
                            bg="bg-red-500/10"
                            onClick={() => setSearchParams({ filter: 'OVERDUE' })}
                            active={filter === 'OVERDUE'}
                        />
                        <KpiCard
                            icon={Bell}
                            label="Mentions"
                            value={stats.totalMentions}
                            color="text-purple-500"
                            bg="bg-purple-500/10"
                            onClick={() => setSearchParams({ filter: 'MENTIONS' })}
                            active={isMentionsView}
                        />
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold tracking-tight">
                            {isMentionsView ? 'Recent Mentions' : 'Your Tasks'}
                        </h2>

                        {/* View Toggles */}
                        <div className="flex items-center gap-3">

                            {!isMentionsView && (
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setSearchParams(prev => {
                                        const newParams = new URLSearchParams(prev);
                                        newParams.set('status', e.target.value);
                                        return newParams;
                                    })}
                                    className="h-8 px-2 text-xs bg-card border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground capitalize"
                                >
                                    <option value="ALL">All Statuses</option>
                                    {availableStatuses.map(status => (
                                        <option key={status} value={status}>
                                            {status.toLowerCase().replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                            )}

                            <div className="flex items-center gap-2">

                                {isMentionsView && (
                                    <div className="flex items-center bg-card border border-border p-1 rounded-lg">
                                        <button
                                            onClick={() => setSearchParams({ filter: 'MENTIONS' })}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === 'MENTIONS' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-accent'}`}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={() => setSearchParams({ filter: 'CHAT_MENTIONS' })}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === 'CHAT_MENTIONS' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-accent'}`}
                                        >
                                            Chat
                                        </button>
                                        <button
                                            onClick={() => setSearchParams({ filter: 'COMMENT_MENTIONS' })}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === 'COMMENT_MENTIONS' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-accent'}`}
                                        >
                                            Comments
                                        </button>
                                    </div>
                                )}

                                {!isMentionsView && (
                                    <div className="flex items-center bg-card border border-border p-1 rounded-lg">
                                        <button
                                            onClick={() => setViewMode('GRID')}
                                            className={`p-1.5 rounded-md transition-all ${viewMode === 'GRID' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-accent'}`}
                                        >
                                            <LayoutGrid className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('LIST')}
                                            className={`p-1.5 rounded-md transition-all ${viewMode === 'LIST' ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground hover:bg-accent'}`}
                                        >
                                            <LayoutList className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Filter Popup Removed */}

                    {/* CONTENT */}
                    <div className="min-h-[400px]">
                        {isMentionsView ? (
                            mentionsLoading ? (
                                <div className="flex items-center justify-center p-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : displayedMentions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50 p-12 bg-card/50 rounded-xl border border-dashed border-border">
                                    <Bell className="w-12 h-12 mb-4 stroke-1" />
                                    <p>No mentions found.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {displayedMentions.map((mention, idx) => (
                                        <div
                                            key={idx}
                                            className="flex gap-4 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all cursor-pointer shadow-sm"
                                            onClick={() => handleMentionClick(mention)}
                                        >
                                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getBgColor(mention.type)}`}>
                                                {getIcon(mention.type)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <span className="text-sm font-semibold">{mention.actorName}</span>
                                                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(mention.createdAt))} ago</span>
                                                </div>
                                                <p className="text-sm text-foreground mt-1 line-clamp-1">
                                                    {mention.previewText.replace(/<@[\w-]+\|([^>]+)>/g, "@$1")}
                                                </p>
                                                {mention.taskTitle && <p className="text-xs text-primary mt-1">{mention.taskTitle}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            filteredTasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50 p-12 bg-card/50 rounded-xl border border-dashed border-border">
                                    <Inbox className="w-12 h-12 mb-4 stroke-1" />
                                    <p>No tasks found.</p>
                                </div>
                            ) : (
                                <div className={viewMode === 'GRID'
                                    ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                                    : "flex flex-col gap-2"
                                }>
                                    {filteredTasks.map(task => (
                                        viewMode === 'GRID' ? (
                                            <MyTaskCard
                                                key={task.taskId}
                                                task={task}
                                                onStatusChange={handleStatusChange}
                                                onClick={() => openTaskDetail(task.taskId)}
                                                onShare={setShareTask}
                                            />
                                        ) : (
                                            <MyTaskListRow
                                                key={task.taskId}
                                                task={task}
                                                onStatusChange={handleStatusChange}
                                                onClick={() => openTaskDetail(task.taskId)}
                                            />
                                        )
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {isDetailPanelOpen && <TaskDetailPanel />}
            <ShareTaskToChatModal
                isOpen={!!shareTask}
                task={shareTask as any}
                onClose={() => setShareTask(null)}
            />
        </div>
    );
};

// Helper Component for KPI Cards
function KpiCard({ icon: Icon, label, value, color, bg, onClick, active }: any) {
    const isActive = active;

    return (
        <div
            onClick={onClick}
            className={`p-5 rounded-xl border transition-all duration-200 cursor-pointer ${isActive
                ? 'bg-primary/5 border-primary/20 shadow-sm ring-1 ring-primary/20'
                : 'bg-card border-border hover:border-border/80 hover:bg-accent/50'
                }`}
        >
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-lg ${bg || 'bg-primary/10'} ${color || 'text-primary'}`}>
                    <Icon className="w-5 h-5" />
                </div>
                {isActive && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
            </div>
            <div>
                <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
                <div className="text-sm text-muted-foreground font-medium mt-1">{label}</div>
            </div>
        </div>
    );
}
