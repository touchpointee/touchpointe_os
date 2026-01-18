import { create } from 'zustand';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export interface TagDto {
    id: string;
    name: string;
    color: string;
}

interface TagState {
    tags: Record<string, TagDto[]>; // keyed by workspaceId
    loading: boolean;
    error: string | null;

    fetchTags: (workspaceId: string) => Promise<void>;
    createTag: (workspaceId: string, name: string, color: string) => Promise<TagDto>;
    updateTag: (workspaceId: string, tagId: string, name: string, color: string) => Promise<void>;
    deleteTag: (workspaceId: string, tagId: string) => Promise<void>;
}

export const useTagStore = create<TagState>((set, get) => ({
    tags: {},
    loading: false,
    error: null,

    fetchTags: async (workspaceId) => {
        set({ loading: true, error: null });
        try {
            const tags = await apiGet<TagDto[]>(`/workspaces/${workspaceId}/tags`);
            set(state => ({
                tags: { ...state.tags, [workspaceId]: tags },
                loading: false
            }));
        } catch (e) {
            set({ error: (e as Error).message, loading: false });
        }
    },

    createTag: async (workspaceId, name, color) => {
        try {
            const newTag = await apiPost<TagDto>(`/workspaces/${workspaceId}/tags`, { name, color });
            // Optimization: Add to local state if not already there (backend handles case-insensitivity)
            set(state => {
                const workspaceTags = state.tags[workspaceId] || [];
                const exists = workspaceTags.some(t => t.id === newTag.id);
                if (exists) return state;
                return {
                    tags: { ...state.tags, [workspaceId]: [...workspaceTags, newTag] }
                };
            });
            return newTag;
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    updateTag: async (workspaceId, tagId, name, color) => {
        try {
            await apiPut(`/workspaces/${workspaceId}/tags/${tagId}`, { name, color });
            await get().fetchTags(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    deleteTag: async (workspaceId, tagId) => {
        try {
            await apiDelete(`/workspaces/${workspaceId}/tags/${tagId}`);
            set(state => ({
                tags: {
                    ...state.tags,
                    [workspaceId]: (state.tags[workspaceId] || []).filter(t => t.id !== tagId)
                }
            }));
        } catch (e) {
            set({ error: (e as Error).message });
        }
    }
}));
