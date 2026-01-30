import { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useCrmStore } from '@/stores/crmStore';
import { Send } from 'lucide-react';

interface DealCommentsProps {
    dealId: string;
    workspaceId: string;
}

export function DealComments({ dealId, workspaceId }: DealCommentsProps) {
    const {
        dealComments,
        fetchDealComments,
        addDealComment,
        isLoading
    } = useCrmStore();

    const [isSending, setIsSending] = useState(false);
    const [comment, setComment] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        fetchDealComments(workspaceId, dealId);
    }, [workspaceId, dealId, fetchDealComments]);

    const handleSubmit = async () => {
        if (!comment.trim()) return;

        setIsSending(true);
        try {
            await addDealComment(workspaceId, dealId, comment.trim());
            setComment('');
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-4 px-1 mb-4 min-h-[100px] max-h-[400px]">
                {isLoading ? (
                    <div className="text-sm text-muted-foreground">Loading comments...</div>
                ) : dealComments.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No comments yet.</div>
                ) : (
                    dealComments.map((c) => (
                        <div key={c.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold shrink-0">
                                {c.userName.charAt(0)}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{c.userName}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <div className="text-sm text-foreground/90 bg-muted/40 p-2 rounded-md">
                                    {c.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="relative pt-2">
                <div className="flex gap-2">
                    <div className="relative flex-1 bg-muted/30 rounded-lg border border-border focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                        <textarea
                            ref={inputRef}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full max-h-[100px] overflow-y-auto p-3 text-sm outline-none min-h-[80px] bg-transparent resize-none"
                            placeholder="Write a comment..."
                        />
                        <div className="flex justify-end items-center p-2 border-t border-border/50 bg-muted/10">
                            <button
                                onClick={handleSubmit}
                                disabled={isSending || !comment.trim()}
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
