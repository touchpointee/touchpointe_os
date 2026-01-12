import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useWorkspaces } from '@/stores/workspaceStore';
import { X, Loader2 } from 'lucide-react';

interface CreateWorkspaceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateWorkspaceModal({ isOpen, onClose }: CreateWorkspaceModalProps) {
    const [name, setName] = useState('');
    const { createWorkspace, isLoading } = useWorkspaces();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const workspace = await createWorkspace(name);
        if (workspace) {
            setName('');
            onClose();
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in p-4">
            <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h2 className="text-lg font-semibold">Create Workspace</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">Workspace Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Acme Corp"
                            className="w-full px-3 py-2 bg-muted/50 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || isLoading}
                            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Create Workspace
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
