import { useState } from 'react';
import { WorkspaceRole } from '@/stores/teamStore';
import { Loader2, X } from 'lucide-react';

interface InviteMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onInvite: (email: string, role: WorkspaceRole) => Promise<boolean>;
}

export function InviteMemberDialog({ open, onOpenChange, onInvite }: InviteMemberDialogProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<string>(WorkspaceRole.MEMBER.toString());
    const [loading, setLoading] = useState(false);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        const success = await onInvite(email, Number(role) as WorkspaceRole);
        setLoading(false);

        if (success) {
            setEmail('');
            setRole(WorkspaceRole.MEMBER.toString());
            onOpenChange(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg w-full max-w-md p-6 relative">
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-700"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-semibold mb-4">Invite Team Member</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Email or Username
                        </label>
                        <input
                            id="email"
                            type="text"
                            className="w-full px-3 py-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="colleague@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="role" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Role
                        </label>
                        <select
                            id="role"
                            className="w-full px-3 py-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value={WorkspaceRole.ADMIN.toString()}>Admin</option>
                            <option value={WorkspaceRole.MEMBER.toString()}>Member</option>
                            <option value={WorkspaceRole.VIEWER.toString()}>Viewer</option>
                        </select>
                        <p className="text-xs text-zinc-500">
                            Admins can manage the team. Members can edit content. Viewers are read-only.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Send Invitation
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
