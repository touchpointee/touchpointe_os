import { useEffect, useState } from 'react';
import { X, Copy, MoreHorizontal, Calendar as CalendarIcon, Flag, ChevronDown, Check } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useWorkspaces, isValidUUID } from '@/stores/workspaceStore';
import { useTeamStore } from '@/stores/teamStore';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';
import { SubtaskList } from './SubtaskList';
import { TaskComments } from './TaskComments';
import { TaskActivityTimeline } from './TaskActivityTimeline';
import type { TaskStatus, TaskPriority } from '@/types/task';

const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
    { value: 'TODO', label: 'To Do', color: 'bg-zinc-400' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-500' },
    { value: 'IN_REVIEW', label: 'In Review', color: 'bg-yellow-500' },
    { value: 'DONE', label: 'Done', color: 'bg-green-500' },
];

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'NONE', label: 'None', color: 'text-zinc-400' },
    { value: 'LOW', label: 'Low', color: 'text-zinc-600' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-blue-500' },
    { value: 'HIGH', label: 'High', color: 'text-orange-500' },
    { value: 'URGENT', label: 'Urgent', color: 'text-red-500' },
];

export function TaskDetailPanel() {
    const {
        activeTaskId,
        isDetailPanelOpen,
        closeTaskDetail,
        taskDetails,
        fetchTaskDetails,
        updateTask,
        addSubtask,
        toggleSubtask,
        addComment
    } = useTaskStore();
    const { activeWorkspace } = useWorkspaces();
    const { members, fetchMembers } = useTeamStore();
    const { user } = useUserStore();

    const workspaceId = activeWorkspace?.id;


    // Dropdown states
    const [statusOpen, setStatusOpen] = useState(false);
    const [priorityOpen, setPriorityOpen] = useState(false);
    const [assigneeOpen, setAssigneeOpen] = useState(false);

    useEffect(() => {
        if (activeTaskId && isDetailPanelOpen && workspaceId && isValidUUID(workspaceId)) {
            fetchTaskDetails(workspaceId, activeTaskId);
            fetchMembers(workspaceId);
        }
    }, [activeTaskId, isDetailPanelOpen, workspaceId]);

    // Close all dropdowns when clicking outside
    useEffect(() => {
        const handleClick = () => {
            setStatusOpen(false);
            setPriorityOpen(false);
            setAssigneeOpen(false);
        };
        if (statusOpen || priorityOpen || assigneeOpen) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [statusOpen, priorityOpen, assigneeOpen]);

    if (!isDetailPanelOpen || !activeTaskId) return null;
    if (!workspaceId || !isValidUUID(workspaceId)) return null;

    const detail = taskDetails[activeTaskId];
    if (!detail) return (
        <div className="fixed inset-y-0 right-0 w-[60%] bg-background border-l border-border shadow-2xl z-50 p-8 flex items-center justify-center">
            Loading...
        </div>
    );

    const { task, subtasks, comments, activities } = detail;

    // Permission Check
    const canEdit = user && task && (user.id === task.assigneeId || user.id === task.createdById);

    // Handlers
    const handleTitleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        if (e.target.value !== task.title) {
            updateTask(workspaceId, task.id, task.listId, { title: e.target.value });
        }
    };

    const handleDescriptionBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        if (e.target.value !== task.description) {
            updateTask(workspaceId, task.id, task.listId, { description: e.target.value });
        }
    };

    const handleSubDescriptionBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        if (e.target.value !== task.subDescription) {
            updateTask(workspaceId, task.id, task.listId, { subDescription: e.target.value });
        }
    };

    const handleStatusChange = (newStatus: TaskStatus) => {
        if (newStatus !== task.status) {
            updateTask(workspaceId, task.id, task.listId, { status: newStatus });
        }
        setStatusOpen(false);
    };

    const handlePriorityChange = (newPriority: TaskPriority) => {
        if (newPriority !== task.priority) {
            updateTask(workspaceId, task.id, task.listId, { priority: newPriority });
        }
        setPriorityOpen(false);
    };

    const handleAssigneeChange = (userId: string) => {
        if (userId !== task.assigneeId) {
            updateTask(workspaceId, task.id, task.listId, { assigneeId: userId });
        }
        setAssigneeOpen(false);
    };

    const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value ? e.target.value : null;
        updateTask(workspaceId, task.id, task.listId, { dueDate: newDate });
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={closeTaskDetail} />

            {/* Panel */}
            <div className="fixed inset-y-0 right-0 w-[60%] min-w-[600px] bg-background border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="bg-muted px-2 py-1 rounded text-xs font-mono text-muted-foreground">
                            TASK-{task.id.substring(0, 4)}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-muted rounded-md text-muted-foreground"><Copy className="w-4 h-4" /></button>
                        <button className="p-2 hover:bg-muted rounded-md text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></button>
                        <button onClick={closeTaskDetail} className="p-2 hover:bg-muted rounded-md text-muted-foreground"><X className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-8 max-w-4xl mx-auto space-y-8">

                        {/* Title & Metadata */}
                        <div className="space-y-6">
                            <textarea
                                defaultValue={task.title}
                                onBlur={handleTitleBlur}
                                rows={1}
                                disabled={!canEdit}
                                className={cn(
                                    "w-full text-2xl font-bold bg-transparent outline-none resize-none overflow-hidden",
                                    !canEdit && "opacity-80 cursor-not-allowed"
                                )}
                                onInput={(e) => {
                                    e.currentTarget.style.height = 'auto';
                                    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                }}
                            />

                            <textarea
                                defaultValue={task.subDescription || ''}
                                onBlur={handleSubDescriptionBlur}
                                rows={1}
                                disabled={!canEdit}
                                placeholder={canEdit ? "Add context..." : "No additional context"}
                                className={cn(
                                    "w-full text-zinc-500 bg-transparent outline-none resize-none overflow-hidden text-sm",
                                    !canEdit && "opacity-80 cursor-not-allowed"
                                )}
                                onInput={(e) => {
                                    e.currentTarget.style.height = 'auto';
                                    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                }}
                            />

                            <div className="flex gap-4 text-sm">
                                {/* STATUS - Dropdown */}
                                <div className="space-y-1 w-1/4 relative">
                                    <div className="text-muted-foreground text-xs uppercase font-semibold">Status</div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setStatusOpen(!statusOpen); setPriorityOpen(false); setAssigneeOpen(false); }}
                                        className="flex items-center gap-2 px-2 py-1.5 bg-muted rounded w-full hover:bg-muted/80 transition-colors"
                                    >
                                        <div className={cn("w-2 h-2 rounded-full", statusOptions.find(s => s.value === task.status)?.color)} />
                                        <span className="flex-1 text-left text-sm">{statusOptions.find(s => s.value === task.status)?.label}</span>
                                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                    </button>
                                    {statusOpen && (
                                        <div className="absolute top-full left-0 mt-1 w-full bg-background border border-border rounded-lg shadow-xl z-50 py-1">
                                            {statusOptions.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(opt.value); }}
                                                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted transition-colors"
                                                >
                                                    <div className={cn("w-2 h-2 rounded-full", opt.color)} />
                                                    <span className="flex-1 text-left text-sm">{opt.label}</span>
                                                    {task.status === opt.value && <Check className="w-4 h-4 text-primary" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* ASSIGNEE - Dropdown */}
                                <div className="space-y-1 w-1/4 relative">
                                    <div className="text-muted-foreground text-xs uppercase font-semibold">Assignee</div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setAssigneeOpen(!assigneeOpen); setStatusOpen(false); setPriorityOpen(false); }}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded w-full hover:bg-muted transition-colors"
                                    >
                                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                            {task.assigneeName?.charAt(0) || '?'}
                                        </div>
                                        <span className="flex-1 text-left text-sm truncate">{task.assigneeName}</span>
                                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                    </button>
                                    {assigneeOpen && (
                                        <div className="absolute top-full left-0 mt-1 w-48 bg-background border border-border rounded-lg shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
                                            {members.map(member => (
                                                <button
                                                    key={member.userId}
                                                    onClick={(e) => { e.stopPropagation(); handleAssigneeChange(member.userId); }}
                                                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted transition-colors"
                                                >
                                                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                                        {member.fullName?.charAt(0) || '?'}
                                                    </div>
                                                    <span className="flex-1 text-left text-sm truncate">{member.fullName}</span>
                                                    {task.assigneeId === member.userId && <Check className="w-4 h-4 text-primary" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* PRIORITY - Dropdown */}
                                <div className="space-y-1 w-1/4 relative">
                                    <div className="text-muted-foreground text-xs uppercase font-semibold">Priority</div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setPriorityOpen(!priorityOpen); setStatusOpen(false); setAssigneeOpen(false); }}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded w-full hover:bg-muted transition-colors"
                                    >
                                        <Flag className={cn("w-4 h-4", priorityOptions.find(p => p.value === task.priority)?.color)} />
                                        <span className="flex-1 text-left text-sm">{priorityOptions.find(p => p.value === task.priority)?.label}</span>
                                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                    </button>
                                    {priorityOpen && (
                                        <div className="absolute top-full left-0 mt-1 w-full bg-background border border-border rounded-lg shadow-xl z-50 py-1">
                                            {priorityOptions.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={(e) => { e.stopPropagation(); handlePriorityChange(opt.value); }}
                                                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted transition-colors"
                                                >
                                                    <Flag className={cn("w-4 h-4", opt.color)} />
                                                    <span className="flex-1 text-left text-sm">{opt.label}</span>
                                                    {task.priority === opt.value && <Check className="w-4 h-4 text-primary" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* DUE DATE - Input */}
                                <div className="space-y-1 w-1/4">
                                    <div className="text-muted-foreground text-xs uppercase font-semibold">Due Date</div>
                                    <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted transition-colors">
                                        <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <input
                                            type="date"
                                            value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                                            onChange={handleDueDateChange}
                                            onClick={(e) => e.currentTarget.showPicker()}
                                            className="flex-1 bg-transparent outline-none text-sm w-full cursor-pointer [color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2 group">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Description</h3>
                            <textarea
                                defaultValue={task.description || ''}
                                onBlur={handleDescriptionBlur}
                                placeholder="Add a description..."
                                className="w-full min-h-[100px] p-3 rounded-md border border-transparent hover:border-border focus:border-primary bg-transparent outline-none resize-y transition-colors"
                            />
                        </div>

                        {/* Subtasks */}
                        <SubtaskList
                            subtasks={subtasks}
                            onAdd={(title, assigneeId) => addSubtask(workspaceId, task.id, title, assigneeId)}
                            onToggle={(id) => toggleSubtask(workspaceId, id)}
                            canAdd={!!canEdit}
                            currentUserId={user?.id}
                            parentAssigneeId={task.assigneeId}
                        />

                        {/* Split View: Activity & Comments */}
                        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-border">
                            <TaskActivityTimeline activities={activities} />
                            <TaskComments
                                comments={comments}
                                onAdd={(content) => addComment(workspaceId, task.id, content)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
