import { useState, useMemo, useEffect } from 'react';
import { useLeadStore } from '@/stores/leadStore';
import type { Lead } from '@/stores/leadStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { Plus, Mail, Building2, Flame, Snowflake, Sun } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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

export function LeadsKanban() {
    const { leads, fetchLeads, updateLead, openLeadDetail } = useLeadStore();
    const { activeWorkspace } = useWorkspaces();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [modalStatus, setModalStatus] = useState('NEW');

    useEffect(() => {
        if (activeWorkspace) {
            fetchLeads(activeWorkspace.id);
        }
    }, [activeWorkspace, fetchLeads]);

    // Group leads by status
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

        if (!over || !activeWorkspace) return;

        const activeLeadId = active.id as string;
        const overId = over.id as string;

        const activeLead = leads.find(l => l.id === activeLeadId);
        if (!activeLead) return;

        const isOverStatus = LEAD_STATUSES.some(s => s.id === overId);
        let newStatus = activeLead.status;

        if (isOverStatus) {
            newStatus = overId as Lead['status'];
        } else {
            const overLead = leads.find(l => l.id === overId);
            if (overLead) {
                newStatus = overLead.status;
            }
        }

        if (newStatus !== activeLead.status) {
            await updateLead(activeWorkspace.id, activeLeadId, { status: newStatus });
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

                <button
                    onClick={() => openAddModal('NEW')}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
                >
                    <Plus size={16} />
                    Add Lead
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
                    <div className="flex h-full gap-4 min-w-max">
                        {LEAD_STATUSES.map(status => (
                            <div key={status.id} className="flex flex-col w-80 h-full bg-muted/30 border border-border/50 rounded-lg overflow-hidden shrink-0">
                                {/* Column Header */}
                                <div className="p-3 border-b border-border/50 bg-background flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-3 h-3 rounded-full", status.color)}></div>
                                        <span className="font-semibold text-sm">{status.label}</span>
                                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                            {columns[status.id].length}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => openAddModal(status.id)}
                                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                {/* Droppable Area */}
                                <SortableContext
                                    id={status.id}
                                    items={columns[status.id].map(l => l.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                        <DroppableStatus id={status.id}>
                                            {columns[status.id].map(lead => (
                                                <SortableLeadCard
                                                    key={lead.id}
                                                    lead={lead}
                                                    onClick={() => openLeadDetail(lead.id)}
                                                    scoreIcon={getScoreIcon(lead.score)}
                                                />
                                            ))}
                                            {columns[status.id].length === 0 && (
                                                <div className="h-20 flex items-center justify-center text-xs text-muted-foreground/50 border-2 border-dashed border-border/30 rounded">
                                                    Drop here
                                                </div>
                                            )}
                                        </DroppableStatus>
                                    </div>
                                </SortableContext>
                            </div>
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

            <AddLeadModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                defaultStatus={modalStatus}
            />

            <LeadDetailPanel />
        </div>
    );
}

// Helper Components

function DroppableStatus({ id, children }: { id: string, children: React.ReactNode }) {
    const { setNodeRef } = useDroppable({ id });
    return (
        <div ref={setNodeRef} className="flex flex-col gap-2 min-h-[100px] h-full">
            {children}
        </div>
    );
}

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
