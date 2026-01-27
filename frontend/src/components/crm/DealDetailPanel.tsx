import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Copy, Check, User, ListTodo } from 'lucide-react';
import { useCrmStore } from '@/stores/crmStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { useTaskStore } from '@/stores/taskStore';
import { useHierarchyStore } from '@/stores/hierarchyStore';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { DealComments } from './DealComments';
import { DealAttachments } from './DealAttachments';

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
    const navigate = useNavigate();

    const [stageOpen, setStageOpen] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);

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

                    {/* Comments Section */}
                    <div className="border-t pt-6">
                        <DealComments dealId={activeDealId} workspaceId={activeWorkspace.id} />
                    </div>

                    {/* Attachments Section */}
                    <div className="border-t pt-6">
                        <DealAttachments dealId={activeDealId} workspaceId={activeWorkspace.id} />
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t pt-6">
                        <button
                            onClick={() => setShowTaskModal(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-md font-medium transition-colors"
                        >
                            <ListTodo size={16} />
                            Create Follow-up Task
                        </button>
                    </div>

                </div>
            </div>

            {/* Create Task Modal */}
            {showTaskModal && activeWorkspace && (
                <CreateTaskFromDealModal
                    deal={deal}
                    workspaceId={activeWorkspace.id}
                    onClose={() => setShowTaskModal(false)}
                    onSuccess={(taskId, listId) => {
                        setShowTaskModal(false);
                        navigate(`/tasks/list/${listId}?task=${taskId}`);
                    }}
                />
            )}
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

// ========== Create Task From Deal Modal ==========

interface ListItem {
    id: string;
    name: string;
    spaceName: string;
}

function CreateTaskFromDealModal({ deal, workspaceId, onClose, onSuccess }: {
    deal: any;
    workspaceId: string;
    onClose: () => void;
    onSuccess: (taskId: string, listId: string) => void;
}) {
    const { spaces, fetchHierarchy } = useHierarchyStore();
    const { createTask } = useTaskStore();

    const [title, setTitle] = useState(`Follow up on deal: ${deal.name}`);
    const [description, setDescription] = useState(`Deal: ${deal.name}\nValue: ₹${(deal.value || 0).toLocaleString('en-IN')}\nStage: ${deal.stage}`);
    const [selectedListId, setSelectedListId] = useState('');
    const [dueDate, setDueDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    const [priority, setPriority] = useState<string>('MEDIUM');
    const [isLoading, setIsLoading] = useState(false);

    // Extract all lists from spaces hierarchy
    const lists = useMemo(() => {
        const allLists: ListItem[] = [];
        spaces.forEach(space => {
            // Lists directly in space
            space.lists.forEach(list => {
                allLists.push({ id: list.id, name: list.name, spaceName: space.name });
            });
            // Lists in folders
            space.folders.forEach(folder => {
                folder.lists.forEach(list => {
                    allLists.push({ id: list.id, name: list.name, spaceName: `${space.name} / ${folder.name}` });
                });
            });
        });
        return allLists;
    }, [spaces]);

    useEffect(() => {
        fetchHierarchy(workspaceId);
    }, [workspaceId]);

    useEffect(() => {
        if (lists.length > 0 && !selectedListId) {
            setSelectedListId(lists[0].id);
        }
    }, [lists]);

    const handleSubmit = async () => {
        if (!selectedListId || !title.trim()) return;

        setIsLoading(true);
        try {
            const newTask = await createTask(workspaceId, {
                listId: selectedListId,
                title: title.trim(),
                description: description.trim(),
                priority,
                dueDate
            });
            onSuccess(newTask.id, selectedListId);
        } catch (err) {
            console.error('Failed to create task:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="bg-card border border-border rounded-lg w-full max-w-md mx-4 shadow-xl">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold">Create Follow-up Task</h2>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Task Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                            placeholder="Follow up on deal..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Task List *</label>
                        <select
                            value={selectedListId}
                            onChange={(e) => setSelectedListId(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        >
                            {lists.length === 0 ? (
                                <option value="">No lists available</option>
                            ) : (
                                lists.map((list) => (
                                    <option key={list.id} value={list.id}>
                                        {list.spaceName ? `${list.spaceName} › ${list.name}` : list.name}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>
                    </div>
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
                        disabled={isLoading || !selectedListId || !title.trim()}
                        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
                    >
                        {isLoading ? 'Creating...' : 'Create Task'}
                    </button>
                </div>
            </div>
        </div>
    );
}
