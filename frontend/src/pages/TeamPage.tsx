import { useEffect, useState } from 'react';
import { toast } from '@/contexts/ToastContext';
import { useWorkspaces } from '@/stores/workspaceStore';
import { useTeamStore, WorkspaceRole } from '@/stores/teamStore';
import { MembersTable } from '@/components/team/MembersTable';
import { InvitationsTable } from '@/components/team/InvitationsTable';
import { InviteMemberModal } from '@/components/team/InviteMemberModal';
import { Plus } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

export function TeamPage() {
    const { activeWorkspace } = useWorkspaces();
    const { members, invitations, fetchMembers, fetchInvitations, updateRole, removeMember, revokeInvitation, resendInvitation } = useTeamStore();
    const currentUser = getCurrentUser();
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        if (activeWorkspace) {
            fetchMembers(activeWorkspace.id);
            fetchInvitations(activeWorkspace.id);
        }
    }, [activeWorkspace]);

    if (!activeWorkspace) {
        return (
            <div className="flex-1 overflow-y-auto bg-background p-8 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-lg font-semibold">No Workspace Selected</h2>
                    <p className="text-muted-foreground">Please select a workspace to view the team.</p>
                </div>
            </div>
        );
    }

    if (!currentUser) return null;

    const currentUserMember = members.find(m => m.userId.toLowerCase() === currentUser.id.toLowerCase());
    const role = currentUserMember?.role ?? WorkspaceRole.VIEWER;
    const canInvite = role === WorkspaceRole.OWNER || role === WorkspaceRole.ADMIN;

    const isInvitationsPage = location.pathname.includes('/invitations');

    return (
        <div className="flex-1 overflow-y-auto bg-background p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isInvitationsPage ? 'Invitations' : 'Team Management'}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {isInvitationsPage
                                ? `Manage pending invitations for ${activeWorkspace.name}.`
                                : `Manage members and roles for ${activeWorkspace.name}.`
                            }
                        </p>
                    </div>
                    {canInvite && (
                        <button
                            onClick={() => setIsInviteOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Invite Member
                        </button>
                    )}
                </div>



                <Routes>
                    <Route path="members" element={
                        <MembersTable
                            members={members}
                            currentUserId={currentUser.id}
                            currentUserRole={role}

                            onUpdateRole={async (id, r) => {
                                const err = await updateRole(activeWorkspace.id, id, r);
                                if (!err) {
                                    toast.success('Role Updated', 'Member role updated successfully');
                                    return true;
                                } else {
                                    toast.error('Update Failed', err);
                                    return false;
                                }
                            }}
                            onRemoveMember={async (id) => {
                                const err = await removeMember(activeWorkspace.id, id);
                                if (!err) {
                                    toast.success('Member Removed', 'Member removed from workspace');
                                    return true;
                                } else {
                                    toast.error('Removal Failed', err);
                                    return false;
                                }
                            }}
                        />
                    } />
                    <Route path="invitations" element={
                        <InvitationsTable
                            invitations={invitations}
                            onRevoke={async (id) => {
                                const err = await revokeInvitation(activeWorkspace.id, id);
                                if (!err) toast.success('Invitation Revoked', 'Invitation has been cancelled');
                                else toast.error('Revoke Failed', err);
                            }}
                            onResend={async (id) => {
                                const err = await resendInvitation(activeWorkspace.id, id);
                                if (!err) toast.success('Invitation Resent', 'Invitation extended and resent');
                                else toast.error('Resend Failed', err);
                            }}
                            currentUserRole={role}
                        />
                    } />
                    <Route path="*" element={<Navigate to="members" replace />} />
                </Routes>
            </div>

            <InviteMemberModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
            />
        </div>
    );
}
