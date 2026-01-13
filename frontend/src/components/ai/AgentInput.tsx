import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaces } from '@/stores/workspaceStore';
import { Loader2, Hash, User, CheckSquare } from 'lucide-react';
import { apiGet } from '@/lib/api';

interface AgentInputProps {
    value: string;
    onChange: (val: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    placeholder?: string;
    disabled?: boolean;
    onContextChange: (entities: { type: 'channel' | 'user' | 'task'; id: string; name: string }[]) => void;
}

export const AgentInput: React.FC<AgentInputProps> = ({ value, onChange, onSubmit, placeholder, disabled, onContextChange }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [selectedContexts, setSelectedContexts] = useState<{ type: 'channel' | 'user' | 'task'; id: string; name: string }[]>([]);

    // Suggestion ref to close on click outside
    const suggestionRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { activeWorkspace } = useWorkspaces();

    // Context entities management
    useEffect(() => {
        onContextChange(selectedContexts);
    }, [selectedContexts, onContextChange]);

    const fetchSuggestions = async (query: string) => {
        if (!activeWorkspace) return;
        setLoadingSuggestions(true);

        try {
            // Parallel fetch for potential matches (simplified for prototype)
            // In prod: dedicated /search/entities endpoint

            // 1. Channels
            const channels = await apiGet<any[]>(`/${activeWorkspace.id}/chat/channels`);

            // 2. Members (Users)
            const members = await apiGet<any[]>(`/workspaces/${activeWorkspace.id}/members`);

            // 3. Tasks (My Tasks)
            const tasks = await apiGet<any[]>(`/workspaces/${activeWorkspace.id}/tasks/my-tasks`);

            const qLower = query.toLowerCase();

            const matchedChannels = channels
                .filter(c => c.name.toLowerCase().includes(qLower))
                .slice(0, 3)
                .map(c => ({ type: 'channel', id: c.id, name: c.name, icon: Hash }));

            const matchedUsers = members
                .filter(m => m.user.fullName.toLowerCase().includes(qLower))
                .slice(0, 3)
                .map(m => ({ type: 'user', id: m.userId, name: m.user.fullName, icon: User }));

            const matchedTasks = tasks
                .filter(t => t.title.toLowerCase().includes(qLower))
                .slice(0, 3)
                .map(t => ({ type: 'task', id: t.taskId, name: t.title, icon: CheckSquare }));

            setSuggestions([...matchedChannels, ...matchedUsers, ...matchedTasks]);

        } catch (err) {
            console.error("Failed to fetch suggestions", err);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    // Handle Input Change & Trigger Detection
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        const cursorPos = e.target.selectionStart || 0;
        onChange(newVal);
        setCursorPosition(cursorPos);

        // Detect triggering character '@'
        // Look backwards from cursor to find the last '@'
        const textBeforeCursor = newVal.slice(0, cursorPos);
        const lastAt = textBeforeCursor.lastIndexOf('@');

        if (lastAt !== -1) {
            // Check if there's a space before '@' or it's the start
            const charBeforeAt = lastAt > 0 ? textBeforeCursor[lastAt - 1] : ' ';
            if (charBeforeAt === ' ' || charBeforeAt === '\n') {
                const query = textBeforeCursor.slice(lastAt + 1);
                // Only trigger if query doesn't contain spaces (simple assumption for now)
                if (!query.includes(' ')) {
                    setShowSuggestions(true);
                    fetchSuggestions(query);
                    return;
                }
            }
        }
        setShowSuggestions(false);
    };

    const selectSuggestion = (item: any) => {
        // Replace the `@query` with the selected item name
        const textBeforeCursor = value.slice(0, cursorPosition);
        const lastAt = textBeforeCursor.lastIndexOf('@');

        const prefix = value.slice(0, lastAt);
        const suffix = value.slice(cursorPosition);

        const newItemName = `@${item.name} `; // Add space after

        onChange(prefix + newItemName + suffix);
        setShowSuggestions(false);

        // Add to context list if not already there
        if (!selectedContexts.find(c => c.id === item.id)) {
            setSelectedContexts([...selectedContexts, { type: item.type, id: item.id, name: item.name }]);
        }

        // Refocus input
        inputRef.current?.focus();
    };

    return (
        <div className="relative w-full">
            {/* Context Chips */}
            {selectedContexts.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 px-1">
                    {selectedContexts.map(ctx => (
                        <div key={ctx.id} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs animate-in fade-in zoom-in duration-200">
                            {ctx.type === 'channel' && <Hash className="w-3 h-3" />}
                            {ctx.type === 'user' && <User className="w-3 h-3" />}
                            {ctx.type === 'task' && <CheckSquare className="w-3 h-3" />}
                            <span className="font-medium">{ctx.name}</span>
                            <button
                                onClick={() => setSelectedContexts(prev => prev.filter(c => c.id !== ctx.id))}
                                className="ml-1 hover:text-destructive"
                            >×</button>
                        </div>
                    ))}
                </div>
            )}

            <div className="relative flex items-center gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (showSuggestions && suggestions.length > 0) {
                                selectSuggestion(suggestions[0]); // Select first on enter if suggesting
                            } else {
                                onSubmit(e);
                            }
                        }
                        if (e.key === 'Escape') setShowSuggestions(false);
                    }}
                    placeholder={placeholder}
                    className="flex-1 px-4 py-3 rounded-xl bg-muted/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/70"
                    disabled={disabled}
                    autoComplete="off"
                />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
                <div
                    ref={suggestionRef}
                    className="absolute bottom-full left-0 w-full mb-2 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-50 animate-in slide-in-from-bottom-2 duration-200"
                >
                    {loadingSuggestions && (
                        <div className="p-2 flex items-center justify-center text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                    )}

                    {!loadingSuggestions && suggestions.length === 0 && (
                        <div className="p-2 text-xs text-muted-foreground text-center">No matches found</div>
                    )}

                    {!loadingSuggestions && suggestions.map((item, idx) => (
                        <button
                            key={`${item.type}-${item.id}`} // Ensure unique key
                            onClick={(e) => {
                                e.preventDefault(); // Prevent potential form submits
                                selectSuggestion(item);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2 ${idx === 0 ? 'bg-accent/50' : ''}`}
                        >
                            <div className="p-1 rounded bg-background border shadow-sm">
                                <item.icon className="w-3 h-3 text-muted-foreground" />
                            </div>
                            <span className="font-medium text-foreground">{item.name}</span>
                            <span className="text-xs text-muted-foreground ml-auto capitalize">{item.type}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
