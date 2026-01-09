import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspaces } from '@/stores/workspaceStore';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export function AcceptInvitePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const { acceptInvitation } = useWorkspaces();

    const [status, setStatus] = useState<'validating' | 'success' | 'error'>('validating');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage('Invitation token is missing.');
            return;
        }

        const handleAccept = async () => {
            try {
                const workspace = await acceptInvitation(token);
                setStatus('success');
                // Redirect after small delay
                setTimeout(() => {
                    navigate(`/workspace/${workspace.id}/home`);
                }, 1500);
            } catch (e: any) {
                setStatus('error');
                setErrorMessage(e.message || 'Failed to accept invitation.');
            }
        };

        handleAccept();
    }, [token, acceptInvitation, navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
            <div className="w-full max-w-md bg-background border border-border shadow-2xl rounded-xl p-8 text-center animate-in fade-in zoom-in-95">

                {status === 'validating' && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <h2 className="text-xl font-semibold">Joining Workspace...</h2>
                        <p className="text-muted-foreground">Please wait while we verify your invitation.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-4">
                        <CheckCircle className="w-12 h-12 text-green-500 animate-in zoom-in spin-in-12" />
                        <h2 className="text-xl font-semibold">Success!</h2>
                        <p className="text-muted-foreground">You have joined the workspace. Redirecting...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-4">
                        <XCircle className="w-12 h-12 text-destructive animate-in shake" />
                        <h2 className="text-xl font-semibold">Invitation Failed</h2>
                        <p className="text-destructive font-medium">{errorMessage}</p>
                        <button
                            onClick={() => navigate('/home')}
                            className="mt-4 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm font-medium transition-colors"
                        >
                            Return to Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
