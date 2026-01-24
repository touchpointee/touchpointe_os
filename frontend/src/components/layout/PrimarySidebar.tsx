import {
    CheckSquare,
    MessageSquare,
    UsersRound,

    Sparkles,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MyTasksIcon } from '@/components/icons/MyTasksIcon';
import { CrmIcon } from '@/components/icons/CrmIcon';

export function PrimarySidebar() {
    return (
        <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[80px] bg-[hsl(var(--sidebar-bg))] border-r border-[hsl(var(--sidebar-border))] flex flex-col items-center py-6 z-50 transition-all duration-300 shadow-xl backdrop-blur-md bg-opacity-95">
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
            <div className="relative w-10 h-10 mb-8 flex items-center justify-center shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#477df7] to-[#a157fa] rounded-xl blur-[6px] opacity-60" />
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-black shadow-lg z-10 ring-1 ring-white/10">
                    <img src="/logo.jpeg" alt="TouchPointe" className="w-full h-full object-cover" />
                </div>
            </div>

            {/* Navigation Groups */}
            <nav className="flex-1 flex flex-col w-full px-3 gap-4 overflow-y-auto no-scrollbar pt-2">
                <NavItem icon={MyTasksIcon} label="My Tasks" path="/my-tasks" />
                <NavItem icon={CheckSquare} label="Tasks" path="/tasks" />
                <NavItem icon={CrmIcon} label="CRM" path="/crm" />
                <NavItem icon={MessageSquare} label="Chat" path="/chat" />
                <NavItem icon={Sparkles} label="Agent" path="/ai" isAgent />
                <NavItem icon={UsersRound} label="Team" path="/team" />
            </nav>

            {/* Bottom Section (Settings/Profile placeholder if needed) */}
            <div className="mt-auto px-3 pb-2 pt-4">
                {/* Could add settings here later */}
            </div>
        </aside>
    );
}

function NavItem({ icon: Icon, label, path, isAgent }: { icon: any, label: string, path: string, isAgent?: boolean }) {
    return (
        <NavLink
            to={path}
            className={({ isActive }) =>
                cn(
                    'group relative flex items-center justify-center w-10 h-10 md:w-full md:h-12 rounded-xl transition-all duration-300',
                    isActive
                        ? 'shadow-[0_0_15px_-3px_rgba(var(--primary),0.3)]'
                        : 'text-[hsl(var(--sidebar-muted))] hover:text-[hsl(var(--sidebar-fg))] hover:bg-[hsl(var(--sidebar-accent))] hover:scale-105 active:scale-95'
                )
            }
            style={({ isActive }) => isActive ? {
                background: 'linear-gradient(94.03deg, #925FF8 -8.9%, #4175E4 100%)',
                color: 'white'
            } : undefined}
        >
            {({ isActive }) => (
                <>
                    {/* Agent Background Shade */}
                    {isAgent && !isActive && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-[#477df7] via-[#a157fa] to-[#f74787] rounded-lg blur-[8px] opacity-40 pointer-events-none agent-blink-bg" />
                    )}

                    <Icon
                        className={cn("w-[22px] h-[22px] relative z-10 transition-transform duration-300 group-hover:rotate-3", isAgent && "agent-blink-icon")}
                        style={isAgent && !isActive ? { stroke: 'url(#agent-gradient)' } : undefined}
                    />

                    {/* Tooltip */}
                    <span className="absolute left-full ml-4 px-3 py-1.5 rounded-lg bg-popover text-popover-foreground text-xs font-semibold shadow-xl border border-border/50 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap z-[100]">
                        {label}
                        {/* Little Arrow */}
                        <span className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-popover rotate-45 border-l border-b border-border/50"></span>
                    </span>

                    {/* Active Indicator Dot (Optional flair) */}
                    {isActive && (
                        <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-3 bg-white/30 rounded-full md:hidden" />
                    )}
                </>
            )}
        </NavLink>
    );
}
