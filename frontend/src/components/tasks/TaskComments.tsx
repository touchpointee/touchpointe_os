import { useState } from 'react';
import type { TaskCommentDto } from '@/types/task';
import { formatDistanceToNow } from 'date-fns';

export function TaskComments({ comments, onAdd }: {
    comments: TaskCommentDto[],
    onAdd: (content: string) => Promise<void>
}) {
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSending(true);
        await onAdd(content);
        setContent('');
        setIsSending(false);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Comments</h3>

            <div className="space-y-4">
                {comments.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {comment.userName.charAt(0)}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm font-semibold">{comment.userName}</span>
                                <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                            </div>
                            <div className="text-sm text-foreground bg-muted/30 p-2 rounded-md">
                                {comment.content}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                <div className="flex-1 border border-border rounded-md bg-background focus-within:ring-1 focus-within:ring-ring">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full bg-transparent p-2 text-sm outline-none resize-none min-h-[40px]"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <div className="flex justify-end p-1 border-t border-border bg-muted/10">
                        <button
                            type="submit"
                            disabled={isSending || !content.trim()}
                            className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 disabled:opacity-50"
                        >
                            Comment
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
