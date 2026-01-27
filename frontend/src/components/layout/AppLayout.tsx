import { useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { PrimarySidebar } from './PrimarySidebar';
import { GlobalHeader } from './GlobalHeader';
import { ContextSidebar } from './ContextSidebar';
import { MobileSidebar } from './MobileSidebar';
import { InvitationHandler } from '@/components/auth/InvitationHandler';
import { RealtimeManager } from '@/components/shared/RealtimeManager';

interface AppLayoutProps {
    children: ReactNode;
    hideContextSidebar?: boolean;
    hidePrimarySidebar?: boolean;
}

export function AppLayout({ children, hideContextSidebar = false, hidePrimarySidebar = false }: AppLayoutProps) {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-background pt-14">
            {!hidePrimarySidebar && <PrimarySidebar />}
            <GlobalHeader onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
            {!hideContextSidebar && !hidePrimarySidebar && <ContextSidebar />}

            <MobileSidebar
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <InvitationHandler />
            <RealtimeManager />

            {/* Main Content Area */}
            <main className={cn(
                "h-[calc(100vh-56px)] overflow-hidden transition-all duration-300",
                // If primary sidebar hidden -> ml-0
                // Else -> standard margins. Chat uses wider sidebar (320px + 72px = 392px)
                hidePrimarySidebar ? "ml-0" : (
                    hideContextSidebar ? "md:ml-[72px]" :
                        (location.pathname.includes('/chat') ? "md:ml-[72px] lg:ml-[392px]" : "md:ml-[72px] lg:ml-[332px]")
                )
            )}>
                {(location.pathname.startsWith('/chat') || location.pathname.includes('/chat')) || location.pathname.startsWith('/ai') || hideContextSidebar ? (
                    children
                ) : (
                    <div className="h-full pt-4 pl-4 md:pt-6 md:pl-6">
                        <div className="surface-elevated rounded-tl-2xl h-full flex flex-col overflow-hidden pt-4 pl-4 md:pt-6 md:pl-6 bg-card/50 border border-white/5">
                            <div className="flex-1 overflow-y-auto no-scrollbar">
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
