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
import { Circle, ArrowUp, CheckCircle2, Plus, MoreHorizontal, Palette, Trash2, Edit2, User, Calendar, Flag } from 'lucide-react';

const PRESET_COLORS = [
    '#6B7280', // Gray
    '#2563EB', // Blue
    '#16A34A', // Green
    '#F59E0B', // Yellow
    '#DC2626', // Red
    '#7C3AED', // Violet
    '#DB2777', // Pink
    '#0891B2', // Cyan
];

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
                color: '#6B7280',
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

    const handleAddTask = async (statusId: string) => {
        if (!workspaceId || !listId) return;
        try {
            const newTask = await createTask(workspaceId, {
                listId,
                title: 'New Task',
                customStatus: statusId
            });
            if (newTask) {
                openTaskDetail(newTask.id);
            }
        } catch (error) {
            console.error("Failed to create task", error);
        }
    };

    const activeTask = activeId ? listTasks.find(t => t.id === activeId) : null;

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex h-full gap-4 p-4 items-stretch min-h-0 min-w-0 overflow-x-auto snap-x snap-mandatory md:snap-none selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
                {statusDefs.map(status => (
                    <BoardColumn
                        key={status.id}
                        statusDef={status}
                        tasks={tasksByStatus[status.id] || []}
                        onTaskClick={handleTaskClick}
                        onAddTask={() => handleAddTask(status.id)}
                        onUpdateStatus={(updates) => handleUpdateStatus(status.id, updates)}
                        onDeleteStatus={() => handleDeleteStatus(status.id)}
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
                {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}

function BoardColumn({ statusDef, tasks, onTaskClick, onAddTask, onUpdateStatus, onDeleteStatus }: {
    statusDef: TaskStatusDto;
    tasks: TaskDto[];
    onTaskClick: (id: string) => void;
    onAddTask: () => void;
    onUpdateStatus: (updates: { name?: string; color?: string }) => void;
    onDeleteStatus: () => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: statusDef.id });
    const [isEditingName, setIsEditingName] = useState(false);
    const [editName, setEditName] = useState(statusDef.name);
    const [showMenu, setShowMenu] = useState(false);

    // Sync state when prop changes
    useEffect(() => {
        setEditName(statusDef.name);
    }, [statusDef.name]);

    // Choose icon based on Category
    const Icon = statusDef.category === 'Closed' ? CheckCircle2 : (statusDef.category === 'Active' ? ArrowUp : Circle);

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
                "flex flex-col flex-1 min-w-[85vw] md:min-w-[280px] h-full transition-colors group/col snap-center",
                "border border-border/40 bg-card/30 rounded-xl overflow-hidden",
                isOver && "bg-card/60 ring-1 ring-primary/10"
            )}
        >
            {/* Header */}
            <div className="p-3 pb-3 flex items-center gap-3 shrink-0 border-b border-white/5 mx-1 mb-1 relative">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm max-w-max text-[11px] font-bold uppercase tracking-wide transition-opacity"
                    style={{
                        backgroundColor: statusDef.category === 'NotStarted' ? 'transparent' : statusDef.color,
                        color: statusDef.category === 'NotStarted' ? statusDef.color : '#fff',
                        border: statusDef.category === 'NotStarted' ? `1px solid ${statusDef.color}50` : 'none'
                    }}
                >
                    <Icon className="w-3 h-3" />

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
                            className="bg-transparent text-inherit outline-none w-[100px]"
                        />
                    ) : (
                        <span className="translate-y-[0.5px]" onClick={(e) => {
                            e.stopPropagation();
                            setIsEditingName(true);
                        }}>{statusDef.name}</span>
                    )}
                </div>

                <span className="text-muted-foreground/50 text-xs font-medium">{tasks.length}</span>

                <div className="ml-auto flex gap-1 items-center">
                    <button
                        onClick={(e) => { e.stopPropagation(); onAddTask(); }}
                        className="text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 rounded p-1 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={cn(
                                "text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 rounded p-1 transition-colors",
                                showMenu && "bg-muted text-foreground"
                            )}
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute top-full right-0 mt-1 w-48 bg-card border border-border shadow-xl rounded-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                        onClick={() => { setShowMenu(false); setIsEditingName(true); }}
                                        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" /> Rename
                                    </button>

                                    <div className="px-3 py-2 border-t border-border">
                                        <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                            <Palette className="w-3 h-3" /> Color
                                        </div>
                                        <div className="grid grid-cols-4 gap-1.5">
                                            {PRESET_COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => {
                                                        onUpdateStatus({ color: c });
                                                        setShowMenu(false);
                                                    }}
                                                    className={cn(
                                                        "w-6 h-6 rounded-md border border-white/10 hover:scale-110 transition-transform",
                                                        statusDef.color === c && "ring-2 ring-primary ring-offset-1 ring-offset-card"
                                                    )}
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="border-t border-border mt-1 pt-1">
                                        <button
                                            onClick={() => { setShowMenu(false); onDeleteStatus(); }}
                                            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 transition-colors"
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
            <div className="flex-1 overflow-y-auto px-2 pb-2 flex flex-col gap-2 min-h-0">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <SortableTaskItem
                            key={task.id}
                            task={task}
                            onClick={() => onTaskClick(task.id)}
                        />
                    ))}
                </SortableContext>

                <button
                    onClick={onAddTask}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors mt-1 opacity-60 hover:opacity-100 w-full text-left hover:bg-muted/50"
                    style={{ color: statusDef.color }}
                >
                    <Plus className="w-4 h-4" />
                    <span>Add Task</span>
                </button>
            </div>
        </div>
    );
}

function SortableTaskItem({ task, onClick }: { task: TaskDto; onClick?: () => void }) {
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
            onClick={onClick}
            className={cn(isDragging && "opacity-50 z-50")}
        >
            <TaskCard task={task} />
        </div>
    );
}

function TaskCard({ task, isOverlay }: { task: TaskDto; isOverlay?: boolean }) {
    const priorityColors: Record<string, string> = {
        URGENT: 'text-[#DC2626]',
        HIGH: 'text-[#F97316]',
        MEDIUM: 'text-[#2563EB]',
        LOW: 'text-[#6B7280]',
        NONE: 'text-[#9E9E9E]',
    };

    return (
        <div
            className={cn(
                "bg-card p-3 rounded-lg border border-border/60 shadow-sm select-none transition-all group hover:border-primary/30",
                "cursor-grab active:cursor-grabbing",
                isOverlay && "shadow-xl ring-2 ring-primary rotate-1 scale-105"
            )}
        >
            <div className="flex justify-between items-start mb-1 gap-2">
                <div className="text-sm font-medium leading-tight line-clamp-2">{task.title}</div>
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {task.tags.map(tag => (
                        <div
                            key={tag.id}
                            className="w-4 h-1 rounded-full"
                            style={{ backgroundColor: tag.color }}
                            title={tag.name}
                        />
                    ))}
                </div>
            )}

            <div className="flex items-center gap-3 mt-3 text-muted-foreground">
                <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 shadow-inner",
                    task.assigneeId ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/30 border border-dashed border-border"
                )}>
                    {task.assigneeName?.charAt(0) || <User className="w-3 h-3" />}
                </div>

                {task.dueDate && (
                    <div className="flex items-center gap-1 text-[10px] hover:text-foreground transition-colors">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                    </div>
                )}

                <div className={cn("text-[10px] font-bold ml-auto flex items-center gap-1 opacity-80", priorityColors[task.priority] || priorityColors.NONE)}>
                    {task.priority !== 'NONE' && (
                        <>
                            <Flag className="w-2.5 h-2.5 fill-current" />
                            <span className="uppercase tracking-tighter">{task.priority}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
