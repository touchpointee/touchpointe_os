import { useState, useMemo, useEffect } from 'react';
import { useCrmStore } from '../../stores/crmStore';
import type { Deal } from '../../stores/crmStore';
import { useWorkspaces } from '../../stores/workspaceStore';
import { Plus, MoreHorizontal, IndianRupee, LayoutGrid, List, ArrowUpDown, ChevronDown, Building2 } from 'lucide-react';
import { AddDealModal } from './AddDealModal';
import { DealDetailPanel } from './DealDetailPanel';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable
} from '@dnd-kit/core';
import type {
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const DEAL_STAGES = [
    { id: 'NEW', label: 'New', color: 'bg-blue-500' },
    { id: 'DISCOVERY', label: 'Discovery', color: 'bg-indigo-500' },
    { id: 'PROPOSAL', label: 'Proposal', color: 'bg-yellow-500' },
    { id: 'NEGOTIATION', label: 'Negotiation', color: 'bg-orange-500' },
    { id: 'CLOSED_WON', label: 'Won', color: 'bg-green-500' },
    { id: 'CLOSED_LOST', label: 'Lost', color: 'bg-red-500' },
] as const;

type ViewMode = 'kanban' | 'table';

export function DealsView() {
    const { deals, fetchDeals, updateDealStage, openDealDetail } = useCrmStore();
    const { activeWorkspace } = useWorkspaces();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [modalStage, setModalStage] = useState('NEW');
    const [viewMode, setViewMode] = useState<ViewMode>('kanban');
    const [sortBy, setSortBy] = useState<'value' | 'createdAt' | 'name' | 'closeDate'>('value');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        if (activeWorkspace) {
            fetchDeals(activeWorkspace.id);
        }
    }, [activeWorkspace, fetchDeals]);

    // Group deals by stage
    const columns = useMemo(() => {
        const groups: Record<string, Deal[]> = {};
        DEAL_STAGES.forEach(stage => groups[stage.id] = []);
        deals.forEach(deal => {
            if (groups[deal.stage]) {
                groups[deal.stage].push(deal);
            }
        });
        // Sort by orderIndex - simple sort for now
        DEAL_STAGES.forEach(stage => {
            groups[stage.id].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        });
        return groups;
    }, [deals]);

    // Sorted deals for table view
    const sortedDeals = useMemo(() => {
        return [...deals].sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'value') {
                comparison = a.value - b.value;
            } else if (sortBy === 'createdAt') {
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            } else if (sortBy === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (sortBy === 'closeDate') {
                const dateA = a.closeDate ? new Date(a.closeDate).getTime() : 0;
                const dateB = b.closeDate ? new Date(b.closeDate).getTime() : 0;
                comparison = dateA - dateB;
            }
            return sortOrder === 'desc' ? -comparison : comparison;
        });
    }, [deals, sortBy, sortOrder]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeDealId = active.id as string;
        const overId = over.id as string;

        // Find source and dest
        const activeDeal = deals.find(d => d.id === activeDealId);
        if (!activeDeal) return;

        // Simple logic: if dropped on a stage container (overId is stageId)
        // or dropped on a card (need to find card's stage)

        let newStage = activeDeal.stage;
        let newIndex = activeDeal.orderIndex;

        const isOverStage = DEAL_STAGES.some(s => s.id === overId);

        if (isOverStage) {
            newStage = overId as any;
            newIndex = columns[overId].length; // Move to end of list
        } else {
            // Find which stage the "over" card belongs to
            const overDeal = deals.find(d => d.id === overId);
            if (overDeal) {
                newStage = overDeal.stage;
                // newIndex logic can be complex, simplifying for now
            }
        }

        if (newStage !== activeDeal.stage) {
            // Optimistic update handled by store if needed, but for now just call API
            if (activeWorkspace) {
                updateDealStage(activeWorkspace.id, activeDealId, newStage, newIndex);
            }
        }
    };

    const openAddModal = (stageId: string = 'NEW') => {
        setModalStage(stageId);
        setIsAddModalOpen(true);
    };

    const toggleSort = (column: 'value' | 'createdAt' | 'name' | 'closeDate') => {
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
                    <h1 className="text-2xl font-bold tracking-tight">Deals Pipeline</h1>
                    <div className="text-sm text-muted-foreground px-2 py-1 bg-muted rounded">
                        {deals.length} deals • ₹{deals.reduce((acc, d) => acc + d.value, 0).toLocaleString('en-IN')}
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
                        Add Deal
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {viewMode === 'kanban' ? (
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="flex h-full gap-4 min-w-max snap-x snap-mandatory md:snap-none">
                            {DEAL_STAGES.map(stage => (
                                <KanbanColumn
                                    key={stage.id}
                                    stage={stage}
                                    deals={columns[stage.id]}
                                    onAddClick={() => openAddModal(stage.id)}
                                    onDealClick={openDealDetail}
                                />
                            ))}
                        </div>

                        <DragOverlay>
                            {activeId ? (
                                <DealCard deal={deals.find(d => d.id === activeId)!} isOverlay />
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            ) : (
                <div className="flex-1 overflow-auto p-6">
                    <DealsTable
                        deals={sortedDeals}
                        onDealClick={openDealDetail}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        onSort={toggleSort}
                    />
                </div>
            )}

            <AddDealModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                defaultStage={modalStage}
            />

            <DealDetailPanel />
        </div>
    );
}

// ========== Kanban Column ==========

interface KanbanColumnProps {
    stage: typeof DEAL_STAGES[number];
    deals: Deal[];
    onAddClick: () => void;
    onDealClick: (id: string) => void;
}

function KanbanColumn({ stage, deals, onAddClick, onDealClick }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: stage.id });

    return (
        <div className="flex flex-col w-[85vw] md:w-80 h-full bg-muted/30 border border-border/50 rounded-lg overflow-hidden shrink-0 snap-center">
            {/* Column Header */}
            <div className="p-3 border-b border-border/50 bg-background flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", stage.color)}></div>
                    <span className="font-semibold text-sm">{stage.label}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {deals.length}
                    </span>
                </div>
                <button
                    onClick={onAddClick}
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Droppable Area */}
            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 overflow-y-auto p-2 space-y-2 transition-colors",
                    isOver && "bg-primary/5"
                )}
            >
                <SortableContext
                    id={stage.id}
                    items={deals.map(d => d.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-col gap-2 min-h-[100px] h-full">
                        {deals.map(deal => (
                            <SortableDealCard
                                key={deal.id}
                                deal={deal}
                                onClick={() => onDealClick(deal.id)}
                            />
                        ))}
                        {/* Empty State / Drop Target */}
                        {deals.length === 0 && (
                            <div className={cn(
                                "h-24 flex items-center justify-center text-xs text-muted-foreground/50 border-2 border-dashed rounded transition-colors",
                                isOver ? "border-primary/50 bg-primary/5" : "border-border/30"
                            )}>
                                Drop deals here
                            </div>
                        )}
                    </div>
                </SortableContext>
            </div>

            {/* Column Footer Summary */}
            <div className="p-2 text-xs text-muted-foreground border-t border-border/50 text-center bg-background/50">
                ₹{deals.reduce((acc, d) => acc + d.value, 0).toLocaleString('en-IN')}
            </div>
        </div>
    );
}

// ========== Deal Card Components ==========

function DealCard({ deal, isOverlay, onClick }: { deal: Deal, isOverlay?: boolean, onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "p-3 rounded-md border bg-card transition-all cursor-grab active:cursor-grabbing group select-none",
                isOverlay ? "shadow-xl rotate-2 ring-2 ring-primary border-primary z-50" : "shadow-sm border-border hover:border-primary/50"
            )}>
            <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-sm line-clamp-2 leading-tight">{deal.name}</span>
                <div className="flex items-center gap-0.5 font-bold text-xs shrink-0 pl-2">
                    <IndianRupee size={11} className="text-muted-foreground" />
                    {deal.value.toLocaleString('en-IN')}
                </div>
            </div>

            <div className="space-y-1 text-xs text-muted-foreground mb-1">
                <div className="flex items-center gap-1.5">
                    <Building2 size={12} className="shrink-0" />
                    <span className="truncate">{deal.companyName || deal.contactNames || 'No Company'}</span>
                </div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Placeholder for left badge, or keep empty to match Leads style being empty space or source badge */}
                </div>
                <span>{format(new Date(deal.createdAt), 'MMM d')}</span>
            </div>
        </div>
    );
}

function SortableDealCard({ deal, onClick }: { deal: Deal, onClick?: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: deal.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <DealCard deal={deal} onClick={onClick} />
        </div>
    );
}

// ========== Table View ==========

interface DealsTableProps {
    deals: Deal[];
    onDealClick: (id: string) => void;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSort: (column: 'value' | 'createdAt' | 'name' | 'closeDate') => void;
}

function DealsTable({ deals, onDealClick, sortBy, sortOrder, onSort }: DealsTableProps) {
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
                                Deal Name {getSortIcon('name')}
                            </button>
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <button onClick={() => onSort('value')} className="flex items-center gap-1 hover:text-foreground">
                                Value {getSortIcon('value')}
                            </button>
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Stage
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Contact / Company
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <button onClick={() => onSort('closeDate')} className="flex items-center gap-1 hover:text-foreground">
                                Close Date {getSortIcon('closeDate')}
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
                    {deals.map(deal => (
                        <tr
                            key={deal.id}
                            onClick={() => onDealClick(deal.id)}
                            className="hover:bg-muted/30 cursor-pointer transition-colors"
                        >
                            <td className="px-4 py-3">
                                <span className="font-medium text-sm">{deal.name}</span>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-1 font-medium text-sm">
                                    <IndianRupee size={12} className="text-muted-foreground" />
                                    {deal.value.toLocaleString('en-IN')}
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <span className={cn(
                                    "px-2 py-1 rounded text-xs font-medium",
                                    deal.stage === 'NEW' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                    deal.stage === 'DISCOVERY' && "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
                                    deal.stage === 'PROPOSAL' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                                    deal.stage === 'NEGOTIATION' && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                                    deal.stage === 'CLOSED_WON' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                    deal.stage === 'CLOSED_LOST' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                )}>
                                    {DEAL_STAGES.find(s => s.id === deal.stage)?.label || deal.stage}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                {deal.companyName || deal.contactNames || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                {deal.closeDate ? format(new Date(deal.closeDate), 'MMM d, yyyy') : '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                                {format(new Date(deal.createdAt), 'MMM d, yyyy')}
                            </td>
                        </tr>
                    ))}
                    {deals.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                No deals found. Create a new deal to get started.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
