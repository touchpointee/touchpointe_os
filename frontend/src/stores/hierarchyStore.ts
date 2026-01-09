import { create } from 'zustand';
import type { SpaceHierarchyDto, CreateSpaceRequest, CreateFolderRequest, CreateListRequest, UpdateSpaceRequest, UpdateFolderRequest, UpdateListRequest } from '@/types/hierarchy';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

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
    toggleSpace: (spaceId: string) => void;
    toggleFolder: (folderId: string) => void;
}

export const useHierarchyStore = create<HierarchyState>((set, get) => ({
    spaces: [],
    loading: false,
    error: null,
    expandedSpaces: new Set(),
    expandedFolders: new Set(),

    fetchHierarchy: async (workspaceId) => {
        set({ loading: true, error: null });
        try {
            const spaces = await apiGet<SpaceHierarchyDto[]>(`/${workspaceId}/hierarchy`);
            set({ spaces, loading: false });
        } catch (e) {
            set({ error: (e as Error).message, loading: false });
        }
    },

    createSpace: async (workspaceId, request) => {
        try {
            await apiPost(`/${workspaceId}/hierarchy/spaces`, request);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    createFolder: async (workspaceId, request) => {
        try {
            await apiPost(`/${workspaceId}/hierarchy/folders`, request);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    createList: async (workspaceId, request) => {
        try {
            await apiPost(`/${workspaceId}/hierarchy/lists`, request);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    updateSpace: async (workspaceId, spaceId, request) => {
        try {
            await apiPut(`/${workspaceId}/hierarchy/spaces/${spaceId}`, request);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    deleteSpace: async (workspaceId, spaceId) => {
        try {
            await apiDelete(`/${workspaceId}/hierarchy/spaces/${spaceId}`);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    updateFolder: async (workspaceId, folderId, request) => {
        try {
            await apiPut(`/${workspaceId}/hierarchy/folders/${folderId}`, request);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    deleteFolder: async (workspaceId, folderId) => {
        try {
            await apiDelete(`/${workspaceId}/hierarchy/folders/${folderId}`);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    updateList: async (workspaceId, listId, request) => {
        try {
            await apiPut(`/${workspaceId}/hierarchy/lists/${listId}`, request);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    deleteList: async (workspaceId, listId) => {
        try {
            await apiDelete(`/${workspaceId}/hierarchy/lists/${listId}`);
            await get().fetchHierarchy(workspaceId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    toggleSpace: (spaceId) => {
        const { expandedSpaces } = get();
        const newSet = new Set(expandedSpaces);
        if (newSet.has(spaceId)) {
            newSet.delete(spaceId);
        } else {
            newSet.add(spaceId);
        }
        set({ expandedSpaces: newSet });
    },

    toggleFolder: (folderId) => {
        const { expandedFolders } = get();
        const newSet = new Set(expandedFolders);
        if (newSet.has(folderId)) {
            newSet.delete(folderId);
        } else {
            newSet.add(folderId);
        }
        set({ expandedFolders: newSet });
    },
}));
