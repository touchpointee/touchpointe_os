import { useState } from 'react';
import { type TeamMember, WorkspaceRole } from '@/stores/teamStore';
import { RoleBadge } from './RoleBadge';
import { Trash2, Edit } from 'lucide-react';

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
        <div className="rounded-lg border border-border overflow-hidden bg-card shadow-sm">
            <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                    <tr>
                        <th className="px-5 py-3.5">Name</th>
                        <th className="px-5 py-3.5">Email</th>
                        <th className="px-5 py-3.5">Role</th>
                        <th className="px-5 py-3.5">Joined</th>
                        <th className="px-5 py-3.5 w-[100px]">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {members.map((member) => (
                        <tr key={member.memberId} className="group hover:bg-muted/50 transition-colors">
                            <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border/50">
                                        {member.avatarUrl ? (
                                            <img src={member.avatarUrl} alt={member.fullName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-semibold text-muted-foreground">
                                                {member.fullName.substring(0, 2).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-foreground/90">{member.fullName}</div>
                                        {member.userId === currentUserId && <span className="text-xs text-muted-foreground font-medium">(You)</span>}
                                    </div>
                                </div>
                            </td>
                            <td className="px-5 py-4 text-muted-foreground font-medium">{member.email}</td>
                            <td className="px-5 py-4">
                                {editingId === member.memberId ? (
                                    <select
                                        className="bg-transparent border border-input rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary"
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
                                ) : (
                                    <RoleBadge role={member.role} />
                                )}
                            </td>
                            <td className="px-5 py-4 text-muted-foreground text-xs font-medium">
                                {new Date(member.joinedAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </td>
                            <td className="px-5 py-4">
                                {canManageCheck(member.role) && member.userId !== currentUserId && member.role !== WorkspaceRole.OWNER && (
                                    <div className="flex items-center gap-1 transition-opacity">
                                        <button
                                            onClick={() => setEditingId(member.memberId)}
                                            className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors"
                                            title="Edit Role"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to remove this member?')) {
                                                    onRemoveMember(member.memberId);
                                                }
                                            }}
                                            className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md text-muted-foreground transition-colors"
                                            title="Remove Member"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                    {members.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                                <p className="text-sm">No members found.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
