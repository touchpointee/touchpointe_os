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
}

export function ReactionDetailsModal({
    isOpen,
    onClose,
    reactions,
    currentUser,
    onRemoveReaction
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
    const displayedReactions = activeTab === 'All'
        ? reactions
        : groupedReactions[activeTab] || [];

    // Helper to generate consistent colors
    // Removed unused USER_COLORS and getUserColor function as we're using generic placeholders as per design


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent animate-in fade-in duration-200">
            <div
                ref={modalRef}
                className="w-[300px] max-w-[90vw] h-[350px] max-h-[90vh] bg-[#222e35] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-[#2a3942]"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#2a3942]">
                    <h2 className="text-[#e9edef] font-medium text-lg">Message info</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-[#374248] rounded-full transition-colors text-[#8696a0]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Filter Tabs */}
                {reactions.length > 0 ? (
                    <>
                        <div className="flex items-center px-4 pt-2 gap-4 overflow-x-auto no-scrollbar border-b border-[#2a3942]">
                            <button
                                onClick={() => setActiveTab('All')}
                                className={`pb-2 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'All'
                                    ? 'text-[#00a884]'
                                    : 'text-[#8696a0] hover:text-[#d1d7db]'
                                    }`}
                            >
                                All {reactions.length}
                                {activeTab === 'All' && (
                                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00a884] rounded-t-sm" />
                                )}
                            </button>

                            {uniqueEmojis.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => setActiveTab(emoji)}
                                    className={`pb-2 text-xl font-medium transition-colors relative px-2 ${activeTab === emoji
                                        ? 'text-[#e9edef]'
                                        : 'opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    {emoji} <span className="text-xs font-normal text-[#8696a0] ml-1 align-top">{groupedReactions[emoji].length}</span>
                                    {activeTab === emoji && (
                                        <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00a884] rounded-t-sm" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Reaction List */}
                        <div className="flex-1 overflow-y-auto p-2">
                            {displayedReactions.map(reaction => {
                                const isMe = reaction.userId === currentUser?.id;
                                const displayName = isMe ? "You" : reaction.userName;
                                const clickToRemove = isMe ? "Click to remove" : "";

                                return (
                                    <div
                                        key={reaction.id}
                                        className={`flex items-center justify-between p-2 rounded-lg hover:bg-[#111b21] transition-colors group ${isMe ? 'cursor-pointer' : ''}`}
                                        onClick={() => {
                                            if (isMe) {
                                                onRemoveReaction(reaction.messageId, reaction.emoji);
                                                // If this was the last reaction of this type, switch to 'All'
                                                if (groupedReactions[reaction.emoji]?.length <= 1 && activeTab === reaction.emoji) {
                                                    setActiveTab('All');
                                                }
                                                // If it was the very last reaction, close modal (delayed check handled by parent re-render or explicit logic?)
                                                // Actually, parent might re-render and remove the reaction from the prop list immediately.
                                            }
                                        }}
                                        title={clickToRemove}
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Avatar Placeholder */}
                                            <div className="w-8 h-8 rounded-full bg-[#111b21] flex items-center justify-center text-[#cfd3d6] shrink-0 border border-[#2a3942]">
                                                <User className="w-5 h-5" />
                                            </div>

                                            <div className="flex flex-col">
                                                <span
                                                    className={`text-sm font-medium ${isMe ? 'text-[#cfd3d6]' : 'text-[#e9edef]'}`}
                                                >
                                                    {displayName}
                                                </span>
                                                {isMe && (
                                                    <span className="text-xs text-[#8696a0]">Click to remove</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-2xl animate-in zoom-in duration-200">
                                            {reaction.emoji}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-[#8696a0]">
                        No reactions yet
                    </div>
                )}
            </div>
        </div>
    );
}
