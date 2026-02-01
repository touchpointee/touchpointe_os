import { useState } from 'react';
import { type TeamMember, WorkspaceRole } from '@/stores/teamStore';
import { RoleBadge } from './RoleBadge';
import { Trash2, Edit, Shield } from 'lucide-react';


interface MembersTableProps {
    members: TeamMember[];
    currentUserId: string;
    currentUserRole: WorkspaceRole;
    onUpdateRole: (memberId: string, role: WorkspaceRole) => Promise<boolean>;
    onRemoveMember: (memberId: string) => Promise<boolean>;
}

export function MembersTable({ members, currentUserId, currentUserRole, onUpdateRole, onRemoveMember }: MembersTableProps) {
    const [editingId, setEditingId] = useState<string | null>(null);

    const canManageCheck = (targetRole: WorkspaceRole) => {
        if (currentUserRole === WorkspaceRole.OWNER) return true;
        if (currentUserRole === WorkspaceRole.ADMIN) {
            if (targetRole === WorkspaceRole.OWNER) return false;
            return true;
        }
        return false;
    };

    return (
        <div className="w-full">
            <table className="w-full text-sm text-left">
                <thead className="text-muted-foreground font-medium border-b border-white/5">
                    <tr>
                        <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Member</th>
                        <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Role</th>
                        <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider">Joined</th>
                        <th className="px-6 py-4 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {members.map((member) => (
                        <tr key={member.memberId} className="group hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden border border-white/10 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                                            {member.avatarUrl ? (
                                                <img src={member.avatarUrl} alt={member.fullName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-sm font-bold text-primary">
                                                    {member.fullName.substring(0, 2).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-foreground flex items-center gap-2">
                                            {member.fullName}
                                            {member.userId === currentUserId && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                                                    You
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{member.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                {editingId === member.memberId ? (
                                    <div className="flex items-center gap-2">
                                        <select
                                            className="bg-background/50 border border-input rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                                            value={member.role}
                                            onChange={async (e) => {
                                                const success = await onUpdateRole(member.memberId, Number(e.target.value) as WorkspaceRole);
                                                if (success) setEditingId(null);
                                            }}
                                            onBlur={() => setEditingId(null)}
                                            autoFocus
                                        >
                                            <option value={WorkspaceRole.ADMIN}>Admin</option>
                                            <option value={WorkspaceRole.MEMBER}>Member</option>
                                            <option value={WorkspaceRole.VIEWER}>Viewer</option>
                                        </select>
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        <RoleBadge role={member.role} />
                                    </div>
                                )}
                            </td>
                            <td className="px-6 py-4 text-muted-foreground text-sm">
                                {new Date(member.joinedAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </td>
                            <td className="px-6 py-4 text-right">
                                {canManageCheck(member.role) && member.userId !== currentUserId && member.role !== WorkspaceRole.OWNER ? (
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                        <button
                                            onClick={() => setEditingId(member.memberId)}
                                            className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg text-muted-foreground transition-colors"
                                            title="Edit Role"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to remove this member?')) {
                                                    onRemoveMember(member.memberId);
                                                }
                                            }}
                                            className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg text-muted-foreground transition-colors"
                                            title="Remove Member"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-muted-foreground/30 text-xs italic">No actions</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    {members.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-16 text-center text-muted-foreground">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                                        <Shield className="w-6 h-6 opacity-30" />
                                    </div>
                                    <p>No members found in this workspace.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
