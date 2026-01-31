import { useState, useEffect } from 'react';
import { X, MessageSquare, Plus, Hash } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useUserStore } from '@/stores/userStore';
import { useNavigate } from 'react-router-dom';

// Compatible with both TaskDto and MyTask/MyTaskDto as long as they have these fields
interface ShareableTask {
    id?: string;
    taskId?: string; // MyTask uses taskId
    title: string;
    status: string;
    assigneeName?: string | null;
    listName?: string;
    workspaceId: string;
}

interface ShareTaskToChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: ShareableTask | null;
}

export function ShareTaskToChatModal({ isOpen, onClose, task }: ShareTaskToChatModalProps) {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const { channels, fetchChannels, postMessage, createChannel, setActiveChannel } = useChatStore();

    const [selectedChannelId, setSelectedChannelId] = useState<string>('');
    const [message, setMessage] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Initial setup when modal opens
    useEffect(() => {
        if (isOpen && task) {
            fetchChannels(task.workspaceId);

            // Default message
            const taskId = task.id || task.taskId || '';
            const defaultMsg = `Shared Task: **${task.title}**\nID: ${taskId.substring(0, 8)}\nStatus: ${task.status}\nAssignee: ${task.assigneeName || 'Unassigned'}`;
            // We only pre-fill if empty or resetting? Better to keep it clean or just append?
            // User requirement: "Open a modal with tsk detail and option to add more texts"
            // So we can keep the standard text and let them add to it, or just partial?
            // Let's pre-fill the standard text for now as the user asked for "task detail... and add more texts"
            setMessage(defaultMsg);

            // Auto-select channel logic will run after channels fetch, doing it in separate effect or here if channels already loaded.
            // But fetch is async.
        }
    }, [isOpen, task, fetchChannels]);

    // Auto-select channel when channels load
    useEffect(() => {
        if (isOpen && task && channels.length > 0 && !selectedChannelId && !isCreating) {
            const listName = task.listName;
            if (listName) {
                const match = channels.find(c => c.name.toLowerCase() === listName.toLowerCase());
                if (match) {
                    setSelectedChannelId(match.id);
                }
            }
        }
    }, [isOpen, task, channels, selectedChannelId, isCreating]);

    // Initialize new channel name
    useEffect(() => {
        if (isCreating && task?.listName && !newChannelName) {
            setNewChannelName(task.listName);
        }
    }, [isCreating, task]);

    if (!isOpen || !task) return null;

    const handleSend = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            let targetId = selectedChannelId;

            if (isCreating) {
                if (!newChannelName.trim()) return;
                // Create Channel
                // We need to implement createChannel in a way that gives us the ID.
                // Looking at chatStore, createChannel pushes to state.channels
                // We probably need to fetch channels again or rely on store update?
                // The store method returns boolean... wait, let me check the store definition I saw earlier.
                // "createChannel: async ... returns boolean". And it sets `activeChannelId`.
                // Perfect.
                const success = await createChannel(task.workspaceId, newChannelName, false, `Channel for ${task.listName}`);
                if (success) {
                    // Logic to find the new channel ID? 
                    // Store sets activeChannelId to new channel.
                    targetId = useChatStore.getState().activeChannelId!;
                } else {
                    alert("Failed to create channel");
                    setIsLoading(false);
                    return;
                }
            }

            if (!targetId) {
                alert("Please select or create a channel");
                setIsLoading(false);
                return;
            }

            setActiveChannel(targetId);
            await postMessage(task.workspaceId, message, user.id, user.fullName || 'User');

            onClose();
            navigate(`/chat/channel/${targetId}`);
        } catch (e) {
            console.error("Failed to share task", e);
            alert("Failed to share task");
        } finally {
            setIsLoading(false);
        }
    };

    const taskId = task.id || task.taskId || '';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-background rounded-lg border shadow-xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        Share Task to Chat
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto">

                    {/* Task Preview Card */}
                    <div className="bg-muted/50 p-3 rounded-md border text-sm">
                        <div className="font-semibold">{task.title}</div>
                        <div className="text-muted-foreground flex gap-3 mt-1 text-xs">
                            <span>ID: {taskId.substring(0, 8)}</span>
                            <span>Status: {task.status}</span>
                        </div>
                    </div>

                    {/* Channel Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Destination Channel</label>

                        {!isCreating ? (
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary text-foreground"
                                    value={selectedChannelId}
                                    onChange={(e) => setSelectedChannelId(e.target.value)}
                                >
                                    <option value="" disabled className="bg-popover text-popover-foreground">Select a channel...</option>
                                    {channels.map(c => (
                                        <option key={c.id} value={c.id} className="bg-popover text-popover-foreground"># {c.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="h-10 px-3 border border-dashed border-input rounded-md hover:bg-accent text-sm flex items-center gap-1 shrink-0"
                                    title="Create New Channel"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="sr-only sm:not-sr-only">New</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2 animate-in slide-in-from-left duration-200">
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <input
                                            placeholder="Channel Name"
                                            value={newChannelName}
                                            onChange={e => setNewChannelName(e.target.value.replace(/\s+/g, '-').toLowerCase())}
                                            className="flex h-10 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                    <button
                                        onClick={() => setIsCreating(false)}
                                        className="h-10 px-3 text-muted-foreground hover:text-foreground text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                <p className="text-[10px] text-muted-foreground">Channel will be created in this workspace.</p>
                            </div>
                        )}
                    </div>

                    {/* Message Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Message</label>
                        <textarea
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Add a message..."
                        />
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-muted/20 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="h-9 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isLoading || (!selectedChannelId && !isCreating)}
                        className="h-9 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {isLoading ? 'Sending...' : 'Send Message'}
                    </button>
                </div>

            </div>
        </div>
    );
}
