import { create } from 'zustand';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useChatStore, type Message } from './chatStore';
import { useTeamStore } from './teamStore';

export interface RealtimeState {
    connection: HubConnection | null;
    isConnected: boolean;
    isConnecting: boolean;

    // Typing tracking: ChannelId -> Set of UserNames typing
    typingUsers: Record<string, { userId: string, userName: string }[]>;

    connect: (workspaceId: string, token?: string) => Promise<void>;
    disconnect: () => Promise<void>;

    // Actions
    emitTyping: (channelId: string) => Promise<void>;
    emitStopTyping: (channelId: string) => Promise<void>;
    joinChannel: (channelId: string) => Promise<void>;
    leaveChannel: (channelId: string) => Promise<void>;
    reset: () => void;
}

export const useRealtimeStore = create<RealtimeState>()((set, get) => ({
    connection: null,
    isConnected: false,
    isConnecting: false,
    typingUsers: {},

    reset: () => {
        get().disconnect();
        set({
            connection: null,
            isConnected: false,
            isConnecting: false,
            typingUsers: {}
        });
    },

    connect: async (workspaceId, token) => {
        if (get().isConnected || get().isConnecting) return;

        set({ isConnecting: true });

        // Use environment variable for API URL
        const apiBaseUrl = import.meta.env.VITE_API_URL;

        if (!apiBaseUrl) {
            console.error('VITE_API_URL is not defined');
            set({ isConnecting: false });
            return;
        }

        const connection = new HubConnectionBuilder()
            .withUrl(`${apiBaseUrl}/hubs/chat?workspaceId=${workspaceId}`, {
                accessTokenFactory: token ? () => token : undefined,
                withCredentials: true
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        // --- Event Listeners ---

        connection.on('message:new', (message: Message) => {
            console.log('[Realtime] New Message:', message);
            useChatStore.getState().addMessage(message);
        });

        connection.on('message:reaction:new', (reaction: any) => {
            // Note: Backend sends reactionDto. We need channelId from context?
            // Actually, backend sends just reactionDto.
            // Wait, helper in ChatNotificationService sends just 'reaction'.
            // And client Group is channel:{id}.
            // But receiver needs to know which channel if global store?
            // "channelId" is not in reactionDto from backend service usually, logic check:
            // Service line 534: reactionDto has MessageId, UserId, Emoji. No ChannelId.
            // But we join groups per channel. The store puts messages in messages[activeId].
            // If we are subscribed to channel X, we receive this event.
            // But the store needs to know WHERE to update the message.
            // Ideally backend sends { channelId, reaction } or wrapper.
            // Backend sends: await _hubContext.Clients.Group($"channel:{channelId}").SendAsync("message:reaction:new", reaction);
            // So we just get 'reaction'.
            // We can try to find the message in all channels or assume it's for the current channel if we restrict events.
            // But simpler: The store updates message by ID.
            useChatStore.getState().handleReactionAdded(reaction);
        });

        connection.on('message:reaction:remove', (payload: any) => {
            const messageId = payload.messageId || payload.MessageId;
            const userId = payload.userId || payload.UserId;
            const emoji = payload.emoji || payload.Emoji;
            if (messageId && userId && emoji) {
                useChatStore.getState().handleReactionRemoved(messageId, userId, emoji);
            }
        });

        connection.on('user:typing', ({ userId, userName, channelId }: { userId: string, userName: string, channelId: string }) => {
            set(state => {
                const current = state.typingUsers[channelId] || [];
                if (current.some(u => u.userId === userId)) return state; // Already typing

                return {
                    typingUsers: {
                        ...state.typingUsers,
                        [channelId]: [...current, { userId, userName }]
                    }
                };
            });

            // Auto-clear after 3 seconds (fail-safe)
            // Logic handled by StopTyping usually, but good to have timeout
        });

        connection.on('user:stopTyping', ({ userId, channelId }: { userId: string, channelId: string }) => {
            set(state => ({
                typingUsers: {
                    ...state.typingUsers,
                    [channelId]: (state.typingUsers[channelId] || []).filter(u => u.userId !== userId)
                }
            }));
        });

        connection.on('user:online', (userId: string) => {
            useTeamStore.getState().setUserOnline(userId, true);
        });

        connection.on('user:offline', (userId: string) => {
            useTeamStore.getState().setUserOnline(userId, false);
        });

        connection.on('notification:new', (notification: any) => {
            // Use sonner to show toast
            import('sonner').then(({ toast }) => {
                toast(notification.title, {
                    description: notification.message,
                    action: {
                        label: 'View',
                        onClick: () => {
                            // Basic navigation logic if data contains URL or IDs
                            // For now just dismiss
                            console.log('Notification clicked', notification);
                        }
                    }
                });
            });

            // Optionally verify if we need to refresh notification list in a store
            // const { fetchNotifications } = useNotificationStore.getState();

            // Add to store for header dropdown
            import('./notificationStore').then(({ useNotificationStore }) => {
                useNotificationStore.getState().addNotification(notification);
            });
        });

        try {
            await connection.start();
            console.log('[Realtime] Connected to SignalR');
            set({ connection, isConnected: true, isConnecting: false });
        } catch (err) {
            console.error('[Realtime] Connection failed:', err);
            set({ isConnecting: false });
        }
    },

    disconnect: async () => {
        const { connection } = get();
        if (connection) {
            await connection.stop();
            set({ connection: null, isConnected: false });
        }
    },

    emitTyping: async (channelId) => {
        const { connection } = get();
        if (connection && connection.state === 'Connected') {
            await connection.invoke('Typing', channelId);
        }
    },

    emitStopTyping: async (channelId) => {
        const { connection } = get();
        if (connection && connection.state === 'Connected') {
            await connection.invoke('StopTyping', channelId);
        }
    },

    joinChannel: async (channelId) => {
        const { connection } = get();
        if (connection && connection.state === 'Connected') {
            try {
                await connection.invoke('JoinChannel', channelId);
                console.log(`[Realtime] Joined channel: ${channelId}`);
            } catch (err) {
                console.error(`[Realtime] Failed to join channel ${channelId}:`, err);
            }
        }
    },

    leaveChannel: async (channelId) => {
        const { connection } = get();
        if (connection && connection.state === 'Connected') {
            try {
                await connection.invoke('LeaveChannel', channelId);
                console.log(`[Realtime] Left channel: ${channelId}`);
            } catch (err) {
                console.error(`[Realtime] Failed to leave channel ${channelId}:`, err);
            }
        }
    }
}));
