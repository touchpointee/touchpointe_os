import { useState, useRef, useEffect } from 'react';
import { X, User } from 'lucide-react';

interface Reaction {
    id: string;
    messageId: string;
    userId: string;
    userName: string;
    emoji: string;
    createdAt: string;
}

interface ReactionDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    reactions: Reaction[];
    currentUser: { id: string; name?: string; email?: string } | null;
    onRemoveReaction: (messageId: string, emoji: string) => void;
    triggerRect?: { top: number; left: number; bottom: number; right: number };
    getUserAvatar?: (userId: string) => string | undefined;
}

export function ReactionDetailsModal({
    isOpen,
    onClose,
    reactions,
    currentUser,
    onRemoveReaction,
    triggerRect,
    getUserAvatar
}: ReactionDetailsModalProps) {
    const [activeTab, setActiveTab] = useState<string>('All');
    const modalRef = useRef<HTMLDivElement>(null);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current) {
                // Check if click is inside the modal
                if (modalRef.current.contains(event.target as Node)) {
                    return;
                }
                // Check if click is inside the trigger element (to prevent immediate re-open/close conflict)
                // We don't have direct access to trigger element ref, but we rely on the backdrop or existing logic.
                // If we use a transparent backdrop (div below), that handles "click outside".
                // But let's keep this safe.
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc, r) => {
        if (!acc[r.emoji]) acc[r.emoji] = [];
        acc[r.emoji].push(r);
        return acc;
    }, {} as Record<string, Reaction[]>);

    const uniqueEmojis = Object.keys(groupedReactions);

    // Determine filtered list and sort "You" to the top
    const displayedReactions = (activeTab === 'All'
        ? reactions
        : groupedReactions[activeTab] || []
    ).sort((a, b) => {
        const isMeA = a.userId === currentUser?.id;
        const isMeB = b.userId === currentUser?.id;
        if (isMeA && !isMeB) return -1;
        if (!isMeA && isMeB) return 1;
        return 0;
    });

    // Calculate position style
    let style: React.CSSProperties = {};
    let animateClass = "zoom-in-95 origin-top-left";

    if (triggerRect) {
        const MODAL_WIDTH = 200;
        const MAX_HEIGHT = 260; // Approximate max height
        const GAP = 8;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Vertical Positioning
        const spaceBelow = windowHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;

        let top: number | string = triggerRect.bottom + GAP;
        let bottom: number | string = 'auto';

        // Flip up if not enough space below and more space above
        if (spaceBelow < MAX_HEIGHT && spaceAbove > spaceBelow) {
            top = 'auto';
            bottom = windowHeight - triggerRect.top + GAP;
            animateClass = "zoom-in-95 origin-bottom-left";
        }

        // Horizontal Positioning
        let left = triggerRect.left;

        // Flip left if goes off screen right
        if (left + MODAL_WIDTH > windowWidth - 20) {
            // Try aligning right edge to trigger right edge
            const alignRightLeft = triggerRect.right - MODAL_WIDTH;
            // If that is too far left (off screen left), just clamp to window right
            left = Math.max(20, Math.min(alignRightLeft, windowWidth - MODAL_WIDTH - 20));
            // Update origin for animation
            animateClass = animateClass.replace('left', 'right');
        }

        style = {
            position: 'fixed',
            top,
            bottom,
            left,
            transform: 'none',
            maxHeight: MAX_HEIGHT
        };
    }

    return (
        <div className={triggerRect ? 'fixed inset-0 z-50' : ''}>
            {/* Invisible backdrop for clicking outside */}
            <div className="fixed inset-0 z-40 bg-transparent" onClick={onClose} />

            <div
                ref={modalRef}
                style={style}
                className={`${triggerRect ? 'fixed z-50 shadow-2xl ring-1 ring-black/5 dark:ring-white/10' : 'fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-2xl ring-1 ring-black/5 dark:ring-white/10'} 
                    w-[200px] h-auto bg-[var(--chat-bg-secondary)] rounded-xl flex flex-col overflow-hidden 
                    border border-[var(--chat-border)] animate-in duration-100 ease-out ${animateClass}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--chat-border)] shrink-0">
                    <h2 className="text-[var(--chat-text-primary)] font-medium text-xs">Message info</h2>
                    <button
                        onClick={onClose}
                        className="p-0.5 hover:bg-[var(--chat-bg-hover)] rounded-full transition-colors text-[var(--chat-text-secondary)]"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Filter Tabs */}
                {reactions.length > 0 ? (
                    <>
                        <div className="flex items-center px-3 pt-0.5 gap-2 overflow-x-auto no-scrollbar border-b border-[var(--chat-border)] shrink-0">
                            <button
                                onClick={() => setActiveTab('All')}
                                className={`pb-1 text-[11px] font-medium transition-colors relative whitespace-nowrap ${activeTab === 'All'
                                    ? 'text-[var(--chat-accent)]'
                                    : 'text-[var(--chat-text-secondary)] hover:text-[var(--chat-text-primary)]'
                                    }`}
                            >
                                All {reactions.length}
                                {activeTab === 'All' && (
                                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--chat-accent)] rounded-t-sm" />
                                )}
                            </button>

                            {uniqueEmojis.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => setActiveTab(emoji)}
                                    className={`pb-1 text-base font-medium transition-colors relative px-1 ${activeTab === emoji
                                        ? 'text-[var(--chat-text-primary)]'
                                        : 'opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    {emoji} <span className="text-[10px] font-normal text-[var(--chat-text-secondary)] ml-0.5 align-top">{groupedReactions[emoji].length}</span>
                                    {activeTab === emoji && (
                                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--chat-accent)] rounded-t-sm" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Reaction List */}
                        <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
                            {displayedReactions.map(reaction => {
                                const isMe = reaction.userId === currentUser?.id;
                                const displayName = isMe ? "You" : reaction.userName;
                                const clickToRemove = isMe ? "Click to remove" : "";
                                const avatarUrl = getUserAvatar ? getUserAvatar(reaction.userId) : undefined;

                                return (
                                    <div
                                        key={reaction.id}
                                        className={`flex items-center justify-between p-1.5 rounded-lg hover:bg-[var(--chat-bg-hover)] transition-colors group ${isMe ? 'cursor-pointer' : ''}`}
                                        onClick={() => {
                                            if (isMe) {
                                                onRemoveReaction(reaction.messageId, reaction.emoji);
                                                if (groupedReactions[reaction.emoji]?.length <= 1 && activeTab === reaction.emoji) {
                                                    setActiveTab('All');
                                                }
                                            }
                                        }}
                                        title={clickToRemove}
                                    >
                                        <div className="flex items-center gap-2">
                                            {/* Avatar or Placeholder */}
                                            {avatarUrl ? (
                                                <img
                                                    src={avatarUrl}
                                                    alt={reaction.userName}
                                                    className="w-6 h-6 rounded-full object-cover shrink-0 border border-[var(--chat-border)]"
                                                />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-[var(--chat-bg-tertiary)] flex items-center justify-center text-[var(--chat-text-muted)] shrink-0 border border-[var(--chat-border)]">
                                                    <User className="w-3.5 h-3.5" />
                                                </div>
                                            )}

                                            <div className="flex flex-col">
                                                <span
                                                    className={`text-xs font-medium text-[var(--chat-text-primary)]`}
                                                >
                                                    {displayName}
                                                </span>
                                                {isMe && (
                                                    <span className="text-[10px] text-[var(--chat-text-secondary)]">Click to remove</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-lg animate-in zoom-in duration-200">
                                            {reaction.emoji}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-[var(--chat-text-secondary)] text-xs">
                        No reactions yet
                    </div>
                )}
            </div>
        </div>
    );
}
