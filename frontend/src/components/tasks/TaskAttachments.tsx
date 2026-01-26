import React, { useRef, useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import type { TaskAttachmentDto } from '@/types/task';
import { Paperclip, X, File } from 'lucide-react';

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

    const isImage = (contentType: string) => contentType.startsWith('image/');

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Attachments
                </h3>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                >
                    {isUploading ? 'Uploading...' : 'Add Attachment'}
                </button>
                <input
                    id="task-file-input"
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            {attachments.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic">No attachments</div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-3">
                    {attachments.map((att) => (
                        <div key={att.id} className="group relative border border-gray-200 dark:border-gray-700 rounded-lg p-2 flex flex-col items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <button
                                onClick={() => handleDelete(att.id)}
                                className="absolute top-1 right-1 p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600"
                                title="Delete"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="w-full h-24 mb-2 flex items-center justify-center bg-gray-100 dark:bg-gray-900 rounded overflow-hidden">
                                {isImage(att.contentType) ? (
                                    <img src={att.url} alt={att.fileName} className="w-full h-full object-cover" />
                                ) : (
                                    <File className="w-10 h-10 text-gray-400" />
                                )}
                            </a>

                            <div className="w-full text-center">
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate w-full" title={att.fileName}>
                                    {att.fileName}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                    {(att.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
