import { useEffect, useState } from 'react';
import { X, Copy, Check, User } from 'lucide-react';
import { useCrmStore } from '@/stores/crmStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const DEAL_STAGES = [
    { id: 'NEW', label: 'New', color: 'bg-blue-500' },
    { id: 'DISCOVERY', label: 'Discovery', color: 'bg-indigo-500' },
    { id: 'PROPOSAL', label: 'Proposal', color: 'bg-purple-500' },
    { id: 'NEGOTIATION', label: 'Negotiation', color: 'bg-orange-500' },
    { id: 'CLOSED_WON', label: 'Won', color: 'bg-green-500' },
    { id: 'CLOSED_LOST', label: 'Lost', color: 'bg-red-500' },
] as const;

export function DealDetailPanel() {
    const {
        deals,
        activeDealId,
        isDetailPanelOpen,
        closeDealDetail,
        updateDeal,
        updateDealStage,
        fetchActivities,
        activities,
        fetchCompanies,
        companies,
        fetchContacts,
        contacts
    } = useCrmStore();
    const { activeWorkspace } = useWorkspaces();

    const [stageOpen, setStageOpen] = useState(false);

    useEffect(() => {
        if (activeDealId && isDetailPanelOpen && activeWorkspace) {
            fetchActivities(activeWorkspace.id, activeDealId, 'Deal');
            fetchCompanies(activeWorkspace.id);
            fetchContacts(activeWorkspace.id);
        }
    }, [activeDealId, isDetailPanelOpen, activeWorkspace, fetchActivities, fetchCompanies, fetchContacts]);

    if (!isDetailPanelOpen || !activeDealId) return null;

    // Find deal from store (or fetch specifically if needed, but store usually has it from board)
    const deal = deals.find(d => d.id === activeDealId);

    if (!deal || !activeWorkspace) return null;

    const handleNameBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        if (e.target.value !== deal.name) {
            updateDeal(activeWorkspace.id, deal.id, { name: e.target.value });
        }
    };

    const handleValueBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val !== deal.value) {
            updateDeal(activeWorkspace.id, deal.id, { value: val });
        }
    };

    const handleStageChange = (newStage: string) => {
        if (newStage !== deal.stage) {
            updateDealStage(activeWorkspace.id, deal.id, newStage, deal.orderIndex);
        }
        setStageOpen(false);
    };

    const handleUpdateContacts = (newContactIds: string[]) => {
        // Optimistic update handled by store/UI, send to backend
        updateDeal(activeWorkspace.id, deal.id, { contactIds: newContactIds });
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={closeDealDetail} />
            <div className="fixed inset-y-0 right-0 w-[60%] min-w-[600px] bg-background border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="bg-muted px-2 py-1 rounded text-xs font-mono text-muted-foreground">
                            DEAL
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-muted rounded-md text-muted-foreground"><Copy className="w-4 h-4" /></button>
                        <button onClick={closeDealDetail} className="p-2 hover:bg-muted rounded-md text-muted-foreground"><X className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">

                    {/* Main Fields */}
                    <div className="space-y-6">
                        <textarea
                            defaultValue={deal.name}
                            onBlur={handleNameBlur}
                            rows={1}
                            className="w-full text-2xl font-bold bg-transparent outline-none resize-none overflow-hidden"
                            onInput={(e) => {
                                e.currentTarget.style.height = 'auto';
                                e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                            }}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            {/* Value */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Value</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                    <input
                                        type="number"
                                        defaultValue={deal.value}
                                        onBlur={handleValueBlur}
                                        className="w-full h-10 pl-7 pr-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            </div>

                            {/* Stage */}
                            <div className="space-y-1 relative">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Stage</label>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setStageOpen(!stageOpen); }}
                                    className="w-full h-10 px-3 flex items-center justify-between rounded-md border border-input bg-background hover:bg-accent text-sm"
                                >
                                    <span className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full", DEAL_STAGES.find(s => s.id === deal.stage)?.color)} />
                                        {DEAL_STAGES.find(s => s.id === deal.stage)?.label}
                                    </span>
                                </button>
                                {stageOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-full bg-background border border-border rounded-lg shadow-xl z-50 py-1">
                                        {DEAL_STAGES.map(s => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleStageChange(s.id); }}
                                                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted transition-colors text-sm"
                                            >
                                                <div className={cn("w-2 h-2 rounded-full", s.color)} />
                                                <span className="flex-1 text-left">{s.label}</span>
                                                {deal.stage === s.id && <Check className="w-4 h-4 text-primary" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Company */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Company</label>
                                <select
                                    value={deal.companyId || ''}
                                    onChange={(e) => updateDeal(activeWorkspace.id, deal.id, { companyId: e.target.value || undefined })}
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                >
                                    <option value="">No Company</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Contacts (M2M) */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground uppercase">Contacts</label>
                            <div className="p-3 border rounded-md space-y-3">
                                {/* Current Contacts Chips */}
                                <div className="flex flex-wrap gap-2">
                                    {deal.contacts && deal.contacts.length > 0 ? deal.contacts.map(c => (
                                        <div key={c.id} className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                                            <User className="w-3 h-3" />
                                            {c.fullName}
                                            <button
                                                onClick={() => {
                                                    const newIds = deal.contacts.filter(x => x.id !== c.id).map(x => x.id);
                                                    handleUpdateContacts(newIds);
                                                }}
                                                className="hover:text-destructive"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )) : <span className="text-sm text-muted-foreground italic">No contacts linked</span>}
                                </div>

                                <div className="pt-2 border-t text-xs text-muted-foreground">
                                    Add Contacts:
                                </div>
                                <select
                                    className="w-full h-8 text-sm border rounded px-2"
                                    onChange={(e) => {
                                        if (!e.target.value) return;
                                        const currentIds = deal.contacts?.map(c => c.id) || [];
                                        if (!currentIds.includes(e.target.value)) {
                                            handleUpdateContacts([...currentIds, e.target.value]);
                                        }
                                        e.target.value = '';
                                    }}
                                >
                                    <option value="">Select contact to add...</option>
                                    {contacts.map(c => (
                                        <option key={c.id} value={c.id}>{c.fullName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                    </div>

                    {/* Activity Timeline */}
                    <div className="border-t pt-6">
                        <h3 className="text-sm font-semibold mb-4">Activity (History)</h3>
                        <div className="space-y-4 relative pl-4 border-l border-border">
                            {activities.map((activity) => (
                                <div key={activity.id} className="relative text-sm">
                                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-border" />
                                    <div className="flex flex-col gap-1">
                                        <div className="font-medium">
                                            <span className="font-semibold text-primary">{activity.userName}</span> <span className="text-foreground">{getActivityText(activity)}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {activities.length === 0 && (
                                <div className="text-sm text-muted-foreground italic">No activity recorded yet</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}

function getActivityText(activity: any) {
    const { actionType, oldValue, newValue } = activity;

    switch (actionType) {
        case 'Created':
            return 'created this deal';
        case 'StageChanged':
            const oldStage = DEAL_STAGES.find(s => s.id === oldValue)?.label || oldValue;
            const newStage = DEAL_STAGES.find(s => s.id === newValue)?.label || newValue;
            return `moved deal from "${oldStage}" to "${newStage}"`;
        case 'ValueChanged':
            return `changed value from ₹${(oldValue || 0).toLocaleString('en-IN')} to ₹${(newValue || 0).toLocaleString('en-IN')}`;
        case 'NameChanged':
            return `renamed deal from "${oldValue}" to "${newValue}"`;
        case 'CompanyChanged':
            return `updated the company`;
        case 'Linked':
            return 'updated linked contacts';
        default:
            if (oldValue && newValue) {
                return `changed ${actionType} from "${oldValue}" to "${newValue}"`;
            }
            return `performed ${actionType}`;
    }
}
