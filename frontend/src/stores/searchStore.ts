import { create } from 'zustand';
import { apiGet } from '@/lib/api';

export interface SearchResult {
    id: string;
    title: string;
    subtitle: string;
    type: 'Task' | 'Lead' | 'Contact' | 'Company' | 'Deal' | 'Channel';
    url: string;
}

interface SearchState {
    query: string;
    results: SearchResult[];
    isLoading: boolean;
    isOpen: boolean;
    setQuery: (query: string) => void;
    setIsOpen: (isOpen: boolean) => void;
    search: (workspaceId: string, q: string) => Promise<void>;
    clear: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
    query: '',
    results: [],
    isLoading: false,
    isOpen: false,
    setQuery: (query) => set({ query }),
    setIsOpen: (isOpen) => set({ isOpen }),
    search: async (workspaceId, q) => {
        if (!q.trim()) {
            set({ results: [], isLoading: false });
            return;
        }

        set({ isLoading: true });
        try {
            const results = await apiGet<SearchResult[]>(`/workspaces/${workspaceId}/search?q=${encodeURIComponent(q)}`);
            set({ results, isLoading: false });
        } catch (error) {
            console.error('Search error:', error);
            set({ results: [], isLoading: false });
        }
    },
    clear: () => set({ query: '', results: [], isLoading: false, isOpen: false }),
}));
