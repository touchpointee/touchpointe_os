import { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNotificationStore } from '@/stores/notificationStore';
import { cn } from '@/lib/utils';

interface NotificationsPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export function NotificationsPopover({ isOpen, onClose, anchorRef }: NotificationsPopoverProps) {
    const popoverRef = useRef<HTMLDivElement>(null);
    const { notifications, markAsRead } = useNotificationStore();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
                anchorRef.current && !anchorRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose, anchorRef]);

    if (!isOpen) return null;

    return (
        <div
            ref={popoverRef}
            className="absolute top-full right-0 mt-2 w-80 bg-background border border-border rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right"
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No new notifications.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {notifications.map(n => (
                            <div
                                key={n.id}
                                className={cn(
                                    "p-4 hover:bg-accent/50 transition-colors cursor-pointer relative group",
                                    !n.isRead && "bg-accent/10"
                                )}
                                onClick={() => !n.isRead && markAsRead(n.id)}
                            >
                                <h4 className={cn("text-sm font-medium", !n.isRead && "text-primary")}>{n.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                                <span className="text-[10px] text-muted-foreground mt-2 block">
                                    {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString()}
                                </span>
                                {!n.isRead && (
                                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
