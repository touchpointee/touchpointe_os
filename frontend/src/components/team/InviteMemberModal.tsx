import { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from '@/contexts/ToastContext';
import { useTeamStore, WorkspaceRole } from '@/stores/teamStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { X, Loader2 } from 'lucide-react';

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InviteMemberModal({ isOpen, onClose }: InviteMemberModalProps) {
    const { activeWorkspace } = useWorkspaces();
    const { inviteMember, isLoading } = useTeamStore();

    const [email, setEmail] = useState('');
    const [role, setRole] = useState<number>(WorkspaceRole.MEMBER);

    if (!isOpen || !activeWorkspace) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        const errorMsg = await inviteMember(activeWorkspace.id, email, role as WorkspaceRole);
        if (!errorMsg) {
            toast.success('Invitation Sent', `Invitation successfully sent to ${email}`);
            setEmail('');
            onClose();
        } else {
            toast.error('Invitation Failed', errorMsg);
            // Keep modal open
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <h2 className="text-lg font-semibold">Invite Member</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">Email or Username</label>
                            <input
                                id="email"
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="username or email@example.com"
                                className="w-full px-3 py-2 bg-muted/50 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                                autoFocus
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="role" className="text-sm font-medium">Role</label>
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(parseInt(e.target.value) as WorkspaceRole)}
                                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition-all text-foreground"
                            >
                                <option value={WorkspaceRole.ADMIN} className="bg-popover text-popover-foreground">Admin</option>
                                <option value={WorkspaceRole.MEMBER} className="bg-popover text-popover-foreground">Member</option>
                                <option value={WorkspaceRole.VIEWER} className="bg-popover text-popover-foreground">Viewer</option>
                            </select>
                            <p className="text-xs text-muted-foreground">
                                Admins can manage members and settings. Members can edit content. Viewers can only read.
                            </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!email.trim() || isLoading}
                                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Send Invitation
                            </button>
                        </div>
                    </>
                </form>
            </div>
        </div>,
        document.body
    );
}
