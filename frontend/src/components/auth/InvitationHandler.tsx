import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiGet, apiPost } from '@/lib/api';
import { useWorkspaces } from '@/stores/workspaceStore';
import { Check, X, Loader2 } from 'lucide-react';

interface Invitation {
    id: string;
    token: string;
    workspaceName: string;
    inviterName: string;
    role: number;
}

export function InvitationHandler() {
    const { fetchWorkspaces } = useWorkspaces();
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchInvitations = async () => {
        try {
            const data = await apiGet<Invitation[]>('/invitations');
            setInvitations(data);
        } catch (e) {
            console.error("Failed to fetch invitations", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Simple check to ensure we only fetch if logged in?
        // apiGet handles token retrieval internally.
        fetchInvitations();
    }, []);

    const handleAccept = async (token: string) => {
        setActionLoading(token);
        try {
            await apiPost(`/invitations/${token}/accept`, {});
            // Refresh workspaces to show the new one
            await fetchWorkspaces();
            // Remove from list
            setInvitations(prev => prev.filter(i => i.token !== token));
        } catch (e: any) {
            alert(e.message || 'Failed to accept');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (token: string) => {
        setActionLoading(token);
        try {
            await apiPost(`/invitations/${token}/reject`, {});
            setInvitations(prev => prev.filter(i => i.token !== token));
        } catch (e: any) {
            alert(e.message || 'Failed to reject');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading || invitations.length === 0) return null;

    return createPortal(
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
            {invitations.map((inv) => (
                <div key={inv.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5">
                    <div className="flex-1">
                        <h4 className="font-semibold text-sm">Workspace Invitation</h4>
                        <p className="text-xs text-zinc-500 mt-1">
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{inv.inviterName}</span> invited you to join <span className="font-medium text-zinc-900 dark:text-zinc-100">{inv.workspaceName}</span>.
                        </p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleAccept(inv.token)}
                            disabled={actionLoading === inv.token}
                            className="p-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors disabled:opacity-50"
                            title="Accept"
                        >
                            {actionLoading === inv.token ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => handleReject(inv.token)}
                            disabled={actionLoading === inv.token}
                            className="p-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors disabled:opacity-50"
                            title="Reject"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>,
        document.body
    );
}
