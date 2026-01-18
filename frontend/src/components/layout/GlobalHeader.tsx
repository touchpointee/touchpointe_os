import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Settings, ChevronDown, Moon, Sun, User, LogOut, Plus, Check, Menu } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { logout } from '@/lib/auth';
import { useWorkspaces } from '@/stores/workspaceStore';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';
import { CreateWorkspaceModal } from '@/components/workspace/CreateWorkspaceModal';
import { NotificationsPopover } from '@/components/layout/NotificationsPopover';

interface GlobalHeaderProps {
    workspaceName?: string;
    userName?: string;
    onOpenMobileMenu?: () => void;
}

export function GlobalHeader({ workspaceName = 'My Workspace', userName = 'User', onOpenMobileMenu }: GlobalHeaderProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { workspaces, activeWorkspace, setActiveWorkspace, clear: resetWorkspaces } = useWorkspaces();
    const userInitial = userName.charAt(0).toUpperCase();

    // Dropdown states
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const profileRef = useRef<HTMLDivElement>(null);
    const workspaceRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLButtonElement>(null);

    // Click outside handler
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
            if (workspaceRef.current && !workspaceRef.current.contains(event.target as Node)) {
                setIsWorkspaceOpen(false);
            }
            // Notifications handled by popover internal logic or similar
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        resetWorkspaces();
        // Also clear user store to prevent stale data
        useUserStore.getState().logout();
        navigate('/login', { replace: true });
    };

    const handleSwitchWorkspace = (id: string) => {
        setActiveWorkspace(id);
        setIsWorkspaceOpen(false);
        // Navigate to dashboard home with explicit workspace ID
        navigate(`/workspace/${id}/home`);
    };

    const currentWorkspaceName = activeWorkspace?.name || workspaceName;
    const currentWorkspaceInitial = currentWorkspaceName.charAt(0).toUpperCase();

    return (
        <header className="fixed top-0 left-0 right-0 h-14 glass border-b border-border/50 flex items-center justify-between px-4 z-40 md:left-[72px]">
            {/* Settings Animation Style */}
            <style>
                {`
                    @keyframes settings-spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .settings-spin {
                        transition: transform 0.3s ease;
                    }
                    .settings-group:hover .settings-spin {
                        animation: settings-spin 4s linear infinite;
                    }
                `}
            </style>
            {/* Left: Hamburger & Workspace Selector */}
            <div className="flex items-center gap-2">
                {/* Mobile Menu Button */}
                <button
                    onClick={onOpenMobileMenu}
                    className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="relative" ref={workspaceRef}>
                    <button
                        onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors"
                    >
                        <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground text-xs font-medium">
                                {currentWorkspaceInitial}
                            </span>
                        </div>
                        <span className="font-medium text-sm hidden sm:inline-block">{currentWorkspaceName}</span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>

                    {/* Workspace Dropdown */}
                    {isWorkspaceOpen && (
                        <div className="absolute left-0 top-full mt-2 w-64 bg-background border border-border rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                            <div className="max-h-[300px] overflow-y-auto py-1">
                                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Switch Workspace
                                </div>
                                {workspaces.map((ws) => (
                                    <button
                                        key={ws.id}
                                        onClick={() => handleSwitchWorkspace(ws.id)}
                                        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                <span className="text-primary font-medium">{ws.name.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className="font-medium truncate max-w-[140px]">{ws.name}</span>
                                                {/* <span className="text-xs text-muted-foreground hidden">Members: </span> */}
                                            </div>
                                        </div>
                                        {activeWorkspace?.id === ws.id && (
                                            <Check className="w-4 h-4 text-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className="border-t border-border p-1">
                                <button
                                    onClick={() => {
                                        setIsWorkspaceOpen(false);
                                        setIsCreateModalOpen(true);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Workspace
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-md mx-8 hidden sm:block">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search... (Ctrl+K)"
                        className="w-full h-9 pl-9 pr-4 rounded-lg bg-muted/50 border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all"
                    />
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
                    aria-label="Toggle theme"
                >
                    {theme === 'dark' ? (
                        <Sun className="w-5 h-5 text-muted-foreground" />
                    ) : (
                        <Moon className="w-5 h-5 text-muted-foreground" />
                    )}
                </button>

                {/* Settings Button */}
                {/* Settings Button */}
                <button
                    onClick={() => navigate('/settings')}
                    className={cn(
                        "settings-group w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                        (location.pathname.startsWith('/settings') && !isNotificationsOpen) ? "nav-item-selected" : "hover:bg-accent"
                    )}
                >
                    <Settings className="w-5 h-5 text-muted-foreground settings-spin" />
                </button>

                {/* Notifications */}
                <button
                    ref={notificationRef}
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className={cn(
                        "relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                        isNotificationsOpen ? "nav-item-selected" : "hover:bg-accent"
                    )}
                >
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
                </button>
                <NotificationsPopover
                    isOpen={isNotificationsOpen}
                    onClose={() => setIsNotificationsOpen(false)}
                    anchorRef={notificationRef}
                />

                {/* User Avatar with Dropdown */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="w-9 h-9 rounded-full bg-primary flex items-center justify-center hover:opacity-90 transition-opacity"
                    >
                        <span className="text-primary-foreground text-sm font-medium">{userInitial}</span>
                    </button>

                    {/* Dropdown Menu */}
                    <div className={cn(
                        "absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-lg shadow-xl overflow-hidden transition-all duration-200 origin-top-right",
                        isProfileOpen
                            ? "opacity-100 scale-100 visible"
                            : "opacity-0 scale-95 invisible"
                    )}>
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-border">
                            <p className="text-sm font-medium truncate">{userName}</p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                            <button
                                onClick={() => {
                                    setIsProfileOpen(false);
                                    navigate('/profile');
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors"
                            >
                                <User className="w-4 h-4 text-muted-foreground" />
                                Profile
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <CreateWorkspaceModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </header>
    );
}
