import { create } from 'zustand';
import type { SpaceHierarchyDto, CreateSpaceRequest, CreateFolderRequest, CreateListRequest, UpdateSpaceRequest, UpdateFolderRequest, UpdateListRequest } from '@/types/hierarchy';
import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '@/lib/api';

interface HierarchyState {
    spaces: SpaceHierarchyDto[];
    loading: boolean;
    error: string | null;
    expandedSpaces: Set<string>;
    expandedFolders: Set<string>;

    // Actions
    fetchHierarchy: (workspaceId: string) => Promise<void>;
    createSpace: (workspaceId: string, request: CreateSpaceRequest) => Promise<void>;
    createFolder: (workspaceId: string, request: CreateFolderRequest) => Promise<void>;
    createList: (workspaceId: string, request: CreateListRequest) => Promise<void>;

    updateSpace: (workspaceId: string, spaceId: string, request: UpdateSpaceRequest) => Promise<void>;
    deleteSpace: (workspaceId: string, spaceId: string) => Promise<void>;

    updateFolder: (workspaceId: string, folderId: string, request: UpdateFolderRequest) => Promise<void>;
    deleteFolder: (workspaceId: string, folderId: string) => Promise<void>;

    updateList: (workspaceId: string, listId: string, request: UpdateListRequest) => Promise<void>;
    deleteList: (workspaceId: string, listId: string) => Promise<void>;

    updateStatus: (workspaceId: string, statusId: string, request: { name?: string; color?: string }) => Promise<void>;
    createStatus: (workspaceId: string, listId: string, request: { name: string; color: string; category: string }) => Promise<void>;
    deleteStatus: (workspaceId: string, statusId: string) => Promise<void>;

    toggleSpace: (spaceId: string) => void;
    toggleFolder: (folderId: string) => void;
    reset: () => void;
}

export const useHierarchyStore = create<HierarchyState>((set, get) => ({
    spaces: [],
    loading: false,
    error: null,
    expandedSpaces: new Set(),
    expandedFolders: new Set(),

    reset: () => set({
        spaces: [],
        loading: false,
        error: null,
        expandedSpaces: new Set(),
        expandedFolders: new Set()
    }),

    fetchHierarchy: async (workspaceId) => {
        set({ loading: true, error: null });
        try {
            const spaces = await apiGet<SpaceHierarchyDto[]>(`/workspaces/${workspaceId}/hierarchy`);
            set({ spaces, loading: false });
        } catch (e) {
            set({ error: (e as Error).message, loading: false });
        }
    },

    createSpace: async (workspaceId, request) => {
        try {
            await apiPost(`/workspaces/${workspaceId}/hierarchy/spaces`, request);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    createFolder: async (workspaceId, request) => {
        try {
            await apiPost(`/workspaces/${workspaceId}/hierarchy/folders`, request);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    createList: async (workspaceId, request) => {
        try {
            await apiPost(`/workspaces/${workspaceId}/hierarchy/lists`, request);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    updateSpace: async (workspaceId, spaceId, request) => {
        try {
            await apiPut(`/workspaces/${workspaceId}/hierarchy/spaces/${spaceId}`, request);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    deleteSpace: async (workspaceId, spaceId) => {
        try {
            await apiDelete(`/workspaces/${workspaceId}/hierarchy/spaces/${spaceId}`);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    updateFolder: async (workspaceId, folderId, request) => {
        try {
            await apiPut(`/workspaces/${workspaceId}/hierarchy/folders/${folderId}`, request);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    deleteFolder: async (workspaceId, folderId) => {
        try {
            await apiDelete(`/workspaces/${workspaceId}/hierarchy/folders/${folderId}`);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    updateList: async (workspaceId, listId, request) => {
        try {
            await apiPut(`/workspaces/${workspaceId}/hierarchy/lists/${listId}`, request);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    deleteList: async (workspaceId, listId) => {
        try {
            await apiDelete(`/workspaces/${workspaceId}/hierarchy/lists/${listId}`);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    updateStatus: async (workspaceId, statusId, request) => {
        try {
            await apiPatch(`/workspaces/${workspaceId}/task-statuses/${statusId}`, request);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    createStatus: async (workspaceId, listId, request) => {
        try {
            await apiPost(`/workspaces/${workspaceId}/lists/${listId}/statuses`, request);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    deleteStatus: async (workspaceId, statusId) => {
        try {
            await apiDelete(`/workspaces/${workspaceId}/task-statuses/${statusId}`);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    toggleSpace: (spaceId) => {
        const { expandedSpaces } = get();
        const newSet = new Set<string>();

        // If clicking a different space, open it (and close others by virtue of new Set)
        if (!expandedSpaces.has(spaceId)) {
            newSet.add(spaceId);
        }
        // If clicking the same space, it will be removed (toggled off) because we start with empty set
        // and don't add it back.

        set({ expandedSpaces: newSet });
    },

    toggleFolder: (folderId) => {
        const { expandedFolders } = get();
        const newSet = new Set<string>();

        if (!expandedFolders.has(folderId)) {
            newSet.add(folderId);
        }

        set({ expandedFolders: newSet });
    },
}));
