import { useState, useMemo, useEffect } from 'react';
import { useLeadStore } from '@/stores/leadStore';
import type { Lead } from '@/stores/leadStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { Plus, Mail, Building2, Flame, Snowflake, Sun, LayoutGrid, List, Phone, ArrowUpDown, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable
} from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AddLeadModal } from './AddLeadModal';
import { LeadDetailPanel } from './LeadDetailPanel';

const LEAD_STATUSES = [
    { id: 'NEW', label: 'New', color: 'bg-blue-500' },
    { id: 'CONTACTED', label: 'Contacted', color: 'bg-indigo-500' },
    { id: 'QUALIFIED', label: 'Qualified', color: 'bg-green-500' },
    { id: 'UNQUALIFIED', label: 'Unqualified', color: 'bg-gray-500' },
    { id: 'CONVERTED', label: 'Converted', color: 'bg-emerald-500' },
] as const;

type ViewMode = 'kanban' | 'table';

export function LeadsKanban() {
    const { leads, fetchLeads, updateLead, openLeadDetail } = useLeadStore();
    const { activeWorkspace } = useWorkspaces();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [modalStatus, setModalStatus] = useState('NEW');
    const [viewMode, setViewMode] = useState<ViewMode>('kanban');
    const [sortBy, setSortBy] = useState<'score' | 'createdAt' | 'name'>('score');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        if (activeWorkspace) {
            fetchLeads(activeWorkspace.id);
        }
    }, [activeWorkspace, fetchLeads]);

    // Group leads by status for kanban
    const columns = useMemo(() => {
        const groups: Record<string, Lead[]> = {};
        LEAD_STATUSES.forEach(status => groups[status.id] = []);
        leads.forEach(lead => {
            if (groups[lead.status]) {
                groups[lead.status].push(lead);
            }
        });
        // Sort by score descending
        LEAD_STATUSES.forEach(status => {
            groups[status.id].sort((a, b) => b.score - a.score);
        });
        return groups;
    }, [leads]);

    // Sorted leads for table view
    const sortedLeads = useMemo(() => {
        return [...leads].sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'score') {
                comparison = a.score - b.score;
            } else if (sortBy === 'createdAt') {
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            } else if (sortBy === 'name') {
                comparison = a.fullName.localeCompare(b.fullName);
            }
            return sortOrder === 'desc' ? -comparison : comparison;
        });
    }, [leads, sortBy, sortOrder]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || !activeWorkspace) return;

        const activeLeadId = active.id as string;
        const overId = over.id as string;

        const activeLead = leads.find(l => l.id === activeLeadId);
        if (!activeLead) return;

        // Check if dropped on a column (status)
        const isOverColumn = LEAD_STATUSES.some(s => s.id === overId);

        let newStatus: Lead['status'];

        if (isOverColumn) {
            // Dropped directly on a column
            newStatus = overId as Lead['status'];
        } else {
            // Dropped on another lead card - use that lead's status
            const overLead = leads.find(l => l.id === overId);
            if (overLead) {
                newStatus = overLead.status;
            } else {
                return; // Can't determine status
            }
        }

        if (newStatus && newStatus !== activeLead.status) {
            try {
                await updateLead(activeWorkspace.id, activeLeadId, { status: newStatus });
            } catch (err) {
                console.error('Failed to update lead status:', err);
            }
        }
    };

    const openAddModal = (statusId: string = 'NEW') => {
        setModalStatus(statusId);
        setIsAddModalOpen(true);
    };

    const getScoreIcon = (score: number) => {
        if (score >= 60) return <Flame size={14} className="text-orange-500" />;
        if (score >= 30) return <Sun size={14} className="text-yellow-500" />;
        return <Snowflake size={14} className="text-blue-400" />;
    };

    const toggleSort = (column: 'score' | 'createdAt' | 'name') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/30">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
                    <div className="text-sm text-muted-foreground px-2 py-1 bg-muted rounded">
                        {leads.length} total
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Switcher */}
                    <div className="flex bg-muted rounded-md p-0.5">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors",
                                viewMode === 'kanban'
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <LayoutGrid size={16} />
                            Kanban
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded transition-colors",
                                viewMode === 'table'
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <List size={16} />
                            Table
                        </button>
                    </div>

                    <button
                        onClick={() => openAddModal('NEW')}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
                    >
                        <Plus size={16} />
                        Add Lead
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {viewMode === 'kanban' ? (
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="flex h-full gap-4 min-w-max">
                            {LEAD_STATUSES.map(status => (
                                <KanbanColumn
                                    key={status.id}
                                    status={status}
                                    leads={columns[status.id]}
                                    onAddClick={() => openAddModal(status.id)}
                                    onLeadClick={openLeadDetail}
                                    getScoreIcon={getScoreIcon}
                                />
                            ))}
                        </div>

                        <DragOverlay>
                            {activeId ? (
                                <LeadCard
                                    lead={leads.find(l => l.id === activeId)!}
                                    isOverlay
                                    scoreIcon={getScoreIcon(leads.find(l => l.id === activeId)?.score || 0)}
                                />
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            ) : (
                <div className="flex-1 overflow-auto p-6">
                    <LeadsTable
                        leads={sortedLeads}
                        onLeadClick={openLeadDetail}
                        getScoreIcon={getScoreIcon}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={toggleSort}
                    />
                </div>
            )}

            <AddLeadModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                defaultStatus={modalStatus}
            />

            <LeadDetailPanel />
        </div>
    );
}

// ========== Kanban Column ==========

interface KanbanColumnProps {
    status: typeof LEAD_STATUSES[number];
    leads: Lead[];
    onAddClick: () => void;
    onLeadClick: (id: string) => void;
    getScoreIcon: (score: number) => React.ReactNode;
}

function KanbanColumn({ status, leads, onAddClick, onLeadClick, getScoreIcon }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: status.id });

    return (
        <div className="flex flex-col w-80 h-full bg-muted/30 border border-border/50 rounded-lg overflow-hidden shrink-0">
            {/* Column Header */}
            <div className="p-3 border-b border-border/50 bg-background flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", status.color)}></div>
                    <span className="font-semibold text-sm">{status.label}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {leads.length}
                    </span>
                </div>
                <button
                    onClick={onAddClick}
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Droppable Column Content */}
            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 overflow-y-auto p-2 transition-colors",
                    isOver && "bg-primary/5"
                )}
            >
                <SortableContext
                    items={leads.map(l => l.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2 min-h-[100px]">
                        {leads.map(lead => (
                            <SortableLeadCard
                                key={lead.id}
                                lead={lead}
                                onClick={() => onLeadClick(lead.id)}
                                scoreIcon={getScoreIcon(lead.score)}
                            />
                        ))}
                        {leads.length === 0 && (
                            <div className={cn(
                                "h-24 flex items-center justify-center text-xs text-muted-foreground/50 border-2 border-dashed rounded transition-colors",
                                isOver ? "border-primary/50 bg-primary/5" : "border-border/30"
                            )}>
                                Drop leads here
                            </div>
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
}

// ========== Table View ==========

interface LeadsTableProps {
    leads: Lead[];
    onLeadClick: (id: string) => void;
    getScoreIcon: (score: number) => React.ReactNode;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSort: (column: 'score' | 'createdAt' | 'name') => void;
}

function LeadsTable({ leads, onLeadClick, getScoreIcon, sortBy, sortOrder, onSort }: LeadsTableProps) {
    const getSortIcon = (column: string) => {
        if (sortBy !== column) return <ArrowUpDown size={14} className="text-muted-foreground" />;
        return <ChevronDown size={14} className={cn(sortOrder === 'asc' && 'rotate-180')} />;
    };

    return (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                    <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <button onClick={() => onSort('name')} className="flex items-center gap-1 hover:text-foreground">
                                Name {getSortIcon('name')}
                            </button>
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Contact
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Company
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Status
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Source
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <button onClick={() => onSort('score')} className="flex items-center gap-1 hover:text-foreground">
                                Score {getSortIcon('score')}
                            </button>
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <button onClick={() => onSort('createdAt')} className="flex items-center gap-1 hover:text-foreground">
                                Created {getSortIcon('createdAt')}
                            </button>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {leads.map(lead => (
                        <tr
                            key={lead.id}
                            onClick={() => onLeadClick(lead.id)}
                            className="hover:bg-muted/30 cursor-pointer transition-colors"
                        >
                            <td className="px-4 py-3">
                                <span className="font-medium text-sm">{lead.fullName}</span>
                            </td>
                            <td className="px-4 py-3">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <Mail size={12} />
                                        {lead.email}
                                    </div>
                                    {lead.phone && (
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <Phone size={12} />
                                            {lead.phone}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                {lead.companyName || '-'}
                            </td>
                            <td className="px-4 py-3">
                                <span className={cn(
                                    "px-2 py-1 rounded text-xs font-medium w-24 inline-flex justify-center",
                                    lead.status === 'NEW' && "bg-blue-500/15 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                    lead.status === 'CONTACTED' && "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
                                    lead.status === 'QUALIFIED' && "bg-green-500/15 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                    lead.status === 'UNQUALIFIED' && "bg-gray-500/15 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
                                    lead.status === 'CONVERTED' && "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                )}>
                                    {lead.status}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <span className={cn(
                                    "px-2 py-0.5 rounded text-xs font-medium w-20 inline-flex justify-center",
                                    lead.source === 'FACEBOOK' && "bg-blue-100 text-blue-700",
                                    lead.source === 'GOOGLE' && "bg-red-100 text-red-700",
                                    lead.source === 'FORM' && "bg-green-100 text-green-700",
                                    lead.source === 'MANUAL' && "bg-gray-100 text-gray-700",
                                    lead.source === 'REFERRAL' && "bg-purple-100 text-purple-700"
                                )}>
                                    {lead.source}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                    {getScoreIcon(lead.score)}
                                    <span className="text-sm font-semibold">{lead.score}</span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                {format(new Date(lead.createdAt), 'MMM d, yyyy')}
                            </td>
                        </tr>
                    ))}
                    {leads.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                No leads yet. Add your first lead to get started.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

// ========== Lead Card Components ==========

function LeadCard({ lead, isOverlay, onClick, scoreIcon }: {
    lead: Lead,
    isOverlay?: boolean,
    onClick?: () => void,
    scoreIcon: React.ReactNode
}) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "p-3 rounded-md border bg-card transition-all cursor-grab active:cursor-grabbing group select-none",
                isOverlay ? "shadow-xl rotate-2 ring-2 ring-primary border-primary z-50" : "shadow-sm border-border hover:border-primary/50"
            )}>
            <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-sm line-clamp-1">{lead.fullName}</span>
                <div className="flex items-center gap-1">
                    {scoreIcon}
                    <span className="text-xs font-bold">{lead.score}</span>
                </div>
            </div>

            <div className="space-y-1 text-xs text-muted-foreground">
                {lead.email && (
                    <div className="flex items-center gap-1.5">
                        <Mail size={12} />
                        <span className="truncate">{lead.email}</span>
                    </div>
                )}
                {lead.companyName && (
                    <div className="flex items-center gap-1.5">
                        <Building2 size={12} />
                        <span className="truncate">{lead.companyName}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-medium",
                    lead.source === 'FACEBOOK' && "bg-blue-100 text-blue-700",
                    lead.source === 'GOOGLE' && "bg-red-100 text-red-700",
                    lead.source === 'FORM' && "bg-green-100 text-green-700",
                    lead.source === 'MANUAL' && "bg-gray-100 text-gray-700",
                    lead.source === 'REFERRAL' && "bg-purple-100 text-purple-700"
                )}>
                    {lead.source}
                </span>
                <span>{format(new Date(lead.createdAt), 'MMM d')}</span>
            </div>
        </div>
    );
}

function SortableLeadCard({ lead, onClick, scoreIcon }: {
    lead: Lead,
    onClick?: () => void,
    scoreIcon: React.ReactNode
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: lead.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <LeadCard lead={lead} onClick={onClick} scoreIcon={scoreIcon} />
        </div>
    );
}
