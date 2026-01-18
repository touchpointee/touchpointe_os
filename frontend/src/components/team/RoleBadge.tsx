import { WorkspaceRole } from '@/stores/teamStore';
import { Shield, ShieldAlert, User, Eye } from 'lucide-react';

interface RoleBadgeProps {
    role: WorkspaceRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
    switch (role) {
        case WorkspaceRole.OWNER:
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-foreground dark:bg-purple-900/30 dark:text-foreground">
                    <ShieldAlert className="w-3 h-3" /> Owner
                </span>
            );
        case WorkspaceRole.ADMIN:
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-foreground dark:bg-blue-900/30 dark:text-foreground">
                    <Shield className="w-3 h-3" /> Admin
                </span>
            );
        case WorkspaceRole.MEMBER:
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-foreground dark:bg-green-900/30 dark:text-foreground">
                    <User className="w-3 h-3" /> Member
                </span>
            );
        case WorkspaceRole.VIEWER:
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-foreground dark:bg-gray-800 dark:text-foreground">
                    <Eye className="w-3 h-3" /> Viewer
                </span>
            );
        default:
            return null;
    }
}
