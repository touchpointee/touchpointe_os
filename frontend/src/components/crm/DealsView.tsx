import { useState, useMemo, useEffect } from 'react';
import { useCrmStore } from '../../stores/crmStore';
import type { Deal } from '../../stores/crmStore';
import { useWorkspaces } from '../../stores/workspaceStore';
import { Plus, MoreHorizontal, IndianRupee } from 'lucide-react';
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

export function DealsView() {
    const { deals, fetchDeals, updateDealStage, openDealDetail } = useCrmStore();
    const { activeWorkspace } = useWorkspaces();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [modalStage, setModalStage] = useState('NEW');

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

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/30">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold tracking-tight">Deals Pipeline</h1>
                    <div className="text-sm text-muted-foreground px-2 py-1 bg-muted rounded">
                        Total Value: ₹{deals.reduce((acc, d) => acc + d.value, 0).toLocaleString('en-IN')}
                    </div>
                </div>

                <button
                    onClick={() => openAddModal('NEW')}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
                >
                    <Plus size={16} />
                    Add Deal
                </button>
            </div>

            {/* Board Area */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex h-full gap-4 min-w-max snap-x snap-mandatory md:snap-none">
                        {DEAL_STAGES.map(stage => (
                            <div key={stage.id} className="flex flex-col w-[85vw] md:w-80 h-full bg-muted/30 border border-border/50 rounded-lg overflow-hidden shrink-0 snap-center">
                                {/* Column Header */}
                                <div className="p-3 border-b border-border/50 bg-background flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-3 h-3 rounded-full", stage.color)}></div>
                                        <span className="font-semibold text-sm">{stage.label}</span>
                                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                            {columns[stage.id].length}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => openAddModal(stage.id)}
                                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                {/* Droppable Area */}
                                <SortableContext
                                    id={stage.id}
                                    items={columns[stage.id].map(d => d.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                        <DroppableStage id={stage.id}>
                                            {columns[stage.id].map(deal => (
                                                <SortableDealCard
                                                    key={deal.id}
                                                    deal={deal}
                                                    onClick={() => openDealDetail(deal.id)}
                                                />
                                            ))}
                                            {/* Empty State / Drop Target */}
                                            {columns[stage.id].length === 0 && (
                                                <div className="h-20 flex items-center justify-center text-xs text-muted-foreground/50 border-2 border-dashed border-border/30 rounded">
                                                    Drop here
                                                </div>
                                            )}
                                        </DroppableStage>
                                    </div>
                                </SortableContext>

                                {/* Column Footer Summary */}
                                <div className="p-2 text-xs text-muted-foreground border-t border-border/50 text-center bg-background/50">
                                    ₹{columns[stage.id].reduce((acc, d) => acc + d.value, 0).toLocaleString('en-IN')}
                                </div>
                            </div>
                        ))}
                    </div>

                    <DragOverlay>
                        {activeId ? (
                            <DealCard deal={deals.find(d => d.id === activeId)!} isOverlay />
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            <AddDealModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                defaultStage={modalStage}
            />

            <DealDetailPanel />
        </div>
    );
}

// Helper Components

function DroppableStage({ id, children }: { id: string, children: React.ReactNode }) {
    const { setNodeRef } = useDroppable({ id });
    return (
        <div ref={setNodeRef} className="flex flex-col gap-2 min-h-[100px] h-full">
            {children}
        </div>
    );
}

function DealCard({ deal, isOverlay, onClick }: { deal: Deal, isOverlay?: boolean, onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "p-3 rounded-md border bg-card transition-all cursor-grab active:cursor-grabbing group select-none relative",
                isOverlay ? "shadow-xl rotate-2 ring-2 ring-primary border-primary z-50" : "shadow-sm border-border hover:border-primary/50"
            )}>
            <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-sm line-clamp-2 leading-tight">{deal.name}</span>
                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded text-muted-foreground -mr-1 -mt-1 transition-opacity">
                    <MoreHorizontal size={14} />
                </button>
            </div>

            <div className="flex items-center gap-1 text-sm font-semibold text-foreground mb-2">
                <IndianRupee size={12} className="text-muted-foreground" />
                {deal.value.toLocaleString('en-IN')}
            </div>

            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="truncate max-w-[100px] font-medium text-primary/80">
                    {deal.companyName || deal.contactNames || 'No Link'}
                </span>
                <span>{deal.closeDate ? format(new Date(deal.closeDate), 'MMM d') : '-'}</span>
            </div>

            {/* Color accent bar on left */}
            <div className={cn("absolute left-0 top-3 bottom-3 w-0.5 rounded-r bg-primary/50", isOverlay && "hidden")} />
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
