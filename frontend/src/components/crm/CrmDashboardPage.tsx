import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeadStore } from '@/stores/leadStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { Users, TrendingUp, Target, Flame, DollarSign, BarChart3, ExternalLink, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CrmDashboardPage() {
    const navigate = useNavigate();
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

    const navigateToLeads = (filter?: { status?: string; source?: string }) => {
        if (activeWorkspace) {
            const params = new URLSearchParams();
            if (filter?.status) params.set('status', filter.status);
            if (filter?.source) params.set('source', filter.source);
            const query = params.toString();
            navigate(`/workspace/${activeWorkspace.id}/crm/leads${query ? `?${query}` : ''}`);
        }
    };

    const navigateToDeals = () => {
        if (activeWorkspace) {
            navigate(`/workspace/${activeWorkspace.id}/crm/deals`);
        }
    };

    return (
        <div className="h-full overflow-y-auto p-6 bg-background">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Sales Dashboard</h1>
                    <button
                        onClick={() => navigateToLeads()}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        View All Leads
                        <ExternalLink size={14} />
                    </button>
                </div>

                {/* Summary Cards - Clickable */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <SummaryCard
                        title="Total Leads"
                        value={dashboardSummary?.totalLeads ?? 0}
                        icon={<Users size={20} />}
                        color="bg-blue-500"
                        onClick={() => navigateToLeads()}
                    />
                    <SummaryCard
                        title="This Month"
                        value={dashboardSummary?.newLeadsThisMonth ?? 0}
                        icon={<TrendingUp size={20} />}
                        color="bg-green-500"
                        onClick={() => navigateToLeads({ status: 'NEW' })}
                    />
                    <SummaryCard
                        title="Qualified"
                        value={dashboardSummary?.qualifiedLeads ?? 0}
                        icon={<Target size={20} />}
                        color="bg-indigo-500"
                        onClick={() => navigateToLeads({ status: 'QUALIFIED' })}
                    />
                    <SummaryCard
                        title="Hot Leads"
                        value={dashboardSummary?.hotLeads ?? 0}
                        icon={<Flame size={20} />}
                        color="bg-orange-500"
                        onClick={() => navigateToLeads()}
                        subtitle="Score 60+"
                    />
                    <SummaryCard
                        title="Converted"
                        value={dashboardSummary?.convertedLeads ?? 0}
                        icon={<TrendingUp size={20} />}
                        color="bg-emerald-500"
                        onClick={() => navigateToLeads({ status: 'CONVERTED' })}
                    />
                    <SummaryCard
                        title="Pipeline"
                        value={`₹${(dashboardSummary?.totalPipelineValue ?? 0).toLocaleString('en-IN')}`}
                        icon={<DollarSign size={20} />}
                        color="bg-purple-500"
                        isLarge
                        onClick={navigateToDeals}
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Conversion Funnel - Clickable Stages */}
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <BarChart3 size={20} className="text-muted-foreground" />
                            Conversion Funnel
                        </h2>
                        {conversionFunnel && (
                            <div className="space-y-3">
                                <FunnelBar
                                    label="New"
                                    value={conversionFunnel.new}
                                    max={Math.max(conversionFunnel.new, 1)}
                                    color="bg-blue-500"
                                    onClick={() => navigateToLeads({ status: 'NEW' })}
                                />
                                <FunnelBar
                                    label="Contacted"
                                    value={conversionFunnel.contacted}
                                    max={Math.max(conversionFunnel.new, 1)}
                                    color="bg-indigo-500"
                                    onClick={() => navigateToLeads({ status: 'CONTACTED' })}
                                />
                                <FunnelBar
                                    label="Qualified"
                                    value={conversionFunnel.qualified}
                                    max={Math.max(conversionFunnel.new, 1)}
                                    color="bg-green-500"
                                    onClick={() => navigateToLeads({ status: 'QUALIFIED' })}
                                />
                                <FunnelBar
                                    label="Converted"
                                    value={conversionFunnel.converted}
                                    max={Math.max(conversionFunnel.new, 1)}
                                    color="bg-emerald-500"
                                    onClick={() => navigateToLeads({ status: 'CONVERTED' })}
                                />
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

                    {/* Leads by Source - Clickable */}
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h2 className="text-lg font-semibold mb-4">Leads by Source</h2>
                        <div className="space-y-3">
                            {leadsBySource.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No data yet</p>
                            ) : (
                                leadsBySource.map((item) => (
                                    <div
                                        key={item.source}
                                        onClick={() => navigateToLeads({ source: item.source })}
                                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors group"
                                    >
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
                                            <ExternalLink size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ListTodo size={20} className="text-muted-foreground" />
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <QuickActionButton
                            label="View Hot Leads"
                            onClick={() => navigateToLeads()}
                            variant="fire"
                        />
                        <QuickActionButton
                            label="New Leads Today"
                            onClick={() => navigateToLeads({ status: 'NEW' })}
                            variant="primary"
                        />
                        <QuickActionButton
                            label="Create Lead Form"
                            onClick={() => activeWorkspace && navigate(`/workspace/${activeWorkspace.id}/crm/forms`)}
                            variant="secondary"
                        />
                        <QuickActionButton
                            label="View All Deals"
                            onClick={navigateToDeals}
                            variant="secondary"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ title, value, icon, color, isLarge, onClick, subtitle }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    isLarge?: boolean;
    onClick?: () => void;
    subtitle?: string;
}) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "bg-card border border-border rounded-lg p-4 transition-all",
                onClick && "cursor-pointer hover:border-primary/50 hover:shadow-md"
            )}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
                <div className={cn("p-1.5 rounded", color, "text-white")}>
                    {icon}
                </div>
            </div>
            <p className={cn("font-bold", isLarge ? "text-xl" : "text-2xl")}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
    );
}

function FunnelBar({ label, value, max, color, onClick }: {
    label: string;
    value: number;
    max: number;
    color: string;
    onClick?: () => void;
}) {
    const percentage = max > 0 ? (value / max) * 100 : 0;

    return (
        <div
            onClick={onClick}
            className={cn(
                "p-2 rounded-md transition-colors",
                onClick && "cursor-pointer hover:bg-muted/50"
            )}
        >
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

function QuickActionButton({ label, onClick, variant }: {
    label: string;
    onClick: () => void;
    variant: 'primary' | 'secondary' | 'fire';
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-4 py-3 rounded-md text-sm font-medium transition-colors text-left",
                variant === 'primary' && "bg-primary text-primary-foreground hover:opacity-90",
                variant === 'secondary' && "bg-muted hover:bg-muted/80 text-foreground",
                variant === 'fire' && "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90"
            )}
        >
            {label}
        </button>
    );
}
