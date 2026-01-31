import React, { useRef, useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import type { TaskAttachmentDto } from '@/types/task';
import { Paperclip, X, File, Plus } from 'lucide-react';

interface TaskAttachmentsProps {
    workspaceId: string;
    taskId: string;
    attachments: TaskAttachmentDto[];
}

export default function TaskAttachments({ workspaceId, taskId, attachments }: TaskAttachmentsProps) {
    const { uploadAttachment, deleteAttachment } = useTaskStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setIsUploading(true);
            try {
                await uploadAttachment(workspaceId, taskId, file);
            } catch (error) {
                console.error("Upload failed", error);
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    const handleDelete = async (attachmentId: string) => {
        if (confirm('Are you sure you want to delete this attachment?')) {
            await deleteAttachment(workspaceId, taskId, attachmentId);
        }
    };

    // Helper to get consistent icons/previews
    const isImage = (contentType: string) => contentType.startsWith('image/');

    return (
        <div className="mt-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Attachments
            </h3>

            <input
                id="task-file-input"
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />

            <div className="flex flex-wrap gap-4">
                {/* Existing Attachments */}
                {attachments.map((att) => (
                    <div key={att.id} className="group relative w-50 aspect-[16/9] bg-background border border-border rounded-xl overflow-hidden flex flex-col hover:border-foreground/20 transition-all shadow-sm">
                        <button
                            onClick={() => handleDelete(att.id)}
                            className="absolute top-2 right-2 p-1.5 bg-background/80 hover:bg-destructive/10 rounded-full text-destructive opacity-0 group-hover:opacity-100 transition-all z-10 backdrop-blur-sm"
                            title="Delete"
                        >
                            <X className="w-3 h-3" />
                        </button>

                        {/* Preview Area */}
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center bg-muted relative overflow-hidden">
                            {isImage(att.contentType) ? (
                                <img src={att.url} alt={att.fileName} className="w-full h-full object-cover" />
                            ) : (
                                <File className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
                            )}
                        </a>

                        {/* Footer Details */}
                        <div className="h-14 px-3 flex flex-col justify-center bg-card border-t border-border">
                            <p className="text-[13px] text-foreground truncate text-center w-full" title={att.fileName}>
                                {att.fileName}
                            </p>
                            <p className="text-[11px] text-muted-foreground text-center w-full mt-0.5">
                                {(att.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                    </div>
                ))}

                {/* Add Attachment Card */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    style={{ boxShadow: '0px 0px 25px 0px rgba(128, 128, 128, 0.1) inset' }}
                    className="w-32 aspect-[3/4] flex flex-col items-center justify-center gap-3 bg-background border border-border rounded-xl hover:bg-accent hover:text-accent-foreground transition-all group ml-10"
                >
                    <div className="w-8 h-8 flex items-center justify-center">
                        {isUploading ? (
                            <div className="w-5 h-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Plus className="w-6 h-6 text-muted-foreground group-hover:text-foreground" strokeWidth={1.5} />
                        )}
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">Add Attachment</span>
                </button>
            </div>
        </div>
    );
}
