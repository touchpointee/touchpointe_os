import { useEffect, useState, useMemo } from 'react';
import { X, Copy, MoreHorizontal, Calendar as CalendarIcon, Flag, ChevronDown, Check, Trash2, Plus, Paperclip } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useTagStore } from '@/stores/tagStore';
import { useWorkspaces, isValidUUID } from '@/stores/workspaceStore';
import { useTeamStore } from '@/stores/teamStore';
import { useHierarchyStore } from '@/stores/hierarchyStore';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';
import { SubtaskList } from './SubtaskList';
import { TaskComments } from './TaskComments';
import { TaskActivityTimeline } from './TaskActivityTimeline';
import type { TaskPriority } from '@/types/task';
import { TimeTrackingPanel } from './TimeTrackingPanel';
import TaskAttachments from './TaskAttachments';

interface StatusOption {
    value: string;
    label: string;
    color: string;
}

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
        deleteTask
    } = useTaskStore();
    const { activeWorkspace } = useWorkspaces();
    const { members, fetchMembers } = useTeamStore();
    const { user } = useUserStore();
    const { spaces } = useHierarchyStore();

    const workspaceId = activeWorkspace?.id;


    // Dropdown states
    const [statusOpen, setStatusOpen] = useState(false);
    const [priorityOpen, setPriorityOpen] = useState(false);
    const [assigneeOpen, setAssigneeOpen] = useState(false);
    const [tagSearch, setTagSearch] = useState('');
    const [tagPickerOpen, setTagPickerOpen] = useState(false);

    const { tags, fetchTags, createTag } = useTagStore();

    useEffect(() => {
        if (activeTaskId && isDetailPanelOpen && workspaceId && isValidUUID(workspaceId)) {
            fetchTaskDetails(workspaceId, activeTaskId);
            fetchMembers(workspaceId);
            fetchTags(workspaceId);
        }
    }, [activeTaskId, isDetailPanelOpen, workspaceId]);

    // Close all dropdowns when clicking outside
    useEffect(() => {
        const handleClick = () => {
            setStatusOpen(false);
            setPriorityOpen(false);
            setAssigneeOpen(false);
            setTagPickerOpen(false);
        };
        if (statusOpen || priorityOpen || assigneeOpen || tagPickerOpen) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [statusOpen, priorityOpen, assigneeOpen, tagPickerOpen]);

    // Get detail and task - may be null
    const detail = activeTaskId ? taskDetails[activeTaskId] : null;
    const task = detail?.task;
    const subtasks = detail?.subtasks || [];
    const activities = detail?.activities || [];

    // Get Dynamic Status Options - MUST be before any conditional returns (Rules of Hooks)
    const statusOptions: StatusOption[] = useMemo(() => {
        if (!task) return [];

        let currentList = null;
        for (const space of spaces) {
            const list = space.lists.find(l => l.id === task.listId);
            if (list) { currentList = list; break; }
            for (const folder of space.folders) {
                const fList = folder.lists.find(l => l.id === task.listId);
                if (fList) { currentList = fList; break; }
            }
        }

        if (currentList?.statuses) {
            return currentList.statuses.map(d => ({
                value: d.id,
                label: d.name,
                color: d.color
            }));
        }
        return [];
    }, [spaces, task?.listId]);

    const currentStatusOption = useMemo(() => {
        if (!task || !statusOptions.length) return null;
        return statusOptions.find((s: StatusOption) => s.value === task.customStatus)
            || statusOptions[0];
    }, [statusOptions, task]);

    // Permission Check
    // ClickUp Model: "Any workspace member who has access to the task’s List can edit..."
    // Since we don't have granular List permissions yet, we assume access = edit.
    const canEdit = useMemo(() => {
        return !!user && !!task;
    }, [user, task]);

    // Early returns AFTER all hooks
    if (!isDetailPanelOpen || !activeTaskId) return null;
    if (!workspaceId || !isValidUUID(workspaceId)) return null;
    if (!detail || !task) return (
        <div className="fixed inset-y-0 right-0 w-[60%] bg-background border-l border-border shadow-2xl z-50 p-8 flex items-center justify-center">
            Loading...
        </div>
    );

    // Handlers
    const handleTitleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        if (!canEdit) return;
        if (e.target.value !== task.title) {
            updateTask(workspaceId, task.id, task.listId, { title: e.target.value });
        }
    };

    const handleDescriptionBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        if (!canEdit) return;
        if (e.target.value !== task.description) {
            updateTask(workspaceId, task.id, task.listId, { description: e.target.value });
        }
    };

    const handleSubDescriptionBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        if (!canEdit) return;
        if (e.target.value !== task.subDescription) {
            updateTask(workspaceId, task.id, task.listId, { subDescription: e.target.value });
        }
    };

    const handleStatusChange = (newStatusId: string) => {
        if (!canEdit) return;
        if (newStatusId !== task.customStatus) {
            updateTask(workspaceId, task.id, task.listId, { customStatus: newStatusId });
        }
        setStatusOpen(false);
    };

    const handlePriorityChange = (newPriority: TaskPriority) => {
        if (!canEdit) return;
        if (newPriority !== task.priority) {
            updateTask(workspaceId, task.id, task.listId, { priority: newPriority });
        }
        setPriorityOpen(false);
    };

    const handleAssigneeChange = (userId: string) => {
        if (!canEdit) return;
        if (userId !== task.assigneeId) {
            updateTask(workspaceId, task.id, task.listId, { assigneeId: userId });
        }
        setAssigneeOpen(false);
    };

    const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!canEdit) return;
        const newDate = e.target.value ? e.target.value : null;
        updateTask(workspaceId, task.id, task.listId, { dueDate: newDate });
    };

    const handleTagToggle = async (tagId: string) => {
        if (!canEdit) return;
        const currentTagIds = task.tags.map(t => t.id);
        const newTagIds = currentTagIds.includes(tagId)
            ? currentTagIds.filter(id => id !== tagId)
            : [...currentTagIds, tagId];

        await updateTask(workspaceId, task.id, task.listId, { tagIds: newTagIds });
    };

    const handleCreateTag = async () => {
        if (!canEdit) return;
        if (!tagSearch.trim()) return;

        // Random color from a preset list
        const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const newTag = await createTag(workspaceId, tagSearch.trim(), randomColor);
        if (newTag) {
            await handleTagToggle(newTag.id);
            setTagSearch('');
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={closeTaskDetail} />

            {/* Panel */}
            <div className="fixed inset-y-0 right-0 w-full md:w-[60%] md:min-w-[600px] bg-background border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <div className="bg-muted px-2 py-1 rounded text-xs font-mono text-muted-foreground">
                            TASK-{task.id.substring(0, 4)}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => document.getElementById('task-file-input')?.click()}
                            className="p-2 hover:bg-muted rounded-md text-muted-foreground"
                            title="Attach File"
                        >
                            <Paperclip className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-muted rounded-md text-muted-foreground"><Copy className="w-4 h-4" /></button>
                        {canEdit && <button
                            onClick={() => {
                                if (window.confirm('Are you sure you want to delete this task?')) {
                                    deleteTask(workspaceId, task.id);
                                }
                            }}
                            className="p-2 hover:bg-red-500/10 rounded-md text-red-500"
                            title="Delete Task"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>}
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

                            <div className="flex flex-col md:flex-row gap-4 text-sm">
                                {/* STATUS - Dropdown */}
                                <div className="space-y-1 w-full md:w-1/4 relative">
                                    <div className="text-muted-foreground text-xs uppercase font-semibold">Status</div>
                                    <button
                                        onClick={(e) => {
                                            if (!canEdit) return;
                                            e.stopPropagation(); setStatusOpen(!statusOpen); setPriorityOpen(false); setAssigneeOpen(false);
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 px-2 py-1.5 bg-muted rounded w-full hover:bg-muted/80 transition-colors",
                                            !canEdit && "opacity-70 cursor-not-allowed"
                                        )}
                                        disabled={!canEdit}
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: currentStatusOption?.color || '#999' }}
                                        />
                                        <span className="flex-1 text-left text-sm">{currentStatusOption?.label || task.status}</span>
                                        {canEdit && <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                                    </button>
                                    {statusOpen && canEdit && (
                                        <div className="absolute top-full left-0 mt-1 w-full bg-background border border-border rounded-lg shadow-xl z-50 py-1">
                                            {statusOptions.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(opt.value); }}
                                                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted transition-colors"
                                                >
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opt.color }} />
                                                    <span className="flex-1 text-left text-sm">{opt.label}</span>
                                                    {currentStatusOption?.value === opt.value && <Check className="w-4 h-4 text-primary" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* ASSIGNEE - Dropdown */}
                                <div className="space-y-1 w-full md:w-1/4 relative">
                                    <div className="text-muted-foreground text-xs uppercase font-semibold">Assignee</div>
                                    <button
                                        onClick={(e) => {
                                            if (!canEdit) return;
                                            e.stopPropagation(); setAssigneeOpen(!assigneeOpen); setStatusOpen(false); setPriorityOpen(false);
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 px-2 py-1.5 rounded w-full hover:bg-muted transition-colors",
                                            !canEdit && "opacity-70 cursor-not-allowed"
                                        )}
                                        disabled={!canEdit}
                                    >
                                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                            {task.assigneeName?.charAt(0) || '?'}
                                        </div>
                                        <span className="flex-1 text-left text-sm truncate">{task.assigneeName}</span>
                                        {canEdit && <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                                    </button>
                                    {assigneeOpen && canEdit && (
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
                                <div className="space-y-1 w-full md:w-1/4 relative">
                                    <div className="text-muted-foreground text-xs uppercase font-semibold">Priority</div>
                                    <button
                                        onClick={(e) => {
                                            if (!canEdit) return;
                                            e.stopPropagation(); setPriorityOpen(!priorityOpen); setStatusOpen(false); setAssigneeOpen(false);
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 px-2 py-1.5 rounded w-full hover:bg-muted transition-colors",
                                            !canEdit && "opacity-70 cursor-not-allowed"
                                        )}
                                        disabled={!canEdit}
                                    >
                                        <Flag className={cn("w-4 h-4", priorityOptions.find(p => p.value === task.priority)?.color)} />
                                        <span className="flex-1 text-left text-sm">{priorityOptions.find(p => p.value === task.priority)?.label}</span>
                                        {canEdit && <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                                    </button>
                                    {priorityOpen && canEdit && (
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
                                <div className="space-y-1 w-full md:w-1/4 relative">
                                    <div className="text-muted-foreground text-xs uppercase font-semibold">Due Date</div>
                                    <div className={cn("flex items-center gap-2 px-2 py-1 rounded hover:bg-muted transition-colors", !canEdit && "opacity-70")}>
                                        <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <input
                                            type="date"
                                            value={task.dueDate ? task.dueDate.split('T')[0] : ''}
                                            onChange={handleDueDateChange}
                                            onClick={(e) => canEdit && e.currentTarget.showPicker()}
                                            disabled={!canEdit}
                                            className={cn(
                                                "flex-1 bg-transparent outline-none text-sm w-full [color-scheme:dark]",
                                                canEdit ? "cursor-pointer" : "cursor-not-allowed"
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* TIME TRACKING */}
                                <div className="space-y-1 w-full md:w-1/4 relative">
                                    {/* Label moved inside component or handled by UI design (User requested specific look) */}
                                    {/* <div className="text-muted-foreground text-xs uppercase font-semibold">Time</div> */}
                                    <TimeTrackingPanel workspaceId={workspaceId} taskId={task.id} />
                                </div>
                            </div>
                            {/* TAGS SECTION */}
                            <div className="space-y-2">
                                <div className="text-muted-foreground text-xs uppercase font-semibold">Tags</div>
                                <div className="flex flex-wrap gap-2 items-center">
                                    {task.tags.map(tag => (
                                        <span
                                            key={tag.id}
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold text-white uppercase shadow-sm group"
                                            style={{ backgroundColor: tag.color }}
                                        >
                                            {tag.name}
                                            <button
                                                onClick={() => handleTagToggle(tag.id)}
                                                className="hover:scale-110 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}
                                    <div className="relative">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setTagPickerOpen(!tagPickerOpen); }}
                                            className="p-1 px-2 border border-dashed border-border rounded text-[10px] font-bold text-muted-foreground hover:border-primary hover:text-primary transition-all flex items-center gap-1"
                                        >
                                            <Plus size={12} /> Add Tag
                                        </button>
                                        {tagPickerOpen && (
                                            <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border shadow-2xl rounded-xl p-3 z-50">
                                                <input
                                                    placeholder="Search or create tag..."
                                                    value={tagSearch}
                                                    onChange={e => setTagSearch(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateTag())}
                                                    className="w-full bg-muted border-none rounded-lg px-2.5 py-1.5 text-xs mb-3 outline-none focus:ring-1 focus:ring-primary"
                                                    autoFocus
                                                />
                                                <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                                    {(tags[workspaceId] || []).filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase())).map(t => (
                                                        <button
                                                            key={t.id}
                                                            onClick={(e) => { e.stopPropagation(); handleTagToggle(t.id); }}
                                                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-xs transition-colors"
                                                        >
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                                                            <span className="flex-1 text-left font-medium">{t.name}</span>
                                                            {task.tags.some(xt => xt.id === t.id) && <Check size={12} className="text-primary" />}
                                                        </button>
                                                    ))}
                                                    {tagSearch && !(tags[workspaceId] || []).some(t => t.name.toLowerCase() === tagSearch.toLowerCase()) && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleCreateTag(); }}
                                                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-primary/5 text-primary text-xs transition-all font-bold border border-dashed border-primary/20"
                                                        >
                                                            <Plus size={12} /> Create "{tagSearch}"
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
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

                        {/* Attachments */}
                        <div className="space-y-2">
                            <TaskAttachments
                                workspaceId={workspaceId}
                                taskId={task.id}
                                attachments={detail.attachments || []}
                            />
                        </div>

                        {/* Subtasks */}
                        <SubtaskList
                            subtasks={subtasks}
                            onAdd={(title, assigneeId) => addSubtask(workspaceId, task.id, title, assigneeId)}
                            onToggle={(id) => toggleSubtask(workspaceId, id)}
                            canAdd={!!canEdit}
                            currentUserId={user?.id}
                            parentAssigneeId={task.assigneeId ?? undefined}
                        />

                        {/* Split View: Activity & Comments */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border">
                            <TaskActivityTimeline activities={activities} />
                            <TaskComments
                                taskId={task.id}
                                workspaceId={workspaceId}
                            />
                        </div>
                    </div>
                </div>
            </div >
        </>
    );
}
