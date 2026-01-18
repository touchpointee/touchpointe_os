import { useState, useEffect, useMemo } from 'react';
import { Play, Pause, Clock, Trash2, Square } from 'lucide-react';
import { useTaskStore } from '@/stores/taskStore';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TimeTrackingPanelProps {
    workspaceId: string;
    taskId: string;
}

export function TimeTrackingPanel({ workspaceId, taskId }: TimeTrackingPanelProps) {
    const {
        timeEntries,
        fetchTimeEntries,
        startTimer,
        stopTimer,
        logManualTime,
        deleteTimeEntry
    } = useTaskStore();

    const { user } = useUserStore();
    const entries = timeEntries[taskId] || [];

    const [durationInput, setDurationInput] = useState('');
    const [descriptionInput, setDescriptionInput] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0); // For active timer display

    useEffect(() => {
        fetchTimeEntries(workspaceId, taskId);
    }, [workspaceId, taskId]);

    // Find active timer for this task
    const activeEntry = useMemo(() => {
        return entries.find(e => !e.endTime);
    }, [entries]);

    const isRunning = !!activeEntry;

    // Timer tick for active entry
    useEffect(() => {
        let interval: any;
        if (activeEntry && activeEntry.startTime) {
            const start = new Date(activeEntry.startTime).getTime();
            // Initial calc
            setElapsedTime(Math.floor((Date.now() - start) / 1000));

            interval = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - start) / 1000));
            }, 1000);
        } else {
            setElapsedTime(0);
        }
        return () => clearInterval(interval);
    }, [activeEntry]);

    const handleStartStop = async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (isRunning) {
            await stopTimer(workspaceId, taskId);
        } else {
            // Start timer (ignore duration input, just use description)
            await startTimer(workspaceId, taskId, { description: descriptionInput || undefined });
            setDescriptionInput('');
            setDurationInput('');
        }
    };

    const handleManualLog = async () => {
        if (!durationInput) return;

        // Parse time string "1h 30m"
        const seconds = parseDurationString(durationInput);
        if (seconds > 0) {
            await logManualTime(workspaceId, taskId, {
                durationSeconds: seconds,
                description: descriptionInput || 'Manual Entry'
            });
            setDurationInput('');
            setDescriptionInput('');
        }
    };

    const parseDurationString = (str: string): number => {
        // Regex for "1h", "30m", "1h 30m"
        let totalSeconds = 0;
        const hours = str.match(/(\d+)\s*h/);
        const minutes = str.match(/(\d+)\s*m/);

        if (hours) totalSeconds += parseInt(hours[1]) * 3600;
        if (minutes) totalSeconds += parseInt(minutes[1]) * 60;

        // Fallback: if just number, assume minutes
        if (!hours && !minutes && !isNaN(parseInt(str))) {
            totalSeconds = parseInt(str) * 60;
        }

        return totalSeconds;
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s > 0 ? s + 's' : ''}`;
        return `${s}s`;
    };

    const totalSeconds = entries.reduce((acc, curr) => {
        if (!curr.endTime && curr.startTime) {
            // Active timer: include elapsed
            const currentElapsed = Math.floor((Date.now() - new Date(curr.startTime).getTime()) / 1000);
            return acc + currentElapsed;
        }
        return acc + curr.durationSeconds;
    }, 0);

    return (
        <div className="relative">
            {/* Label */}
            <div className="text-muted-foreground text-xs uppercase font-semibold flex items-center gap-1.5 mb-1">
                <Clock size={12} /> Track Time
            </div>

            {/* Header Summary / Trigger */}
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md w-full transition-all border text-sm font-medium group",
                    isRunning
                        ? "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                        : "bg-background border-zinc-700 hover:border-zinc-500 text-zinc-300"
                )}
            >
                {isRunning ? (
                    <>
                        <Square size={14} fill="currentColor" className="mr-1" />
                        <span className="font-mono flex-1 text-left">{formatDuration(elapsedTime)}</span>
                        <span className="text-[10px] uppercase opacity-70 font-bold tracking-wider">Stop</span>
                    </>
                ) : (
                    <>
                        <Play size={14} fill="currentColor" className="text-zinc-400 group-hover:text-white transition-colors mr-1" />
                        <span className="font-medium flex-1 text-left">Start Timer</span>
                    </>
                )}
            </button>

            {/* Popover */}
            {isMenuOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="bg-muted/50 p-3 border-b border-border flex justify-between items-center">
                            <span className="text-xs font-semibold uppercase text-muted-foreground">Time Tracking</span>
                            <span className="text-sm font-mono font-bold">{formatDuration(totalSeconds)}</span>
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-b border-zinc-800 space-y-3 bg-zinc-900/50">
                            <div className="flex gap-2">
                                <div className="flex-1 grid grid-cols-2 gap-2">
                                    <input
                                        placeholder="Time (e.g. 1h 30m)"
                                        value={durationInput}
                                        onChange={e => setDurationInput(e.target.value)}
                                        className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary text-zinc-200 placeholder:text-zinc-500"
                                        onKeyDown={e => e.key === 'Enter' && handleManualLog()}
                                    />
                                    <input
                                        placeholder="Description (Optional)"
                                        value={descriptionInput}
                                        onChange={e => setDescriptionInput(e.target.value)}
                                        className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary text-zinc-200 placeholder:text-zinc-500"
                                        onKeyDown={e => e.key === 'Enter' && (!durationInput ? handleStartStop() : handleManualLog())}
                                    />
                                </div>

                                {durationInput ? (
                                    <button
                                        onClick={handleManualLog}
                                        className="px-3 rounded-md bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
                                    >
                                        Log
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => handleStartStop(e)}
                                        className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 shadow-lg",
                                            isRunning
                                                ? "bg-red-500 text-white hover:bg-red-600"
                                                : "bg-green-500 text-white hover:bg-green-600"
                                        )}
                                    >
                                        {isRunning ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Entries List - Grouped by User */}
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {entries.length === 0 ? (
                                <div className="p-4 text-center text-xs text-muted-foreground">No time logged yet.</div>
                            ) : (
                                <div className="divide-y divide-border/50">
                                    {Object.entries(
                                        entries.reduce((groups, entry) => {
                                            const userId = entry.userId;
                                            if (!groups[userId]) groups[userId] = [];
                                            groups[userId].push(entry);
                                            return groups;
                                        }, {} as Record<string, typeof entries>)
                                    ).map(([userId, userEntries]) => {
                                        const totalUserSeconds = userEntries.reduce((acc, curr) => {
                                            if (!curr.endTime && curr.startTime) {
                                                const currentElapsed = Math.floor((Date.now() - new Date(curr.startTime).getTime()) / 1000);
                                                return acc + currentElapsed;
                                            }
                                            return acc + curr.durationSeconds;
                                        }, 0);
                                        const userInfo = userEntries[0]; // Get user info from first entry

                                        return (
                                            <div key={userId} className="bg-muted/10">
                                                {/* User Group Header */}
                                                <div className="px-3 py-2 bg-muted/30 flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                                            {userInfo.userAvatarUrl ? (
                                                                <img src={userInfo.userAvatarUrl} alt={userInfo.userName} className="w-full h-full rounded-full object-cover" />
                                                            ) : (
                                                                userInfo.userName?.charAt(0) || '?'
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-semibold">{userInfo.userName || 'Unknown User'}</span>
                                                    </div>
                                                    <span className="text-xs font-mono font-medium text-muted-foreground">
                                                        {formatDuration(totalUserSeconds)}
                                                    </span>
                                                </div>

                                                {/* User Entries */}
                                                <div className="divide-y divide-border/30">
                                                    {userEntries.map(entry => (
                                                        <div key={entry.id} className="p-3 pl-8 flex items-start gap-3 hover:bg-muted/20 group transition-colors">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start">
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {format(new Date(entry.startTime || entry.createdAt), 'MMM d, h:mm a')}
                                                                        {entry.endTime && ` - ${format(new Date(entry.endTime), 'h:mm a')}`}
                                                                    </div>
                                                                    <span className="text-xs font-mono font-medium">
                                                                        {entry.endTime
                                                                            ? formatDuration(entry.durationSeconds)
                                                                            : <span className="text-green-500 animate-pulse">Running...</span>}
                                                                    </span>
                                                                </div>
                                                                {entry.description && (
                                                                    <div className="text-xs text-zinc-400 mt-1 truncate">{entry.description}</div>
                                                                )}
                                                            </div>
                                                            {/* Actions */}
                                                            {user && (entry.userId === user.id || user.role === 'Admin' || user.role === 'Owner') && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); deleteTimeEntry(workspaceId, entry.id); }}
                                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
