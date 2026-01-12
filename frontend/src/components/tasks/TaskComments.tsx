import { useState, useRef, useEffect, useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MentionSuggestion } from '../shared/MentionSuggestion';
import { MentionRenderer } from '../shared/MentionRenderer';
import { useChatStore } from '@/stores/chatStore';
import { useTaskStore } from '@/stores/taskStore';
import { Send } from 'lucide-react';

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
    const [mentionPosition, setMentionPosition] = useState<{ top?: number, bottom?: number, left: number }>({ left: 0 });
    const [hasContent, setHasContent] = useState(false);

    const inputRef = useRef<HTMLDivElement>(null);

    // Use taskDetails to get comments
    const comments = taskDetails[taskId]?.comments || [];

    // Fetch details if not present or stale?
    // Usually usage of this component implies details are open, but let's ensure.
    useEffect(() => {
        if (!taskDetails[taskId]) {
            fetchTaskDetails(workspaceId, taskId);
        }
    }, [taskId, workspaceId, fetchTaskDetails, taskDetails]); // Added taskDetails dep to avoid loop? No, handled by if check potentially?
    // Actually simpler: just rely on parent opening details or fetch once.
    // The previous code fetched on mount.

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

                        const inputRect = inputRef.current.getBoundingClientRect();
                        setMentionPosition({
                            bottom: window.innerHeight - inputRect.top + 8,
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
        <div className="flex flex-col h-full">
            <h3 className="font-semibold mb-4 px-1">Comments</h3>

            <div className="flex-1 overflow-y-auto space-y-4 px-1 mb-4 min-h-[100px] max-h-[400px]">
                {loading ? (
                    <div className="text-sm text-muted-foreground">Loading comments...</div>
                ) : comments.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No comments yet.</div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold shrink-0">
                                {comment.userName.charAt(0)}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{comment.userName}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <div className="text-sm text-foreground/90 bg-muted/40 p-2 rounded-md">
                                    <MentionRenderer content={comment.content} />
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="relative pt-2">
                {mentionQuery !== null && (
                    <MentionSuggestion
                        users={filteredMembers}
                        onSelect={selectUser}
                        onClose={() => setMentionQuery(null)}
                        position={mentionPosition}
                    />
                )}

                <div className="flex gap-2">
                    <div className="relative flex-1 bg-muted/30 rounded-lg border border-border focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                        <div
                            ref={inputRef}
                            contentEditable
                            onInput={handleInput}
                            onKeyDown={handleKeyDown}
                            className="w-full max-h-[100px] overflow-y-auto p-3 text-sm outline-none min-h-[80px] empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
                            role="textbox"
                            aria-multiline="true"
                            data-placeholder="Write a comment..."
                        />
                        <div className="flex justify-between items-center p-2 border-t border-border/50 bg-muted/10">
                            <div className="flex gap-2 text-xs text-muted-foreground">
                                Type @ to mention
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={isSending || !hasContent}
                                className="bg-primary text-primary-foreground p-1.5 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
