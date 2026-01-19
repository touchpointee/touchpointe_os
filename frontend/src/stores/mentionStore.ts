import { create } from 'zustand';
import { apiGet } from '@/lib/api';
import type { UserMention } from '@/types/mention';

interface MentionState {
    mentions: UserMention[];
    isLoading: boolean;
    error: string | null;
    fetchMentions: () => Promise<void>;
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

    fetchMentions: async () => {
        set({ isLoading: true, error: null });
        try {
            const data = await apiGet<UserMention[]>('/mentions');
            set({ mentions: data, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    }
}));
