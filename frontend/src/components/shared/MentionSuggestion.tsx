import { useEffect, useState, forwardRef, useRef } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MentionSuggestionProps {
    users: { id: string; fullName: string; email: string; avatarUrl?: string | null }[];
    onSelect: (user: { id: string; fullName: string }) => void;
    onClose: () => void;
    position: { top?: number | string; bottom?: number | string; left: number | string };
    strategy?: 'fixed' | 'absolute';
}

export const MentionSuggestion = forwardRef<HTMLDivElement, MentionSuggestionProps>(({
    users,
    onSelect,
    onClose,
    position,
    strategy = 'fixed'
}, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

    // We assume 'users' passed to this component are already filtered suggestions.
    const filteredUsers = users;

    useEffect(() => {
        setSelectedIndex(0);
    }, [users]); // Reset selection when list changes

    useEffect(() => {
        if (itemRefs.current[selectedIndex]) {
            itemRefs.current[selectedIndex]?.scrollIntoView({
                block: 'nearest',
                behavior: 'smooth'
            });
        }
    }, [selectedIndex]);

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

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [filteredUsers, selectedIndex, onSelect, onClose]);

    if (filteredUsers.length === 0) return null;

    return (
        <div
            ref={ref}
            className={cn(
                strategy === 'fixed' ? "fixed z-[100]" : "absolute z-50",
                "w-64 bg-popover text-popover-foreground rounded-md border shadow-md outline-none animate-in fade-in-0 zoom-in-95 max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-zinc-500 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:border-0 [&::-webkit-scrollbar-thumb]:rounded-full"
            )}
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
                        ref={el => { itemRefs.current[index] = el; }}
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
