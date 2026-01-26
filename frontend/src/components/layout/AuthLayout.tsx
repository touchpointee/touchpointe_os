import type { ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full bg-background-dark flex items-center justify-center font-sans overflow-x-hidden relative px-4 py-8">
            {/* Content */}
            <div className="relative z-10 w-full">
                {children}
            </div>
        </div>
    );
}
