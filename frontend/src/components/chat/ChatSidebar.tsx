import { useState, useEffect, useMemo } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { useTeamStore } from '@/stores/teamStore';
import { useUserStore } from '@/stores/userStore';
import { Plus, Lock, ChevronDown, Search, PenBox, Hash, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import * as Popover from '@radix-ui/react-popover';

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
    const { user: currentUser } = useUserStore();

    const [searchQuery, setSearchQuery] = useState('');

    // UI States
    const [isCreatingChannel, setIsCreatingChannel] = useState(false);
    const [newChannelName, setNewChannelName] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);

    const [isCreatingDm, setIsCreatingDm] = useState(false);
    const [selectedMemberId, setSelectedMemberId] = useState('');

    const [isChannelsOpen, setIsChannelsOpen] = useState(true);
    const [isDmsOpen, setIsDmsOpen] = useState(true);

    // Edit/Delete States
    const [editingChannel, setEditingChannel] = useState<any | null>(null);
    const [deletingChannelId, setDeletingChannelId] = useState<string | null>(null);

    // Edit Form State
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editIsPrivate, setEditIsPrivate] = useState(false);

    // Actions
    const { updateChannel, deleteChannel } = useChatStore();

    const openEditModal = (channel: any) => {
        setEditingChannel(channel);
        setEditName(channel.name);
        setEditDescription(channel.description || '');
        setEditIsPrivate(channel.isPrivate);
    };

    const handleUpdateChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeWorkspace || !editingChannel || !editName.trim()) return;

        await updateChannel(activeWorkspace.id, editingChannel.id, editName, editIsPrivate, editDescription);
        setEditingChannel(null);
    };

    const handleDeleteChannel = async (id: string) => {
        if (!activeWorkspace) return;
        await deleteChannel(activeWorkspace.id, id);
        setDeletingChannelId(null);
    };

    // Helper Component for Menu
    const EditChannelMenu = ({ channel }: { channel: any }) => {
        const [isOpen, setIsOpen] = useState(false);
        return (
            <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
                <Popover.Trigger asChild>
                    <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="p-1 text-[#aebac1] hover:text-[#e9edef] hover:bg-[#374045] rounded transition-all"
                    >
                        <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content className="w-32 bg-[#202c33] rounded-md shadow-lg border border-[#2f3b43] p-1 z-50 animate-in zoom-in-95 duration-200" side="right" align="start">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); openEditModal(channel); }}
                            className="w-full text-left px-2 py-1.5 text-xs text-[#e9edef] hover:bg-[#374045] rounded flex items-center gap-2"
                        >
                            <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); setDeletingChannelId(channel.id); }}
                            className="w-full text-left px-2 py-1.5 text-xs text-red-400 hover:bg-[#374045] rounded flex items-center gap-2"
                        >
                            <Trash2 className="w-3 h-3" /> Delete
                        </button>
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        );
    };

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
                const existingMessages = useChatStore.getState().messages[group.id];
                if (!existingMessages || existingMessages.length === 0) {
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

        await createDmGroup(activeWorkspace.id, [selectedMemberId]);
        setIsCreatingDm(false);
        setSelectedMemberId('');
    };

    const isGroupOnline = (group: any) => {
        const otherMembers = group.members.filter((m: any) => m.id !== currentUser?.id);
        if (otherMembers.length === 0) return false;
        return otherMembers.some((m: any) => onlineUserIds.includes(m.id || m.Id));
    };

    // Filter Logic
    const filteredChannels = useMemo(() => {
        return channels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [channels, searchQuery]);

    const filteredDmGroups = useMemo(() => {
        return dmGroups.filter(g => {
            const otherMembers = g.members.filter(m => m.id !== currentUser?.id);
            const displayName = otherMembers.map(m => m.fullName).join(', ');
            return displayName.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [dmGroups, searchQuery, currentUser]);


    return (
        <div className="w-80 border-r border-[#2f3b43] h-full flex flex-col bg-[#111b21] text-[#e9edef] shrink-0 transform transition-all duration-300 overflow-x-hidden">
            {/* Header */}
            <div className="h-[60px] px-4 flex items-center justify-between bg-[#202c33] shrink-0 border-b border-[#2f3b43]">
                <div className="flex items-center gap-3">
                    {/* User Avatar */}
                    <div className="w-8 h-8 rounded-full bg-[#6a7175] overflow-hidden flex items-center justify-center cursor-pointer border border-[#8696a0]/20">
                        {currentUser?.avatarUrl ? (
                            <img src={currentUser.avatarUrl} alt="Me" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-sm font-medium text-[#e9edef]">{currentUser?.fullName?.charAt(0) || 'U'}</span>
                        )}
                    </div>
                    <h1 className="text-lg font-bold tracking-tight text-[#e9edef]">Chats</h1>
                </div>

                <div className="flex items-center gap-2 text-[#aebac1]">
                    <button
                        onClick={() => setIsCreatingDm(true)}
                        className="p-2 hover:bg-[#374045] rounded-full transition-colors"
                        title="New Chat"
                    >
                        <PenBox className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-3 py-2 shrink-0 border-b border-[#2f3b43] bg-[#111b21]">
                <div className="bg-[#202c33] rounded-lg flex items-center px-3 h-8">
                    <button className="mr-3 text-[#aebac1] hover:text-[#e9edef]">
                        {searchQuery ? (
                            <span className="text-green-500 font-bold cursor-pointer" onClick={() => setSearchQuery('')}>×</span>
                        ) : (
                            <Search className="w-4 h-4" />
                        )}
                    </button>
                    <input
                        type="text"
                        placeholder="Search or start new chat"
                        className="bg-transparent border-none text-sm text-[#e9edef] placeholder-[#8696a0] w-full focus:outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Scrollable List */}
            <div
                className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#374045] [&::-webkit-scrollbar-track]:bg-transparent"
                style={{ scrollbarWidth: 'thin', overflowX: 'hidden' }}
            >

                {/* Create DM Form (Inline) - Cleaned */}
                {isCreatingDm && (
                    <div className="p-3 bg-[#202c33] border-b border-[#2f3b43] animate-in slide-in-from-top-2">
                        <form onSubmit={handleCreateDm}>
                            <h3 className="text-xs font-bold uppercase text-[#00a884] mb-2 tracking-wider">New Conversation</h3>
                            <select
                                className="w-full text-sm bg-[#111b21] text-[#e9edef] border border-[#2f3b43] mb-3 p-2 rounded focus:outline-none focus:border-[#00a884]"
                                value={selectedMemberId}
                                onChange={e => setSelectedMemberId(e.target.value)}
                                autoFocus
                            >
                                <option value="">Select a contact...</option>
                                {members.filter(m => m.id !== currentUser?.id).map(m => (
                                    <option key={m.id} value={m.id}>{m.fullName}</option>
                                ))}
                            </select>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setIsCreatingDm(false)} className="px-3 py-1 text-xs font-medium text-[#e9edef] hover:bg-[#374045] rounded transition-colors">Cancel</button>
                                <button type="submit" className="px-3 py-1 text-xs font-medium bg-[#00a884] text-[#111b21] rounded hover:bg-[#00a884]/90 transition-colors">Start Chat</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Create Channel Form (Inline) - Cleaned */}
                {isCreatingChannel && (
                    <div className="p-3 bg-[#202c33] border-b border-[#2f3b43] animate-in slide-in-from-top-2">
                        <form onSubmit={handleCreateChannel}>
                            <h3 className="text-xs font-bold uppercase text-[#00a884] mb-2 tracking-wider">New Channel</h3>
                            <input
                                className="w-full text-sm bg-[#111b21] text-[#e9edef] border border-[#2f3b43] mb-2 p-2 rounded focus:outline-none focus:border-[#00a884]"
                                placeholder="Channel name"
                                value={newChannelName}
                                onChange={e => setNewChannelName(e.target.value)}
                                autoFocus
                            />
                            <div className="flex items-center gap-2 mb-3">
                                <input
                                    type="checkbox"
                                    checked={isPrivate}
                                    onChange={e => setIsPrivate(e.target.checked)}
                                    id="priv"
                                    className="accent-[#00a884]"
                                />
                                <label htmlFor="priv" className="text-xs text-[#8696a0] select-none cursor-pointer">Private Channel</label>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setIsCreatingChannel(false)} className="px-3 py-1 text-xs font-medium text-[#e9edef] hover:bg-[#374045] rounded transition-colors">Cancel</button>
                                <button type="submit" className="px-3 py-1 text-xs font-medium bg-[#00a884] text-[#111b21] rounded hover:bg-[#00a884]/90 transition-colors">Create</button>
                            </div>
                        </form>
                    </div>
                )}


                {/* Channels Section */}
                <div className="py-2">
                    <div className="flex items-center justify-between px-4 py-1 hover:bg-[#202c33] cursor-pointer group mb-1" onClick={() => setIsChannelsOpen(!isChannelsOpen)}>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-[#8696a0] group-hover:text-[#00a884] uppercase tracking-wider transition-colors">Channels</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsCreatingChannel(true); }}
                                className="text-[#aebac1] hover:text-[#e9edef] p-0.5 rounded hover:bg-[#374045]"
                                title="Create Channel"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <ChevronDown className={`w-3.5 h-3.5 text-[#aebac1] transition-transform duration-200 ${isChannelsOpen ? '' : '-rotate-90'}`} />
                        </div>
                    </div>

                    {isChannelsOpen && (
                        <div className="px-3 space-y-[2px]">
                            {filteredChannels.map(channel => (
                                <div key={channel.id} className="relative group/channel">
                                    <button
                                        onClick={() => setActiveChannel(channel.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-[6px] transition-all relative overflow-hidden ${activeChannelId === channel.id
                                            ? 'bg-[#202c33] text-[#e9edef] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-[3px] before:bg-[#00a884] before:rounded-r-full'
                                            : 'text-[#e9edef] hover:bg-[#202c33]'
                                            }`}
                                    >
                                        <div className={`shrink-0 ${activeChannelId === channel.id ? 'text-[#00a884]' : 'text-[#8696a0] group-hover/channel:text-[#aebac1]'}`}>
                                            {channel.isPrivate ? <Lock className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                                        </div>

                                        <span className="truncate text-[15px] font-normal flex-1 text-left leading-5">{channel.name}</span>
                                    </button>

                                    {/* Action Menu Trigger (Only distinct from main click if positioned carefully or using context menu. For simplicity, adding a small trigger on hover) */}
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/channel:opacity-100 transition-opacity flex bg-[#202c33] rounded shadow-sm">
                                        <EditChannelMenu channel={channel} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Edit Channel Modal */}
                {editingChannel && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-[#202c33] rounded-lg shadow-xl w-full max-w-sm border border-[#2f3b43] animate-in zoom-in-95 duration-200">
                            <form onSubmit={handleUpdateChannel} className="p-4">
                                <h3 className="text-sm font-bold uppercase text-[#00a884] mb-4 tracking-wider">Edit Channel</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-[#8696a0] mb-1 block">Name</label>
                                        <input
                                            className="w-full text-sm bg-[#111b21] text-[#e9edef] border border-[#2f3b43] p-2 rounded focus:outline-none focus:border-[#00a884]"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-[#8696a0] mb-1 block">Description</label>
                                        <input
                                            className="w-full text-sm bg-[#111b21] text-[#e9edef] border border-[#2f3b43] p-2 rounded focus:outline-none focus:border-[#00a884]"
                                            value={editDescription}
                                            onChange={e => setEditDescription(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={editIsPrivate}
                                            onChange={e => setEditIsPrivate(e.target.checked)}
                                            id="editPriv"
                                            className="accent-[#00a884]"
                                        />
                                        <label htmlFor="editPriv" className="text-xs text-[#8696a0] select-none cursor-pointer">Private Channel</label>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                    <button type="button" onClick={() => setEditingChannel(null)} className="px-3 py-1.5 text-xs font-medium text-[#e9edef] hover:bg-[#374045] rounded transition-colors">Cancel</button>
                                    <button type="submit" className="px-3 py-1.5 text-xs font-medium bg-[#00a884] text-[#111b21] rounded hover:bg-[#00a884]/90 transition-colors">Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Channel Alert */}
                {deletingChannelId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-[#202c33] rounded-lg shadow-xl w-full max-w-sm border border-[#2f3b43] p-4 text-center animate-in zoom-in-95 duration-200">
                            <h3 className="text-lg font-medium text-[#e9edef] mb-2">Delete Channel?</h3>
                            <p className="text-sm text-[#8696a0] mb-4">Are you sure you want to delete this channel? This action cannot be undone.</p>
                            <div className="flex justify-center gap-3">
                                <button onClick={() => setDeletingChannelId(null)} className="px-4 py-2 text-sm font-medium text-[#e9edef] hover:bg-[#374045] rounded transition-colors">Cancel</button>
                                <button onClick={() => handleDeleteChannel(deletingChannelId)} className="px-4 py-2 text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded transition-colors">Delete</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="border-t border-[#2f3b43]/30 my-1 mx-4" />

                {/* Direct Messages Section */}
                <div className="py-2">
                    <div className="flex items-center justify-between px-4 py-1 hover:bg-[#202c33] cursor-pointer group mb-1" onClick={() => setIsDmsOpen(!isDmsOpen)}>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-[#8696a0] group-hover:text-[#00a884] uppercase tracking-wider transition-colors">Direct Messages</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsCreatingDm(true); }}
                                className="text-[#aebac1] hover:text-[#e9edef] p-0.5 rounded hover:bg-[#374045]"
                                title="New Chat"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <ChevronDown className={`w-3.5 h-3.5 text-[#aebac1] transition-transform duration-200 ${isDmsOpen ? '' : '-rotate-90'}`} />
                        </div>
                    </div>

                    {isDmsOpen && (
                        <div className="px-3">
                            {filteredDmGroups.map(group => {
                                const isOnline = isGroupOnline(group);
                                const groupMessages = messages[group.id] || [];
                                const lastMessage = groupMessages.length > 0 ? groupMessages[groupMessages.length - 1] : null;

                                let timeDisplay = '';
                                if (lastMessage) {
                                    const date = new Date(lastMessage.createdAt);
                                    if (isToday(date)) {
                                        timeDisplay = format(date, 'HH:mm');
                                    } else if (isYesterday(date)) {
                                        timeDisplay = 'Yesterday';
                                    } else {
                                        timeDisplay = format(date, 'MM/dd/yy');
                                    }
                                }

                                const otherMembers = group.members.filter((m: any) => m.id !== currentUser?.id);
                                const displayName = otherMembers.length > 0 ? otherMembers.map((m: any) => m.fullName).join(', ') : "Me";
                                const avatarUrl = otherMembers.length > 0 ? otherMembers[0].avatarUrl : undefined;

                                return (
                                    <div
                                        key={group.id}
                                        onClick={() => setActiveDmInfo(group.id)}
                                        className={`flex items-center gap-3 px-3 py-3 rounded-[6px] cursor-pointer transition-colors relative group/item border-b border-[#2f3b43]/30 last:border-0 ${activeDmGroupId === group.id
                                            ? 'bg-[#202c33]'
                                            : 'hover:bg-[#202c33]'
                                            }`}
                                    >
                                        {/* Avatar */}
                                        <div className="relative shrink-0">
                                            <div className="w-[48px] h-[48px] rounded-full bg-[#111b21] overflow-hidden flex items-center justify-center border border-[#2f3b43]/50">
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-[#6a7175] text-[#e9edef] text-lg font-medium">
                                                        {displayName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            {isOnline && (
                                                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-[3px] border-[#111b21] rounded-full"></span>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <span className={`text-[16px] truncate leading-5 ${activeDmGroupId === group.id ? 'font-medium text-[#e9edef]' : 'text-[#e9edef]'}`}>
                                                    {displayName}
                                                </span>
                                                <span className={`text-[11px] whitespace-nowrap ${activeDmGroupId === group.id ? 'text-[#00a884]' : 'text-[#8696a0]'}`}>
                                                    {timeDisplay}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {lastMessage?.senderId === currentUser?.id && (
                                                    <span className="text-[#00a884] shrink-0">
                                                        <svg viewBox="0 0 16 11" height="11" width="16" className="fill-current w-[14px] h-[9px]"><path d="M11.854.146a.5.5 0 0 0-.708 0L7 4.293 5.354 2.646a.5.5 0 0 0-.708.708l2 2a.5.5 0 0 0 .708 0l4.5-4.5a.5.5 0 0 0 0-.708zm-9.5 0a.5.5 0 0 1 .708 0L5 2.293 4.646 2.646a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 0-.708z"></path></svg>
                                                    </span>
                                                )}
                                                <p className="text-[14px] text-[#8696a0] truncate leading-5">
                                                    {lastMessage ? (
                                                        lastMessage.content ? lastMessage.content : <span className="italic flex items-center gap-1 text-[13px]"><Search className="w-3 h-3" /> Attachment</span>
                                                    ) : (
                                                        <span className="opacity-70 text-[13px]">No messages yet</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
