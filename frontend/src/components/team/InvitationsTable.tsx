import { Mail, Clock, X, RotateCw } from 'lucide-react';
import { WorkspaceRole } from '@/stores/teamStore';

interface Invitation {
    id: string;
    email: string;
    role: WorkspaceRole;
    inviterName: string;
    expiresAt: string;
    status?: 'Pending' | 'Expired'; // Backend doesn't explicitly send status enum in DTO provided, usually inferred from Expiry
}

interface InvitationsTableProps {
    invitations: Invitation[];
    onRevoke: (id: string) => void;
    onResend: (id: string) => void;
    currentUserRole: WorkspaceRole;
}

export function InvitationsTable({ invitations, onRevoke, onResend, currentUserRole }: InvitationsTableProps) {
    const canManage = currentUserRole === WorkspaceRole.OWNER || currentUserRole === WorkspaceRole.ADMIN;

    if (invitations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border border-border/50 rounded-lg bg-muted/20">
                <Mail className="w-10 h-10 mb-3 opacity-20" />
                <p>No pending invitations</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Invited By</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {invitations.map((invite) => {
                        const isExpired = new Date(invite.expiresAt) < new Date();
                        return (
                            <tr key={invite.id} className="group hover:bg-muted/50 transition-colors">
                                <td className="px-4 py-3 font-medium">{invite.email}</td>
                                <td className="px-4 py-3">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                                        {invite.role === WorkspaceRole.ADMIN ? 'Admin' : 'Member'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{invite.inviterName}</td>
                                <td className="px-4 py-3">
                                    {isExpired ? (
                                        <span className="inline-flex items-center gap-1.5 text-xs text-red-500">
                                            <Clock className="w-3 h-3" /> Expired
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 text-xs text-yellow-500">
                                            <Clock className="w-3 h-3" /> Pending
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {canManage && (
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onResend(invite.id)}
                                                className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                                                title="Resend Invite"
                                            >
                                                <RotateCw className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onRevoke(invite.id)}
                                                className="p-1.5 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500"
                                                title="Revoke Invite"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
