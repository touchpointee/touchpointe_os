import { create } from 'zustand';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

export interface Channel {
    id: string;
    workspaceId: string;
    name: string;
    isPrivate: boolean;
    description: string;
    memberCount: number;
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

    // Actions
    fetchChannels: (workspaceId: string) => Promise<void>;
    fetchDmGroups: (workspaceId: string) => Promise<void>;
    fetchWorkspaceMembers: (workspaceId: string) => Promise<void>;

    setActiveChannel: (channelId: string) => void;
    setActiveDmInfo: (dmId: string) => void; // Using different name to avoid conflict if I used setActiveDm

    fetchMessages: (workspaceId: string, id: string, isDm?: boolean) => Promise<void>;

    postMessage: (workspaceId: string, content: string, currentUserId: string, currentUserName: string, replyToMessageId?: string) => Promise<void>;
    addMessage: (message: Message) => void;

    addReaction: (workspaceId: string, messageId: string, emoji: string) => Promise<void>;
    removeReaction: (workspaceId: string, messageId: string, emoji: string) => Promise<void>;

    handleReactionAdded: (reaction: any) => void;
    handleReactionRemoved: (messageId: string, userId: string, emoji: string) => void;

    createChannel: (workspaceId: string, name: string, isPrivate: boolean, description: string) => Promise<boolean>;
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
    isLoading: false,
    error: null,

    reset: () => set({
        channels: [],
        dmGroups: [],
        members: [],
        activeChannelId: null,
        activeDmGroupId: null,
        messages: {},
        isLoading: false,
        error: null
    }),

    fetchChannels: async (workspaceId) => {
        set({ isLoading: true, error: null });
        try {
            const channels = await apiGet<Channel[]>(`/workspaces/${workspaceId}/chat/channels`);
            set({ channels, isLoading: false });
        } catch (e: any) {
            set({ isLoading: false, error: e.message });
        }
    },

    fetchDmGroups: async (workspaceId) => {
        try {
            const dmGroups = await apiGet<DmGroup[]>(`/workspaces/${workspaceId}/chat/dm`);
            set({ dmGroups });
        } catch (e: any) {
            console.error("Failed to fetch DMs", e);
        }
    },

    fetchWorkspaceMembers: async (workspaceId) => {
        try {
            const members = await apiGet<UserDto[]>(`/workspaces/${workspaceId}/chat/users`);
            set({ members });
        } catch (e: any) {
            console.error("Failed to fetch members", e);
        }
    },

    setActiveChannel: (channelId) => {
        set({ activeChannelId: channelId, activeDmGroupId: null });
    },

    setActiveDmInfo: (dmId) => {
        set({ activeDmGroupId: dmId, activeChannelId: null });
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

    postMessage: async (workspaceId, content, currentUserId, currentUserName, replyToMessageId) => {
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
            reactions: []
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

            const realMessage = await apiPost<Message>(endpoint, { content, replyToMessageId });

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
        const targetId = message.channelId || message.directMessageGroupId;
        if (!targetId) return;

        set(state => {
            const currentMessages = state.messages[targetId] || [];

            // 1. Check if we already have this exact message ID (Dedupe)
            if (currentMessages.some(m => m.id === message.id)) return state;

            // 2. Check if we have an OPTIMISTIC message that matches this one (Sender + Content)
            // This handles the race condition where SignalR broadcast arrives before API POST returns.
            // We replace the optimistic one with the real one.
            const optimisticMatchIndex = currentMessages.findIndex(m =>
                m.isOptimistic &&
                m.senderId === message.senderId &&
                m.content === message.content
            );

            if (optimisticMatchIndex !== -1) {
                // Replace optimistic with real
                const updated = [...currentMessages];
                updated[optimisticMatchIndex] = message;
                return {
                    messages: {
                        ...state.messages,
                        [targetId]: updated
                    }
                };
            }

            // 3. Otherwise, just append
            return {
                messages: {
                    ...state.messages,
                    [targetId]: [...currentMessages, message]
                }
            };
        });
    },

    createChannel: async (workspaceId, name, isPrivate, description) => {
        // ...
        try {
            const newChannel = await apiPost<Channel>(`/workspaces/${workspaceId}/chat/channels`, { name, isPrivate, description });
            set(state => ({
                channels: [...state.channels, newChannel],
                activeChannelId: newChannel.id,
                activeDmGroupId: null
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
    }

}));
