import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiGet } from '@/lib/api';

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

    fetchUser: () => Promise<void>;
    logout: () => void;
    clear: () => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            user: null,
            isLoading: false,
            error: null,

            fetchUser: async () => {
                set({ isLoading: true, error: null });
                try {
                    const user = await apiGet<User>('/auth/me');
                    set({ user, isLoading: false });
                } catch (e: any) {
                    set({ error: e.message, isLoading: false });
                }
            },

            logout: () => {
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
