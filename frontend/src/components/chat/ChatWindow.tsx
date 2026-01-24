import { useEffect, useState, useRef, useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChatStore } from '@/stores/chatStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { useRealtimeStore } from '@/stores/realtimeStore';
import { getCurrentUser } from '@/lib/auth';
import { ChatMessageItem } from './ChatMessageItem';
import { MentionSuggestion } from '../shared/MentionSuggestion';
import { format, isToday, isYesterday } from 'date-fns';
import { X, CornerDownRight } from 'lucide-react';

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

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
                    <div className="flex flex-col leading-none justify-center">
                        <span className="text-foreground">{activeChannel ? activeChannel.name.replace(/^#/, '') : getHeaderTitle()}</span>
                        {activeChannel && <span className="text-[10px] text-muted-foreground font-normal mt-0.5">{activeChannel.memberCount} members</span>}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {isLoading ? (
                    <div className="flex justify-center p-4"><span className="animate-spin">⌛</span></div>
                ) : currentMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground mt-10">No messages yet. Say hello!</div>
                ) : (
                    currentMessages.map((msg, idx) => {
                        const isMe = msg.senderId === currentUser?.id;
                        const showHeader = idx === 0 || currentMessages[idx - 1].senderId !== msg.senderId || (new Date(msg.createdAt).getTime() - new Date(currentMessages[idx - 1].createdAt).getTime() > 60000 * 5);

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
                            <div key={msg.id} className="flex flex-col">
                                {dateSeparator && (
                                    <div className="flex items-center justify-center my-4">
                                        <div className="bg-muted/50 text-xs text-muted-foreground px-3 py-1 rounded-full">{dateLabel}</div>
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
                                />
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-card border-t border-border shrink-0 relative z-10">
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
                    <div className="flex items-center justify-between bg-muted/40 p-2 rounded-t-lg border-x border-t border-border/50 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground truncate">
                            <CornerDownRight className="w-4 h-4 shrink-0" />
                            <span>Replying to <span className="font-semibold text-foreground">{replyingTo.senderName}</span></span>
                            <span className="truncate opacity-70">- {replyingTo.content}</span>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-muted rounded-full">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="relative bg-muted/30 rounded-lg border border-border focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                    <div
                        ref={inputRef}
                        contentEditable
                        onInput={handleInput}
                        onKeyDown={handleKeyDown}
                        className="w-full max-h-[150px] overflow-y-auto p-3 text-sm outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
                        role="textbox"
                        aria-multiline="true"
                        data-placeholder={`Message ${getHeaderTitle()}...`}
                    />

                    <div className="flex justify-between items-center p-2 border-t border-border/50 bg-muted/10">
                        <div className="flex gap-2">
                            <div className="w-6 h-6 rounded hover:bg-muted cursor-pointer flex items-center justify-center text-muted-foreground">
                                +
                            </div>
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={isSending || !hasContent}
                            className="bg-primary text-primary-foreground p-2 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
