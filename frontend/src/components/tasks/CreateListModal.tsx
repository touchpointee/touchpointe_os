import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useHierarchyStore } from '@/stores/hierarchyStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { useChatStore } from '@/stores/chatStore';
import { X, Loader2, LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateListModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultSpaceId?: string;
    defaultFolderId?: string;
}

export function CreateListModal({ isOpen, onClose, defaultSpaceId, defaultFolderId }: CreateListModalProps) {
    const { activeWorkspace } = useWorkspaces();
    const { spaces, createList } = useHierarchyStore();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedSpaceId, setSelectedSpaceId] = useState(defaultSpaceId || '');
    const [isPrivate, setIsPrivate] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setDescription('');
            setIsPrivate(false);
            if (defaultSpaceId) setSelectedSpaceId(defaultSpaceId);
            // Default to first space if none selected
            else if (spaces.length > 0 && !selectedSpaceId) {
                setSelectedSpaceId(spaces[0].id);
            }
        }
    }, [isOpen, defaultSpaceId, spaces]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !selectedSpaceId || !activeWorkspace) return;

        setIsSubmitting(true);
        try {
            await createList(activeWorkspace.id, {
                spaceId: selectedSpaceId,
                folderId: defaultFolderId, // Use the folder passed in prop
                name: name.trim()
                // Description and Privacy are not yet supported by API, but UI is compliant
            });

            // Automatically create a channel for this project
            const { createChannel } = useChatStore.getState();
            await createChannel(
                activeWorkspace.id,
                name.trim(), // Channel Name matches Project Name
                isPrivate, // Match privacy setting
                `Channel for project: ${name.trim()}` // Auto-generated description
            );

            onClose();
        } catch (error) {
            console.error("Failed to create list", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in p-4">
            <div className="bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl w-full max-w-[500px] overflow-hidden animate-in zoom-in-95 text-white">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <h2 className="text-lg font-medium">Create List</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-gray-300">Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Project, List of items, Campaign"
                            className="w-full px-3 py-2.5 bg-[#2a2b2d] border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm placeholder:text-gray-500 transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label htmlFor="description" className="text-sm font-medium text-gray-300">Description</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Tell us a bit about your List (optional)"
                            className="w-full px-3 py-2.5 bg-[#2a2b2d] border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm placeholder:text-gray-500 min-h-[80px] resize-none transition-all"
                        />
                    </div>

                    {/* Space Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Space (location)</label>
                        <div className="relative">
                            <select
                                value={selectedSpaceId}
                                onChange={(e) => setSelectedSpaceId(e.target.value)}
                                className="w-full appearance-none px-3 py-2.5 bg-[#2a2b2d] border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm text-white cursor-pointer"
                            >
                                {spaces.map(space => (
                                    <option key={space.id} value={space.id} className="bg-[#2a2b2d]">
                                        {space.name}
                                    </option>
                                ))}
                            </select>
                            {/* Custom Arrow */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Make Private */}
                    <div className="flex items-center justify-between pt-1">
                        <div>
                            <div className="text-sm font-medium text-gray-300">Make private</div>
                            <div className="text-xs text-gray-500 mt-0.5">Only you and invited members have access</div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPrivate(!isPrivate)}
                            className={cn(
                                "w-11 h-6 rounded-full transition-colors relative",
                                isPrivate ? "bg-blue-600" : "bg-gray-600"
                            )}
                        >
                            <div className={cn(
                                "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform",
                                isPrivate ? "translate-x-5" : "translate-x-0"
                            )} />
                        </button>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-2">
                        <button
                            type="button"
                            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                        >
                            <LayoutTemplate className="w-4 h-4" />
                            Use Templates
                        </button>

                        <button
                            type="submit"
                            disabled={!name.trim() || isSubmitting || !selectedSpaceId}
                            className="px-6 py-2 bg-white text-black font-medium text-sm rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
