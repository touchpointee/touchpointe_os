import { useState, useEffect } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { useTeamStore } from '@/stores/teamStore';
import { Plus, Lock, Users, ChevronDown } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';

export function ChatSidebar() {
    const {
        channels, dmGroups, members, messages,
        activeChannelId, activeDmGroupId,
        setActiveChannel, setActiveDmInfo,
        createChannel, createDmGroup,
        fetchChannels, fetchDmGroups, fetchWorkspaceMembers,
        fetchMessages
    } = useChatStore();

    const { onlineUserIds } = useTeamStore();

    const { activeWorkspace } = useWorkspaces();
    const currentUser = getCurrentUser();

    const [isCreatingChannel, setIsCreatingChannel] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);

    const [isCreatingDm, setIsCreatingDm] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState('');

    const [isChannelsOpen, setIsChannelsOpen] = useState(true);
    const [isDmsOpen, setIsDmsOpen] = useState(true);

    useEffect(() => {
        if (activeWorkspace) {
            fetchChannels(activeWorkspace.id);
            fetchDmGroups(activeWorkspace.id);
            fetchWorkspaceMembers(activeWorkspace.id);
        }
    }, [activeWorkspace]);

    // Fetch messages for DMs to show previews
    useEffect(() => {
        if (activeWorkspace && dmGroups.length > 0) {
            dmGroups.forEach(group => {
                // Check if we have messages for this group. If not, fetch them to show preview.
                const existingMessages = useChatStore.getState().messages[group.id];
                if (!existingMessages || existingMessages.length === 0) {
                    // We can silently fetch the latest messages
                    fetchMessages(activeWorkspace.id, group.id, true);
                }
            });
        }
    }, [activeWorkspace, dmGroups]);

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


    const isGroupOnline = (group: any) => {
        const otherMembers = group.members.filter((m: any) => m.id !== currentUser?.id);
        if (otherMembers.length === 0) return false;
        // If any member is online? Or all? Usually any.
        return otherMembers.some((m: any) => onlineUserIds.includes(m.id));
    };

    return (
        <div className="w-64 border-r border-border h-full flex flex-col bg-card/30">
            {/* Channels */}
            <div className="px-4 pt-4 pb-1">
                <div className="flex items-center justify-between mb-2 group">
                    <button
                        onClick={() => setIsChannelsOpen(!isChannelsOpen)}
                        className="flex items-center gap-1 text-sm font-bold text-gray-300 uppercase tracking-wider hover:text-white transition-colors"
                    >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isChannelsOpen ? '' : '-rotate-90'}`} />
                        <span>Channels</span>
                    </button>
                    <button onClick={() => setIsCreatingChannel(true)} className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {isChannelsOpen && (
                    <>
                        {isCreatingChannel && (
                            <form onSubmit={handleCreateChannel} className="mb-4 bg-background p-2 rounded border animate-in fade-in slide-in-from-top-2">
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

                        <div className="space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                            {channels.map(channel => (
                                <button
                                    key={channel.id}
                                    onClick={() => setActiveChannel(channel.id)}
                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${activeChannelId === channel.id ? 'text-white font-medium shadow-sm' : 'text-gray-400 hover:bg-accent hover:text-foreground'
                                        }`}
                                    style={activeChannelId === channel.id ? { background: 'linear-gradient(94.03deg, #925FF8 -8.9%, #4175E4 100%)' } : undefined}
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
                    </>
                )}
            </div>

            {/* Direct Messages */}
            <div className="px-4 pb-4 pt-1">
                <div className="flex items-center justify-between mb-2 group">
                    <button
                        onClick={() => setIsDmsOpen(!isDmsOpen)}
                        className="flex items-center gap-1 text-sm font-bold text-gray-300 uppercase tracking-wider hover:text-white transition-colors"
                    >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDmsOpen ? '' : '-rotate-90'}`} />
                        <span>Chats</span>
                    </button>
                    <button onClick={() => setIsCreatingDm(true)} className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {isDmsOpen && (
                    <>
                        {isCreatingDm && (
                            <form onSubmit={handleCreateDm} className="mb-4 bg-background p-2 rounded border animate-in fade-in slide-in-from-top-2">
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

                        <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200 mt-2">
                            {dmGroups.map(group => {
                                const isOnline = isGroupOnline(group);
                                // Get messages for this group to show last message
                                const groupMessages = messages[group.id] || [];
                                const lastMessage = groupMessages.length > 0 ? groupMessages[groupMessages.length - 1] : null; // Messages are appended, so last is latest

                                // Format time if exists
                                let timeDisplay = '';
                                if (lastMessage) {
                                    const date = new Date(lastMessage.createdAt);
                                    const now = new Date();
                                    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                                    const isYesterday = new Date(now.setDate(now.getDate() - 1)).getDate() === date.getDate();

                                    if (isToday) {
                                        timeDisplay = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    } else if (isYesterday) {
                                        timeDisplay = 'Yesterday';
                                    } else {
                                        timeDisplay = date.toLocaleDateString();
                                    }
                                }

                                const otherMembers = group.members.filter((m: any) => m.id !== currentUser?.id);
                                const displayName = otherMembers.length > 0 ? otherMembers.map((m: any) => m.fullName).join(', ') : "Me";
                                const avatarUrl = otherMembers.length > 0 ? otherMembers[0].avatarUrl : undefined;

                                return (
                                    <button
                                        key={group.id}
                                        onClick={() => setActiveDmInfo(group.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeDmGroupId === group.id
                                            ? 'text-white shadow-md border border-transparent'
                                            : 'hover:bg-accent/40 border border-transparent text-muted-foreground hover:text-foreground'
                                            }`}
                                        style={activeDmGroupId === group.id ? { background: 'linear-gradient(94.03deg, #925FF8 -8.9%, #4175E4 100%)' } : undefined}
                                    >
                                        {/* Avatar */}
                                        <div className="relative shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-white overflow-hidden text-sm font-medium">
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    group.members.length > 2 ? <Users className="w-5 h-5 opacity-70" /> : <span>{displayName.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            {isOnline && (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1c1c1c]"></span>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 flex flex-col items-start gap-0.5">
                                            <div className="flex items-center justify-between w-full">
                                                <span className={`truncate text-sm ${activeDmGroupId === group.id ? 'font-semibold text-white' : 'font-medium text-gray-200'}`}>
                                                    {displayName}
                                                </span>
                                                {timeDisplay && (
                                                    <span className={`text-[10px] shrink-0 ${activeDmGroupId === group.id ? 'text-gray-300' : 'text-gray-500'}`}>
                                                        {timeDisplay}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`truncate text-xs w-full text-left ${activeDmGroupId === group.id ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {lastMessage ? (
                                                    <>
                                                        {lastMessage.senderId === currentUser?.id && <span className="mr-1">✓</span>}
                                                        {lastMessage.content}
                                                    </>
                                                ) : (
                                                    <span className="italic opacity-70">No messages yet</span>
                                                )}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
