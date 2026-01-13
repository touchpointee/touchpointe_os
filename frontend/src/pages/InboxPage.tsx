import { useEffect } from 'react';
import { useMentionStore } from '@/stores/mentionStore';
import { Bell, CheckCircle, Mail, RotateCcw, MessageSquare, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useTaskStore } from '@/stores/taskStore';
import { useNavigate } from 'react-router-dom';

export function InboxPage() {
    const { mentions, fetchMentions, isLoading } = useMentionStore();
    const { openTaskDetail } = useTaskStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchMentions();
    }, [fetchMentions]);

    const handleItemClick = (mention: any) => {
        if (mention.taskId) {
            // Open task detail
            openTaskDetail(mention.taskId);
        } else if (mention.channelId) {
            // Navigate to channel
            // Assuming channel path is /chat/channels/{channelId}
            // But we might need to resolve channel name or just use ID if routes support it.
            // Existing routes seem to use channel names or specific paths?
            // Let's assume ID-based routing or just log for now if unsure.
            // Based on ContextSidebar, paths are /chat/channels/general etc.
            // If we have ID, ideally we have a route like /chat/{channelId}.
            // Current app might need enhancement there.
            navigate(`/chat`); // Fallback
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

    return (
        <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
                        <p className="text-muted-foreground mt-1">
                            Your unified feed of mentions and activity.
                        </p>
                    </div>
                    <button
                        onClick={() => fetchMentions()}
                        className="p-2 text-muted-foreground hover:bg-accent rounded-full transition-colors"
                        title="Refresh"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-24 bg-accent/30 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : mentions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl border-dashed">
                            <div className="w-16 h-16 bg-accent/30 rounded-full flex items-center justify-center mb-4">
                                <Mail className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="font-semibold text-lg">Your inbox is empty</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm">
                                You're all caught up! No new mentions.
                            </p>
                        </div>
                    ) : (
                        mentions.map((mention, idx) => (
                            <div
                                key={idx} // No ID in DTO? Use index for now or add ID
                                className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                                onClick={() => handleItemClick(mention)}
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
                                                    {mention.type === 'CHAT' ? (mention.channelName ? ` #${mention.channelName}` : ' Chat') : ' a Task'}
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

                                    <p className="text-sm text-foreground/80 mt-2 line-clamp-2 bg-muted/30 p-2 rounded border border-border/50 italic">
                                        "{mention.previewText}"
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
