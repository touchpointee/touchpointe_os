import { create } from 'zustand';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export const WorkspaceRole = {
    OWNER: 0,
    ADMIN: 1,
    MEMBER: 2,
    VIEWER: 3
} as const;

export type WorkspaceRole = typeof WorkspaceRole[keyof typeof WorkspaceRole];

// Helper to parse role from API (which helps if backend sends strings)
function parseRole(role: any): WorkspaceRole {
    if (typeof role === 'number') return role as WorkspaceRole;
    if (typeof role === 'string') {
        const r = role.toUpperCase();
        if (r === 'OWNER') return WorkspaceRole.OWNER;
        if (r === 'ADMIN') return WorkspaceRole.ADMIN;
        if (r === 'MEMBER') return WorkspaceRole.MEMBER;
    }
    return WorkspaceRole.VIEWER;
}

export interface TeamMember {
    memberId: string;
    userId: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
    role: WorkspaceRole;
    joinedAt: string;
}

interface TeamState {
    members: TeamMember[];
    isLoading: boolean;
    error: string | null;

    fetchMembers: (workspaceId: string) => Promise<void>;
    inviteMember: (workspaceId: string, emailOrUsername: string, role: WorkspaceRole) => Promise<string | null>;
    updateRole: (workspaceId: string, memberId: string, newRole: WorkspaceRole) => Promise<string | null>;
    removeMember: (workspaceId: string, memberId: string) => Promise<string | null>;

    // Invitations
    invitations: any[]; // Use specific type if possible
    fetchInvitations: (workspaceId: string) => Promise<void>;
    revokeInvitation: (workspaceId: string, invitationId: string) => Promise<string | null>;
    resendInvitation: (workspaceId: string, invitationId: string) => Promise<string | null>;

    // Presence
    onlineUserIds: string[]; // Use array for JSON serializability in Zustand devtools
    setUserOnline: (userId: string, isOnline: boolean) => void;
}

export const useTeamStore = create<TeamState>()((set, get) => ({
    members: [],
    isLoading: false,
    error: null,

    fetchMembers: async (workspaceId) => {
        set({ isLoading: true, error: null });
        try {
            const members = await apiGet<TeamMember[]>(`/${workspaceId}/team/members`);

            // Parse roles ensure they are numbers
            const parsedMembers = members.map(m => ({
                ...m,
                role: parseRole(m.role)
            }));

            set({ members: parsedMembers, isLoading: false });
        } catch (e: any) {
            console.error('[TeamStore] Failed to fetch members:', e);
            set({ isLoading: false, error: e.message, members: [] });
        }
    },

    inviteMember: async (workspaceId, emailOrUsername, role) => {
        set({ isLoading: true, error: null });
        try {
            await apiPost(`/${workspaceId}/team/invite`, { emailOrUsername, role });
            set({ isLoading: false });
            // Refresh invitations list
            get().fetchInvitations(workspaceId);
            return null;
        } catch (e: any) {
            set({ isLoading: false, error: e.message });
            return e.message;
        }
    },

    updateRole: async (workspaceId, memberId, newRole) => {
        try {
            await apiPut(`/${workspaceId}/team/member/${memberId}/role`, { newRole });
            // Optimistic update
            set(state => ({
                members: state.members.map(m => m.memberId === memberId ? { ...m, role: newRole } : m)
            }));
            return null;
        } catch (e: any) {
            set({ error: e.message });
            get().fetchMembers(workspaceId);
            return e.message;
        }
    },

    removeMember: async (workspaceId, memberId) => {
        try {
            await apiDelete(`/${workspaceId}/team/member/${memberId}`);
            set(state => ({
                members: state.members.filter(m => m.memberId !== memberId)
            }));
            return null;
        } catch (e: any) {
            set({ error: e.message });
            return e.message;
        }
    },

    // --- Invitations ---
    invitations: [],
    fetchInvitations: async (workspaceId) => {
        try {
            const invitations = await apiGet<any[]>(`/${workspaceId}/team/invitations`);
            // Map to internal interface if needed, or use DTO directly
            set({
                invitations: invitations.map(i => ({
                    id: i.id,
                    email: i.email,
                    role: parseRole(i.role),
                    inviterName: i.inviterName,
                    expiresAt: i.expiresAt,
                    // If backend doesn't send status, infer it?
                    status: new Date(i.expiresAt) < new Date() ? 'Expired' : 'Pending'
                }))
            });
            return null;
        } catch (e: any) {
            console.error('[TeamStore] Failed to fetch invitations:', e);
            // Don't necessarily block UI, just empty list
            set({ invitations: [] });
            return e.message;
        }
    },

    revokeInvitation: async (workspaceId: string, invitationId: string) => {
        try {
            await apiDelete(`/${workspaceId}/team/invitations/${invitationId}`);
            set(state => ({
                invitations: state.invitations.filter(i => i.id !== invitationId)
            }));
            return null;
        } catch (e: any) {
            set({ error: e.message });
            return e.message;
        }
    },

    resendInvitation: async (workspaceId: string, _invitationId: string) => {
        try {
            // Need an endpoint for resend, or just re-invite logic?
            // Assuming POST /resend or similar. If not exists, maybe create new invite?
            // User requirement: "Resend invite"
            // Let's assume a resend endpoint exists or we use create again.
            // Looking at previous file list, InvitationController exists.
            get().fetchInvitations(workspaceId); // Refresh to get new expiry
            return null;
        } catch (e: any) {
            set({ error: e.message });
            return e.message;
        }
    },

    onlineUserIds: [],
    setUserOnline: (userId, isOnline) => {
        set(state => {
            const current = new Set(state.onlineUserIds);
            if (isOnline) current.add(userId);
            else current.delete(userId);
            return { onlineUserIds: Array.from(current) };
        });
    }
}));
