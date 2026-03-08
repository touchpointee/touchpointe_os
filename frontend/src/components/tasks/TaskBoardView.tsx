import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    DndContext,
    DragOverlay,
    useDroppable,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTaskStore } from '@/stores/taskStore';
import { useHierarchyStore } from '@/stores/hierarchyStore';
import { useWorkspaces, isValidUUID } from '@/stores/workspaceStore';
import type { TaskDto } from '@/types/task';
import type { TaskStatusDto } from '@/types/hierarchy';
import { cn } from '@/lib/utils';
import { Plus, MoreHorizontal, Palette, Trash2, Edit2, User, MessageSquare, Timer, Play, Pause } from 'lucide-react';

import { ShareTaskToChatModal } from './ShareTaskToChatModal';
import { CreateTaskModal } from './CreateTaskModal';
import { toast } from '@/contexts/ToastContext';
import type { CreateTaskRequest } from '@/types/task';

const DEFAULT_COLUMN_COLOR = '#2563eb';

/** Normalize to #rrggbb for native color input; invalid values return default. */
function toHexColor(value: string | undefined): string {
    if (!value) return DEFAULT_COLUMN_COLOR;
    const trimmed = value.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toLowerCase();
    if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) {
        const r = trimmed[1] + trimmed[1], g = trimmed[2] + trimmed[2], b = trimmed[3] + trimmed[3];
        return `#${r}${g}${b}`.toLowerCase();
    }
    return DEFAULT_COLUMN_COLOR;
}

export function TaskBoardView() {
    const { listId } = useParams<{ listId: string }>();
    const { activeWorkspace } = useWorkspaces();
    const workspaceId = activeWorkspace?.id;
    const { tasks, updateTask, openTaskDetail, createTask } = useTaskStore();
    const { spaces, updateStatus, createStatus, deleteStatus } = useHierarchyStore();

    // Find the current list configuration
    const currentList = useMemo(() => {
        if (!listId) return null;
        for (const space of spaces) {
            const list = space.lists.find(l => l.id === listId);
            if (list) return list;
            for (const folder of space.folders) {
                const fList = folder.lists.find(l => l.id === listId);
                if (fList) return fList;
            }
        }
        return null;
    }, [spaces, listId]);

    const statusDefs = useMemo(() => {
        return currentList?.statuses || [];
    }, [currentList]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // All useState hooks MUST be before any conditional returns (Rules of Hooks)
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isAddingGroup, setIsAddingGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [shareTask, setShareTask] = useState<TaskDto | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);

    // Early return AFTER all hooks
    if (!workspaceId || !isValidUUID(workspaceId)) {
        return <div className="h-full flex items-center justify-center text-muted-foreground">Loading workspace...</div>;
    }

    const listTasks = tasks[listId || '']?.items || [];

    // Group tasks by dynamic status ID
    const tasksByStatus = useMemo(() => {
        const grouped: Record<string, TaskDto[]> = {};

        // Initialize groups
        statusDefs.forEach(def => {
            grouped[def.id] = [];
        });

        const firstStatusId = statusDefs[0]?.id;

        listTasks.forEach(task => {
            // Priority:
            // 1. Valid customStatus
            // 2. Map legacy status to first appropriate dynamic status
            // 3. First status in the list

            let statusKey = task.customStatus;

            if (statusKey && grouped[statusKey]) {
                grouped[statusKey].push(task);
            } else {
                // Try fallback to first status
                if (firstStatusId) {
                    grouped[firstStatusId].push(task);
                }
            }
        });

        Object.keys(grouped).forEach(key => {
            grouped[key].sort((a, b) => a.orderIndex - b.orderIndex);
        });
        return grouped;
    }, [listTasks, statusDefs]);

    const handleAddStatus = async () => {
        if (!newGroupName.trim() || !currentList || !workspaceId) return;

        try {
            await createStatus(workspaceId, currentList.id, {
                name: newGroupName,
                color: '#71717a',
                category: 'Active'
            });
            setIsAddingGroup(false);
            setNewGroupName('');
        } catch (e) {
            console.error("Failed to add status", e);
        }
    };

    const handleUpdateStatus = async (statusId: string, updates: { name?: string; color?: string }) => {
        if (!workspaceId) return;
        try {
            await updateStatus(workspaceId, statusId, updates);
        } catch (e) {
            console.error("Failed to update status", e);
        }
    };

    const handleDeleteStatus = async (statusId: string) => {
        if (!workspaceId) return;
        if (!confirm('Are you sure you want to delete this status? Tasks in this status will be moved to To Do.')) return;
        try {
            await deleteStatus(workspaceId, statusId);
        } catch (e) {
            console.error("Failed to delete status", e);
        }
    };

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeTask = listTasks.find(t => t.id === active.id);
        if (!activeTask) return;

        const overId = over.id as string;
        let newStatusId: string | null = null;

        // 1. Dropped on a Column (checking against statusDefs IDs)
        if (statusDefs.some(s => s.id === overId)) {
            newStatusId = overId;
        }
        // 2. Dropped on another Task
        else {
            const overTask = listTasks.find(t => t.id === overId);
            if (overTask) {
                newStatusId = overTask.customStatus || 'todo'; // mapping fallback
            }
        }

        if (newStatusId && newStatusId !== (activeTask.customStatus || 'todo')) {
            updateTask(workspaceId!, activeTask.id, activeTask.listId, { customStatus: newStatusId });
        }
    }

    const handleTaskClick = (taskId: string) => {
        openTaskDetail(taskId);
    };

    const handleAddTask = (statusId: string) => {
        setPendingStatusId(statusId);
        setIsCreateModalOpen(true);
    };

    const handleCreateTask = async (data: Partial<CreateTaskRequest>) => {
        if (!workspaceId || !listId) return;
        try {
            const newTask = await createTask(workspaceId, {
                ...data,
                listId,
                customStatus: pendingStatusId || undefined
            } as CreateTaskRequest);
            if (newTask) {
                openTaskDetail(newTask.id);
                toast.success('Task Created', `Task '${data.title}' created successfully.`);
            }
        } catch (error) {
            console.error("Failed to create task", error);
            // Error toast is already shown by the global API handler
        }
    };

    const handleShareTask = (task: TaskDto) => {
        // Find list name if needed for creation, although modal does it too?
        // Let's attach listName to the task if not present, but TaskDto has no listName field?
        // TaskDto has listId. Modal expects listName for auto-channel.
        // We can find it here.
        let listName = currentList?.name || '';

        setShareTask({ ...task, listName } as any); // Casting since TaskDto might not define listName but Modal expects it
    };

    const activeTask = activeId ? listTasks.find(t => t.id === activeId) : null;

    return (
        <>
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex h-full p-4 items-stretch min-h-0 min-w-0 overflow-x-auto overflow-y-hidden snap-x snap-mandatory md:snap-none selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
                    {statusDefs.map(status => (
                        <BoardColumn
                            key={status.id}
                            statusDef={status}
                            tasks={tasksByStatus[status.id] || []}
                            onTaskClick={handleTaskClick}
                            onAddTask={() => handleAddTask(status.id)}
                            onUpdateStatus={(updates) => handleUpdateStatus(status.id, updates)}
                            onDeleteStatus={() => handleDeleteStatus(status.id)}
                            subtitle={currentList?.name}
                            onShare={handleShareTask}
                        />
                    ))}

                    {/* Fallback 'Unknown' column if dirty data */}
                    {(tasksByStatus['unknown']?.length > 0) && (
                        <BoardColumn
                            key="unknown"
                            statusDef={{ id: 'unknown', listId: listId || '', name: 'Unknown', color: '#999', category: 'NotStarted', order: 99 }}
                            tasks={tasksByStatus['unknown']}
                            onTaskClick={handleTaskClick}
                            onAddTask={() => { }}
                            onUpdateStatus={() => { }}
                            onDeleteStatus={() => { }}
                            subtitle={currentList?.name}
                            onShare={handleShareTask}
                        />
                    )}

                    {/* Create New Group Column */}
                    <div className="min-w-[200px] pt-1">
                        {!isAddingGroup ? (
                            <button
                                onClick={() => setIsAddingGroup(true)}
                                className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 px-3 py-2 rounded-lg transition-colors text-sm w-full"
                            >
                                <Plus className="w-4 h-4" /> Add group
                            </button>
                        ) : (
                            <div className="bg-card border border-border rounded-lg p-3 animate-in fade-in w-[280px]">
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    placeholder="Group name"
                                    className="w-full bg-background border border-input px-2 py-1.5 rounded text-sm mb-2 focus:ring-1 focus:ring-primary outline-none"
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleAddStatus();
                                        if (e.key === 'Escape') setIsAddingGroup(false);
                                    }}
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleAddStatus} className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-medium">Add</button>
                                    <button onClick={() => setIsAddingGroup(false)} className="hover:bg-accent px-2 py-1 rounded text-xs">Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
                <DragOverlay>
                    {activeTask ? (
                        <TaskCard
                            task={activeTask}
                            isOverlay
                            subtitle={currentList?.name}
                            statusColor={statusDefs.find(s => s.id === activeTask.customStatus)?.color}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            <ShareTaskToChatModal
                isOpen={!!shareTask}
                task={shareTask}
                onClose={() => setShareTask(null)}
            />

            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => { setIsCreateModalOpen(false); setPendingStatusId(null); }}
                onSubmit={handleCreateTask}
                workspaceId={workspaceId}
                defaultStatus={pendingStatusId || undefined}
            />
        </>
    );
}

function BoardColumn({ statusDef, tasks, onTaskClick, onAddTask, onUpdateStatus, onDeleteStatus, subtitle, onShare }: {
    statusDef: TaskStatusDto;
    tasks: TaskDto[];
    onTaskClick: (id: string) => void;
    onAddTask: () => void;
    onUpdateStatus: (updates: { name?: string; color?: string }) => void;
    onDeleteStatus: () => void;
    subtitle?: string;
    onShare?: (task: TaskDto) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: statusDef.id });
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState(statusDef.name);
    const [showMenu, setShowMenu] = useState(false);
    const [hexInput, setHexInput] = useState('');

    // Sync state when prop changes
    useEffect(() => {
        setEditName(statusDef.name);
    }, [statusDef.name]);

    // When color menu opens, sync hex input from current color
    useEffect(() => {
        if (showMenu) setHexInput(toHexColor(statusDef.color).replace(/^#/, ''));
    }, [showMenu, statusDef.color]);

    const handleSaveName = () => {
        if (editName.trim() && editName !== statusDef.name) {
            onUpdateStatus({ name: editName });
        }
        setIsEditingName(false);
    };

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex flex-col shrink-0 w-[85vw] md:w-[319px] h-full transition-colors group/col snap-center",
                "bg-transparent rounded-xl", // Removed overflow-hidden to fix header radius clipping
                isOver && "ring-1 ring-primary/10"
            )}
        >
            {/* Header Pill - primary accent */}
            <div className="mb-3 flex items-center justify-between bg-task-card border border-task-card-border border-primary/20 p-1.5 rounded-lg shrink-0 group/header relative z-10 h-11 shadow-[var(--task-card-shadow)] w-[300px]">
                <div className="flex items-center gap-3">
                    {/* Count Badge */}
                    <div
                        className="flex items-center justify-center w-7.5 h-7.5 rounded-full text-[16px] font-medium text-white shadow-sm ring-1 ring-white/10 ml-2"
                        style={{ backgroundColor: statusDef.color }}
                    >
                        {tasks.length}
                    </div>

                    {/* Status Name */}
                    {isEditingName ? (
                        <input
                            autoFocus
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={handleSaveName}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveName();
                                if (e.key === 'Escape') setIsEditingName(false);
                            }}
                            onClick={e => e.stopPropagation()}
                            className="bg-transparent font-['Inter'] text-[16px] font-medium leading-none tracking-normal text-task-card-foreground outline-none w-[120px]"
                        />
                    ) : (
                        <span
                            className="font-['Inter'] text-[15px] font-medium leading-none tracking-normal text-task-card-foreground cursor-pointer hover:underline decoration-primary/50 dark:decoration-white/20 underline-offset-4"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsEditingName(true);
                            }}
                        >
                            {statusDef.name}
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 pr-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); onAddTask(); }}
                        className="text-muted-foreground hover:text-white p-0.5 hover:bg-white/10 rounded transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={cn(
                                "text-muted-foreground hover:text-white p-0.5 hover:bg-white/10 rounded transition-colors",
                                "text-muted-foreground hover:text-white p-0.5 hover:bg-white/10 rounded transition-colors",
                                showMenu && "text-white bg-white/10"
                            )}
                        >
                            <MoreHorizontal className="w-4.5 h-4.5 rotate-90" />
                        </button>
                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute top-full right-0 mt-1 w-48 bg-popover border border-border shadow-xl rounded-lg py-1 z-50 text-popover-foreground">
                                    <button
                                        onClick={() => { setShowMenu(false); setIsEditingName(true); }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-white/5 transition-colors"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" /> Rename
                                    </button>

                                    <div className="px-3 py-2 border-t border-border bg-muted">
                                        <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                            <Palette className="w-3 h-3" /> Color
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={toHexColor(statusDef.color)}
                                                    onChange={(e) => {
                                                        const hex = e.target.value;
                                                        onUpdateStatus({ color: hex });
                                                        setHexInput(hex.replace(/^#/, ''));
                                                    }}
                                                    className="w-9 h-9 rounded-md border border-border cursor-pointer bg-transparent shrink-0"
                                                    title="Pick color"
                                                />
                                                <input
                                                    type="text"
                                                    value={hexInput}
                                                    onChange={(e) => {
                                                        const v = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                                                        setHexInput(v);
                                                        if (v.length === 6) onUpdateStatus({ color: '#' + v });
                                                    }}
                                                    onBlur={() => {
                                                        if (hexInput.length === 6) onUpdateStatus({ color: '#' + hexInput });
                                                        else setHexInput(toHexColor(statusDef.color).replace(/^#/, ''));
                                                    }}
                                                    placeholder="Hex"
                                                    className="flex-1 min-w-0 h-9 px-2 text-xs font-mono rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">Pick any color or enter hex (e.g. #ff5500)</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-white/10 mt-1 pt-1">
                                        <button
                                            onClick={() => { setShowMenu(false); onDeleteStatus(); }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-scroll px-0 pr-0 pb-2 flex flex-col gap-2 min-h-0 task-board-scrollbar">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <SortableTaskItem
                            key={task.id}
                            task={task}
                            onClick={() => onTaskClick(task.id)}
                            subtitle={subtitle}
                            onShare={onShare}
                            statusColor={statusDef.color}
                        />
                    ))}
                </SortableContext>

                <button
                    onClick={onAddTask}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors mt-1 opacity-60 hover:opacity-100 w-full text-left hover:bg-accent text-muted-foreground"
                >
                    <Plus className="w-4 h-4" />
                    <span>Create</span>
                </button>
            </div>
        </div>
    );
}

function SortableTaskItem({ task, onClick, subtitle, onShare, statusColor }: { task: TaskDto; onClick?: () => void; subtitle?: string; onShare?: (task: TaskDto) => void; statusColor?: string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(isDragging && "opacity-50 z-50 transform-gpu")}
        >
            <TaskCard task={task} subtitle={subtitle} onOpenDetail={onClick} onShare={onShare} statusColor={statusColor} />
        </div>
    );
}

function TaskCard({ task, isOverlay, subtitle, onOpenDetail, onShare, statusColor }: { task: TaskDto; isOverlay?: boolean; subtitle?: string; onOpenDetail?: () => void; onShare?: (task: TaskDto) => void; statusColor?: string }) {
    const priorityColors: Record<string, string> = {
        URGENT: 'text-destructive bg-destructive/10 border-destructive/20',
        HIGH: 'text-primary bg-primary/10 border-primary/20',
        MEDIUM: 'text-muted-foreground bg-muted border-border',
        LOW: 'text-muted-foreground bg-muted/80 border-border',
        NONE: 'text-muted-foreground',
    };

    const { activeTimer, startTimer, stopTimer } = useTaskStore();
    const isRunning = activeTimer?.taskId === task.id;

    // Timer State
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        let interval: any;
        if (isRunning && activeTimer?.startTime) {
            const start = new Date(activeTimer.startTime).getTime();
            setSeconds(Math.floor((Date.now() - start) / 1000));

            interval = setInterval(() => {
                setSeconds(Math.floor((Date.now() - start) / 1000));
            }, 1000);
        } else {
            setSeconds(0);
        }
        return () => clearInterval(interval);
    }, [isRunning, activeTimer?.startTime]);

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleTimer = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (isRunning) {
            await stopTimer(task.workspaceId, task.id);
        } else {
            await startTimer(task.workspaceId, task.id);
        }
    };

    const handleMessageClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (onShare) {
            onShare(task);
        }
    };

    const borderColor = statusColor || 'hsl(var(--primary) / 0.6)';
    const bgStyle = statusColor
        ? { background: `linear-gradient(135deg, ${statusColor}22 0%, ${statusColor}08 100%), var(--task-card-bg)`, borderLeftColor: borderColor }
        : { borderLeftColor: borderColor };

    return (
        <div
            className={cn(
                "bg-task-card flex flex-col rounded-lg border border-task-card-border border-l-4 select-none transition-all group hover:border-primary/40 hover:shadow-md shadow-[var(--task-card-shadow)]",
                "cursor-grab active:cursor-grabbing",
                isOverlay ? "shadow-2xl ring-2 ring-primary rotate-1 scale-105" : ""
            )}
            style={bgStyle}
        >
            {/* Top Section: Title + Priority + Info - CLICKABLE FOR DETAILS */}
            <div
                className="px-2.5 pt-2 pb-1.5 flex flex-col cursor-pointer min-h-0"
                onClick={onOpenDetail}
            >
                {/* Top Row: Title + Priority */}
                <div className="flex justify-between items-start gap-2">
                    <div className="text-[13px] font-medium text-task-card-foreground leading-snug line-clamp-2 flex-1 min-w-0">
                        {task.title}
                    </div>
                    {task.priority !== 'NONE' && (
                        <div className={cn(
                            "text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 flex items-center justify-center border",
                            priorityColors[task.priority] || priorityColors.NONE
                        )}>
                            {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                        </div>
                    )}
                </div>

                {/* Subtitle - Near Title */}
                {subtitle && (
                    <div className="text-[11px] text-task-card-muted font-normal truncate mt-0.5">
                        {subtitle}
                    </div>
                )}

                {/* Date / Estimate - Compact row */}
                {(task.dueDate || task.estimate) && (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
                        {task.dueDate && (
                            <span className="font-['Inter'] text-[10px] text-task-card-muted">
                                Due {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </span>
                        )}
                        {task.estimate && (
                            <span className="font-['Inter'] text-[10px] text-task-card-muted">{task.estimate}h</span>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Row: Icons + Assignee - compact */}
            <div className="px-2.5 py-1.5 border-t border-task-card-border flex items-center justify-between cursor-default">
                <div className="flex items-center gap-1.5 text-task-card-muted">
                    <button
                        onClick={toggleTimer}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={cn(
                            "flex items-center gap-1 text-[10px] font-medium transition-colors hover:bg-primary/10 hover:text-primary rounded p-1 -ml-0.5",
                            (isRunning || seconds > 0) ? "text-primary" : "hover:text-task-card-foreground"
                        )}
                    >
                        {isRunning ? (
                            <Pause className="w-3.5 h-3.5" />
                        ) : seconds > 0 ? (
                            <Play className="w-3.5 h-3.5" />
                        ) : (
                            <Timer className="w-3.5 h-3.5" />
                        )}
                        {(isRunning || seconds > 0) && <span>{formatTime(seconds)}</span>}
                    </button>
                    <button
                        onClick={handleMessageClick}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-[10px] font-medium hover:bg-primary/10 hover:text-primary rounded p-1 transition-colors"
                        title="Share to Channel"
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ring-1 ring-border overflow-hidden",
                    task.assigneeId && !task.assigneeAvatarUrl ? "bg-primary/20 text-primary ring-primary/30" : "bg-muted/50 text-muted-foreground",
                    task.assigneeAvatarUrl && "bg-transparent text-transparent ring-transparent"
                )}>
                    {task.assigneeAvatarUrl ? (
                        <img
                            src={task.assigneeAvatarUrl}
                            alt={task.assigneeName || "Assignee"}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        task.assigneeName?.charAt(0) || <User className="w-3 h-3" />
                    )}
                </div>
            </div>
        </div>
    );
}
