import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
    CheckCircle2,
    Circle,
    AlertCircle,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@/stores/taskStore';
import { useWorkspaces, isValidUUID } from '@/stores/workspaceStore';
import { useTeamStore } from '@/stores/teamStore';
import { useHierarchyStore } from '@/stores/hierarchyStore';
import type { TaskDto, TaskPriority } from '@/types/task';
import type { TaskStatusDto } from '@/types/hierarchy';

// Priority Config (priority is not list-specific, remains hardcoded)
const priorityConfig: Record<TaskPriority, { color: string; icon: React.ElementType }> = {
    NONE: { color: 'text-[#9E9E9E]', icon: Circle },
    LOW: { color: 'text-[#6B7280]', icon: ArrowDown },
    MEDIUM: { color: 'text-[#2563EB]', icon: Circle },
    HIGH: { color: 'text-[#F97316]', icon: ArrowUp },
    URGENT: { color: 'text-[#DC2626]', icon: AlertCircle },
};

export function TaskListView() {
    const { listId } = useParams<{ listId: string }>();
    const { tasks, loading, fetchTasks, updateTask, openTaskDetail } = useTaskStore();
    const { activeWorkspace } = useWorkspaces();
    const { fetchMembers, members } = useTeamStore();
    const { spaces } = useHierarchyStore();

    const workspaceId = activeWorkspace?.id;

    // Get dynamic status config from list
    const statusDefs = useMemo(() => {
        if (!listId) return [];
        for (const space of spaces) {
            const list = space.lists.find(l => l.id === listId);
            if (list) return list.statuses || [];

            for (const folder of space.folders) {
                const fList = folder.lists.find(l => l.id === listId);
                if (fList) return fList.statuses || [];
            }
        }
        return [];
    }, [spaces, listId]);

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
        <div className="w-full pb-20 selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
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
                        statusDefs={statusDefs}
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
    statusDefs,
    onUpdate,
    onClick
}: {
    task: TaskDto,
    members: any[],
    statusDefs: TaskStatusDto[],
    onUpdate: (req: any) => void,
    onClick: () => void
}) {
    const [openDropdown, setOpenDropdown] = useState<'status' | 'priority' | 'assignee' | null>(null);

    // Find current status from dynamic defs
    const currentStatusDef = statusDefs.find(s => s.id === task.customStatus)
        || statusDefs[0];

    // Priority config remains hardcoded (priority is not list-specific)
    const priorityCfg = priorityConfig[task.priority as TaskPriority] || priorityConfig.NONE;
    const PriorityIcon = priorityCfg.icon;

    // Status icon based on category
    const getStatusIcon = (category: string) => {
        if (category === 'Closed') return CheckCircle2;
        if (category === 'Active') return ArrowUp;
        return Circle;
    };
    const StatusIcon = getStatusIcon(currentStatusDef?.category || 'NotStarted');

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
                    <div
                        className="text-muted-foreground transition-colors cursor-default"
                    >
                        {task.status === 'DONE' ? <CheckCircle2 className="w-5 h-5 md:w-4 md:h-4 text-green-600" /> : <Circle className="w-5 h-5 md:w-4 md:h-4" />}
                    </div>
                </div>

                {/* 2. Title (Click to open detail) */}
                <div className="flex-1 flex flex-col min-w-0 pr-4">
                    <div className="font-medium text-foreground truncate cursor-pointer hover:underline hover:text-primary md:text-sm text-base" onClick={onClick}>
                        {task.title}
                    </div>
                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {task.tags.map(tag => (
                                <span
                                    key={tag.id}
                                    className="px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold text-white uppercase tracking-wider"
                                    style={{ backgroundColor: tag.color }}
                                >
                                    {tag.name}
                                </span>
                            ))}
                        </div>
                    )}
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
                            priorityCfg.color
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
                        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs w-auto md:w-full max-w-[120px] cursor-pointer hover:opacity-80 transition-opacity dropdown-trigger"
                        style={{
                            backgroundColor: currentStatusDef?.color || '#87909e',
                            color: '#fff'
                        }}
                        onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'status' ? null : 'status'); }}
                    >
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{currentStatusDef?.name || 'Unknown'}</span>
                    </div>

                    {/* Status Menu */}
                    {openDropdown === 'status' && (
                        <div className="absolute top-full right-0 z-50 w-44 mt-1 bg-popover border text-popover-foreground rounded-md shadow-md py-1 dropdown-content animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-0.5 p-1">
                            {statusDefs.map((status) => {
                                const SIcon = getStatusIcon(status.category);
                                const isActive = currentStatusDef?.id === status.id;
                                return (
                                    <div
                                        key={status.id}
                                        className={cn(
                                            "flex items-center gap-2 px-2 py-1.5 hover:bg-accent/50 cursor-pointer text-xs rounded-sm transition-colors",
                                        )}
                                        onClick={(e) => { e.stopPropagation(); onUpdate({ customStatus: status.id }); setOpenDropdown(null); }}
                                    >
                                        <div
                                            className="p-1 rounded-full"
                                            style={{ backgroundColor: status.color }}
                                        >
                                            <SIcon className="w-3 h-3 text-white" />
                                        </div>
                                        <span>{status.name}</span>
                                        {isActive && <CheckCircle2 className="w-3 h-3 ml-auto opacity-50" />}
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
