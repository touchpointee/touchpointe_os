// ... imports
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useWorkspaces } from '@/stores/workspaceStore';
import { useTaskStore } from '@/stores/taskStore';
import { useMentionStore } from '@/stores/mentionStore';
import { apiGet, apiPut } from '@/lib/api';
import type { MyTask } from '@/types/myTasks';
import type { UserMention } from '@/types/mention';
import { MyTaskCard } from '@/components/tasks/MyTaskCard';
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel';
import { MentionRenderer } from '@/components/shared/MentionRenderer';
import { Loader2, Inbox, CheckSquare, Bell, MessageSquare, MessageCircle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const MyTasksPage = () => {
    const { activeWorkspace } = useWorkspaces();
    const { openTaskDetail, isDetailPanelOpen } = useTaskStore();
    const { mentions, fetchMentions, isLoading: mentionsLoading } = useMentionStore();
    const [searchParams] = useSearchParams();
    const [tasks, setTasks] = useState<MyTask[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Read state from URL
    const filter = (searchParams.get('filter') || 'ALL') as 'ALL' | 'TODAY' | 'OVERDUE' | 'MENTIONS' | 'COMMENT_MENTIONS' | 'CHAT_MENTIONS';
    const urgencyMode = searchParams.get('urgency') === 'true';

    useEffect(() => {
        if (activeWorkspace?.id) {
            if (filter === 'MENTIONS' || filter === 'COMMENT_MENTIONS' || filter === 'CHAT_MENTIONS') {
                fetchMentions();
                setLoading(false);
            } else {
                loadTasks();
            }
        }
    }, [activeWorkspace?.id, searchParams, filter]);

    const loadTasks = async () => {
        try {
            setLoading(true);
            const data = await apiGet<MyTask[]>(`/workspaces/${activeWorkspace!.id}/tasks/my-tasks`);
            setTasks(data);
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
    }, [tasks, filter, urgencyMode]);

    if (loading && !['MENTIONS', 'COMMENT_MENTIONS', 'CHAT_MENTIONS'].includes(filter)) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const isMentionsView = ['MENTIONS', 'COMMENT_MENTIONS', 'CHAT_MENTIONS'].includes(filter);

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
            </header>

            <div className="flex-1 overflow-y-auto p-6">
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
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 max-w-7xl mx-auto">
                            {filteredTasks.map(task => (
                                <MyTaskCard
                                    key={task.taskId}
                                    task={task}
                                    onStatusChange={handleStatusChange}
                                    onClick={() => openTaskDetail(task.taskId)}
                                />
                            ))}
                        </div>
                    )
                )}
            </div>

            {isDetailPanelOpen && <TaskDetailPanel />}
        </div>
    );
};
