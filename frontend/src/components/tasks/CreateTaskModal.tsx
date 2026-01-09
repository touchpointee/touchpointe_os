import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, User, Flag, Search, UserPlus } from 'lucide-react';
import { useTeamStore } from '@/stores/teamStore';
import { cn } from '@/lib/utils';
import type { TaskPriority } from '@/types/task';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        title: string;
        subDescription?: string;
        assigneeId: string;
        dueDate: string;
        priority: TaskPriority;
    }) => Promise<void>;
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
    const navigate = useNavigate();
    const { members, fetchMembers, isLoading: membersLoading } = useTeamStore();

    // Check if solo workspace (only current user)
    const isSoloWorkspace = members.length === 1;

    // Form state
    const [title, setTitle] = useState('');
    const [subDescription, setSubDescription] = useState('');
    const [assigneeId, setAssigneeId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Assignee search
    const [assigneeSearch, setAssigneeSearch] = useState('');
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

    // Fetch members on mount
    useEffect(() => {
        if (isOpen && workspaceId) {
            fetchMembers(workspaceId);
        }
    }, [isOpen, workspaceId, fetchMembers]);

    // Filter members by search
    const filteredMembers = useMemo(() => {
        if (!assigneeSearch.trim()) return members;
        const search = assigneeSearch.toLowerCase();
        return members.filter(m =>
            m.fullName.toLowerCase().includes(search) ||
            m.email.toLowerCase().includes(search)
        );
    }, [members, assigneeSearch]);

    // Get selected member
    const selectedMember = members.find(m => m.userId === assigneeId);

    // Form validation
    const isValid = title.trim() && assigneeId && dueDate;

    // Reset form on close
    useEffect(() => {
        if (!isOpen) {
            setTitle('');
            setSubDescription('');
            setAssigneeId('');
            setDueDate('');
            setPriority('MEDIUM');
            setError(null);
            setAssigneeSearch('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid) return;

        setIsSubmitting(true);
        setError(null);

        try {
            await onSubmit({
                title: title.trim(),
                subDescription: subDescription.trim() || undefined,
                assigneeId,
                dueDate,
                priority
            });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create task');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-semibold">Create New Task</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Task Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What needs to be done?"
                            className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Sub Description */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Sub Description <span className="text-zinc-500 font-normal">(Optional)</span>
                        </label>
                        <textarea
                            value={subDescription}
                            onChange={(e) => setSubDescription(e.target.value)}
                            placeholder="Additional context/details..."
                            className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[80px] resize-none"
                        />
                    </div>

                    {/* Assignee */}
                    <div className="relative">
                        <label className="block text-sm font-medium mb-2">
                            <User className="w-4 h-4 inline mr-1" />
                            Assignee <span className="text-red-500">*</span>
                        </label>

                        {/* Selected or Search */}
                        <div
                            className="relative"
                            onClick={() => setShowAssigneeDropdown(true)}
                        >
                            {selectedMember ? (
                                <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/50 border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-all">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                        {selectedMember.fullName.charAt(0)}
                                    </div>
                                    <span className="flex-1">{selectedMember.fullName}</span>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setAssigneeId(''); }}
                                        className="text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border border-border rounded-lg cursor-pointer hover:border-primary/50 transition-all">
                                    <Search className="w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={assigneeSearch}
                                        onChange={(e) => setAssigneeSearch(e.target.value)}
                                        placeholder="Search team members..."
                                        className="flex-1 bg-transparent outline-none"
                                        onFocus={() => setShowAssigneeDropdown(true)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Dropdown */}
                        {showAssigneeDropdown && !selectedMember && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowAssigneeDropdown(false)}
                                />
                                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                                    {membersLoading ? (
                                        <div className="p-3 text-sm text-muted-foreground text-center">Loading...</div>
                                    ) : filteredMembers.length === 0 ? (
                                        <div className="p-3 text-sm text-muted-foreground text-center">No members found</div>
                                    ) : (
                                        filteredMembers.map((member) => (
                                            <button
                                                key={member.userId}
                                                type="button"
                                                onClick={() => {
                                                    setAssigneeId(member.userId);
                                                    setShowAssigneeDropdown(false);
                                                    setAssigneeSearch('');
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted transition-colors"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                                    {member.fullName.charAt(0)}
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-sm font-medium">{member.fullName}</div>
                                                    <div className="text-xs text-muted-foreground">{member.email}</div>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </>
                        )}

                        {/* Solo workspace helper */}
                        {isSoloWorkspace && !membersLoading && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                                <span>You're the only member in this workspace.</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onClose();
                                        navigate('/team');
                                    }}
                                    className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                                >
                                    <UserPlus className="w-3 h-3" />
                                    Invite teammates
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Due Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            onClick={(e) => e.currentTarget.showPicker()}
                            className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer [color-scheme:dark]"
                        />
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            <Flag className="w-4 h-4 inline mr-1" />
                            Priority
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {priorities.map((p) => (
                                <button
                                    key={p.value}
                                    type="button"
                                    onClick={() => setPriority(p.value)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                                        priority === p.value
                                            ? `${p.color} bg-current/10 border-current`
                                            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                                    )}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!isValid || isSubmitting}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
