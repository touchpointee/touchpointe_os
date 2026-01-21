// ... imports
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useWorkspaces } from '@/stores/workspaceStore';
import { useTaskStore } from '@/stores/taskStore';
import { useMentionStore } from '@/stores/mentionStore';
import { useHierarchyStore } from '@/stores/hierarchyStore';
import { apiGet, apiPut } from '@/lib/api';
import type { MyTask } from '@/types/myTasks';
import type { UserMention } from '@/types/mention';
import { MyTaskCard } from '@/components/tasks/MyTaskCard';
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel';
import { MentionRenderer } from '@/components/shared/MentionRenderer';
import { Loader2, Inbox, CheckSquare, Bell, MessageSquare, MessageCircle, CheckCircle, Filter, LayoutList, LayoutGrid } from 'lucide-react';
import { MyTaskListRow } from '@/components/tasks/MyTaskListRow';
import { formatDistanceToNow } from 'date-fns';

export const MyTasksPage = () => {
    const { activeWorkspace } = useWorkspaces();
    const { openTaskDetail, isDetailPanelOpen } = useTaskStore();
    const { mentions, fetchMentions, isLoading: mentionsLoading } = useMentionStore();
    const [searchParams, setSearchParams] = useSearchParams();
    const [tasks, setTasks] = useState<MyTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

    const navigate = useNavigate();

    // Read state from URL
    const filter = (searchParams.get('filter') || 'ALL') as 'ALL' | 'TODAY' | 'OVERDUE' | 'MENTIONS' | 'COMMENT_MENTIONS' | 'CHAT_MENTIONS';
    const spaceFilterId = searchParams.get('spaceFilter');
    const urgencyMode = searchParams.get('urgency') === 'true';

    const { spaces } = useHierarchyStore();

    const isMentionsView = ['MENTIONS', 'COMMENT_MENTIONS', 'CHAT_MENTIONS'].includes(filter);

    useEffect(() => {
        // Ensure hierarchy is loaded for space filtering name lookup
        if (activeWorkspace?.id && (!spaces || spaces.length === 0)) {
            useHierarchyStore.getState().fetchHierarchy(activeWorkspace.id);
        }
    }, [activeWorkspace?.id, spaces]);

    useEffect(() => {
        if (!activeWorkspace?.id) return;

        if (isMentionsView) {
            fetchMentions();
            setLoading(false);
        } else {
            // Only fetch tasks if we switched modes or workspace changed
            loadTasks();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeWorkspace?.id, isMentionsView]);

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
        if (filter === 'COMMENT_MENTIONS' || filter === 'MENTIONS') {
            // Include TASK and COMMENT types
            return mentions.filter(m => m.type === 'TASK' || m.type === 'COMMENT');
        }
        return [];
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


    // Filter & Sort Logic for TASKS (ignored if filter == MENTIONS)
    const filteredTasks = useMemo(() => {
        if (['MENTIONS', 'COMMENT_MENTIONS', 'CHAT_MENTIONS'].includes(filter)) return [];
        let result = [...tasks];

        // 1. Primary Filter
        switch (filter) {
            case 'TODAY':
                result = result.filter(t => t.isDueToday);
                break;
            case 'OVERDUE':
                result = result.filter(t => t.isOverdue);
                break;
            case 'ALL':
            default:
                result = result.filter(t => t.status !== 'DONE');
                break;
        }

        // 1.5. Space Filter
        if (spaceFilterId && spaces.length > 0) {
            // Find space name from stored hierarchy
            const space = spaces.find(s => s.id === spaceFilterId);
            if (space) {
                result = result.filter(t => t.spaceName === space.name);
            } else {
                // ID valid but not found in hierarchy => likely hierarchy stale or invalid ID. 
                // Return empty to be safe (this matches "filter active but no matches")
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
    }, [tasks, filter, urgencyMode, spaces, spaceFilterId]);

    if (loading && !['MENTIONS', 'COMMENT_MENTIONS', 'CHAT_MENTIONS'].includes(filter)) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }



    return (
        <div className="h-full flex flex-col bg-background relative">
            <header className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {isMentionsView ? <Bell className="w-6 h-6" /> : <CheckSquare className="w-6 h-6" />}
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            {filter === 'CHAT_MENTIONS' ? 'Chat Mentions' :
                                filter === 'COMMENT_MENTIONS' ? 'Comment Mentions' :
                                    filter === 'MENTIONS' ? 'Mentions Inbox' : 'My Tasks'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {filter === 'ALL' && 'All your assigned tasks'}
                            {filter === 'TODAY' && 'Tasks due today'}
                            {filter === 'OVERDUE' && 'Overdue tasks'}
                            {filter === 'CHAT_MENTIONS' && 'Direct messages and channel mentions'}
                            {filter === 'COMMENT_MENTIONS' && 'Task assignments and comments'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button
                            onClick={() => {
                                setIsFilterPopupOpen(true);
                            }}
                            className={`p-2 rounded-md transition-colors ${isFilterPopupOpen ? 'bg-muted text-foreground' : 'hover:bg-muted/50 text-muted-foreground'
                                }`}
                        >
                            <Filter className="w-5 h-5" />
                        </button>

                        {isFilterPopupOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsFilterPopupOpen(false)} />
                                <div className="absolute top-full right-0 mt-1 w-60 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="space-y-1 px-2 py-0">
                                        {[
                                            { id: 'ALL', label: 'All Tasks' },
                                            { id: 'TODAY', label: 'Due Today' },
                                            { id: 'OVERDUE', label: 'Overdue' },
                                            { id: 'COMMENT_MENTIONS', label: 'Comment Mentions' },
                                            { id: 'CHAT_MENTIONS', label: 'Chat Mentions' },
                                        ].map((option) => (
                                            <div
                                                key={option.id}
                                                onClick={() => {
                                                    setSearchParams({ filter: option.id });
                                                    setIsFilterPopupOpen(false);
                                                }}
                                                className="flex items-center gap-3 px-0.5 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
                                            >
                                                <div
                                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${filter === option.id
                                                        ? 'border-transparent' // Make border transparent so background gradient shows through
                                                        : 'border-white/20 group-hover:border-white/40'
                                                        }`}
                                                    style={filter === option.id ? {
                                                        background: 'linear-gradient(#0a0a0a, #0a0a0a) padding-box, linear-gradient(94.03deg, #925FF8 -8.9%, #4175E4 100%) border-box',
                                                        border: '1px solid transparent',
                                                    } : undefined}
                                                >
                                                    {filter === option.id && (
                                                        <div
                                                            className="w-2.5 h-2.5 rounded-[1px]"
                                                            style={{
                                                                background: 'linear-gradient(94.03deg, #925FF8 -8.9%, #4175E4 100%)'
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                <span className={`text-sm ${filter === option.id ? 'text-white font-medium' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                                                    {option.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {!isMentionsView && (
                        <button
                            onClick={() => setViewMode(prev => prev === 'GRID' ? 'LIST' : 'GRID')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-accent hover:bg-accent/80 rounded-md transition-colors text-sm font-medium text-foreground"
                        >
                            {viewMode === 'GRID' ? (
                                <>
                                    <LayoutList className="w-4 h-4" />
                                    List
                                </>
                            ) : (
                                <>
                                    <LayoutGrid className="w-4 h-4" />
                                    Card
                                </>
                            )}
                        </button>
                    )}
                </div>
            </header>



            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                {isMentionsView ? (
                    // MENTIONS VIEW
                    mentionsLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : displayedMentions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                            <Bell className="w-16 h-16 mb-4 stroke-1" />
                            <p>No mentions found.</p>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-4">
                            {displayedMentions.map((mention, idx) => (
                                <div
                                    key={idx}
                                    className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                                    onClick={() => handleMentionClick(mention)}
                                >
                                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getBgColor(mention.type)}`}>
                                        {getIcon(mention.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold">
                                                    {mention.actorName}
                                                    <span className="font-normal text-muted-foreground ml-1">
                                                        mentioned you in
                                                        {mention.type === 'CHAT' ? (mention.channelName ? ` #${mention.channelName}` : ' Chat') :
                                                            mention.type === 'COMMENT' ? ' a comment' : ' a Task'}
                                                    </span>
                                                </span>
                                                {mention.taskTitle && (
                                                    <span className="text-xs font-medium text-primary mt-0.5">
                                                        {mention.taskTitle}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(mention.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>

                                        <div className="text-sm text-foreground/80 mt-2 line-clamp-2 bg-muted/30 p-2 rounded border border-border/50 italic">
                                            <MentionRenderer content={mention.previewText} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    // TASKS VIEW
                    filteredTasks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                            <Inbox className="w-16 h-16 mb-4 stroke-1" />
                            <p>No tasks found in this view.</p>
                        </div>
                    ) : (
                        <div className={viewMode === 'GRID'
                            ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3 max-w-7xl mx-auto"
                            : "flex flex-col gap-2 max-w-4xl mx-auto"
                        }>
                            {filteredTasks.map(task => (
                                viewMode === 'GRID' ? (
                                    <MyTaskCard
                                        key={task.taskId}
                                        task={task}
                                        onStatusChange={handleStatusChange}
                                        onClick={() => openTaskDetail(task.taskId)}
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

            {isDetailPanelOpen && <TaskDetailPanel />}
        </div>
    );
};
