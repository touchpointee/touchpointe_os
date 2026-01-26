import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Shield, Settings, Users, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SettingsPage() {
    return (
        <div className="flex h-[calc(100vh-56px)] bg-background">
            {/* Settings Sidebar */}
            <div className="w-64 border-r border-border p-4 bg-muted/20">
                <div className="mb-6 px-2">
                    <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
                    <p className="text-xs text-muted-foreground">Manage workspace preferences</p>
                </div>

                <nav className="space-y-1">
                    <SettingsLink to="/settings/general" icon={Settings} label="General" />
                    <SettingsLink to="/settings/team" icon={Users} label="Team & Roles" />
                    <SettingsLink to="/settings/security" icon={Shield} label="Security" />
                    <SettingsLink to="/settings/billing" icon={CreditCard} label="Billing" />
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto">
                <Routes>
                    <Route path="/" element={<Navigate to="general" replace />} /> {/* Default for now since others are empty */}

                    {/* Placeholders for other routes */}
                    <Route path="*" element={
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                            <div className="p-4 rounded-full bg-muted mb-4">
                                <Settings className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
                            <p className="text-muted-foreground max-w-md">
                                This settings section is under development. Check back later for updates.
                            </p>
                        </div>
                    } />
                </Routes>
            </div>
        </div>
    );
}

function SettingsLink({ to, icon: Icon, label }: { to: string, icon: any, label: string }) {
    const location = useLocation();
    // Match exact or sub-paths
    const isActive = location.pathname.startsWith(to);

    return (
        <Link
            to={to}
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
        >
            <Icon size={18} />
            {label}
        </Link>
    );
}
