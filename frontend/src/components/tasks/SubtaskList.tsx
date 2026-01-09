import { useState, useRef, useEffect } from 'react';
import type { SubtaskDto } from '@/types/task';
import { Circle, CheckCircle2, Plus, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTeamStore } from '@/stores/teamStore';

export function SubtaskList({ subtasks, onAdd, onToggle, canAdd, currentUserId, parentAssigneeId }: {
    subtasks: SubtaskDto[],
    onAdd: (title: string, assigneeId?: string) => Promise<void>,
    onToggle: (id: string) => Promise<void>,
    canAdd: boolean,
    currentUserId?: string,
    parentAssigneeId: string
}) {
    const { members } = useTeamStore();

    // Form state
    const [newTitle, setNewTitle] = useState('');
    const [assigneeId, setAssigneeId] = useState<string>('');
    const [isAdding, setIsAdding] = useState(false);
    const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowAssigneeDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        setIsAdding(true);
        // Default to current user if no assignee selected? No, strict matching per backend rules
        // or let backend handle simple cases. 
        // For now pass undefined if empty.
        await onAdd(newTitle, assigneeId || undefined);
        setNewTitle('');
        setAssigneeId(''); // Reset assignee
        setIsAdding(false);
    };

    const selectedMember = members.find(m => m.userId === assigneeId);

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Subtasks</h3>

            <div className="space-y-1">
                {subtasks.map(subtask => {
                    const canToggle = currentUserId && (
                        subtask.assigneeId === currentUserId ||
                        parentAssigneeId === currentUserId
                    );

                    return (
                        <div key={subtask.id} className="group flex items-center gap-3 py-1.5 hover:bg-muted/30 px-2 -mx-2 rounded-lg transition-colors">
                            <button
                                onClick={() => canToggle && onToggle(subtask.id)}
                                disabled={!canToggle}
                                className={cn(
                                    "mt-0.5 transition-colors",
                                    !canToggle ? "opacity-50 cursor-not-allowed text-muted-foreground" : "text-muted-foreground hover:text-primary"
                                )}
                                title={!canToggle ? "You cannot complete this subtask" : "Toggle completion"}
                            >
                                {subtask.isCompleted
                                    ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    : <Circle className="w-4 h-4" />
                                }
                            </button>

                            <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                                <span className={cn("text-sm truncate", subtask.isCompleted && "line-through text-muted-foreground")}>
                                    {subtask.title}
                                </span>

                                {/* Display Assignee Avatar */}
                                {subtask.assigneeName && (
                                    <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded text-xs text-muted-foreground whitespace-nowrap" title={subtask.assigneeName}>
                                        <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                                            {subtask.assigneeName.charAt(0)}
                                        </div>
                                        <span className="max-w-[80px] truncate">{subtask.assigneeName}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {canAdd && (
                <form onSubmit={handleSubmit} className="relative">
                    <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-lg border border-transparent focus-within:border-border focus-within:bg-transparent transition-all">
                        <Plus className="w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Add a subtask..."
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            disabled={isAdding}
                        />

                        {/* Assignee Selector Trigger */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                                className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors",
                                    selectedMember
                                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                                title="Assign to..."
                            >
                                {selectedMember ? (
                                    <>
                                        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold">
                                            {selectedMember.fullName.charAt(0)}
                                        </div>
                                        <span className="max-w-[60px] truncate">{selectedMember.fullName}</span>
                                        <X
                                            className="w-3 h-3 ml-1 opacity-50 hover:opacity-100"
                                            onClick={(e) => { e.stopPropagation(); setAssigneeId(''); }}
                                        />
                                    </>
                                ) : (
                                    <User className="w-4 h-4" />
                                )}
                            </button>

                            {/* Dropdown */}
                            {showAssigneeDropdown && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                                    <div className="p-1">
                                        {members.map(member => (
                                            <button
                                                key={member.userId}
                                                type="button"
                                                onClick={() => {
                                                    setAssigneeId(member.userId);
                                                    setShowAssigneeDropdown(false);
                                                }}
                                                className="flex items-center gap-2 w-full px-2 py-1.5 hover:bg-muted rounded text-left transition-colors"
                                            >
                                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                                    {member.fullName.charAt(0)}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-xs font-medium truncate">{member.fullName}</div>
                                                </div>
                                                {assigneeId === member.userId && <CheckCircle2 className="w-3 h-3 text-primary ml-auto" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
}
