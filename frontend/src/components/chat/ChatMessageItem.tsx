import { useState } from 'react';
import type { Message } from '@/stores/chatStore';
import { MentionRenderer } from '../shared/MentionRenderer';
import { MessageSquare, Smile } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageItemProps {
    message: Message;
    currentUser: { id: string; name?: string; email: string } | null;
    isMe: boolean;
    showHeader: boolean;
    onReply: (message: Message) => void;
    onReact: (messageId: string, emoji: string) => void;
    onRemoveReaction: (messageId: string, emoji: string) => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export function ChatMessageItem({
    message,
    currentUser,
    isMe,
    showHeader,
    onReply,
    onReact,
    onRemoveReaction
}: ChatMessageItemProps) {
    const [showReactions, setShowReactions] = useState(false);

    const handleReactionClick = (emoji: string) => {
        const hasReacted = message.reactions?.some(r => r.userId === currentUser?.id && r.emoji === emoji);
        if (hasReacted) {
            onRemoveReaction(message.id, emoji);
        } else {
            onReact(message.id, emoji);
        }
        setShowReactions(false);
    };

    // Group reactions by emoji
    const reactionCounts = (message.reactions || []).reduce((acc, r) => {
        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const myReactions = new Set((message.reactions || []).filter(r => r.userId === currentUser?.id).map(r => r.emoji));

    return (
        <div
            id={message.id}
            className={`group flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-start gap-3 py-1 px-2 hover:bg-muted/30 rounded-lg transition-colors relative ${message.isOptimistic ? 'animate-pulse opacity-70' : ''}`}
            onMouseLeave={() => { setShowReactions(false); }}
        >
            {/* Avatar */}
            {showHeader ? (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 select-none">
                    {message.senderName.substring(0, 2).toUpperCase()}
                </div>
            ) : (
                <div className="w-8 shrink-0" /> // Spacer
            )}

            <div className={`flex-1 min-w-0 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Header */}
                {showHeader && (
                    <div className={`flex items-center gap-2 mb-0.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-sm font-semibold hover:underline cursor-pointer">{message.senderName}</span>
                        <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </span>
                    </div>
                )}

                {/* Reply Preview */}
                {message.replyToMessageId && (
                    <div
                        onClick={() => {
                            document.getElementById(message.replyToMessageId!)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className={`mb-1 flex items-center gap-2 cursor-pointer opacity-80 hover:opacity-100 group/reply ${isMe ? 'flex-row-reverse text-right' : 'flex-row'}`}
                    >
                        <div className="w-0.5 h-4 bg-primary/40 rounded-full"></div>
                        <span className="text-xs text-muted-foreground group-hover/reply:text-primary transition-colors">
                            Replying into <span className="font-medium">{message.replyPreviewSenderName}</span>: <span className="italic truncate max-w-[200px] inline-block align-bottom">{message.replyPreviewText}</span>
                        </span>
                    </div>
                )}

                {/* Message Content */}
                <div className={`relative px-4 py-2 rounded-2xl shadow-sm text-sm leading-relaxed max-w-fit
                    ${isMe
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-tl-sm border border-border/50'
                    }`}
                >
                    <MentionRenderer content={message.content} />
                </div>

                {/* Reactions Display */}
                {(Object.keys(reactionCounts).length > 0) && (
                    <div className={`mt-1.5 flex flex-wrap gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {Object.entries(reactionCounts).map(([emoji, count]) => (
                            <button
                                key={emoji}
                                onClick={() => handleReactionClick(emoji)}
                                className={`
                                    flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all
                                    ${myReactions.has(emoji)
                                        ? 'bg-primary/10 border-primary/30 text-primary'
                                        : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted hover:border-border'}
                                `}
                            >
                                <span>{emoji}</span>
                                <span className={`${myReactions.has(emoji) ? 'font-semibold' : ''}`}>{count}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Hover Actions (Absolute Right/Left) */}
            <div className={`opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 bg-background border border-border shadow-sm rounded-md flex items-center p-0.5 z-10 ${isMe ? 'left-4' : 'right-4'}`}>
                <button
                    onClick={() => onReply(message)}
                    className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                    title="Reply"
                >
                    <MessageSquare className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-border mx-0.5"></div>
                <button
                    onClick={() => setShowReactions(!showReactions)}
                    className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                    title="Add reaction"
                >
                    <Smile className="w-4 h-4" />
                </button>

                {/* Emoji Picker Popup */}
                {showReactions && (
                    <div className={`absolute top-8 ${isMe ? 'left-0' : 'right-0'} bg-popover border border-border shadow-lg rounded-lg p-2 flex gap-1 z-20 animate-in fade-in zoom-in-95 duration-100 w-max`}>
                        {COMMON_EMOJIS.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => handleReactionClick(emoji)}
                                className={`w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-muted ${myReactions.has(emoji) ? 'bg-primary/10' : ''}`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
