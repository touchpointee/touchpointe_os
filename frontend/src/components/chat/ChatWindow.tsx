import { useEffect, useState, useRef, useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { getCurrentUser } from '@/lib/auth';
import { Hash, User } from 'lucide-react';
import { MentionSuggestion } from '../shared/MentionSuggestion';
import { MentionRenderer } from '../shared/MentionRenderer';

export function ChatWindow() {
    const {
        activeChannelId, activeDmGroupId,
        channels, dmGroups, messages, members,
        fetchMessages, postMessage, fetchWorkspaceMembers,
        isLoading, error
    } = useChatStore();
    const { activeWorkspace } = useWorkspaces();
    const currentUser = getCurrentUser();

    const [isSending, setIsSending] = useState(false);
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionPosition, setMentionPosition] = useState<{ top?: number, bottom?: number, left: number }>({ left: 0 });
    const [hasContent, setHasContent] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);

    const activeId = activeChannelId || activeDmGroupId;
    const isDm = !!activeDmGroupId;

    const currentMessages = activeId ? (messages[activeId] || []) : [];

    const activeChannel = activeChannelId ? channels.find(c => c.id === activeChannelId) : null;
    const activeDm = activeDmGroupId ? dmGroups.find(d => d.id === activeDmGroupId) : null;

    const filteredMembers = useMemo(() => {
        if (mentionQuery === null) return [];
        return members.filter(u =>
            u.fullName.toLowerCase().includes(mentionQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(mentionQuery.toLowerCase())
        ).slice(0, 5);
    }, [members, mentionQuery]);

    useEffect(() => {
        if (activeWorkspace && activeId) {
            fetchMessages(activeWorkspace.id, activeId, isDm);
            fetchWorkspaceMembers(activeWorkspace.id);

            const interval = setInterval(() => {
                fetchMessages(activeWorkspace.id, activeId, isDm);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [activeWorkspace, activeId, isDm, fetchMessages, fetchWorkspaceMembers]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentMessages.length, activeId]);

    const handleInput = () => {
        if (!inputRef.current) return;
        const text = inputRef.current.textContent || '';
        setHasContent(text.trim().length > 0);

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
        try {
            await postMessage(activeWorkspace.id, content, currentUser.id, currentUser.name || currentUser.email);
            inputRef.current.innerHTML = '';
            setHasContent(false);
            setMentionQuery(null);
        } catch (err) {
            console.error("Failed to send", err);
        } finally {
            setIsSending(false);
        }
    };

    const getHeaderTitle = () => {
        if (activeChannel) return `#${activeChannel.name}`;
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
                <div className="flex items-center gap-2 font-semibold">
                    {activeChannel ? <Hash className="w-5 h-5 text-muted-foreground" /> : <User className="w-5 h-5 text-muted-foreground" />}
                    {getHeaderTitle()}
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

                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                {showHeader && (
                                    <div className="flex items-center gap-2 mb-1 mt-2">
                                        <span className="text-xs font-semibold text-foreground/80">{msg.senderName}</span>
                                        <span className="text-[10px] text-muted-foreground">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                )}
                                <div
                                    className={`px-3 py-2 rounded-2xl max-w-[70%] text-sm ${isMe
                                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                        : 'bg-muted text-foreground rounded-tl-sm'
                                        } ${msg.isOptimistic ? 'opacity-70' : ''}`}
                                >
                                    <MentionRenderer content={msg.content} />
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-card border-t border-border shrink-0 relative z-10">
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
