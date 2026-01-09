import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '@/stores/userStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { Loader2 } from 'lucide-react';
import { logout } from '@/lib/auth';

interface AuthGuardProps {
    children: React.ReactNode;
    requireWorkspace?: boolean;
}

export function AuthGuard({ children, requireWorkspace = true }: AuthGuardProps) {
    const location = useLocation();
    const { user, fetchUser, isLoading: isUserLoading } = useUserStore();
    const {
        workspaces,
        fetchWorkspaces,
        createWorkspace,
        activeWorkspace,
        isLoading: isWorkspaceLoading,
        isBootstrapped
    } = useWorkspaces();

    const [isInitializing, setIsInitializing] = useState(true);

    useEffect(() => {
        const init = async () => {
            // 1. Strict Token Check
            const token = localStorage.getItem('token');
            if (!token) {
                // No need to do anything, render check below will redirect
                setIsInitializing(false);
                return;
            }

            try {
                // 2. Load User if not present
                if (!user) {
                    await fetchUser();
                    // If fetchUser fails (401), api.ts handles redirect
                    const currentUser = useUserStore.getState().user;
                    if (!currentUser) {
                        // User cleared or failed?
                        console.error('AuthGuard: User fetch failed. Clearing token.');
                        logout();
                        setIsInitializing(false);
                        return;
                    }
                }

                // 3. Load Workspaces if not bootstrapped
                // We rely on isBootstrapped flag from store which is set to true after first fetch
                if (!isBootstrapped) {
                    const fetched = await fetchWorkspaces();

                    // 4. Auto-create if empty (Zero Data Policy)
                    if (fetched.length === 0) {
                        // Double check store to be safe
                        if (useWorkspaces.getState().workspaces.length === 0) {
                            await createWorkspace('My Workspace');
                        }
                    }
                }

            } catch (error) {
                console.error('AuthGuard initialization failed:', error);
                // Usually api.ts handles 401s. For other errors, we might want to show error or retry.
                // But if it's critical enough to prevent loading, logout.
                logout();
            } finally {
                setIsInitializing(false);
            }
        };

        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    // LOADING STATE
    if (isInitializing || isUserLoading || (isWorkspaceLoading && !isBootstrapped && workspaces.length === 0)) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="mt-2 text-sm text-zinc-500">Initializing workspace...</p>
                </div>
            </div>
        );
    }

    // AUTH CHECK
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // USER CHECK
    if (!user) {
        // Should have been caught by fetchUser failure/redirect, but slight race possible?
        // If we are here, isInitializing is false, but no user. Token exists.
        // Likely fetchUser failed non-fatally? 
        // Force login.
        logout();
        return <Navigate to="/login" replace />;
    }

    // WORKSPACE CHECK
    if (requireWorkspace) {
        if (!activeWorkspace) {
            // Workspaces loaded, but none active? 
            // Logic in store tries to select active.
            // If we have workspaces but no active one (rare), show selector or error?
            // If we have 0 workspaces (create failed), show fallback?

            if (workspaces.length === 0) {
                return (
                    <div className="flex h-screen items-center justify-center">
                        <div className="text-center">
                            <h2 className="text-lg font-semibold">No Workspace Found</h2>
                            <p className="text-muted-foreground">We couldn't create a workspace for you.</p>
                            <button onClick={() => window.location.reload()} className="mt-4 btn btn-primary">Retry</button>
                        </div>
                    </div>
                );
            }

            // If workspaces exist but none active, manually select first? (Store should have done this)
            // Just render children and hope for best? Or block?
            // Preventing "No active workspace" render error is safer.
            return (
                <div className="flex h-screen items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                        <p className="mt-2 text-sm text-zinc-500">Selecting workspace...</p>
                    </div>
                </div>
            );
        }
    }

    return <>{children}</>;
}
