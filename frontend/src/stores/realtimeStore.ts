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

    connect: (token: string, workspaceId: string) => Promise<void>;
    disconnect: () => Promise<void>;

    // Actions
    emitTyping: (channelId: string) => Promise<void>;
    emitStopTyping: (channelId: string) => Promise<void>;
    joinChannel: (channelId: string) => Promise<void>;
    leaveChannel: (channelId: string) => Promise<void>;
}

export const useRealtimeStore = create<RealtimeState>()((set, get) => ({
    connection: null,
    isConnected: false,
    isConnecting: false,
    typingUsers: {},

    connect: async (token, workspaceId) => {
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
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        // --- Event Listeners ---

        connection.on('message:new', (message: Message) => {
            console.log('[Realtime] New Message:', message);
            useChatStore.getState().addMessage(message);
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
