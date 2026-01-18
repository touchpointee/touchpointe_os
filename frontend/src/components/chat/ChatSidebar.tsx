import { useState, useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { useTeamStore } from '@/stores/teamStore';
import { Hash, Plus, Lock, User, Users } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';

export function ChatSidebar() {
    const {
        channels, dmGroups, members,
        activeChannelId, activeDmGroupId,
        setActiveChannel, setActiveDmInfo,
        createChannel, createDmGroup,
        fetchChannels, fetchDmGroups, fetchWorkspaceMembers
    } = useChatStore();

    const { onlineUserIds } = useTeamStore();

    const { activeWorkspace } = useWorkspaces();
    const currentUser = getCurrentUser();

    const [isCreatingChannel, setIsCreatingChannel] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);

    const [isCreatingDm, setIsCreatingDm] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState('');

    useEffect(() => {
        if (activeWorkspace) {
            fetchChannels(activeWorkspace.id);
            fetchDmGroups(activeWorkspace.id);
            fetchWorkspaceMembers(activeWorkspace.id);
        }
    }, [activeWorkspace]);

    const handleCreateChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeWorkspace || !newChannelName.trim()) return;

        await createChannel(activeWorkspace.id, newChannelName, isPrivate, '');
        setIsCreatingChannel(false);
        setNewChannelName('');
        setIsPrivate(false);
    };

    const handleCreateDm = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeWorkspace || !selectedMemberId) return;

        await createDmGroup(activeWorkspace.id, [selectedMemberId]); // Implicitly adds self in backend
        setIsCreatingDm(false);
        setSelectedMemberId('');
    };

    const getDmName = (group: any) => {
        const otherMembers = group.members.filter((m: any) => m.id !== currentUser?.id);
        if (otherMembers.length === 0) return "Me";
        return otherMembers.map((m: any) => m.fullName.split(' ')[0]).join(', ');
    };

    const isGroupOnline = (group: any) => {
        const otherMembers = group.members.filter((m: any) => m.id !== currentUser?.id);
        if (otherMembers.length === 0) return false;
        // If any member is online? Or all? Usually any.
        return otherMembers.some((m: any) => onlineUserIds.includes(m.id));
    };

    return (
        <div className="w-64 border-r border-border h-full flex flex-col bg-card/30">
            {/* Channels */}
            <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Channels</h3>
                    <button onClick={() => setIsCreatingChannel(true)} className="p-1 hover:bg-accent rounded">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {isCreatingChannel && (
                    <form onSubmit={handleCreateChannel} className="mb-4 bg-background p-2 rounded border">
                        <input
                            className="w-full text-sm bg-transparent border-none focus:outline-none mb-2"
                            placeholder="Channel name..."
                            value={newChannelName}
                            onChange={e => setNewChannelName(e.target.value)}
                            autoFocus
                        />
                        <div className="flex items-center gap-2 mb-2">
                            <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} id="priv" />
                            <label htmlFor="priv" className="text-xs">Private</label>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsCreatingChannel(false)} className="text-xs">Cancel</button>
                            <button type="submit" className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Create</button>
                        </div>
                    </form>
                )}

                <div className="space-y-0.5">
                    {channels.map(channel => (
                        <button
                            key={channel.id}
                            onClick={() => setActiveChannel(channel.id)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${activeChannelId === channel.id ? 'nav-item-selected' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                }`}
                        >
                            {channel.isPrivate ? (
                                <Lock className="w-3.5 h-3.5" />
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-current">
                                    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                                    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                            <span className="truncate">{channel.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Direct Messages */}
            <div className="p-4 mt-2">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Direct Messages</h3>
                    <button onClick={() => setIsCreatingDm(true)} className="p-1 hover:bg-accent rounded">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {isCreatingDm && (
                    <form onSubmit={handleCreateDm} className="mb-4 bg-background p-2 rounded border">
                        <select
                            className="w-full text-xs bg-background text-foreground border border-border mb-2 p-1 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                            value={selectedMemberId}
                            onChange={e => setSelectedMemberId(e.target.value)}
                        >
                            <option value="" className="bg-background text-foreground">Select User...</option>
                            {members.filter(m => m.id !== currentUser?.id).map(m => (
                                <option key={m.id} value={m.id} className="bg-background text-foreground">{m.fullName}</option>
                            ))}
                        </select>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsCreatingDm(false)} className="text-xs">Cancel</button>
                            <button type="submit" className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Start</button>
                        </div>
                    </form>
                )}

                <div className="space-y-0.5">
                    {dmGroups.map(group => {
                        const isOnline = isGroupOnline(group);
                        return (
                            <button
                                key={group.id}
                                onClick={() => setActiveDmInfo(group.id)}
                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${activeDmGroupId === group.id ? 'nav-item-selected' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                    }`}
                            >
                                <div className="relative">
                                    {group.members.length > 2 ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                                    {isOnline && (
                                        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border-2 border-background"></span>
                                    )}
                                </div>
                                <span className="truncate">{getDmName(group)}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
