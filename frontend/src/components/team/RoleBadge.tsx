import { WorkspaceRole } from '@/stores/teamStore';
import { Shield, ShieldAlert, User, Eye } from 'lucide-react';

interface RoleBadgeProps {
    role: WorkspaceRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
    switch (role) {
        case WorkspaceRole.OWNER:
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    <ShieldAlert className="w-3 h-3" /> Owner
                </span>
            );
        case WorkspaceRole.ADMIN:
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    <Shield className="w-3 h-3" /> Admin
                </span>
            );
        case WorkspaceRole.MEMBER:
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    <User className="w-3 h-3" /> Member
                </span>
            );
        case WorkspaceRole.VIEWER:
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <Eye className="w-3 h-3" /> Viewer
                </span>
            );
        default:
            return null;
    }
}
