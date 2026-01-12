import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

import { ContextSidebar } from './ContextSidebar';
import {
    Home,
    CheckSquare,
    Users,
    MessageSquare,
    UsersRound,
    Settings,
    Sparkles
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: Users, label: 'CRM', path: '/crm' },
    { icon: MessageSquare, label: 'Chat', path: '/chat' },
    { icon: Sparkles, label: 'Agent', path: '/ai' },
    { icon: UsersRound, label: 'Team', path: '/team' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

function PrimarySidebarMobileAdapter() {
    return (
        <nav className="space-y-1">
            {navItems.map(({ icon: Icon, label, path }) => (
                <NavLink
                    key={path}
                    to={path}
                    className={({ isActive }) =>
                        cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                            isActive
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        )
                    }
                >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                </NavLink>
            ))}
        </nav>
    );
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <div className={cn(
            "fixed inset-0 z-50 lg:hidden transition-all duration-300",
            isOpen ? "visible" : "invisible pointer-events-none"
        )}>
            {/* Backdrop */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-[300px] bg-background border-r border-border shadow-2xl transition-transform duration-300 flex flex-col",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <span className="font-bold text-lg">Menu</span>
                    <button onClick={onClose} className="p-2 hover:bg-accent rounded-md">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-6">
                        <div className="mobile-primary-nav">
                            <PrimarySidebarMobileAdapter />
                        </div>

                        <div className="w-full h-px bg-border/50" />

                        <div className="mobile-context-nav">
                            <div className="relative">
                                {/* Context Sidebar Content */}
                                <ContextSidebar className="w-full block static border-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
