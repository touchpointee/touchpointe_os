import { useState, useEffect } from 'react';
import { X, Calendar, User, Flag, Palette, Plus } from 'lucide-react';
import { useTeamStore } from '@/stores/teamStore';
import { useTagStore } from '@/stores/tagStore';
import { cn } from '@/lib/utils';
import type { TaskPriority, CreateTaskRequest } from '@/types/task';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (request: Partial<CreateTaskRequest>) => Promise<any>;
    workspaceId: string;
    defaultStatus?: string;
}

const priorities: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'NONE', label: 'None', color: 'text-zinc-400' },
    { value: 'LOW', label: 'Low', color: 'text-zinc-600' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-blue-600' },
    { value: 'HIGH', label: 'High', color: 'text-orange-600' },
    { value: 'URGENT', label: 'Urgent', color: 'text-red-600' },
];

export function CreateTaskModal({ isOpen, onClose, onSubmit, workspaceId }: CreateTaskModalProps) {
    // const navigate = useNavigate();
    const { members, fetchMembers } = useTeamStore();
    const { tags, fetchTags, createTag } = useTagStore();

    // Form state
    const [title, setTitle] = useState('');
    const [subDescription, setSubDescription] = useState('');
    const [assigneeId, setAssigneeId] = useState<string | null>(null);
    const [dueDate, setDueDate] = useState<string | null>(null);
    const [priority, setPriority] = useState<TaskPriority>('NONE');
    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pickers visibility
    const [activePicker, setActivePicker] = useState<'assignee' | 'date' | 'priority' | 'tags' | null>(null);
    const [tagSearch, setTagSearch] = useState('');

    useEffect(() => {
        if (isOpen && workspaceId) {
            fetchMembers(workspaceId);
            fetchTags(workspaceId);
        }
    }, [isOpen, workspaceId, fetchMembers, fetchTags]);

    const workspaceTags = tags[workspaceId] || [];
    const filteredTags = workspaceTags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()));

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!title.trim() || isSubmitting) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit({
                title: title.trim(),
                subDescription: subDescription.trim() || undefined,
                assigneeId: assigneeId || undefined,
                dueDate: dueDate || undefined,
                priority,
                tagIds: selectedTagIds
            });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create task');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateTag = async () => {
        if (!tagSearch.trim()) return;
        try {
            const newTag = await createTag(workspaceId, tagSearch.trim(), '#6B7280');
            setSelectedTagIds(prev => [...prev, newTag.id]);
            setTagSearch('');
        } catch (e) {
            console.error("Failed to create tag", e);
        }
    };

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setTitle('');
            setSubDescription('');
            setAssigneeId(null);
            setDueDate(null);
            setPriority('NONE');
            setSelectedTagIds([]);
            setActivePicker(null);
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-background border border-border rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Compact Header Area */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1 bg-muted/50 rounded-md">
                            New Task
                        </div>
                        <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded-full text-muted-foreground transition-colors"><X size={16} /></button>
                    </div>

                    {/* Main Title Input */}
                    <div className="px-1">
                        <input
                            autoFocus
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            placeholder="What needs to be done?"
                            className="w-full text-2xl font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground/30 selection:bg-primary/20"
                        />
                        <textarea
                            value={subDescription}
                            onChange={e => setSubDescription(e.target.value)}
                            placeholder="Add description..."
                            className="w-full mt-3 text-sm bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground/30 min-h-[80px] selection:bg-primary/10"
                        />
                    </div>

                    {/* Selected Tags Display */}
                    {selectedTagIds.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 px-1">
                            {selectedTagIds.map(tid => {
                                const t = workspaceTags.find(x => x.id === tid);
                                return t ? (
                                    <span key={tid} className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase shadow-sm" style={{ backgroundColor: t.color }}>
                                        {t.name}
                                        <button type="button" onClick={() => setSelectedTagIds(prev => prev.filter(id => id !== tid))} className="hover:scale-110 transition-transform"><X size={10} /></button>
                                    </span>
                                ) : null;
                            })}
                        </div>
                    )}

                    {/* Errors */}
                    {error && <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded-lg border border-red-500/20">{error}</div>}

                    {/* Advanced Controls Row */}
                    <div className="flex items-center gap-2 pt-4 border-t border-border/50 px-1 relative">
                        {/* Assignee Picker */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setActivePicker(activePicker === 'assignee' ? null : 'assignee')}
                                className={cn("p-2 rounded-lg transition-all border border-transparent", assigneeId ? "bg-primary/10 border-primary/20 text-primary" : "hover:bg-muted text-muted-foreground")}
                                title="Assign to..."
                            >
                                <User size={18} />
                                {assigneeId && <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full ring-2 ring-background" />}
                            </button>
                            {activePicker === 'assignee' && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setActivePicker(null)} />
                                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-card border border-border shadow-2xl rounded-xl py-1.5 z-50 animate-in slide-in-from-bottom-2 duration-200">
                                        <div className="px-3 pb-1 border-b border-border/50 mb-1.5">
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-1">Assign to</div>
                                        </div>
                                        <div className="max-h-56 overflow-y-auto">
                                            {members.map(m => (
                                                <button
                                                    key={m.userId}
                                                    type="button"
                                                    onClick={() => { setAssigneeId(m.userId); setActivePicker(null); }}
                                                    className="w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-muted transition-colors"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{m.fullName.charAt(0)}</div>
                                                    <span className="flex-1 text-left">{m.fullName}</span>
                                                    {assigneeId === m.userId && <span className="text-primary font-bold">✓</span>}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setAssigneeId(null); setActivePicker(null); }}
                                            className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted mt-1.5 border-t border-border/50 font-medium"
                                        >
                                            Unassign
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Due Date Picker */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setActivePicker(activePicker === 'date' ? null : 'date')}
                                className={cn("p-2 rounded-lg transition-all border border-transparent", dueDate ? "bg-amber-500/10 border-amber-500/20 text-amber-600" : "hover:bg-muted text-muted-foreground")}
                                title="Set due date"
                            >
                                <Calendar size={18} />
                            </button>
                            {activePicker === 'date' && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setActivePicker(null)} />
                                    <div className="absolute bottom-full left-0 mb-2 p-3 bg-card border border-border shadow-2xl rounded-xl z-50 animate-in slide-in-from-bottom-2 duration-200">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Due Date</div>
                                        <input
                                            type="date"
                                            value={dueDate || ''}
                                            onChange={e => { setDueDate(e.target.value); setActivePicker(null); }}
                                            className="bg-muted border border-border rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/50 transition-all [color-scheme:dark]"
                                            autoFocus
                                        />
                                        {dueDate && (
                                            <button
                                                type="button"
                                                onClick={() => { setDueDate(null); setActivePicker(null); }}
                                                className="w-full mt-2 text-[10px] text-red-500 hover:underline font-bold"
                                            >
                                                Clear Date
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Priority Picker */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setActivePicker(activePicker === 'priority' ? null : 'priority')}
                                className={cn("p-2 rounded-lg transition-all border border-transparent", priority !== 'NONE' ? "bg-red-500/10 border-red-500/20 text-red-500" : "hover:bg-muted text-muted-foreground")}
                                title="Set priority"
                            >
                                <Flag size={18} />
                            </button>
                            {activePicker === 'priority' && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setActivePicker(null)} />
                                    <div className="absolute bottom-full left-0 mb-2 w-44 bg-card border border-border shadow-2xl rounded-xl py-1.5 z-50 animate-in slide-in-from-bottom-2 duration-200">
                                        <div className="px-3 pb-1 border-b border-border/50 mb-1.5">
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider py-1">Priority</div>
                                        </div>
                                        {priorities.map(p => (
                                            <button
                                                key={p.value}
                                                type="button"
                                                onClick={() => { setPriority(p.value); setActivePicker(null); }}
                                                className={cn("w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-muted transition-colors font-medium", p.color)}
                                            >
                                                <Flag size={14} className="fill-current" /> {p.label}
                                                {priority === p.value && <span className="ml-auto">✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Tags Picker */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setActivePicker(activePicker === 'tags' ? null : 'tags')}
                                className={cn("p-2 rounded-lg transition-all border border-transparent", selectedTagIds.length > 0 ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-500" : "hover:bg-muted text-muted-foreground")}
                                title="Add tags"
                            >
                                <Palette size={18} />
                            </button>
                            {activePicker === 'tags' && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setActivePicker(null)} />
                                    <div className="absolute bottom-full left-0 mb-2 w-72 bg-card border border-border shadow-2xl rounded-xl p-3 z-50 animate-in slide-in-from-bottom-2 duration-200">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex justify-between items-center">
                                            Tags
                                            <span className="text-[8px] font-normal lowercase bg-muted px-1.5 py-0.5 rounded">Enter to create</span>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search tags..."
                                            value={tagSearch}
                                            onChange={e => setTagSearch(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateTag())}
                                            className="w-full bg-muted border-none rounded-lg px-3 py-2 text-xs mb-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                            autoFocus
                                        />
                                        <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                            {filteredTags.map(t => (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedTagIds(prev => prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]);
                                                    }}
                                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted text-xs transition-all group"
                                                >
                                                    <div className="w-2.5 h-2.5 rounded-full shadow-sm group-hover:scale-110 transition-transform" style={{ backgroundColor: t.color }} />
                                                    <span className="flex-1 text-left font-medium">{t.name}</span>
                                                    {selectedTagIds.includes(t.id) && <span className="text-primary font-bold">✓</span>}
                                                </button>
                                            ))}
                                            {tagSearch && !filteredTags.some(t => t.name.toLowerCase() === tagSearch.toLowerCase()) && (
                                                <button
                                                    type="button"
                                                    onClick={handleCreateTag}
                                                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-primary/10 text-primary text-xs transition-all font-bold border border-dashed border-primary/40 bg-primary/5"
                                                >
                                                    <Plus size={14} /> Create "{tagSearch}"
                                                </button>
                                            )}
                                            {workspaceTags.length === 0 && !tagSearch && (
                                                <div className="text-[10px] text-muted-foreground text-center py-4 italic">No tags yet. Type to create one!</div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="ml-auto flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!title.trim() || isSubmitting}
                                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 disabled:opacity-50 disabled:shadow-none"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Task'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
