import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiGet, apiPost } from '@/lib/api';

export interface Workspace {
    id: string;
    name: string;
    slug: string;
    ownerId: string;
    userRole?: string | number; // Mapped from backend 'userRole' (could be enum string or int)
}

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id: string | undefined | null): boolean {
    if (!id) return false;
    return UUID_REGEX.test(id);
}

interface WorkspaceState {
    workspaces: Workspace[];
    activeWorkspace: Workspace | null;
    isLoading: boolean;
    isBootstrapped: boolean;
    isCreatingWorkspace: boolean; // Guard against duplicate creation
    error: string | null;
    lastActiveWorkspaceId: string | null;

    fetchWorkspaces: () => Promise<Workspace[]>;
    createWorkspace: (name: string) => Promise<Workspace | null>;
    acceptInvitation: (token: string) => Promise<Workspace>;
    setActiveWorkspace: (workspaceId: string) => void;
    clear: () => void;
}

export const useWorkspaces = create<WorkspaceState>()(
    persist(
        (set, get) => ({
            workspaces: [],
            activeWorkspace: null,
            isLoading: false,
            isBootstrapped: false,
            isCreatingWorkspace: false,
            error: null,
            lastActiveWorkspaceId: null,

            fetchWorkspaces: async () => {
                set({ isLoading: true, error: null });
                try {
                    // No token passed - apiGet uses localStorage
                    const workspaces = await apiGet<Workspace[]>('/workspaces');

                    // Auto-select workspace
                    const currentActive = get().activeWorkspace;
                    const lastActiveId = get().lastActiveWorkspaceId;
                    let newActive = currentActive;

                    if (workspaces.length > 0) {
                        // Try to restore last active
                        if (lastActiveId) {
                            const found = workspaces.find(w => w.id === lastActiveId);
                            if (found) newActive = found;
                            else newActive = workspaces[0];
                        } else if (!currentActive || !workspaces.find(w => w.id === currentActive.id)) {
                            newActive = workspaces[0];
                        }
                    } else {
                        newActive = null;
                    }

                    set({
                        workspaces,
                        activeWorkspace: newActive,
                        isLoading: false,
                        isBootstrapped: true,
                        lastActiveWorkspaceId: newActive?.id || null
                    });

                    return workspaces;
                } catch (e: any) {
                    set({ isLoading: false, error: e.message, isBootstrapped: true });
                    return [];
                }
            },

            createWorkspace: async (name: string) => {
                if (get().isCreatingWorkspace) {
                    console.warn('Workspace creation already in progress, skipping...');
                    return null;
                }

                set({ isLoading: true, isCreatingWorkspace: true, error: null });
                try {
                    const workspace = await apiPost<Workspace>('/workspaces', { name });
                    const workspaces = [...get().workspaces, workspace];
                    set({
                        workspaces,
                        activeWorkspace: workspace,
                        isLoading: false,
                        isCreatingWorkspace: false,
                        lastActiveWorkspaceId: workspace.id
                    });
                    return workspace;
                } catch (e: any) {
                    set({ isLoading: false, isCreatingWorkspace: false, error: e.message });
                    return null;
                }
            },

            acceptInvitation: async (token: string) => {
                set({ isLoading: true, error: null });
                try {
                    const workspace = await apiPost<Workspace>('/workspaces/invitations/accept', { token });
                    const currentWorkspaces = get().workspaces;
                    if (!currentWorkspaces.find(w => w.id === workspace.id)) {
                        set({
                            workspaces: [...currentWorkspaces, workspace],
                            isLoading: false
                        });
                    } else {
                        set({ isLoading: false });
                    }
                    return workspace;
                } catch (e: any) {
                    set({ isLoading: false, error: e.message });
                    throw e;
                }
            },

            setActiveWorkspace: (workspaceId: string) => {
                if (!isValidUUID(workspaceId)) {
                    console.error('Invalid workspace ID:', workspaceId);
                    return;
                }
                const workspace = get().workspaces.find(w => w.id === workspaceId);
                if (workspace) {
                    set({
                        activeWorkspace: workspace,
                        lastActiveWorkspaceId: workspace.id
                    });
                }
            },

            clear: () => {
                set({
                    workspaces: [],
                    activeWorkspace: null,
                    isLoading: false,
                    isBootstrapped: false,
                    isCreatingWorkspace: false,
                    error: null,
                    lastActiveWorkspaceId: null
                });
            }
        }),
        {
            name: 'workspace-storage',
            partialize: (state) => ({
                // Only persist the ID of the last active workspace, not the data itself
                lastActiveWorkspaceId: state.lastActiveWorkspaceId,
            })
        }
    )
);
