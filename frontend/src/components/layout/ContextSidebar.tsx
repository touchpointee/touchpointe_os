import { useLocation, useNavigate } from 'react-router-dom';
import {
    Home,
    Inbox,
    Star,
    Building2,
    Users,
    Hash,
    MessageCircle,
    UserPlus,
    Shield,
    CreditCard,
    Settings as SettingsIcon,
    ChevronRight,
    DollarSign,
    Video
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MyTasksSidebar } from '@/components/tasks/MyTasksSidebar';
import { TasksSidebar } from '@/components/tasks/TasksSidebar';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { AiSidebar } from '@/components/ai/AiSidebar';
import { useWorkspaces, isValidUUID } from '@/stores/workspaceStore';

// Wrapper to provide workspaceId from store
function TasksSidebarWrapper() {
    const { activeWorkspace } = useWorkspaces();
    const workspaceId = activeWorkspace?.id;

    if (!workspaceId || !isValidUUID(workspaceId)) {
        return <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>;
    }

    return <TasksSidebar workspaceId={workspaceId} />;
}

type ModuleType = 'home' | 'tasks' | 'my-tasks' | 'crm' | 'chat' | 'team' | 'settings' | 'ai';

interface SidebarItem {
    icon: React.ElementType;
    label: string;
    path?: string;
    children?: { label: string; path: string }[];
}

const moduleContent: Record<Exclude<ModuleType, 'crm' | 'ai' | 'tasks' | 'my-tasks'>, { title: string; items: SidebarItem[] }> = {
    home: {
        title: 'Home',
        items: [
            { icon: Home, label: 'Dashboard', path: '/home' },
            { icon: Inbox, label: 'Inbox', path: '/home/inbox' },
            { icon: Star, label: 'Favorites', path: '/home/favorites' },
            { icon: Video, label: 'Meet', path: '/meet' },
        ],
    },
    // CRM is handled dynamically
    chat: {
        title: 'Chat',
        items: [
            {
                icon: Hash, label: 'Channels', children: [
                    { label: '# general', path: '/chat/channels/general' },
                    { label: '# random', path: '/chat/channels/random' },
                ]
            },
            { icon: MessageCircle, label: 'Direct Messages', path: '/chat/dms' },
        ],
    },
    team: {
        title: 'Team',
        items: [
            { icon: Users, label: 'Members', path: '/team/members' },
            { icon: UserPlus, label: 'Invitations', path: '/team/invitations' },
        ],
    },
    settings: {
        title: 'Settings',
        items: [
            { icon: SettingsIcon, label: 'Workspace', path: '/settings/workspace' },
            { icon: CreditCard, label: 'Billing', path: '/settings/billing' },
            { icon: Shield, label: 'Security', path: '/settings/security' },
        ],
    },
};

function getModuleFromPath(pathname: string): ModuleType {
    const segments = pathname.split('/').filter(Boolean);

    if (segments[0] === 'my-tasks') return 'my-tasks';

    // Handle /workspace/:id/:module pattern
    if (segments[0] === 'workspace' && segments.length >= 3) {
        const module = segments[2] as ModuleType;
        return ['home', 'tasks', 'crm', 'chat', 'team', 'settings', 'ai'].includes(module) ? module : 'home';
    }

    const module = segments[0] as ModuleType;
    if (module === 'ai') return 'ai';
    return ['home', 'tasks', 'crm', 'chat', 'team', 'settings'].includes(module) ? module : 'home';
}

export function ContextSidebar({ className }: { className?: string }) {
    const location = useLocation();
    const { activeWorkspace } = useWorkspaces();
    const currentModule = getModuleFromPath(location.pathname);

    // Dynamic CRM Items
    const crmItems: SidebarItem[] = activeWorkspace ? [
        { icon: Home, label: 'Dashboard', path: `/workspace/${activeWorkspace.id}/crm/dashboard` },
        { icon: UserPlus, label: 'Leads', path: `/workspace/${activeWorkspace.id}/crm/leads` },
        { icon: DollarSign, label: 'Deals', path: `/workspace/${activeWorkspace.id}/crm/deals` },
        { icon: Building2, label: 'Companies', path: `/workspace/${activeWorkspace.id}/crm/companies` },
        { icon: Users, label: 'Contacts', path: `/workspace/${activeWorkspace.id}/crm/contacts` },
    ] : [];

    // Base classes for the sidebar container
    const sidebarClasses = cn(
        "bg-card border-r border-border/50 overflow-y-auto",
        // If className is provided, use it. Otherwise default to desktop fixed positioning
        className || "hidden lg:block fixed left-[72px] top-14 bottom-0 w-[260px]"
    );

    // For Tasks module, render the dynamic TasksSidebar
    if (currentModule === 'tasks') {
        return (
            <aside className={sidebarClasses}>
                <TasksSidebarWrapper />
            </aside>
        );
    }

    if (currentModule === 'my-tasks') {
        return (
            <aside className={sidebarClasses}>
                <MyTasksSidebar />
            </aside>
        );
    }

    if (currentModule === 'chat') {
        return (
            <aside className={sidebarClasses}>
                <ChatSidebar />
            </aside>
        );
    }

    if (currentModule === 'ai') {
        return (
            <aside className={sidebarClasses}>
                <AiSidebar />
            </aside>
        );
    }

    // Determine content for other modules
    let title = '';
    let items: SidebarItem[] = [];

    if (currentModule === 'crm') {
        title = 'CRM';
        items = crmItems;
    } else {
        const content = moduleContent[currentModule as keyof typeof moduleContent];
        title = content?.title || '';
        items = content?.items || [];
    }

    return (
        <aside className={sidebarClasses}>
            <div className="p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    {title}
                </h2>

                <nav className="space-y-1">
                    {items.map((item, i) => (
                        <SidebarItemComponent key={i} item={item} />
                    ))}

                    {currentModule === 'crm' && !activeWorkspace && (
                        <div className="px-3 py-2 text-sm text-amber-600 bg-amber-50 rounded-md">
                            Select a workspace to view CRM
                        </div>
                    )}
                </nav>
            </div>
        </aside>
    );
}

function SidebarItemComponent({ item }: { item: SidebarItem }) {
    const Icon = item.icon;
    const navigate = useNavigate();
    const location = useLocation();

    // Active check: strict includes for CRM to handle potential sub-routes?
    // User Requirement: pathname.includes("/crm/deals") -> active
    // FIX: Also check for non-workspace prefixed routes (e.g. /crm/deals vs /workspace/ID/crm/deals)
    const isActive = item.path && (
        location.pathname.includes(item.path) ||
        (item.path.includes('/crm/') && location.pathname.endsWith(item.path.split('/crm')[1]))
    );

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (item.path) {
            navigate(item.path);
        }
    };

    if (item.children) {
        return (
            <div className="space-y-1">
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    <ChevronRight className="w-3 h-3 ml-auto" />
                </div>
                <div className="ml-4 space-y-0.5">
                    {item.children.map((child, i) => (
                        <a
                            key={i}
                            href={child.path}
                            onClick={(e) => { e.preventDefault(); navigate(child.path); }}
                            className={cn(
                                "block px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer",
                                location.pathname.includes(child.path)
                                    ? "text-white font-medium shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                            style={location.pathname.includes(child.path) ? { background: 'linear-gradient(94.03deg, #925FF8 -8.9%, #4175E4 100%)' } : undefined}
                        >
                            {child.label}
                        </a>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <a
            href={item.path}
            onClick={handleClick}
            className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer',
                isActive
                    ? 'text-white font-medium shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
            style={isActive ? { background: 'linear-gradient(94.03deg, #925FF8 -8.9%, #4175E4 100%)' } : undefined}
        >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
        </a>
    );
}
