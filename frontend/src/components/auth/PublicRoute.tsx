import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '@/lib/auth';

interface PublicRouteProps {
    children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
    const user = getCurrentUser();
    // ideally we'd know the last active workspace. 
    // For now, if logged in, we redirect to /home which will be handled by the app's main redirect logic 
    // or we can try to fetch workspaces if we have access to store state here.
    // However, store might not be initialized if we just landed.

    if (user) {
        // Attempt to find a robust redirection target.
        // Since we don't assume we have workspaces loaded yet if we just hit /login while having a token in LS,
        // We might default to /home or check store.
        // Let's rely on the assumption that if they are authenticated, they should be in the app.
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
