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
import { cn } from '@/lib/utils';

const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: Users, label: 'CRM', path: '/crm' },
    { icon: MessageSquare, label: 'Chat', path: '/chat' },
    { icon: Sparkles, label: 'Agent', path: '/ai' },
    { icon: UsersRound, label: 'Team', path: '/team' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

export function PrimarySidebar() {
    return (
        <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[72px] bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))] flex flex-col items-center py-4 z-50 transition-colors duration-300">
            {/* Logo */}
            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--sidebar-accent))] flex items-center justify-center mb-6">
                <span className="text-[hsl(var(--sidebar-fg))] font-bold text-lg">T</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col gap-1 w-full px-3">
                {navItems.map(({ icon: Icon, label, path }) => (
                    <NavLink
                        key={path}
                        to={path}
                        className={({ isActive }) =>
                            cn(
                                'group relative flex items-center justify-center w-full h-12 rounded-lg transition-all duration-200',
                                isActive
                                    ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-fg))] shadow-sm'
                                    : 'text-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-accent))]'
                            )
                        }
                    >
                        <Icon className="w-5 h-5" />

                        {/* Tooltip */}
                        <span className="absolute left-full ml-2 px-2 py-1 rounded bg-zinc-900 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            {label}
                        </span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}
