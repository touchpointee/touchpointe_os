import { useEffect, useState } from 'react';
import { toast } from '@/contexts/ToastContext';
import { useWorkspaces } from '@/stores/workspaceStore';
import { useTeamStore, WorkspaceRole } from '@/stores/teamStore';
import { MembersTable } from '@/components/team/MembersTable';
import { InvitationsTable } from '@/components/team/InvitationsTable';
import { InviteMemberModal } from '@/components/team/InviteMemberModal';
import { Plus, Users, Mail, ShieldCheck } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { cn } from '@/lib/utils';

export function TeamPage() {
    const { activeWorkspace } = useWorkspaces();
    const { members, invitations, fetchMembers, fetchInvitations, updateRole, removeMember, revokeInvitation, resendInvitation } = useTeamStore();
    const currentUser = getCurrentUser();
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'members' | 'invitations'>('members');

    useEffect(() => {
        if (activeWorkspace) {
            fetchMembers(activeWorkspace.id);
            fetchInvitations(activeWorkspace.id);
        }
    }, [activeWorkspace]);

    if (!activeWorkspace) {
        return (
            <div className="h-full flex items-center justify-center p-8">
                <div className="text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold">No Workspace Selected</h2>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">Please select a workspace from the sidebar to view and manage your team.</p>
                </div>
            </div>
        );
    }

    if (!currentUser) return null;

    const currentUserMember = members.find(m => m.userId.toLowerCase() === currentUser.id.toLowerCase());
    const role = currentUserMember?.role ?? WorkspaceRole.VIEWER;
    const canInvite = role === WorkspaceRole.OWNER || role === WorkspaceRole.ADMIN;

    return (
        <div className="h-full w-full overflow-hidden flex flex-col bg-background/50">
            {/* Header Section */}
            <div className="px-8 pt-8 pb-6 border-b border-white/5 bg-background/50 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto w-full">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                                <Users className="w-8 h-8 text-primary" />
                                Team Management
                            </h1>
                            <p className="text-muted-foreground mt-2 text-sm max-w-xl">
                                Manage access and roles for <span className="text-foreground font-medium">{activeWorkspace.name}</span>.
                                View workspace members and handle pending invitations.
                            </p>
                        </div>
                        {canInvite && (
                            <button
                                onClick={() => setIsInviteOpen(true)}
                                className="group flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                                Invite Member
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl w-fit border border-white/5">
                        <button
                            onClick={() => setActiveTab('members')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                activeTab === 'members'
                                    ? "bg-background text-foreground shadow-sm ring-1 ring-black/5"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <ShieldCheck className="w-4 h-4" />
                            Members
                            <span className={cn(
                                "ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold border",
                                activeTab === 'members'
                                    ? "bg-primary/10 text-primary border-primary/20"
                                    : "bg-muted text-muted-foreground border-transparent"
                            )}>
                                {members.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('invitations')}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                activeTab === 'invitations'
                                    ? "bg-background text-foreground shadow-sm ring-1 ring-black/5"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <Mail className="w-4 h-4" />
                            Invitations
                            {invitations.length > 0 && (
                                <span className={cn(
                                    "ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold border",
                                    activeTab === 'invitations'
                                        ? "bg-primary/10 text-primary border-primary/20"
                                        : "bg-muted text-muted-foreground border-transparent"
                                )}>
                                    {invitations.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-card/30 border border-white/5 rounded-2xl overflow-hidden shadow-sm backdrop-blur-sm">
                        {activeTab === 'members' ? (
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
                        ) : (
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
                        )}
                    </div>
                </div>
            </div>

            <InviteMemberModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
            />
        </div>
    );
}
