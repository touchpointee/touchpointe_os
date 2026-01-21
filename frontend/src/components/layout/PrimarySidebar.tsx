import {
    Home,
    CheckSquare,
    MessageSquare,
    UsersRound,

    Sparkles,
    Video
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MyTasksIcon } from '@/components/icons/MyTasksIcon';
import { CrmIcon } from '@/components/icons/CrmIcon';

const navItems = [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: MyTasksIcon, label: 'My Tasks', path: '/my-tasks' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: CrmIcon, label: 'CRM', path: '/crm' },
    { icon: MessageSquare, label: 'Chat', path: '/chat' },
    { icon: Video, label: 'Meet', path: '/meet' },
    { icon: Sparkles, label: 'Agent', path: '/ai' },
    { icon: UsersRound, label: 'Team', path: '/team' },

];

export function PrimarySidebar() {
    return (
        <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[72px] bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))] flex flex-col items-center py-4 z-50 transition-colors duration-300">
            {/* Force Animation Style */}
            <style>
                {`
                    /* Background Animation (Subtle) */
                    @keyframes agent-blink-bg {
                        0%, 100% { opacity: 0.5; }
                        50% { opacity: 0.2; }
                    }
                    .agent-blink-bg {
                        animation: agent-blink-bg 3s cubic-bezier(0.4, 0, 0.6, 1) infinite !important;
                    }

                    /* Icon Animation (Bright + Zoom) */
                    @keyframes agent-blink-icon {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.6; transform: scale(1.2); }
                    }
                    .agent-blink-icon {
                        animation: agent-blink-icon 3s cubic-bezier(0.4, 0, 0.6, 1) infinite !important;
                    }
                `}
            </style>

            {/* SVG Gradient Definition */}
            <svg width="0" height="0" className="absolute">
                <defs>
                    <linearGradient id="agent-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#477df7" />
                        <stop offset="50%" stopColor="#a157fa" />
                        <stop offset="100%" stopColor="#f74787" />
                    </linearGradient>
                </defs>
            </svg>
            {/* Logo */}
            {/* Logo */}
            <div className="relative w-8 h-8 mb-6 flex items-center justify-center">
                {/* Gradient Blur/Spread Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#477df7] to-[#a157fa] rounded-full blur-[6px] opacity-60" />

                {/* Logo Image */}
                <div className="relative w-full h-full rounded-full overflow-hidden bg-black shadow-sm z-10">
                    <img src="/logo.jpeg" alt="TouchPointe" className="w-full h-full object-cover" />
                </div>
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
                                    ? 'shadow-sm text-white'
                                    : 'text-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-accent))]'
                            )
                        }
                        style={({ isActive }) => isActive ? { background: 'linear-gradient(94.03deg, #925FF8 -8.9%, #4175E4 100%)' } : undefined}
                    >
                        {({ isActive }) => (
                            <>
                                {/* Agent Background Shade */}
                                {label === 'Agent' && !isActive && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-br from-[#477df7] via-[#a157fa] to-[#f74787] rounded-lg blur-[6px] opacity-50 pointer-events-none agent-blink-bg" />
                                )}

                                <Icon
                                    className={cn("w-5 h-5 relative z-10", label === 'Agent' && "agent-blink-icon")}
                                    style={label === 'Agent' && !isActive ? { stroke: 'url(#agent-gradient)' } : undefined}
                                />

                                {/* Tooltip */}
                                <span className="absolute left-full ml-2 px-2 py-1 rounded nav-tooltip text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                    {label}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}
