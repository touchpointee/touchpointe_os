import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiGet } from '@/lib/api';
import { useTaskStore } from './taskStore';
import { useChatStore } from './chatStore';
import { useHierarchyStore } from './hierarchyStore';
import { useTeamStore } from './teamStore';
import { useDashboardStore } from './dashboardStore';
import { useAiStore } from './aiStore';
import { useCrmStore } from './crmStore';
import { useMentionStore } from './mentionStore';
import { useNotificationStore } from './notificationStore';
import { useRealtimeStore } from './realtimeStore';
import { useTagStore } from './tagStore';
import { useWorkspaces } from './workspaceStore';

export interface User {
    id: string;
    email: string;
    fullName: string;
    username: string;
    avatarUrl?: string;
    role?: string;
    lastActiveWorkspaceId?: string;
}

interface UserState {
    user: User | null;
    isLoading: boolean;
    error: string | null;

    fetchUser: (silent?: boolean) => Promise<void>;
    logout: () => void;
    clear: () => void;
}
export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            user: null,
            isLoading: false,
            error: null,

            fetchUser: async (silent = false) => {
                if (!silent) set({ isLoading: true, error: null });
                else set({ error: null });
                try {
                    const user = await apiGet<User>('/auth/me');
                    set({ user, isLoading: false });
                } catch (e: any) {
                    // Clear cached user on any fetch failure (token expired, user deleted, etc.)
                    set({ user: null, error: e.message, isLoading: false });
                    // clear cached user
                    set({ user: null, error: e.message, isLoading: false });
                }
            },

            logout: () => {
                // 1. Reset all domain stores
                useTaskStore.getState().reset();
                useChatStore.getState().reset();
                useHierarchyStore.getState().reset();
                useTeamStore.getState().reset();
                useDashboardStore.getState().reset();
                useAiStore.getState().reset();
                useCrmStore.getState().reset();
                useMentionStore.getState().reset();
                useNotificationStore.getState().reset();
                useRealtimeStore.getState().reset();
                useTagStore.getState().reset();

                // 2. Reset workspace store
                useWorkspaces.getState().clear();

                // 3. Clear user state
                set({ user: null, error: null });
            },

            clear: () => {
                set({ user: null, error: null, isLoading: false });
            }
        }),
        {
            name: 'user-storage',
            partialize: (state) => ({ user: state.user }), // Persist user info
        }
    )
);
