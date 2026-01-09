import { useMemo, useState } from 'react';
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
import { useWorkspaces, isValidUUID } from '@/stores/workspaceStore';
import type { TaskDto, TaskStatus } from '@/types/task';
import { cn } from '@/lib/utils';
import { Circle, ArrowUp, HelpCircle, CheckCircle2, Plus, MoreHorizontal } from 'lucide-react';

const statuses: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

// Exact match to ClickUp style: Solid colored pills for header, colored Add Task buttons
const statusConfig: Record<TaskStatus, {
    headerPill: string;
    addTaskColor: string;
    icon: React.ElementType;
    label: string
}> = {
    TODO: {
        headerPill: 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/50',
        addTaskColor: 'text-zinc-500 hover:bg-zinc-500/10',
        icon: Circle,
        label: 'TO DO'
    },
    IN_PROGRESS: {
        headerPill: 'bg-blue-600 text-white border-transparent shadow-md shadow-blue-900/20',
        addTaskColor: 'text-blue-500 hover:bg-blue-500/10',
        icon: ArrowUp,
        label: 'IN PROGRESS'
    },
    IN_REVIEW: {
        headerPill: 'bg-purple-600 text-white border-transparent shadow-md shadow-purple-900/20',
        addTaskColor: 'text-purple-500 hover:bg-purple-500/10',
        icon: HelpCircle,
        label: 'IN REVIEW'
    },
    DONE: {
        headerPill: 'bg-green-600 text-white border-transparent shadow-md shadow-green-900/20',
        addTaskColor: 'text-green-500 hover:bg-green-500/10',
        icon: CheckCircle2,
        label: 'DONE'
    },
};

export function TaskBoardView() {
    const { listId } = useParams<{ listId: string }>();
    const { activeWorkspace } = useWorkspaces();
    const workspaceId = activeWorkspace?.id;
    const { tasks, updateTask, openTaskDetail, createTask } = useTaskStore();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    if (!workspaceId || !isValidUUID(workspaceId)) {
        return <div className="h-full flex items-center justify-center text-muted-foreground">Loading workspace...</div>;
    }

    const listTasks = tasks[listId || ''] || [];
    const [activeId, setActiveId] = useState<string | null>(null);

    const tasksByStatus = useMemo(() => {
        const grouped: Record<TaskStatus, TaskDto[]> = {
            TODO: [],
            IN_PROGRESS: [],
            IN_REVIEW: [],
            DONE: []
        };
        listTasks.forEach(task => {
            if (grouped[task.status]) {
                grouped[task.status].push(task);
            }
        });
        Object.keys(grouped).forEach(key => {
            grouped[key as TaskStatus].sort((a, b) => a.orderIndex - b.orderIndex);
        });
        return grouped;
    }, [listTasks]);

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
        let newStatus: TaskStatus | null = null;

        // 1. Dropped directly on a Column (empty space)
        if (statuses.includes(overId as TaskStatus)) {
            newStatus = overId as TaskStatus;
        }
        // 2. Dropped on another Task
        else {
            const overTask = listTasks.find(t => t.id === overId);
            if (overTask) {
                newStatus = overTask.status as TaskStatus;
            }
        }

        if (newStatus && newStatus !== activeTask.status) {
            updateTask(workspaceId!, activeTask.id, activeTask.listId, { status: newStatus });
        }
    }

    const handleTaskClick = (taskId: string) => {
        openTaskDetail(taskId);
    };

    const handleAddTask = async (status: TaskStatus) => {
        if (!workspaceId || !listId) return;
        try {
            const newTask = await createTask(workspaceId, {
                listId,
                title: 'New Task',
                priority: 'NONE',
            });
            if (newTask) {
                // If created in a specific column (not default TODO), update status immediately
                if (status !== 'TODO') {
                    await updateTask(workspaceId, newTask.id, listId, { status });
                }
                openTaskDetail(newTask.id);
            }
        } catch (error) {
            console.error("Failed to create task", error);
        }
    };

    const activeTask = activeId ? listTasks.find(t => t.id === activeId) : null;

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {/* FULL HEIGHT container - columns fill width equally */}
            <div className="flex h-full gap-4 p-4 items-stretch min-h-0 min-w-0">
                {statuses.map(status => (
                    <BoardColumn
                        key={status}
                        status={status}
                        tasks={tasksByStatus[status]}
                        onTaskClick={handleTaskClick}
                        onAddTask={() => handleAddTask(status)}
                    />
                ))}
            </div>
            <DragOverlay>
                {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}

function BoardColumn({ status, tasks, onTaskClick, onAddTask }: {
    status: TaskStatus;
    tasks: TaskDto[];
    onTaskClick: (id: string) => void;
    onAddTask: () => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: status });
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div
            ref={setNodeRef}
            className={cn(
                // FULL HEIGHT column, WITH BORDER AND BACKGROUND
                "flex flex-col flex-1 min-w-[200px] h-full transition-colors group/col",
                "border border-border/40 bg-card/30 rounded-xl overflow-hidden", // Added overflow-hidden for border radius
                isOver && "bg-card/60 ring-1 ring-primary/10"
            )}
        >
            {/* Header: Exact Match to Screenshot + Border Separator */}
            <div className="p-3 pb-3 flex items-center gap-3 shrink-0 border-b border-white/5 mx-1 mb-1 relative">
                {/* Status Pill */}
                <div className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-sm max-w-max text-[11px] font-bold uppercase tracking-wide",
                    config.headerPill
                )}>
                    <Icon className="w-3 h-3" />
                    <span className="translate-y-[0.5px]">{config.label}</span>
                </div>

                {/* Count */}
                <span className="text-muted-foreground/50 text-xs font-medium">{tasks.length}</span>

                {/* Hover Actions */}
                <div className="ml-auto flex gap-1 opacity-0 group-hover/col:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onAddTask(); }}
                        className="text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 rounded p-1 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button className="text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 rounded p-1 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
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

                {/* Add Task Button (At Bottom) */}
                <button
                    onClick={onAddTask}
                    className={cn(
                        "flex items-center gap-2 px-2 py-1.5 text-sm font-medium rounded-md transition-colors mt-1 opacity-60 hover:opacity-100 w-full text-left",
                        config.addTaskColor
                    )}
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
        URGENT: 'text-red-500',
        HIGH: 'text-orange-500',
        MEDIUM: 'text-blue-500',
        LOW: 'text-zinc-500',
        NONE: 'text-zinc-600',
    };

    return (
        <div
            className={cn(
                "bg-card p-3 rounded-lg border border-border/60 shadow-sm select-none transition-all group hover:border-primary/30",
                "cursor-grab active:cursor-grabbing",
                isOverlay && "shadow-xl ring-2 ring-primary rotate-1 scale-105"
            )}
        >
            <div className="flex justify-between items-start mb-2 gap-2">
                <div className="text-sm font-medium leading-tight line-clamp-2">{task.title}</div>
            </div>

            <div className="flex items-center gap-3 mt-3 text-muted-foreground">

                {/* Assignee Avatar */}
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold shrink-0">
                    {task.assigneeName?.charAt(0) || '?'}
                </div>

                {/* Due Date */}
                {task.dueDate && (
                    <div className="flex items-center gap-1 text-[10px] hover:text-foreground transition-colors">
                        <span>📅</span>
                        {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: '2-digit' })}
                    </div>
                )}

                {/* Priority Flag */}
                <div className={cn("text-[10px] font-medium ml-auto flex items-center gap-1", priorityColors[task.priority] || priorityColors.NONE)}>
                    <span>⚑</span>
                    {task.priority !== 'NONE' && task.priority}
                </div>
            </div>
        </div>
    );
}
