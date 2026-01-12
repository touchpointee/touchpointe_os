import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    CheckCircle2,
    Circle,
    HelpCircle,
    AlertCircle,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@/stores/taskStore';
import { useWorkspaces, isValidUUID } from '@/stores/workspaceStore';
import { useTeamStore } from '@/stores/teamStore';
import type { TaskDto, TaskStatus, TaskPriority } from '@/types/task';

// Status Config
const statusConfig: Record<TaskStatus, { color: string; icon: React.ElementType }> = {
    TODO: { color: 'bg-zinc-200 text-zinc-700', icon: Circle },
    IN_PROGRESS: { color: 'bg-blue-100 text-blue-700', icon: ArrowUp },
    IN_REVIEW: { color: 'bg-yellow-100 text-yellow-700', icon: HelpCircle },
    DONE: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
};

// Priority Config
const priorityConfig: Record<TaskPriority, { color: string; icon: React.ElementType }> = {
    NONE: { color: 'text-zinc-400', icon: Circle },
    LOW: { color: 'text-zinc-600', icon: ArrowDown },
    MEDIUM: { color: 'text-blue-600', icon: Circle },
    HIGH: { color: 'text-orange-600', icon: ArrowUp },
    URGENT: { color: 'text-red-600', icon: AlertCircle },
};

export function TaskListView() {
    const { listId } = useParams<{ listId: string }>();
    const { tasks, loading, fetchTasks, updateTask, openTaskDetail } = useTaskStore();
    const { activeWorkspace } = useWorkspaces();
    const { fetchMembers, members } = useTeamStore();

    const workspaceId = activeWorkspace?.id;

    useEffect(() => {
        if (listId && workspaceId && isValidUUID(workspaceId)) {
            fetchTasks(workspaceId, listId);
            fetchMembers(workspaceId);
        }
    }, [listId, workspaceId, fetchTasks, fetchMembers]);

    if (!workspaceId || !isValidUUID(workspaceId)) {
        return <div className="p-8 text-center text-muted-foreground">Loading workspace...</div>;
    }

    const listTasks = tasks[listId || ''] || [];

    if (loading && !listTasks.length) {
        return <div className="p-8 text-center text-muted-foreground">Loading tasks...</div>;
    }

    if (listTasks.length === 0) {
        return (
            <div className="p-8 text-center border-2 border-dashed border-border rounded-lg m-4">
                <p className="text-muted-foreground">No tasks in this list.</p>
                <button className="mt-2 text-primary hover:underline font-medium">Create your first task</button>
            </div>
        );
    }

    return (
        <div className="w-full pb-20">
            {/* Header - Hidden on Mobile */}
            <div className="hidden md:grid grid-cols-[40px_1fr_180px_140px_140px] gap-2 px-4 py-2 border-b border-border text-xs font-medium text-muted-foreground bg-muted/30">
                <div className="flex justify-center">#</div>
                <div>Name</div>
                <div>Assignee</div>
                <div>Priority</div>
                <div>Status</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border">
                {listTasks.map((task) => (
                    <TaskRow
                        key={task.id}
                        task={task}
                        members={members}
                        onUpdate={(req) => updateTask(workspaceId, task.id, task.listId, req)}
                        onClick={() => openTaskDetail(task.id)}
                    />
                ))}
            </div>
        </div>
    );
}

function TaskRow({
    task,
    members,
    onUpdate,
    onClick
}: {
    task: TaskDto,
    members: any[],
    onUpdate: (req: any) => void,
    onClick: () => void
}) {
    const [openDropdown, setOpenDropdown] = useState<'status' | 'priority' | 'assignee' | null>(null);

    // Derived values
    const StatusIcon = statusConfig[task.status].icon;
    const PriorityIcon = priorityConfig[task.priority].icon;

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openDropdown && !(event.target as Element).closest('.dropdown-trigger') && !(event.target as Element).closest('.dropdown-content')) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdown]);

    return (
        <div className="md:grid md:grid-cols-[40px_1fr_180px_140px_140px] md:gap-2 px-4 py-3 md:py-2 text-sm hover:bg-accent/50 group transition-colors items-center relative flex flex-col gap-2 md:block">

            {/* Mobile Top Row: Status + Title */}
            <div className="flex items-start md:contents w-full gap-3">
                {/* 1. Check/Toggle Status */}
                <div className="flex justify-center shrink-0 mt-0.5 md:mt-0">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onUpdate({ status: task.status === 'DONE' ? 'TODO' : 'DONE' });
                        }}
                        className="text-muted-foreground hover:text-primary transition-colors"
                    >
                        {task.status === 'DONE' ? <CheckCircle2 className="w-5 h-5 md:w-4 md:h-4 text-green-600" /> : <Circle className="w-5 h-5 md:w-4 md:h-4" />}
                    </button>
                </div>

                {/* 2. Title (Click to open detail) */}
                <div className="font-medium text-foreground truncate cursor-pointer hover:underline hover:text-primary pr-4 flex-1 md:text-sm text-base" onClick={onClick}>
                    {task.title}
                </div>
            </div>

            {/* Mobile Bottom Row: Metadata (Assignee, Priority, Status Label) */}
            <div className="flex items-center gap-3 w-full pl-8 md:p-0 md:contents overflow-x-auto md:overflow-visible">

                {/* 3. Assignee Dropdown */}
                <div className="relative shrink-0">
                    <div
                        className="flex items-center gap-2 cursor-pointer p-1 -ml-1 rounded hover:bg-muted/80 dropdown-trigger"
                        onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'assignee' ? null : 'assignee'); }}
                    >
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold shrink-0 border border-primary/20">
                            {task.assigneeName ? task.assigneeName.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span className={cn("text-xs truncate max-w-[80px] md:max-w-none", !task.assigneeName && "text-muted-foreground italic")}>
                            {task.assigneeName || "Unassigned"}
                        </span>
                    </div>

                    {/* Dropdown Menu */}
                    {openDropdown === 'assignee' && (
                        <div className="absolute top-full left-0 z-50 w-56 mt-1 bg-popover border text-popover-foreground rounded-md shadow-md py-1 dropdown-content max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mb-1">Select Assignee</div>

                            {/* Unassign Option */}
                            <div
                                className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent hover:text-accent-foreground cursor-pointer text-xs"
                                onClick={(e) => { e.stopPropagation(); onUpdate({ assigneeId: null }); setOpenDropdown(null); }}
                            >
                                <div className="w-5 h-5 rounded-full border border-dashed flex items-center justify-center text-[10px] text-muted-foreground shrink-0">
                                    <Circle className="w-3 h-3" />
                                </div>
                                <span>Unassigned</span>
                            </div>

                            {/* Members List */}
                            {members.map(member => (
                                <div
                                    key={member.userId}
                                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent hover:text-accent-foreground cursor-pointer text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUpdate({ assigneeId: member.userId });
                                        setOpenDropdown(null);
                                    }}
                                >
                                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold shrink-0">
                                        {member.fullName.charAt(0)}
                                    </div>
                                    <span className="truncate">{member.fullName}</span>
                                    {task.assigneeId === member.userId && <CheckCircle2 className="w-3 h-3 ml-auto text-primary" />}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 4. Priority Dropdown */}
                <div className="relative shrink-0">
                    <div
                        className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded text-xs w-auto md:w-full max-w-[100px] cursor-pointer border border-transparent hover:border-border transition-all dropdown-trigger",
                            priorityConfig[task.priority].color
                        )}
                        onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'priority' ? null : 'priority'); }}
                    >
                        <PriorityIcon className="w-3.5 h-3.5" />
                        <span className="capitalize">{task.priority.toLowerCase()}</span>
                    </div>

                    {/* Priority Menu */}
                    {openDropdown === 'priority' && (
                        <div className="absolute top-full left-0 z-50 w-36 mt-1 bg-popover border text-popover-foreground rounded-md shadow-md py-1 dropdown-content animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5 p-1">
                            {(Object.keys(priorityConfig) as TaskPriority[]).map((p) => {
                                const PIcon = priorityConfig[p].icon;
                                return (
                                    <div
                                        key={p}
                                        className={cn(
                                            "flex items-center gap-2 px-2 py-1.5 hover:bg-accent hover:text-accent-foreground cursor-pointer text-xs rounded-sm",
                                            priorityConfig[p].color
                                        )}
                                        onClick={(e) => { e.stopPropagation(); onUpdate({ priority: p }); setOpenDropdown(null); }}
                                    >
                                        <PIcon className="w-3.5 h-3.5" />
                                        <span className="capitalize">{p.toLowerCase()}</span>
                                        {task.priority === p && <CheckCircle2 className="w-3 h-3 ml-auto opacity-50" />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 5. Status Dropdown */}
                <div className="relative shrink-0">
                    <div
                        className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded text-xs w-auto md:w-full max-w-[120px] cursor-pointer hover:opacity-80 transition-opacity dropdown-trigger",
                            statusConfig[task.status].color
                        )}
                        onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'status' ? null : 'status'); }}
                    >
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{task.status.replace('_', ' ')}</span>
                    </div>

                    {/* Status Menu */}
                    {openDropdown === 'status' && (
                        <div className="absolute top-full right-0 z-50 w-40 mt-1 bg-popover border text-popover-foreground rounded-md shadow-md py-1 dropdown-content animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5 p-1">
                            {(Object.keys(statusConfig) as TaskStatus[]).map((s) => {
                                const SIcon = statusConfig[s].icon;
                                return (
                                    <div
                                        key={s}
                                        className={cn(
                                            "flex items-center gap-2 px-2 py-1.5 hover:bg-accent/50 cursor-pointer text-xs rounded-sm transition-colors",
                                        )}
                                        onClick={(e) => { e.stopPropagation(); onUpdate({ status: s }); setOpenDropdown(null); }}
                                    >
                                        <div className={cn("p-1 rounded-full", statusConfig[s].color)}>
                                            <SIcon className="w-3 h-3" />
                                        </div>
                                        <span className="">{s.replace('_', ' ')}</span>
                                        {task.status === s && <CheckCircle2 className="w-3 h-3 ml-auto opacity-50" />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
