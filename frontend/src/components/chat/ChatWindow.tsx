import { useEffect, useState, useRef, useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChatStore } from '@/stores/chatStore';
import type { Message } from '@/stores/chatStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { useRealtimeStore } from '@/stores/realtimeStore';
import { getCurrentUser } from '@/lib/auth';
import { ChatMessageItem } from './ChatMessageItem';
import { MentionSuggestion } from '../shared/MentionSuggestion';
import { format, isToday, isYesterday } from 'date-fns';
import { X, Plus, Send, Mic, Smile } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import { ReactionDetailsModal } from './ReactionDetailsModal';

const USER_COLORS = [
    '#a13ee7ff', '#ff9b04ff', '#fd543adb',
    '#ee32ffff', '#d6be00', '#178d7d94', '#6d65dbff',
];

function getUserColor(name?: string) {
    if (!name) return USER_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

export function ChatWindow() {
    const {
        activeChannelId, activeDmGroupId,
        channels, dmGroups, messages, members,
        fetchMessages, postMessage, fetchWorkspaceMembers,
        addReaction, removeReaction,
        isLoading, error
    } = useChatStore();
    const {
        emitTyping,
        emitStopTyping,
        typingUsers,
        joinChannel,
        leaveChannel,
        isConnected
    } = useRealtimeStore();
    const { activeWorkspace } = useWorkspaces();
    const currentUser = getCurrentUser();
    const [searchParams] = useSearchParams();

    const [isSending, setIsSending] = useState(false);
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionPosition, setMentionPosition] = useState<{ top?: number, bottom?: number, left: number }>({ left: 0 });
    const [hasContent, setHasContent] = useState(false);
    const [replyingTo, setReplyingTo] = useState<any | null>(null); // Type Message
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [selectedMessageForReactionDetails, setSelectedMessageForReactionDetails] = useState<Message | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onEmojiClick = (emojiData: EmojiClickData) => {
        if (inputRef.current) {
            const img = `<img src="${emojiData.imageUrl}" alt="${emojiData.emoji}" class="inline-block w-6 h-6 align-middle mx-0.5 object-contain" />`;

            inputRef.current.innerHTML += img;
            setHasContent(true);
            // Move cursor to end
            const range = document.createRange();
            const sel = window.getSelection();
            if (sel) {
                range.selectNodeContents(inputRef.current);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    };

    const activeId = activeChannelId || activeDmGroupId;
    const isDm = !!activeDmGroupId;

    const currentMessages = activeId ? (messages[activeId] || []) : [];

    const activeChannel = activeChannelId ? channels.find(c => c.id === activeChannelId) : null;
    const activeDm = activeDmGroupId ? dmGroups.find(d => d.id === activeDmGroupId) : null;

    // Get typing users for current channel, excluding specific user if needed (though backend filters sender usually)
    const currentTypingUsers = activeId ? (typingUsers[activeId] || []) : [];

    const filteredMembers = useMemo(() => {
        if (mentionQuery === null) return [];
        return members.filter(u =>
            (u.fullName.toLowerCase().includes(mentionQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(mentionQuery.toLowerCase())) &&
            u.id !== currentUser?.id // Exclude self
        ).slice(0, 5);
    }, [members, mentionQuery, currentUser]);

    useEffect(() => {
        if (activeWorkspace && activeId) {
            fetchMessages(activeWorkspace.id, activeId, isDm);
            fetchWorkspaceMembers(activeWorkspace.id);
        }
    }, [activeWorkspace, activeId, isDm, fetchMessages, fetchWorkspaceMembers]);

    // SignalR Subscription Effect - Depends on connection state
    useEffect(() => {
        if (activeWorkspace && activeId && isConnected) {
            // Join SignalR Group
            console.log(`[ChatWindow] Joining channel ${activeId} (connected: ${isConnected})`);
            joinChannel(activeId);

            return () => {
                leaveChannel(activeId);
            };
        }
    }, [activeWorkspace, activeId, isConnected, joinChannel, leaveChannel]);

    useEffect(() => {
        const messageId = searchParams.get('messageId');
        if (messageId && currentMessages.length > 0) {
            const el = document.getElementById(messageId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // Fallback: Scroll to bottom if not found (or should we fetch?)
                // For now, default behavior handles bottom scroll if we don't interfere
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [currentMessages.length, activeId, searchParams]);

    const handleInput = () => {
        if (!inputRef.current) return;
        const text = inputRef.current.textContent || '';
        setHasContent(text.trim().length > 0);

        // Typing logic
        if (activeId) {
            if (text.trim().length > 0) {
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                } else {
                    emitTyping(activeId);
                }

                typingTimeoutRef.current = setTimeout(() => {
                    emitStopTyping(activeId);
                    typingTimeoutRef.current = null;
                }, 2000);
            }
        }

        if (isDm) {
            setMentionQuery(null);
            return;
        }

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;

        if (textNode.nodeType === Node.TEXT_NODE) {
            const textContent = textNode.textContent || '';
            const cursorMap = range.startOffset;
            const textBefore = textContent.slice(0, cursorMap);

            const lastAt = textBefore.lastIndexOf('@');

            if (lastAt !== -1) {
                const charBefore = lastAt > 0 ? textBefore[lastAt - 1] : ' ';
                if (charBefore === ' ' || charBefore === '\n' || charBefore === '\u00A0') {
                    const query = textBefore.slice(lastAt + 1);
                    // Allow spaces but don't start with space
                    if (!query.startsWith(' ') && query.length < 50) {
                        setMentionQuery(query);

                        // Anchor to input box NOT cursor
                        const inputRect = inputRef.current.getBoundingClientRect();
                        setMentionPosition({
                            bottom: window.innerHeight - inputRect.top + 8, // 8px padding above input
                            left: inputRect.left
                        });
                        return;
                    }
                }
            }
        }

        setMentionQuery(null);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            // Only prevent send if we have a valid mention query AND suggestions to select
            if (mentionQuery !== null && filteredMembers.length > 0) {
                e.preventDefault();
                return;
            }
            e.preventDefault();
            handleSend();
        }
    };

    const selectUser = (user: { id: string; fullName: string }) => {
        if (!inputRef.current) return;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;

        if (textNode.nodeType === Node.TEXT_NODE) {
            const textContent = textNode.textContent || '';
            const cursorMap = range.startOffset;
            const lastAt = textContent.lastIndexOf('@', cursorMap - 1);

            if (lastAt !== -1) {
                range.setStart(textNode, lastAt);
                range.setEnd(textNode, cursorMap);
                range.deleteContents();

                const span = document.createElement('span');
                span.textContent = `@${user.fullName}`;
                span.className = "text-primary font-bold bg-primary/10 rounded px-1 mx-0.5 select-none";
                span.dataset.id = user.id;
                span.contentEditable = "false";

                range.insertNode(span);

                const space = document.createTextNode('\u00A0');
                range.collapse(false);
                range.insertNode(space);

                range.setStartAfter(space);
                range.setEndAfter(space);
                selection.removeAllRanges();
                selection.addRange(range);

                setMentionQuery(null);
                setHasContent(true);

                // Keep focus
                inputRef.current.focus();
            }
        }
    };

    const handleSend = async () => {
        if (!inputRef.current || !activeWorkspace || !currentUser) return;

        // Clear typing
        if (activeId && typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            emitStopTyping(activeId);
            typingTimeoutRef.current = null;
        }

        let content = '';
        inputRef.current.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                content += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                if (el.tagName === 'SPAN' && el.dataset.id) {
                    content += `<@${el.dataset.id}|${el.textContent?.replace('@', '')}>`;
                } else if (el.tagName === 'IMG' && el.getAttribute('alt')) {
                    content += el.getAttribute('alt');
                } else if (el.tagName === 'DIV' || el.tagName === 'BR') {
                    content += '\n';
                    if (el.tagName === 'DIV' && el.textContent) content += el.textContent;
                } else {
                    content += el.textContent;
                }
            }
        });

        content = content.trim();
        if (!content) return;

        setIsSending(true);
        setIsSending(true);
        try {
            await postMessage(activeWorkspace.id, content, currentUser.id, currentUser.name || currentUser.email, replyingTo?.id);
            inputRef.current.innerHTML = '';
            setHasContent(false);
            setMentionQuery(null);
            setReplyingTo(null);
        } catch (err) {
            console.error("Failed to send", err);
        } finally {
            setIsSending(false);
        }
    };

    const getHeaderTitle = () => {
        if (activeChannel) return activeChannel.name.replace(/^#/, '');
        if (activeDm) {
            const otherMembers = activeDm.members.filter(m => m.id !== currentUser?.id);
            return otherMembers.map(m => m.fullName).join(', ') || 'Me';
        }
        return 'Chat';
    };

    if (!activeId) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a channel or DM to start chatting
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-background relative">
            {mentionQuery !== null && (
                <MentionSuggestion
                    users={filteredMembers}
                    onSelect={selectUser}
                    onClose={() => setMentionQuery(null)}
                    position={mentionPosition}
                />
            )}

            {/* Header */}
            <div className="h-14 border-b border-border flex items-center px-4 bg-card/10">
                <div className="flex items-center gap-3 font-semibold">
                    {activeChannel ? (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                            {activeChannel.name.replace(/^#/, '').charAt(0).toUpperCase()}
                        </div>
                    ) : activeDm ? (
                        (() => {
                            const otherMembers = activeDm.members.filter(m => m.id !== currentUser?.id);
                            // Single DM
                            if (otherMembers.length === 1 && otherMembers[0].avatarUrl) {
                                return (
                                    <img
                                        src={otherMembers[0].avatarUrl}
                                        alt={otherMembers[0].fullName}
                                        className="w-8 h-8 rounded-full object-cover border border-border"
                                    />
                                );
                            }
                            // Group DM or no avatar
                            return (
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold border border-border">
                                    {otherMembers.length > 0 ? otherMembers[0].fullName.charAt(0).toUpperCase() : 'M'}
                                </div>
                            );
                        })()
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            {/* Generic fallback */}
                            <div className="w-4 h-4 rounded-full bg-muted-foreground/30" />
                        </div>
                    )}

                    {/* Title Text - REFINED (No #) */}
                    <div className="flex flex-col justify-center gap-1">
                        <span className="text-foreground font-semibold leading-tight">{activeChannel ? activeChannel.name.replace(/^#/, '') : getHeaderTitle()}</span>
                        {activeChannel && <span className="text-[10px] text-muted-foreground font-normal truncate max-w-[600px] block">{members.map(m => m.fullName).join(', ')}</span>}
                    </div>
                </div>

                {/* Meeting Icon Button */}
                <button
                    className="ml-auto p-2 hover:bg-muted/50 rounded-full transition-colors"
                    title="Start video meeting"
                    onClick={() => {
                        // TODO: Implement video meeting functionality
                        console.log('Start video meeting');
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-muted-foreground"
                    >
                        <path d="m22 8-6 4 6 4V8Z" />
                        <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
                    </svg>
                </button>

                {/* More Options Icon Button */}
                <div className="relative">
                    <button
                        className="p-2 hover:bg-muted/50 rounded-full transition-colors"
                        title="More options"
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-muted-foreground"
                        >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showMoreMenu && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-[#202c33] border border-[#2a3942] rounded-lg shadow-lg overflow-hidden z-50">
                            <button
                                className="w-full px-4 py-3 text-left text-sm text-[#e9edef] hover:bg-[#2a3942] transition-colors flex items-center gap-3"
                                onClick={() => {
                                    setShowMoreMenu(false);
                                    console.log('Contact info');
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                Contact info
                            </button>
                            <button
                                className="w-full px-4 py-3 text-left text-sm text-[#e9edef] hover:bg-[#2a3942] transition-colors flex items-center gap-3"
                                onClick={() => {
                                    setShowMoreMenu(false);
                                    console.log('Select messages');
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 11 12 14 22 4" />
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                </svg>
                                Select messages
                            </button>
                            <button
                                className="w-full px-4 py-3 text-left text-sm text-[#e9edef] hover:bg-[#2a3942] transition-colors flex items-center gap-3"
                                onClick={() => {
                                    setShowMoreMenu(false);
                                    console.log('Mute notifications');
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                                Mute notifications
                            </button>
                            <button
                                className="w-full px-4 py-3 text-left text-sm text-[#e9edef] hover:bg-[#2a3942] transition-colors flex items-center gap-3"
                                onClick={() => {
                                    setShowMoreMenu(false);
                                    console.log('Search');
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.3-4.3" />
                                </svg>
                                Search
                            </button>
                            <div className="h-px bg-[#2a3942] my-1" />
                            <button
                                className="w-full px-4 py-3 text-left text-sm text-[#ea4335] hover:bg-[#2a3942] transition-colors flex items-center gap-3"
                                onClick={() => {
                                    setShowMoreMenu(false);
                                    console.log('Clear chat');
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Clear chat
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div
                className="flex-1 overflow-y-auto px-4 py-4 chat-background"
            >
                {isLoading ? (
                    <div className="flex justify-center p-4"><span className="animate-spin">⌛</span></div>
                ) : currentMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground mt-10">No messages yet. Say hello!</div>
                ) : (
                    currentMessages.map((msg, idx) => {
                        const isMe = msg.senderId === currentUser?.id;
                        // Use 5 minutes threshold for grouping
                        const isSequence = idx > 0 && currentMessages[idx - 1].senderId === msg.senderId && (new Date(msg.createdAt).getTime() - new Date(currentMessages[idx - 1].createdAt).getTime() < 60000 * 5);
                        const showHeader = idx === 0 || !isSequence;

                        // Date Separator Logic
                        let dateSeparator = null;
                        if (idx === 0) {
                            dateSeparator = new Date(msg.createdAt);
                        } else {
                            const prevDate = new Date(currentMessages[idx - 1].createdAt);
                            const currDate = new Date(msg.createdAt);
                            if (prevDate.getDate() !== currDate.getDate() || prevDate.getMonth() !== currDate.getMonth() || prevDate.getFullYear() !== currDate.getFullYear()) {
                                dateSeparator = currDate;
                            }
                        }

                        let dateLabel = '';
                        if (dateSeparator) {
                            if (isToday(dateSeparator)) dateLabel = 'Today';
                            else if (isYesterday(dateSeparator)) dateLabel = 'Yesterday';
                            else dateLabel = format(dateSeparator, 'MMMM d, yyyy');
                        }

                        return (
                            <div key={msg.id} className={`flex flex-col ${showHeader ? 'mt-4' : 'mt-[2px]'}`}>
                                {dateSeparator && (
                                    <div className="flex items-center justify-center my-4">
                                        <div className="bg-[#202c33] text-xs text-[#e9edef] px-3 py-1 rounded-md shadow-sm">{dateLabel}</div>
                                    </div>
                                )}

                                <ChatMessageItem
                                    message={msg}
                                    currentUser={currentUser ? { id: currentUser.id, name: currentUser.name, email: currentUser.email || '' } : null}
                                    isMe={isMe}
                                    showHeader={showHeader}
                                    onReply={(m) => {
                                        setReplyingTo(m);
                                        inputRef.current?.focus();
                                    }}
                                    onReact={(mid, emoji) => {
                                        if (activeWorkspace) addReaction(activeWorkspace.id, mid, emoji);
                                    }}
                                    onRemoveReaction={(mid, emoji) => {
                                        if (activeWorkspace) removeReaction(activeWorkspace.id, mid, emoji);
                                    }}
                                    onOpenReactionDetails={(m) => setSelectedMessageForReactionDetails(m)}
                                />
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-2 shrink-0 relative z-10">
                {/* Typing Indicator */}
                {currentTypingUsers.length > 0 && (
                    <div className="absolute top-[-25px] left-4 text-xs text-muted-foreground animate-pulse">
                        {currentTypingUsers.length === 1
                            ? `${currentTypingUsers[0].userName} is typing...`
                            : `${currentTypingUsers.length} people are typing...`
                        }
                    </div>
                )}

                {/* Reply Banner */}
                {replyingTo && (
                    <div className="flex items-center justify-between bg-[#1f2c34] p-2 mb-2 rounded-lg border-l-[4px] relative"
                        style={{ borderLeftColor: getUserColor(replyingTo.senderName) }}
                    >
                        <div className="flex flex-col ml-2 overflow-hidden">
                            <span
                                className="text-[12px] font-bold mb-0.5"
                                style={{ color: getUserColor(replyingTo.senderName) }}
                            >
                                Replying to {replyingTo.senderName}
                            </span>
                            <span className="text-[12px] text-[#8696a0] truncate">
                                {replyingTo.content}
                            </span>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-white/10 rounded-full self-start mt-1">
                            <X className="w-4 h-4 text-[#8696a0]" />
                        </button>
                    </div>
                )}

                <div className="flex items-end gap-2 bg-[#202c33] rounded-[24px] p-1 border border-[#2a3942] relative">
                    {showEmojiPicker && (
                        <div className="absolute bottom-full left-0 mb-2 z-50 bg-[#202c33] border border-[#2a3942] rounded-[16px] shadow-2xl flex flex-col overflow-hidden w-[430px]">
                            <div className="flex-1 bg-[#111b21] emoji-picker-custom">
                                <style>{`
                                    .emoji-picker-custom aside.EmojiPickerReact {
                                        --epr-emoji-size: 26px !important;
                                        --epr-search-input-height: 32px !important;
                                        --epr-category-label-height: 28px !important;
                                        --epr-category-navigation-button-size: 24px !important;
                                    }
                                    /* Reduce icon scaling */
                                    .emoji-picker-custom .epr-cat-btn > img {
                                        width: 20px !important;
                                        height: 20px !important;
                                    }
                                    /* Active Category Circle */
                                    /* Active Category Circle */
                                    .emoji-picker-custom .epr-cat-btn[aria-selected="true"] {
                                        background-color: #374045 !important;
                                        border-radius: 50% !important;
                                        border: none !important;
                                        outline: none !important;
                                        box-shadow: 0 0 0 6px #374045 !important;
                                        color: white !important;
                                    }
                                    /* Remove pseudo-elements */
                                    .emoji-picker-custom .epr-cat-btn[aria-selected="true"]::before,
                                    .emoji-picker-custom .epr-cat-btn[aria-selected="true"]::after {
                                        display: none !important;
                                        content: none !important;
                                    }
                                    /* White Icon for Active */
                                    .emoji-picker-custom .epr-cat-btn[aria-selected="true"] > * {
                                        filter: grayscale(1) brightness(0) invert(1) !important;
                                        opacity: 1 !important;
                                    }
                                    .emoji-picker-custom .epr-emoji-img {
                                        width: 25px !important;
                                        height: 25px !important;
                                        max-width: 25px !important;
                                        max-height: 25px !important;
                                    }
                                    .emoji-picker-custom li.epr-emoji-category > .epr-emoji-category-content {
                                        grid-template-columns: repeat(auto-fill, 36px) !important;
                                    }
                                    .emoji-picker-custom .epr-body {
                                        padding: 0 0 0 0 !important;
                                    }
                                    /* Compact Search */
                                    .emoji-picker-custom .epr-search-container {
                                        padding: 10px 10px 8px 10px !important;
                                        margin-bottom: 0 !important;
                                    }
                                    .emoji-picker-custom .epr-category-nav {
                                        padding-top: 0 !important;
                                        padding-bottom: 0 !important;
                                        margin-top: 5px !important;
                                        margin-bottom: 20px !important;
                                    }
                                    .emoji-picker-custom input.epr-search {
                                        height: 32px !important;
                                        font-size: 13px !important;
                                        border-radius: 8px !important;
                                    }
                                    /* Smaller Text */
                                    .emoji-picker-custom .epr-emoji-category-label {
                                        font-size: 12px !important;
                                        line-height: 28px !important;
                                    }
                                `}</style>
                                <EmojiPicker
                                    onEmojiClick={onEmojiClick}
                                    theme={Theme.DARK}
                                    width="100%"
                                    height={350}
                                    previewConfig={{ showPreview: false }}
                                    skinTonesDisabled
                                />
                            </div>
                        </div>
                    )}

                    <button className="p-1.5 text-[#8696a0] hover:text-[#e9edef] transition-colors shrink-0 rounded-full hover:bg-white/5 pb-1.5">
                        <Plus className="w-6 h-6" />
                    </button>

                    <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`p-1.5 transition-colors shrink-0 rounded-full hover:bg-white/5 pb-1.5 -ml-1 ${showEmojiPicker ? 'text-[#00a884]' : 'text-[#8696a0] hover:text-[#e9edef]'}`}
                    >
                        <Smile className="w-6 h-6" />
                    </button>

                    <div
                        ref={inputRef}
                        contentEditable
                        onInput={handleInput}
                        onKeyDown={handleKeyDown}
                        className="flex-1 max-h-[100px] overflow-y-auto py-2 px-2 text-[15px] text-[#e9edef] outline-none min-h-[24px] empty:before:content-[attr(data-placeholder)] empty:before:text-[#8696a0]"
                        role="textbox"
                        aria-multiline="true"
                        data-placeholder={`Message ${getHeaderTitle()}...`}
                    />

                    <button
                        onClick={handleSend}
                        disabled={isSending || !hasContent}
                        className={`p-1.5 rounded-full shrink-0 transition-all pb-1.5 ${hasContent
                            ? 'text-[#00a884] hover:bg-[#00a884]/10'
                            : 'text-[#8696a0] hover:bg-white/5'
                            }`}
                    >
                        {hasContent ? (
                            <Send className="w-5 h-5 ml-0.5" />
                        ) : (
                            <Mic className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>
            {/* Reaction Details Modal */}
            {selectedMessageForReactionDetails && (
                <ReactionDetailsModal
                    isOpen={true}
                    onClose={() => setSelectedMessageForReactionDetails(null)}
                    reactions={selectedMessageForReactionDetails.reactions || []}
                    currentUser={currentUser ? { id: currentUser.id, name: currentUser.name, email: currentUser.email || '' } : null}
                    onRemoveReaction={(mid, emoji) => {
                        if (activeWorkspace) removeReaction(activeWorkspace.id, mid, emoji);
                    }}
                />
            )}
        </div>
    );
}
