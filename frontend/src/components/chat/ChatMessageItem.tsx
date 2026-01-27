import { useState } from 'react';
import type { Message } from '@/stores/chatStore';
import { MentionRenderer } from '../shared/MentionRenderer';
import { Reply, Smile, User, File as FileIcon, Download, Play, Pause } from 'lucide-react';
import { useRef } from 'react';
import { format } from 'date-fns';

interface ChatMessageItemProps {
    message: Message;
    currentUser: { id: string; name?: string; email: string } | null;
    isMe: boolean;
    showHeader: boolean;
    onReply: (message: Message) => void;
    onReact: (messageId: string, emoji: string) => void;
    onRemoveReaction: (messageId: string, emoji: string) => void;
    onOpenReactionDetails: (message: Message) => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const USER_COLORS = [
    '#a13ee7ff', '#ff9b04ff', '#fd543adb',
    '#ee32ffff', '#d6be00', '#178d7d94', '#6d65dbff',
];

function getUserColor(name?: string | null) {
    if (!name) return USER_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

// Helper function to detect if message contains only a single emoji
function isSingleEmoji(text: string): boolean {
    const trimmed = text.trim();
    // Regex to match a single emoji (including compound emojis with ZWJ, skin tones, etc.)
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)(\u200D(\p{Emoji_Presentation}|\p{Emoji}\uFE0F))*$/u;
    return emojiRegex.test(trimmed);
}

const AudioPlayer = ({ src }: { src: string }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const total = audioRef.current.duration;
            if (total) { // Avoid NaN
                setProgress((current / total) * 100);
            }
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-2 bg-black/20 p-2 rounded-lg min-w-[200px] mt-1" onClick={(e) => e.stopPropagation()}>
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                className="hidden"
            />
            <button
                onClick={togglePlay}
                className="p-2 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white transition-colors"
            >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <div className="flex-1 flex flex-col justify-center gap-1">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => {
                        if (audioRef.current) {
                            const newTime = (Number(e.target.value) / 100) * audioRef.current.duration;
                            audioRef.current.currentTime = newTime;
                            setProgress(Number(e.target.value));
                        }
                    }}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00a884]"
                />
                <div className="flex justify-between text-[10px] text-[#8696a0]">
                    <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
                    <span>{formatTime(duration || 0)}</span>
                </div>
            </div>
        </div>
    );
};

export function ChatMessageItem({
    message,
    currentUser,
    isMe,
    showHeader,
    onReply,
    onReact,
    onRemoveReaction,
    onOpenReactionDetails
}: ChatMessageItemProps) {
    const [showReactions, setShowReactions] = useState(false);

    const handleReactionClick = (emoji: string) => {
        const existingReaction = message.reactions?.find(r => r.userId === currentUser?.id);

        if (existingReaction) {
            // If clicking the same emoji, toggle it off
            if (existingReaction.emoji === emoji) {
                onRemoveReaction(message.id, emoji);
            } else {
                // If clicking a different emoji, remove the old one and add the new one
                onRemoveReaction(message.id, existingReaction.emoji);
                onReact(message.id, emoji);
            }
        } else {
            // No existing reaction, just add the new one
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
            className={`group flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-start gap-3 px-2 hover:bg-muted/30 rounded-lg transition-colors relative ${message.isOptimistic ? 'animate-pulse opacity-70' : ''} ${Object.keys(reactionCounts).length > 0 ? 'mb-7' : ''}`}
            onMouseLeave={() => { setShowReactions(false); }}
        >
            {/* Avatar */}
            {showHeader ? (
                message.senderAvatarUrl ? (
                    <img
                        src={message.senderAvatarUrl}
                        alt={message.senderName}
                        className="w-8 h-8 rounded-full object-cover shrink-0 select-none bg-muted"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 select-none">
                        <User className="w-5 h-5" />
                    </div>
                )
            ) : (
                <div className="w-8 shrink-0" /> // Spacer
            )}

            <div className={`flex-1 min-w-0 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>

                {/* Single Emoji - No Bubble */}
                {isSingleEmoji(message.content) ? (
                    <div className="flex flex-col items-center gap-4 py-2.5">
                        <span className="text-5xl leading-none">{message.content.trim()}</span>
                        <span className={`text-[11px] select-none whitespace-nowrap px-2 py-1 rounded-md ${isMe ? 'bg-[#005c4b] text-[#e9edef]/60' : 'bg-[#202c33] text-[#8696a0]'}`}>
                            {format(new Date(message.createdAt), 'h:mm a')}
                        </span>
                    </div>
                ) : (
                    /* Regular Message with Bubble */
                    <div className={`flex items-center max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Message Content Bubble */}
                        <div className={`relative px-3 py-1 shadow-sm text-sm 
                            ${isMe
                                ? `bg-[#005c4b] text-[#e9edef] rounded-lg ${showHeader ? 'rounded-tr-none' : ''}`
                                : `bg-[#202c33] text-[#e9edef] rounded-lg ${showHeader ? 'rounded-tl-none' : ''}`
                            }`}
                        >
                            {/* Tail SVG - Only for first message in group */}
                            {showHeader && (
                                isMe ? (
                                    <span className="absolute top-0 -right-[8px] text-[#005c4b]">
                                        <svg viewBox="0 0 8 13" height="13" width="8" preserveAspectRatio="none" className="block fill-current">
                                            <path d="M5.188 0H0v11.193l6.467-8.625C7.526 2.156 6.958 0 5.188 0z"></path>
                                        </svg>
                                    </span>
                                ) : (
                                    <span className="absolute top-0 -left-[8px] text-[#202c33] -scale-x-100">
                                        <svg viewBox="0 0 8 13" height="13" width="8" preserveAspectRatio="none" className="block fill-current">
                                            <path d="M5.188 0H0v11.193l6.467-8.625C7.526 2.156 6.958 0 5.188 0z"></path>
                                        </svg>
                                    </span>
                                )
                            )}

                            {/* WhatsApp-style Reply Preview */}
                            {message.replyToMessageId && (
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        document.getElementById(message.replyToMessageId!)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }}
                                    className="mb-1 rounded bg-black/20 flex relative cursor-pointer overflow-hidden border-l-[4px] border-l-[#00a884]"
                                    style={{ borderLeftColor: getUserColor(message.replyPreviewSenderName) }}
                                >
                                    <div className="p-1 pl-2 flex flex-col justify-center min-w-0">
                                        <span
                                            className="text-[12px] font-bold leading-tight truncate"
                                            style={{ color: getUserColor(message.replyPreviewSenderName) }}
                                        >
                                            {message.replyPreviewSenderName}
                                        </span>
                                        <span className="text-[12px] text-[#e9edef]/80 truncate leading-tight">
                                            {message.replyPreviewText}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Sender Name in Bubble (Only for others) */}
                            {!isMe && showHeader && (
                                <div
                                    style={{ color: getUserColor(message.senderName) }}
                                    className="font-bold text-[11px] mb-1 leading-tight cursor-pointer hover:underline"
                                >
                                    {message.senderName}
                                </div>
                            )}

                            <div className="flex flex-col gap-1 mb-1">
                                {message.attachments?.map(att => (
                                    att.contentType.startsWith('image/') ? (
                                        <div key={att.id} className="rounded-lg overflow-hidden mt-1 mb-1 cursor-pointer" onClick={() => window.open(att.fileUrl, '_blank')}>
                                            <img src={att.fileUrl} alt={att.fileName} className="max-w-[100%] max-h-[300px] object-cover" />
                                        </div>
                                    ) : att.contentType.startsWith('audio/') ? (
                                        <AudioPlayer key={att.id} src={att.fileUrl} />
                                    ) : (
                                        <div key={att.id} className="flex items-center gap-2 bg-black/20 p-2 rounded max-w-[300px] mt-1">
                                            <div className="bg-[#202c33] p-1.5 rounded text-[#8696a0]">
                                                <FileIcon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div
                                                    className="text-sm truncate text-[#e9edef] hover:underline cursor-pointer"
                                                    onClick={() => window.open(att.fileUrl, '_blank')}
                                                >
                                                    {att.fileName}
                                                </div>
                                                <div className="text-xs text-[#8696a0]">{`${(att.size / 1024).toFixed(1)} KB`}</div>
                                            </div>
                                            <a href={att.fileUrl} download={att.fileName} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-white/10 rounded-full" onClick={e => e.stopPropagation()}>
                                                <Download className="w-4 h-4 text-[#8696a0]" />
                                            </a>
                                        </div>
                                    )
                                ))}
                            </div>

                            <div className="leading-snug whitespace-pre-wrap break-all">
                                <MentionRenderer content={message.content} />
                                <span className={`text-[10px] select-none whitespace-nowrap ml-2 float-right mt-3 ${isMe ? 'text-[#e9edef]/60' : 'text-[#8696a0]'}`}>
                                    {format(new Date(message.createdAt), 'h:mm a')}
                                </span>
                            </div>

                            {/* Reactions Display (Floating Pill) */}
                            {(Object.keys(reactionCounts).length > 0) && (
                                <div className={`absolute -bottom-5 ${isMe ? 'right-1' : 'left-3'} z-10`}>
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenReactionDetails(message);
                                        }}
                                        className="bg-[#202c33] border border-[#2a3942] rounded-full px-1.5 py-[1px] flex items-center gap-0 shadow-md cursor-pointer hover:bg-[#2a3942] transition-colors"
                                    >
                                        {Object.entries(reactionCounts).map(([emoji]) => (
                                            <div
                                                key={emoji}
                                                className={`
                                                    flex items-center justify-center h-5 w-4 rounded-full text-sm transition-all
                                                `}
                                            >
                                                <span>{emoji}</span>
                                            </div>
                                        ))}
                                        {(message.reactions || []).length > 1 && (
                                            <span className="text-[#8696a0] font-medium text-[11px] px-1">
                                                {(message.reactions || []).length}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Hover Actions */}
                        <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'mr-1' : 'ml-1'}`}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowReactions(!showReactions);
                                }}
                                className="p-1.5 hover:bg-muted/50 rounded-full transition-colors"
                                title="React"
                            >
                                <Smile className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReply(message);
                                }}
                                className="p-1.5 hover:bg-muted/50 rounded-full transition-colors"
                                title="Reply"
                            >
                                <Reply className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Reaction Picker Popup */}
                {showReactions && !isSingleEmoji(message.content) && (
                    <div className={`mt-1 bg-[#202c33] border border-[#2a3942] rounded-full px-2 py-1 flex items-center gap-1 shadow-lg ${isMe ? 'self-end' : 'self-start'}`}>
                        {COMMON_EMOJIS.map(emoji => (
                            <button
                                key={emoji}
                                onClick={() => handleReactionClick(emoji)}
                                className={`
                                    w-8 h-8 flex items-center justify-center rounded-full text-lg
                                    hover:bg-muted/30 transition-all
                                    ${myReactions.has(emoji) ? 'bg-muted/50 scale-110' : ''}
                                `}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>


        </div >
    );
}
