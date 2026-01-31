import { useState, useRef, useEffect, useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MentionSuggestion } from '../shared/MentionSuggestion';
import { MentionRenderer } from '../shared/MentionRenderer';
import { useChatStore } from '@/stores/chatStore';
import { useTaskStore } from '@/stores/taskStore';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCommentsProps {
    taskId: string;
    workspaceId: string;
}

export function TaskComments({ taskId, workspaceId }: TaskCommentsProps) {
    const {
        taskDetails,
        loading,
        fetchTaskDetails,
        addComment
    } = useTaskStore();

    // Fetch members from chat store for mentions
    const { members, fetchWorkspaceMembers } = useChatStore();

    useEffect(() => {
        if (workspaceId) {
            fetchWorkspaceMembers(workspaceId);
        }
    }, [workspaceId, fetchWorkspaceMembers]);

    const [isSending, setIsSending] = useState(false);
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionPosition, setMentionPosition] = useState<{ top?: number | string, bottom?: number | string, left: number | string }>({ left: 0 });
    const [hasContent, setHasContent] = useState(false);

    const inputRef = useRef<HTMLDivElement>(null);

    // Use taskDetails to get comments
    const comments = taskDetails[taskId]?.comments || [];

    useEffect(() => {
        if (!taskDetails[taskId]) {
            fetchTaskDetails(workspaceId, taskId);
        }
    }, [taskId, workspaceId, fetchTaskDetails, taskDetails]);


    const filteredMembers = useMemo(() => {
        if (mentionQuery === null) return [];
        return members.filter(u =>
            u.fullName.toLowerCase().includes(mentionQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(mentionQuery.toLowerCase())
        ).slice(0, 5);
    }, [members, mentionQuery]);

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
                    if (!query.startsWith(' ') && query.length < 50) {
                        setMentionQuery(query);
                        setMentionPosition({
                            bottom: '100%',
                            left: 0
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
            if (mentionQuery !== null && filteredMembers.length > 0) {
                e.preventDefault();
                return;
            }
            e.preventDefault();
            handleSubmit();
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

                inputRef.current.focus();
            }
        }
    };

    const handleSubmit = async () => {
        if (!inputRef.current) return;

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
            // TaskStore addComment only takes workspaceId, taskId, content. User is inferred.
            await addComment(workspaceId, taskId, content);
            inputRef.current.innerHTML = '';
            setHasContent(false);
            setMentionQuery(null);
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Comments</h3>

            <div className="bg-background border border-border rounded-[6px] h-[400px] overflow-y-auto custom-scrollbar p-4 relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground/60">
                        Loading comments...
                    </div>
                ) : comments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 border border-dashed border-border rounded-lg bg-muted/20 m-2">
                        <span className="text-sm">No comments yet</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {comments.map((comment) => {
                            const member = members.find(m => m.id === comment.userId);
                            const avatarUrl = comment.userAvatarUrl || member?.avatarUrl;

                            return (
                                <div key={comment.id} className="flex gap-3 group">
                                    {/* Avatar */}
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold shrink-0 text-indigo-500 mt-0.5 overflow-hidden">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt={comment.userName} className="w-full h-full object-cover" />
                                        ) : (
                                            comment.userName.charAt(0)
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-foreground">{comment.userName}</span>
                                            <span className="text-[10px] text-muted-foreground/60">
                                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <div className="text-xs text-foreground/90 bg-muted/50 p-3 rounded-lg border border-border/50 shadow-sm inline-block max-w-full">
                                            <MentionRenderer content={comment.content} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="relative pt-2">
                {mentionQuery !== null && (
                    <MentionSuggestion
                        users={filteredMembers}
                        onSelect={selectUser}
                        onClose={() => setMentionQuery(null)}
                        position={mentionPosition}
                        strategy="absolute"
                    />
                )}

                <div className="flex gap-2">
                    <div className="relative flex-1 bg-background rounded-lg border border-border focus-within:ring-1 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-all shadow-sm">
                        {!hasContent && (
                            <div className="absolute top-3 left-3 text-muted-foreground text-sm pointer-events-none select-none">
                                Write a comment... (Type @ to mention)
                            </div>
                        )}
                        <div
                            ref={inputRef}
                            contentEditable
                            onInput={handleInput}
                            onKeyDown={handleKeyDown}
                            className="w-full max-h-[150px] overflow-y-auto p-3 text-sm outline-none min-h-[60px] text-foreground custom-scrollbar relative z-10 bg-transparent"
                            role="textbox"
                            aria-multiline="true"
                        />
                        <div className="flex justify-end items-center p-2 border-t border-border/50 bg-muted/20">
                            <button
                                onClick={handleSubmit}
                                disabled={isSending || !hasContent}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                                    hasContent && !isSending
                                        ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm"
                                        : "bg-muted text-muted-foreground cursor-not-allowed"
                                )}
                            >
                                <Send className="w-3.5 h-3.5" />
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
