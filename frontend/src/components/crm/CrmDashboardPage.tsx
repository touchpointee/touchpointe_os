import { useEffect } from 'react';
import { useLeadStore } from '@/stores/leadStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { Users, TrendingUp, Target, Flame, DollarSign, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CrmDashboardPage() {
    const {
        dashboardSummary,
        leadsBySource,
        conversionFunnel,
        fetchDashboardSummary,
        fetchLeadsBySource,
        fetchConversionFunnel
    } = useLeadStore();
    const { activeWorkspace } = useWorkspaces();

    useEffect(() => {
        if (activeWorkspace) {
            fetchDashboardSummary(activeWorkspace.id);
            fetchLeadsBySource(activeWorkspace.id);
            fetchConversionFunnel(activeWorkspace.id);
        }
    }, [activeWorkspace]);

    return (
        <div className="h-full overflow-y-auto p-6 bg-background">
            <div className="max-w-7xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold tracking-tight">Sales Dashboard</h1>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <SummaryCard
                        title="Total Leads"
                        value={dashboardSummary?.totalLeads ?? 0}
                        icon={<Users size={20} />}
                        color="bg-blue-500"
                    />
                    <SummaryCard
                        title="This Month"
                        value={dashboardSummary?.newLeadsThisMonth ?? 0}
                        icon={<TrendingUp size={20} />}
                        color="bg-green-500"
                    />
                    <SummaryCard
                        title="Qualified"
                        value={dashboardSummary?.qualifiedLeads ?? 0}
                        icon={<Target size={20} />}
                        color="bg-indigo-500"
                    />
                    <SummaryCard
                        title="Hot Leads"
                        value={dashboardSummary?.hotLeads ?? 0}
                        icon={<Flame size={20} />}
                        color="bg-orange-500"
                    />
                    <SummaryCard
                        title="Converted"
                        value={dashboardSummary?.convertedLeads ?? 0}
                        icon={<TrendingUp size={20} />}
                        color="bg-emerald-500"
                    />
                    <SummaryCard
                        title="Pipeline"
                        value={`₹${(dashboardSummary?.totalPipelineValue ?? 0).toLocaleString('en-IN')}`}
                        icon={<DollarSign size={20} />}
                        color="bg-purple-500"
                        isLarge
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Conversion Funnel */}
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <BarChart3 size={20} className="text-muted-foreground" />
                            Conversion Funnel
                        </h2>
                        {conversionFunnel && (
                            <div className="space-y-3">
                                <FunnelBar label="New" value={conversionFunnel.new} max={Math.max(conversionFunnel.new, 1)} color="bg-blue-500" />
                                <FunnelBar label="Contacted" value={conversionFunnel.contacted} max={Math.max(conversionFunnel.new, 1)} color="bg-indigo-500" />
                                <FunnelBar label="Qualified" value={conversionFunnel.qualified} max={Math.max(conversionFunnel.new, 1)} color="bg-green-500" />
                                <FunnelBar label="Converted" value={conversionFunnel.converted} max={Math.max(conversionFunnel.new, 1)} color="bg-emerald-500" />
                            </div>
                        )}
                        {dashboardSummary && (
                            <div className="mt-4 pt-4 border-t border-border">
                                <p className="text-sm text-muted-foreground">
                                    Conversion Rate: <span className="font-bold text-foreground">{dashboardSummary.conversionRate}%</span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Leads by Source */}
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h2 className="text-lg font-semibold mb-4">Leads by Source</h2>
                        <div className="space-y-3">
                            {leadsBySource.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No data yet</p>
                            ) : (
                                leadsBySource.map((item) => (
                                    <div key={item.source} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                "w-3 h-3 rounded-full",
                                                item.source === 'FACEBOOK' && "bg-blue-500",
                                                item.source === 'GOOGLE' && "bg-red-500",
                                                item.source === 'FORM' && "bg-green-500",
                                                item.source === 'MANUAL' && "bg-gray-500",
                                                item.source === 'REFERRAL' && "bg-purple-500",
                                                item.source === 'ZAPIER' && "bg-orange-500"
                                            )} />
                                            <span className="text-sm font-medium">{item.source}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold">{item.count}</span>
                                            <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ title, value, icon, color, isLarge }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    isLarge?: boolean;
}) {
    return (
        <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
                <div className={cn("p-1.5 rounded", color, "text-white")}>
                    {icon}
                </div>
            </div>
            <p className={cn("font-bold", isLarge ? "text-xl" : "text-2xl")}>{value}</p>
        </div>
    );
}

function FunnelBar({ label, value, max, color }: {
    label: string;
    value: number;
    max: number;
    color: string;
}) {
    const percentage = max > 0 ? (value / max) * 100 : 0;

    return (
        <div>
            <div className="flex items-center justify-between text-sm mb-1">
                <span>{label}</span>
                <span className="font-bold">{value}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all", color)}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
