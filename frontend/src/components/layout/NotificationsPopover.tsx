import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface Notification {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    isRead: boolean;
}

interface NotificationsPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export function NotificationsPopover({ isOpen, onClose, anchorRef }: NotificationsPopoverProps) {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [notifications, setNotifications] = useState<Notification[]>([
        // Mock data for now
        { id: '1', title: 'Welcome', message: 'Welcome to WorkspaceOS!', createdAt: new Date().toISOString(), isRead: false }
    ]);

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
                            <div key={n.id} className="p-4 hover:bg-accent/50 transition-colors">
                                <h4 className="text-sm font-medium">{n.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                                <span className="text-[10px] text-muted-foreground mt-2 block">
                                    {new Date(n.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
