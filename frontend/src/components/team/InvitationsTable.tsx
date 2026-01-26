import { Mail, Clock, X, RotateCw } from 'lucide-react';
import { WorkspaceRole } from '@/stores/teamStore';
import { cn } from '@/lib/utils';

interface Invitation {
    id: string;
    email: string;
    role: WorkspaceRole;
    inviterName: string;
    expiresAt: string;
    status?: 'Pending' | 'Expired';
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
            <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground/60">
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4 border border-white/5">
                    <Mail className="w-8 h-8 opacity-40" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No Pending Invitations</h3>
                <p className="text-sm max-w-sm mt-1">Invite team members to collaborate. Pending invitations will appear here.</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-white/5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Invited By</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {invitations.map((invite) => {
                        const isExpired = new Date(invite.expiresAt) < new Date();
                        return (
                            <tr key={invite.id} className="group hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <Mail className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="font-medium text-foreground">{invite.email}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "inline-flex items-center px-2 py-1 rounded text-xs font-medium border",
                                        invite.role === WorkspaceRole.ADMIN
                                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                    )}>
                                        {invite.role === WorkspaceRole.ADMIN ? 'Admin' : 'Member'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-muted-foreground text-sm">{invite.inviterName}</td>
                                <td className="px-6 py-4">
                                    {isExpired ? (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive px-2 py-1 rounded-full bg-destructive/10">
                                            <Clock className="w-3 h-3" /> Expired
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-yellow-500 px-2 py-1 rounded-full bg-yellow-500/10">
                                            <Clock className="w-3 h-3" /> Pending
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {canManage && (
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                            <button
                                                onClick={() => onResend(invite.id)}
                                                className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg text-muted-foreground transition-colors"
                                                title="Resend Invite"
                                            >
                                                <RotateCw className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onRevoke(invite.id)}
                                                className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg text-muted-foreground transition-colors"
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
