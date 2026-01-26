import { useEffect, useState } from 'react';
import { useLeadStore } from '@/stores/leadStore';
import type { Lead } from '@/stores/leadStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { X, Mail, Phone, Building2, Calendar, ArrowRight, Flame, Snowflake, Sun, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function LeadDetailPanel() {
    const {
        leads,
        activities,
        activeLeadId,
        isDetailPanelOpen,
        closeLeadDetail,
        fetchLeadActivities,
        updateLead,
        convertLead
    } = useLeadStore();
    const { activeWorkspace } = useWorkspaces();
    const [showConvertModal, setShowConvertModal] = useState(false);

    const lead = leads.find(l => l.id === activeLeadId);

    useEffect(() => {
        if (activeLeadId && activeWorkspace) {
            fetchLeadActivities(activeWorkspace.id, activeLeadId);
        }
    }, [activeLeadId, activeWorkspace]);

    if (!isDetailPanelOpen || !lead) return null;

    const getScoreIndicator = (score: number) => {
        if (score >= 60) return { icon: <Flame size={16} />, label: 'Hot', color: 'text-orange-500 bg-orange-100' };
        if (score >= 30) return { icon: <Sun size={16} />, label: 'Warm', color: 'text-yellow-600 bg-yellow-100' };
        return { icon: <Snowflake size={16} />, label: 'Cold', color: 'text-blue-500 bg-blue-100' };
    };

    const scoreInfo = getScoreIndicator(lead.score);

    const handleStatusChange = async (newStatus: string) => {
        if (!activeWorkspace) return;
        await updateLead(activeWorkspace.id, lead.id, { status: newStatus as Lead['status'] });
    };

    const handleConvert = async (options: { createCompany: boolean; createDeal: boolean; dealName?: string; dealValue?: number }) => {
        if (!activeWorkspace) return;
        try {
            await convertLead(activeWorkspace.id, lead.id, options);
            setShowConvertModal(false);
            closeLeadDetail();
        } catch (e) {
            console.error('Failed to convert lead:', e);
        }
    };

    return (
        <>
            <div
                className="fixed inset-0 bg-black/30 z-40"
                onClick={closeLeadDetail}
            />
            <div className="fixed right-0 top-0 h-full w-[480px] bg-card border-l border-border z-50 flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div>
                        <h2 className="text-lg font-semibold">{lead.fullName}</h2>
                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                    </div>
                    <button onClick={closeLeadDetail} className="p-2 hover:bg-muted rounded-md">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Score & Status */}
                    <div className="flex items-center gap-4">
                        <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full", scoreInfo.color)}>
                            {scoreInfo.icon}
                            <span className="text-sm font-medium">{lead.score} - {scoreInfo.label}</span>
                        </div>
                        <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="px-3 py-1.5 text-sm border border-border rounded-md bg-background"
                        >
                            <option value="NEW">New</option>
                            <option value="CONTACTED">Contacted</option>
                            <option value="QUALIFIED">Qualified</option>
                            <option value="UNQUALIFIED">Unqualified</option>
                            <option value="CONVERTED">Converted</option>
                        </select>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact Info</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 p-2 rounded bg-muted/50">
                                <Mail size={16} className="text-muted-foreground" />
                                <span className="text-sm">{lead.email}</span>
                            </div>
                            {lead.phone && (
                                <div className="flex items-center gap-3 p-2 rounded bg-muted/50">
                                    <Phone size={16} className="text-muted-foreground" />
                                    <span className="text-sm">{lead.phone}</span>
                                </div>
                            )}
                            {lead.companyName && (
                                <div className="flex items-center gap-3 p-2 rounded bg-muted/50">
                                    <Building2 size={16} className="text-muted-foreground" />
                                    <span className="text-sm">{lead.companyName}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 p-2 rounded bg-muted/50">
                                <Calendar size={16} className="text-muted-foreground" />
                                <span className="text-sm">Created {format(new Date(lead.createdAt), 'MMM d, yyyy')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Source */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Source</h3>
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "px-2 py-1 rounded text-xs font-medium",
                                lead.source === 'FACEBOOK' && "bg-blue-100 text-blue-700",
                                lead.source === 'GOOGLE' && "bg-red-100 text-red-700",
                                lead.source === 'FORM' && "bg-green-100 text-green-700",
                                lead.source === 'MANUAL' && "bg-gray-100 text-gray-700",
                                lead.source === 'REFERRAL' && "bg-purple-100 text-purple-700"
                            )}>
                                {lead.source}
                            </span>
                            {lead.utmCampaign && (
                                <span className="text-xs text-muted-foreground">
                                    Campaign: {lead.utmCampaign}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    {lead.notes && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Notes</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notes}</p>
                        </div>
                    )}

                    {/* Activity Timeline */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Activity</h3>
                        <div className="space-y-2">
                            {activities.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No activity yet</p>
                            ) : (
                                activities.map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-3 p-2 rounded bg-muted/30">
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <User size={12} className="text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm">{activity.description}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                                                {activity.scoreChange && (
                                                    <span className={cn(
                                                        "ml-2",
                                                        activity.scoreChange > 0 ? "text-green-600" : "text-red-600"
                                                    )}>
                                                        {activity.scoreChange > 0 ? '+' : ''}{activity.scoreChange} pts
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                {lead.status !== 'CONVERTED' && (
                    <div className="p-4 border-t border-border">
                        <button
                            onClick={() => setShowConvertModal(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
                        >
                            <ArrowRight size={16} />
                            Convert to Contact
                        </button>
                    </div>
                )}
            </div>

            {/* Convert Modal */}
            {showConvertModal && (
                <ConvertLeadModal
                    lead={lead}
                    onClose={() => setShowConvertModal(false)}
                    onConvert={handleConvert}
                />
            )}
        </>
    );
}

function ConvertLeadModal({ lead, onClose, onConvert }: {
    lead: any;
    onClose: () => void;
    onConvert: (options: { createCompany: boolean; createDeal: boolean; dealName?: string; dealValue?: number }) => void;
}) {
    const [createCompany, setCreateCompany] = useState(!!lead.companyName);
    const [createDeal, setCreateDeal] = useState(false);
    const [dealName, setDealName] = useState(`Deal with ${lead.fullName}`);
    const [dealValue, setDealValue] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        setIsLoading(true);
        await onConvert({ createCompany, createDeal, dealName, dealValue });
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="bg-card border border-border rounded-lg w-full max-w-md mx-4 shadow-xl">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold">Convert Lead to Contact</h2>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        This will create a new Contact from <strong>{lead.fullName}</strong>'s information.
                    </p>

                    {lead.companyName && (
                        <label className="flex items-center gap-3 p-3 rounded border border-border cursor-pointer hover:bg-muted/50">
                            <input
                                type="checkbox"
                                checked={createCompany}
                                onChange={(e) => setCreateCompany(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <div>
                                <p className="text-sm font-medium">Create Company</p>
                                <p className="text-xs text-muted-foreground">{lead.companyName}</p>
                            </div>
                        </label>
                    )}

                    <label className="flex items-center gap-3 p-3 rounded border border-border cursor-pointer hover:bg-muted/50">
                        <input
                            type="checkbox"
                            checked={createDeal}
                            onChange={(e) => setCreateDeal(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <div>
                            <p className="text-sm font-medium">Create Deal</p>
                            <p className="text-xs text-muted-foreground">Start a deal pipeline for this contact</p>
                        </div>
                    </label>

                    {createDeal && (
                        <div className="space-y-3 pl-7">
                            <div>
                                <label className="block text-sm font-medium mb-1">Deal Name</label>
                                <input
                                    type="text"
                                    value={dealName}
                                    onChange={(e) => setDealName(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Deal Value (₹)</label>
                                <input
                                    type="number"
                                    value={dealValue}
                                    onChange={(e) => setDealValue(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-2 p-4 border-t border-border">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
                    >
                        {isLoading ? 'Converting...' : 'Convert Lead'}
                    </button>
                </div>
            </div>
        </div>
    );
}
