import { useEffect, useState, forwardRef } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MentionSuggestionProps {
    users: { id: string; fullName: string; email: string; avatarUrl?: string | null }[];
    onSelect: (user: { id: string; fullName: string }) => void;
    onClose: () => void;
    position: { top?: number; bottom?: number; left: number };
}

export const MentionSuggestion = forwardRef<HTMLDivElement, MentionSuggestionProps>(({
    users,
    onSelect,
    onClose,
    position
}, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // We assume 'users' passed to this component are already filtered suggestions.
    const filteredUsers = users;

    useEffect(() => {
        setSelectedIndex(0);
    }, [users]); // Reset selection when list changes

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (filteredUsers.length === 0) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedIndex(prev => (prev + 1) % filteredUsers.length);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
                    break;
                case 'Enter':
                case 'Tab':
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(filteredUsers[selectedIndex]);
                    break;
                case 'Escape':
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                    break;
            }
        };

        // Use capture phase to handle before React components if needed, or bubble.
        // Since we want to override parent behavior, capture might be better OR just rely on document order.
        // Document listener usually runs LAST in bubbling.
        // Let's stick to bubbling but check logic.
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [filteredUsers, selectedIndex, onSelect, onClose]);

    if (filteredUsers.length === 0) return null;

    return (
        <div
            ref={ref}
            className="fixed z-50 w-64 bg-popover text-popover-foreground rounded-md border shadow-md outline-none animate-in fade-in-0 zoom-in-95"
            style={{
                top: position.top,
                bottom: position.bottom,
                left: position.left,
            }}
        >
            <div className="p-1">
                {filteredUsers.map((user, index) => (
                    <div
                        key={user.id}
                        className={cn(
                            "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
                            index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                        )}
                        onClick={() => onSelect(user)}
                    >
                        <div className="flex items-center gap-2">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.fullName} className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="w-3 h-3 text-primary" />
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="font-medium">{user.fullName}</span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

MentionSuggestion.displayName = "MentionSuggestion";
