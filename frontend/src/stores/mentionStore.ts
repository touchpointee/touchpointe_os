import { create } from 'zustand';
import { apiGet } from '@/lib/api';
import type { UserMention } from '@/types/mention';

interface MentionState {
    mentions: UserMention[];
    isLoading: boolean;
    error: string | null;
    fetchMentions: (workspaceId?: string) => Promise<void>;
    reset: () => void;
}

export const useMentionStore = create<MentionState>((set) => ({
    mentions: [],
    isLoading: false,
    error: null,

    reset: () => set({
        mentions: [],
        isLoading: false,
        error: null
    }),

    fetchMentions: async (workspaceId?: string) => {
        set({ isLoading: true, error: null });
        try {
            const url = workspaceId ? `/mentions?workspaceId=${workspaceId}` : '/mentions';
            const data = await apiGet<UserMention[]>(url);
            set({ mentions: data, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    }
}));
