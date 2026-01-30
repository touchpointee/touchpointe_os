import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Copy, Check, User, ListTodo, Building2, Calendar, IndianRupee, ArrowRight, MoreHorizontal, Paperclip, MessageSquare } from 'lucide-react';
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
    { id: 'PROPOSAL', label: 'Proposal', color: 'bg-yellow-500' },
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

    // Find deal from store
    const deal = deals.find(d => d.id === activeDealId);

    if (!deal || !activeWorkspace) return null;

    const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
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
        updateDeal(activeWorkspace.id, deal.id, { contactIds: newContactIds });
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/30 z-40" onClick={closeDealDetail} />
            <div className="fixed right-0 top-0 h-full w-[480px] bg-card border-l border-border z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex-1 min-w-0 pr-4">
                        <input
                            defaultValue={deal.name}
                            onBlur={handleNameBlur}
                            className="w-full bg-transparent font-semibold text-lg outline-none truncate placeholder:text-muted-foreground/50"
                            placeholder="Deal Name"
                        />
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>₹{deal.value.toLocaleString('en-IN')}</span>
                            <span>•</span>
                            <span>Created {format(new Date(deal.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                    </div>
                    <button onClick={closeDealDetail} className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">

                    {/* Stage & Value Row */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                            <input
                                type="number"
                                defaultValue={deal.value}
                                onBlur={handleValueBlur}
                                className="w-32 h-9 pl-6 pr-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Value"
                            />
                        </div>

                        <div className="relative flex-1">
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setStageOpen(!stageOpen); }}
                                className="w-full h-9 px-3 flex items-center justify-between rounded-md border border-border bg-background hover:bg-muted/50 text-sm transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <div className={cn("w-2 h-2 rounded-full", DEAL_STAGES.find(s => s.id === deal.stage)?.color)} />
                                    {DEAL_STAGES.find(s => s.id === deal.stage)?.label}
                                </span>
                            </button>
                            {stageOpen && (
                                <div className="absolute top-full left-0 mt-1 w-full bg-popover border border-border rounded-lg shadow-xl z-50 py-1">
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

                    {/* Deal Info Section */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Deal Info</h3>
                        <div className="space-y-2">
                            {/* Company */}
                            <div className="flex items-center gap-3 p-2 rounded bg-muted/30">
                                <Building2 size={16} className="text-muted-foreground shrink-0" />
                                <select
                                    value={deal.companyId || ''}
                                    onChange={(e) => updateDeal(activeWorkspace.id, deal.id, { companyId: e.target.value || undefined })}
                                    className="w-full bg-transparent text-sm outline-none cursor-pointer"
                                >
                                    <option value="">Select Company</option>
                                    {companies.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Contacts */}
                            <div className="p-2 rounded bg-muted/30 space-y-2">
                                <div className="flex items-start gap-3">
                                    <User size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {deal.contacts && deal.contacts.length > 0 ? deal.contacts.map(c => (
                                                <div key={c.id} className="flex items-center gap-1.5 bg-background border border-border px-2 py-0.5 rounded text-xs">
                                                    <span>{c.fullName}</span>
                                                    <button
                                                        onClick={() => {
                                                            const newIds = deal.contacts.filter(x => x.id !== c.id).map(x => x.id);
                                                            handleUpdateContacts(newIds);
                                                        }}
                                                        className="text-muted-foreground hover:text-destructive"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            )) : <span className="text-sm text-muted-foreground italic">No contacts linked</span>}
                                        </div>
                                        <select
                                            className="w-full text-xs bg-transparent border-t border-border/50 pt-2 outline-none cursor-pointer text-muted-foreground hover:text-foreground"
                                            onChange={(e) => {
                                                if (!e.target.value) return;
                                                const currentIds = deal.contacts?.map(c => c.id) || [];
                                                if (!currentIds.includes(e.target.value)) {
                                                    handleUpdateContacts([...currentIds, e.target.value]);
                                                }
                                                e.target.value = '';
                                            }}
                                        >
                                            <option value="">+ Add Contact</option>
                                            {contacts.map(c => (
                                                <option key={c.id} value={c.id}>{c.fullName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs / Sections for Activity, Comments, Files */}
                    <div className="space-y-6">
                        {/* Comments */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                <MessageSquare size={14} />
                                Comments
                            </div>
                            <DealComments dealId={activeDealId} workspaceId={activeWorkspace.id} />
                        </div>

                        {/* Attachments */}
                        <div className="space-y-3">
                            <DealAttachments dealId={activeDealId} workspaceId={activeWorkspace.id} />
                        </div>

                        {/* Activity */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Activity</h3>
                            <div className="space-y-4 relative pl-4 border-l border-border">
                                {activities.map((activity) => (
                                    <div key={activity.id} className="relative text-sm">
                                        <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-border" />
                                        <div className="flex flex-col gap-0.5">
                                            <div className="font-medium text-xs text-foreground">
                                                <span className="font-semibold text-primary">{activity.userName}</span> {getActivityText(activity)}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground">
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

                {/* Footer Actions */}
                <div className="p-4 border-t border-border bg-background">
                    <button
                        onClick={() => setShowTaskModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-md font-medium transition-colors"
                    >
                        <ListTodo size={16} />
                        Create Follow-up Task
                    </button>
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
