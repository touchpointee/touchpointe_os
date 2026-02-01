import { create } from 'zustand';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export interface Channel {
    id: string;
    workspaceId: string;
    name: string;
    isPrivate: boolean;
    description: string;
    memberCount: number;
    avatarUrl?: string;
}

export interface DmGroup {
    id: string;
    workspaceId: string;
    members: {
        id: string;
        fullName: string;
        email: string;
        avatarUrl?: string;
    }[];
}

export interface Message {
    id: string;
    workspaceId: string;
    channelId?: string;
    directMessageGroupId?: string;
    senderId: string;
    senderName: string;
    senderAvatarUrl?: string;
    content: string;
    createdAt: string;
    isOptimistic?: boolean;
    replyToMessageId?: string | null;
    replyPreviewSenderName?: string | null;
    replyPreviewText?: string | null;
    reactions: {
        id: string;
        messageId: string;
        userId: string;
        userName: string;
        emoji: string;
        createdAt: string;
    }[];
    attachments?: MessageAttachment[];
}

export interface MessageAttachment {
    id: string;
    fileName: string;
    fileUrl: string;
    contentType: string;
    size: number;
}

export interface UserDto {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
}

interface ChatState {
    channels: Channel[];
    dmGroups: DmGroup[];
    members: UserDto[]; // For picker

    activeChannelId: string | null;
    activeDmGroupId: string | null;

    // Messages cache: Key = ID (Channel/DM), Value = Messages[]
    messages: Record<string, Message[]>;

    isLoading: boolean;
    error: string | null;

    // Unread counts: Key = Channel/DM ID, Value = Count
    unreadCounts: Record<string, number>;

    // Actions
    fetchChannels: (workspaceId: string) => Promise<void>;
    fetchDmGroups: (workspaceId: string) => Promise<void>;
    fetchWorkspaceMembers: (workspaceId: string) => Promise<void>;

    setActiveChannel: (channelId: string) => void;
    setActiveDmInfo: (dmId: string) => void; // Using different name to avoid conflict if I used setActiveDm

    fetchMessages: (workspaceId: string, id: string, isDm?: boolean) => Promise<void>;

    postMessage: (workspaceId: string, content: string, currentUserId: string, currentUserName: string, replyToMessageId?: string, attachments?: MessageAttachment[]) => Promise<void>;
    uploadAttachment: (workspaceId: string, file: File) => Promise<MessageAttachment | null>;
    addMessage: (message: Message) => void;

    addReaction: (workspaceId: string, messageId: string, emoji: string) => Promise<void>;
    removeReaction: (workspaceId: string, messageId: string, emoji: string) => Promise<void>;

    handleReactionAdded: (reaction: any) => void;
    handleReactionRemoved: (messageId: string, userId: string, emoji: string) => void;

    createChannel: (workspaceId: string, name: string, isPrivate: boolean, description: string, avatarFile?: File | null) => Promise<boolean>;
    updateChannel: (workspaceId: string, channelId: string, name: string, isPrivate: boolean, description: string, avatarFile?: File | null) => Promise<boolean>;
    deleteChannel: (workspaceId: string, channelId: string) => Promise<boolean>;
    createDmGroup: (workspaceId: string, userIds: string[]) => Promise<string | null>;
    reset: () => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
    channels: [],
    dmGroups: [],
    members: [],
    activeChannelId: null,
    activeDmGroupId: null,
    messages: {},
    unreadCounts: {},
    isLoading: false,
    error: null,

    reset: () => set({
        channels: [],
        dmGroups: [],
        members: [],
        activeChannelId: null,
        activeDmGroupId: null,
        messages: {},
        unreadCounts: {},
        isLoading: false,
        error: null
    }),

    fetchChannels: async (workspaceId) => {
        set({ isLoading: true, error: null });
        try {
            const channels = await apiGet<Channel[]>(`/workspaces/${workspaceId}/chat/channels`);
            const normalized = channels.map(c => ({
                ...c,
                avatarUrl: c.avatarUrl || (c as any).AvatarUrl
            }));
            set({ channels: normalized, isLoading: false });
        } catch (e: any) {
            set({ isLoading: false, error: e.message });
        }
    },

    fetchDmGroups: async (workspaceId) => {
        try {
            const dmGroups = await apiGet<DmGroup[]>(`/workspaces/${workspaceId}/chat/dm`);
            const normalized = dmGroups.map(g => ({
                ...g,
                members: g.members.map(m => ({
                    ...m,
                    avatarUrl: m.avatarUrl || (m as any).AvatarUrl
                }))
            }));
            set({ dmGroups: normalized });
        } catch (e: any) {
            console.error("Failed to fetch DMs", e);
        }
    },

    fetchWorkspaceMembers: async (workspaceId) => {
        try {
            const members = await apiGet<any[]>(`/workspaces/${workspaceId}/chat/users`);
            const normalized = members.map(m => ({
                ...m,
                avatarUrl: m.avatarUrl || m.AvatarUrl
            }));
            set({ members: normalized });
        } catch (e: any) {
            console.error("Failed to fetch members", e);
        }
    },

    setActiveChannel: (channelId) => {
        set(state => ({
            activeChannelId: channelId,
            activeDmGroupId: null,
            unreadCounts: {
                ...state.unreadCounts,
                [channelId]: 0
            }
        }));
    },

    setActiveDmInfo: (dmId) => {
        set(state => ({
            activeDmGroupId: dmId,
            activeChannelId: null,
            unreadCounts: {
                ...state.unreadCounts,
                [dmId]: 0
            }
        }));
    },

    fetchMessages: async (workspaceId, id, isDm = false) => {
        // Don't wipe existing messages to avoid flicker, just append/replace
        try {
            const endpoint = isDm
                ? `/workspaces/${workspaceId}/chat/dm/${id}/messages`
                : `/workspaces/${workspaceId}/chat/channels/${id}/messages`;

            const newMessages = await apiGet<Message[]>(endpoint);

            set(state => ({
                messages: {
                    ...state.messages,
                    [id]: newMessages
                }
            }));
        } catch (e: any) {
            console.error("Failed to fetch messages", e);
        }
    },

    postMessage: async (workspaceId, content, currentUserId, currentUserName, replyToMessageId, attachments) => {
        const { activeChannelId, activeDmGroupId } = get();
        const targetId = activeChannelId || activeDmGroupId;
        if (!targetId) return;

        const isDm = !!activeDmGroupId;

        // Optimistic Update
        const optimisticId = `opt-${Date.now()}`;
        const optimisticMessage: Message = {
            id: optimisticId,
            workspaceId,
            channelId: activeChannelId || undefined,
            directMessageGroupId: activeDmGroupId || undefined,
            senderId: currentUserId,
            senderName: currentUserName,
            content,
            createdAt: new Date().toISOString(),
            isOptimistic: true,
            replyToMessageId: replyToMessageId || undefined,
            // We'll trust backend to resolve name/text. For optimistic UI, we could look it up locally if we wanted.
            reactions: [],
            attachments: attachments || []
        };

        set(state => ({
            messages: {
                ...state.messages,
                [targetId]: [...(state.messages[targetId] || []), optimisticMessage]
            }
        }));

        try {
            const endpoint = isDm
                ? `/workspaces/${workspaceId}/chat/dm/${targetId}/messages`
                : `/workspaces/${workspaceId}/chat/channels/${targetId}/messages`;

            const realMessage = await apiPost<Message>(endpoint, { content, replyToMessageId, attachments });

            // Replace optimistic
            set(state => {
                const list = state.messages[targetId] || [];
                return {
                    messages: {
                        ...state.messages,
                        [targetId]: list.map(m => m.id === optimisticId ? realMessage : m)
                    }
                };
            });
        } catch (e: any) {
            // Revert on failure
            set(state => ({
                messages: {
                    ...state.messages,
                    [targetId]: (state.messages[targetId] || []).filter(m => m.id !== optimisticId)
                },
                error: "Failed to send message"
            }));
        }
    },

    addMessage: (message: Message) => {
        // Normalize message keys to handle PascalCase from SignalR
        const m = message as any;
        const normalizedMessage: Message = {
            id: m.id || m.Id,
            workspaceId: m.workspaceId || m.WorkspaceId,
            channelId: m.channelId || m.ChannelId,
            directMessageGroupId: m.directMessageGroupId || m.DirectMessageGroupId,
            senderId: m.senderId || m.SenderId,
            senderName: m.senderName || m.SenderName,
            senderAvatarUrl: m.senderAvatarUrl || m.SenderAvatarUrl,
            content: m.content || m.Content,
            createdAt: m.createdAt || m.CreatedAt,
            isOptimistic: m.isOptimistic,
            replyToMessageId: m.replyToMessageId || m.ReplyToMessageId,
            replyPreviewSenderName: m.replyPreviewSenderName || m.ReplyPreviewSenderName,
            replyPreviewText: m.replyPreviewText || m.ReplyPreviewText,
            reactions: m.reactions || m.Reactions || [],
            attachments: m.attachments || m.Attachments || []
        };

        const targetId = normalizedMessage.channelId || normalizedMessage.directMessageGroupId;
        if (!targetId) return;

        set(state => {
            const currentMessages = state.messages[targetId] || [];

            // 1. Check if we already have this exact message ID (Dedupe)
            if (currentMessages.some(m => m.id === normalizedMessage.id)) return state;

            // 2. Check if we have an OPTIMISTIC message that matches this one
            const optimisticMatchIndex = currentMessages.findIndex(m =>
                m.isOptimistic &&
                m.senderId === normalizedMessage.senderId &&
                m.content === normalizedMessage.content
            );

            if (optimisticMatchIndex !== -1) {
                // Replace optimistic with real
                const updated = [...currentMessages];
                updated[optimisticMatchIndex] = normalizedMessage;
                return {
                    messages: {
                        ...state.messages,
                        [targetId]: updated
                    }
                };
            }

            // 3. Otherwise, just append
            const isActive = targetId === state.activeChannelId || targetId === state.activeDmGroupId;

            // Check if we know this conversation
            const knownChannel = state.channels.find(c => c.id === targetId);
            const knownDm = state.dmGroups.find(d => d.id === targetId);

            if (!knownChannel && !knownDm) {
                // Unknown conversation - trigger refresh to show in sidebar
                // We determine type based on message properties or just fetch both to be safe
                const workspaceId = normalizedMessage.workspaceId;
                if (workspaceId) {
                    // Fetch in background
                    if (normalizedMessage.channelId) {
                        get().fetchChannels(workspaceId);
                    } else if (normalizedMessage.directMessageGroupId) {
                        get().fetchDmGroups(workspaceId);
                    }
                }
            }

            return {
                messages: {
                    ...state.messages,
                    [targetId]: [...currentMessages, normalizedMessage]
                },
                unreadCounts: !isActive ? {
                    ...state.unreadCounts,
                    [targetId]: (state.unreadCounts[targetId] || 0) + 1
                } : state.unreadCounts
            };
        });
    },

    createChannel: async (workspaceId, name, isPrivate, description, avatarFile?: File | null) => {
        set({ isLoading: true, error: null });
        try {
            let avatarUrl: string | undefined;
            if (avatarFile) {
                const attachment = await get().uploadAttachment(workspaceId, avatarFile);
                if (attachment) avatarUrl = attachment.fileUrl;
            }

            const newChannelRes = await apiPost<Channel>(`/workspaces/${workspaceId}/chat/channels`, {
                name,
                isPrivate,
                description,
                avatarUrl
            });
            const newChannel = {
                ...newChannelRes,
                avatarUrl: newChannelRes.avatarUrl || (newChannelRes as any).AvatarUrl
            };

            set(state => ({
                channels: [...state.channels, newChannel],
                activeChannelId: newChannel.id,
                activeDmGroupId: null,
                isLoading: false
            }));
            return true;
        } catch (e: any) {
            set({ isLoading: false, error: e.message });
            return false;
        }
    },

    updateChannel: async (workspaceId, channelId, name, isPrivate, description, avatarFile?: File | null) => {
        try {
            let avatarUrl: string | undefined;

            if (avatarFile) {
                // Reuse uploadAttachment logic but maybe we need a specific endpoint for channel avatars or just use general attachment?
                // For simplicity/speed, I'll use the existing uploadAttachment and use the fileUrl.
                // NOTE: Ideally backend has specific upload for channel avatar or we update channel with the URL.
                // We just need workspaceId.
                const attachment = await get().uploadAttachment(workspaceId, avatarFile);
                if (attachment) {
                    avatarUrl = attachment.fileUrl;
                }
            }

            const payload: any = { name, isPrivate, description };
            if (avatarUrl) payload.avatarUrl = avatarUrl;

            const updatedRes = await apiPut<Channel>(`/workspaces/${workspaceId}/chat/channels/${channelId}`, payload);
            const updated = {
                ...updatedRes,
                avatarUrl: updatedRes.avatarUrl || (updatedRes as any).AvatarUrl
            };
            set(state => ({
                channels: state.channels.map(c => c.id === channelId ? updated : c)
            }));
            return true;
        } catch (e: any) {
            set({ error: e.message });
            return false;
        }
    },

    deleteChannel: async (workspaceId, channelId) => {
        try {
            await apiDelete(`/workspaces/${workspaceId}/chat/channels/${channelId}`);
            set(state => ({
                channels: state.channels.filter(c => c.id !== channelId),
                activeChannelId: state.activeChannelId === channelId ? null : state.activeChannelId
            }));
            return true;
        } catch (e: any) {
            set({ error: e.message });
            return false;
        }
    },

    createDmGroup: async (workspaceId, userIds) => {
        try {
            const group = await apiPost<DmGroup>(`/workspaces/${workspaceId}/chat/dm`, { userIds });
            set(state => {
                // Check if already in list
                const exists = state.dmGroups.some(g => g.id === group.id);
                return {
                    dmGroups: exists ? state.dmGroups : [...state.dmGroups, group],
                    activeDmGroupId: group.id,
                    activeChannelId: null
                };
            });
            return group.id;
        } catch (e: any) {
            set({ error: e.message });
            return null;
        }
    },

    addReaction: async (workspaceId, messageId, emoji) => {
        try {
            await apiPost(`/workspaces/${workspaceId}/chat/messages/${messageId}/reactions`, { emoji });
        } catch (e: any) {
            console.error("Failed to react", e);
        }
    },

    removeReaction: async (workspaceId, messageId, emoji) => {
        try {
            await apiDelete(`/workspaces/${workspaceId}/chat/messages/${messageId}/reactions/${emoji}`);
        } catch (e: any) {
            console.error("Failed to remove reaction", e);
        }
    },

    // I need to properly implement removeReaction with DELETE
    // I'll just leave it empty for a moment and check api.ts

    handleReactionAdded: (reaction: any) => {
        set(state => {
            const newState: Partial<ChatState> = { messages: { ...state.messages } };

            // Handle PascalCase fallback
            const msgId = reaction.messageId || reaction.MessageId;
            const reactionId = reaction.id || reaction.Id;

            if (!msgId) return state;

            let found = false;
            for (const key of Object.keys(newState.messages!)) {
                if (found) break;
                const list = newState.messages![key];

                const msgIndex = list.findIndex(m => m.id === msgId);
                if (msgIndex !== -1) {
                    const msg = list[msgIndex];
                    // Dedupe
                    if (!msg.reactions.some(r => r.id === reactionId)) {
                        const newList = [...list];
                        // Normalize reaction object to camelCase if needed
                        const normalizedReaction = {
                            id: reactionId,
                            messageId: msgId,
                            userId: reaction.userId || reaction.UserId,
                            userName: reaction.userName || reaction.UserName,
                            emoji: reaction.emoji || reaction.Emoji,
                            createdAt: reaction.createdAt || reaction.CreatedAt
                        };
                        newList[msgIndex] = { ...msg, reactions: [...msg.reactions, normalizedReaction] };
                        newState.messages![key] = newList;
                    }
                    found = true;
                }
            }
            return found ? newState : state;
        });
    },

    handleReactionRemoved: (messageId: string, userId: string, emoji: string) => {
        set(state => {
            const newState: Partial<ChatState> = { messages: { ...state.messages } };
            let found = false;

            for (const key of Object.keys(newState.messages!)) {
                if (found) break;
                const list = newState.messages![key];

                const msgIndex = list.findIndex(m => m.id === messageId);
                if (msgIndex !== -1) {
                    const msg = list[msgIndex];
                    const newList = [...list];
                    newList[msgIndex] = {
                        ...msg,
                        reactions: msg.reactions.filter(r => !(r.userId === userId && r.emoji === emoji))
                    };
                    newState.messages![key] = newList;
                    found = true;
                }
            }
            return found ? newState : state;
        });
    },

    uploadAttachment: async (workspaceId, file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            // Use apiPostMultipart from api.ts which handles authorization and headers correctly
            const { apiPostMultipart } = await import('@/lib/api');
            return await apiPostMultipart<MessageAttachment>(`/workspaces/${workspaceId}/chat/attachments`, formData);
        } catch (e) {
            console.error("Upload failed", e);
            return null;
        }
    }

}));
