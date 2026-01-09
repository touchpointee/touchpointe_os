import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PrimarySidebar } from './PrimarySidebar';
import { GlobalHeader } from './GlobalHeader';
import { ContextSidebar } from './ContextSidebar';
import { InvitationHandler } from '@/components/auth/InvitationHandler';

interface AppLayoutProps {
    children: ReactNode;
    hideContextSidebar?: boolean;
}

export function AppLayout({ children, hideContextSidebar = false }: AppLayoutProps) {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-background pt-14">
            <PrimarySidebar />
            <GlobalHeader />
            {!hideContextSidebar && <ContextSidebar />}
            <InvitationHandler />

            {/* Main Content Area */}
            <main className={cn(
                "h-[calc(100vh-56px)] overflow-hidden transition-all duration-300",
                hideContextSidebar ? "ml-[72px]" : "ml-[332px]"
            )}>
                {location.pathname.startsWith('/chat') || location.pathname.startsWith('/ai') || hideContextSidebar ? (
                    children
                ) : (
                    <div className="h-full p-6">
                        <div className="surface-elevated rounded-tl-2xl h-full flex flex-col overflow-hidden p-6 bg-card/50 border border-white/5">
                            <div className="flex-1 overflow-y-auto">
                                {children}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export { PrimarySidebar, GlobalHeader, ContextSidebar };
