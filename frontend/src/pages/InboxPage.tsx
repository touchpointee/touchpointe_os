import { useEffect } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import { Bell, CheckCircle, Mail, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function InboxPage() {
    const { notifications, fetchNotifications, markAsRead, isLoading } = useNotificationStore();

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return (
        <div className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
                        <p className="text-muted-foreground mt-1">
                            Stay updated with recent activity and notifications.
                        </p>
                    </div>
                    <button
                        onClick={() => fetchNotifications()}
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
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl border-dashed">
                            <div className="w-16 h-16 bg-accent/30 rounded-full flex items-center justify-center mb-4">
                                <Mail className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="font-semibold text-lg">Your inbox is empty</h3>
                            <p className="text-muted-foreground mt-2 max-w-sm">
                                All caught up! Notifications about tasks, mentions, and updates will appear here.
                            </p>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`flex gap-4 p-4 rounded-lg border transition-colors ${notification.isRead
                                        ? 'bg-transparent border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900'
                                        : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'
                                    }`}
                                onClick={() => !notification.isRead && markAsRead(notification.id)}
                            >
                                <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${notification.isRead ? 'bg-zinc-100 dark:bg-zinc-800' : 'bg-primary/20 text-primary'
                                    }`}>
                                    <Bell className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className={`text-sm font-medium ${!notification.isRead && 'text-primary'}`}>
                                            {notification.title}
                                        </h4>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground/80 mt-1 line-clamp-2">
                                        {notification.message}
                                    </p>

                                    {/* Action Area (if needed based on type) */}
                                    {/* e.g. for invitation, we could show accept/reject buttons if parsing data */}
                                </div>
                                {!notification.isRead && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(notification.id);
                                        }}
                                        className="mt-1 text-primary hover:text-primary/80 transition-colors"
                                        title="Mark as read"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
