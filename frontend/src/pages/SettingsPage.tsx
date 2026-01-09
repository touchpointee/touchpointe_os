import { Shield, Settings, Users, CreditCard } from 'lucide-react';

export function SettingsPage() {
    return (
        <div className="min-h-[calc(100vh-56px)] w-full flex flex-col items-center justify-center p-8 bg-background relative overflow-hidden">

            {/* Subtle Animated Background Blobs */}
            <div className="absolute top-[30%] left-[20%] w-[350px] h-[350px] bg-muted rounded-full blur-[80px] -z-10 animate-pulse duration-[7000ms]" />
            <div className="absolute bottom-[20%] right-[20%] w-[300px] h-[300px] bg-primary/5 rounded-full blur-[60px] -z-10 animate-pulse delay-500 duration-[5000ms]" />

            <div className="max-w-2xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Badge */}
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-muted border border-border text-muted-foreground text-xs font-medium mb-4">
                    In active development
                </div>

                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                    Settings are coming soon
                </h1>

                <p className="text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto">
                    Centralized control for your workspace. Manage permissions, billing, and integrations in one place.
                </p>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left pt-8">
                    <FeatureCard icon={Settings} title="Workspace Configuration" description="Customize preferences & branding." />
                    <FeatureCard icon={Users} title="Team Roles & Permissions" description="Granular access control." />
                    <FeatureCard icon={Shield} title="Security & Sessions" description="MFA enforcement & audit logs." />
                    <FeatureCard icon={CreditCard} title="Billing & Usage" description="Manage plans and tracking." />
                </div>

                {/* Coming Soon Button */}
                <div className="pt-8">
                    <button disabled className="px-6 py-3 rounded-xl bg-muted text-muted-foreground font-medium text-sm cursor-not-allowed border border-border">
                        Available in the next update
                    </button>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="p-4 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-accent-foreground/20 transition-all duration-300 shadow-sm">
            <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-muted text-foreground shrink-0">
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
                </div>
            </div>
        </div>
    );
}
