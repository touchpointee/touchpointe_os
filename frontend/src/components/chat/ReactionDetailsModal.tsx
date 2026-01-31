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
    position?: { top: number; left: number };
}

export function ReactionDetailsModal({
    isOpen,
    onClose,
    reactions,
    currentUser,
    onRemoveReaction,
    position
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
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
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

    // Determine filtered list
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
    const style: React.CSSProperties = position
        ? {
            position: 'fixed',
            top: Math.min(position.top, window.innerHeight - 270), // Prevent overflow bottom (max height ~260px)
            left: Math.min(position.left, window.innerWidth - 220), // Prevent overflow right
            transform: 'none'
        }
        : {};

    const containerClass = position
        ? "fixed z-50 animate-in fade-in zoom-in-95 duration-200"
        : "fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200";

    return (
        <div className={position ? 'fixed inset-0 z-50' : ''}>
            {/* Invisible backdrop for clicking outside if positioned, or visible dimming if centered */}
            {/* Use a separate div for the backdrop so we don't mess up the positioned element */}
            <div className="fixed inset-0 z-40 bg-transparent" onClick={onClose} />

            <div
                ref={modalRef}
                style={style}
                className={`${position ? 'fixed z-50 shadow-xl' : 'fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-2xl'} 
                    w-[200px] h-auto max-h-[260px] bg-[#1e202b] rounded-xl flex flex-col overflow-hidden 
                    border border-[#2a3942] animate-in zoom-in-95 duration-100 ease-out`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#2a3942] shrink-0">
                    <h2 className="text-[#e9edef] font-medium text-xs">Message info</h2>
                    <button
                        onClick={onClose}
                        className="p-0.5 hover:bg-[#374248] rounded-full transition-colors text-[#8696a0]"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Filter Tabs */}
                {reactions.length > 0 ? (
                    <>
                        <div className="flex items-center px-3 pt-0.5 gap-2 overflow-x-auto no-scrollbar border-b border-[#2a3942] shrink-0">
                            <button
                                onClick={() => setActiveTab('All')}
                                className={`pb-1 text-[11px] font-medium transition-colors relative whitespace-nowrap ${activeTab === 'All'
                                    ? 'text-[#3b82f6]'
                                    : 'text-[#8696a0] hover:text-[#d1d7db]'
                                    }`}
                            >
                                All {reactions.length}
                                {activeTab === 'All' && (
                                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3b82f6] rounded-t-sm" />
                                )}
                            </button>

                            {uniqueEmojis.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => setActiveTab(emoji)}
                                    className={`pb-1 text-base font-medium transition-colors relative px-1 ${activeTab === emoji
                                        ? 'text-[#e9edef]'
                                        : 'opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    {emoji} <span className="text-[10px] font-normal text-[#8696a0] ml-0.5 align-top">{groupedReactions[emoji].length}</span>
                                    {activeTab === emoji && (
                                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3b82f6] rounded-t-sm" />
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

                                return (
                                    <div
                                        key={reaction.id}
                                        className={`flex items-center justify-between p-1.5 rounded-lg hover:bg-[#101114] transition-colors group ${isMe ? 'cursor-pointer' : ''}`}
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
                                            {/* Avatar Placeholder */}
                                            <div className="w-6 h-6 rounded-full bg-[#101114] flex items-center justify-center text-[#cfd3d6] shrink-0 border border-[#2a3942]">
                                                <User className="w-3.5 h-3.5" />
                                            </div>

                                            <div className="flex flex-col">
                                                <span
                                                    className={`text-xs font-medium ${isMe ? 'text-[#cfd3d6]' : 'text-[#e9edef]'}`}
                                                >
                                                    {displayName}
                                                </span>
                                                {isMe && (
                                                    <span className="text-[10px] text-[#8696a0]">Click to remove</span>
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
                    <div className="flex-1 flex items-center justify-center text-[#8696a0] text-xs">
                        No reactions yet
                    </div>
                )}
            </div>
        </div>
    );
}
