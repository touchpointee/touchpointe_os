import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, History } from 'lucide-react';
import { meetApi } from '@/lib/meet-api';
import { useToast } from '@/contexts/ToastContext';

interface MeetingDetail {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    startedAt?: string;
    endedAt?: string;
    status: string;
    participants: {
        id: string;
        name: string;
        avatar?: string;
        isGuest: boolean;
        totalDurationSeconds: number;
        firstJoinedAt: string;
        lastLeftAt?: string;
        sessions: { joinTime: string; leaveTime?: string; durationSeconds: number }[];
    }[];
}

export function MeetingHistoryPage() {
    const { meetingId } = useParams<{ meetingId: string }>();
    const navigate = useNavigate();
    const toast = useToast();
    const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (meetingId) loadDetails();
    }, [meetingId]);

    const loadDetails = async () => {
        try {
            const data = await meetApi.getMeetingDetails(meetingId!);
            setMeeting(data as any);
        } catch (e) {
            console.error(e);
            toast.error("Error", "Failed to load meeting details");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDuration = (seconds: number) => {
        if (seconds < 0) seconds = 0;
        if (seconds < 60) return `${Math.round(seconds)}s`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ${Math.round(seconds % 60)}s`;
    };

    if (isLoading) return (
        <div className="h-full flex items-center justify-center text-zinc-400">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
                <p>Retrieving meeting data...</p>
            </div>
        </div>
    );
    if (!meeting) return <div className="p-8 text-red-400">Meeting not found</div>;

    const actualDuration = meeting.endedAt && (meeting.startedAt || meeting.startTime)
        ? (new Date(meeting.endedAt).getTime() - new Date(meeting.startedAt || meeting.startTime).getTime()) / 1000
        : (new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / 1000;

    return (
        <div className="h-full flex flex-col bg-background dark:bg-black transition-colors duration-200">
            {/* Header */}
            <div className="border-b border-border bg-background dark:bg-black">
                <div className="max-w-[1920px] mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="h-8 w-px bg-border mx-2" />
                        <div>
                            <h1 className="text-xl font-bold text-foreground leading-none mb-1.5">{meeting.title}</h1>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(meeting.startTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                <span className="uppercase tracking-wider font-semibold">{meeting.status}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                            <div className="text-right">
                                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Duration</div>
                                <div className="text-sm font-mono text-zinc-900 dark:text-zinc-200">{formatDuration(actualDuration)}</div>
                            </div>
                            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
                            <div className="text-right">
                                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Participants</div>
                                <div className="text-sm font-mono text-zinc-900 dark:text-zinc-200">{meeting.participants.length}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Split View */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[360px_1fr] xl:grid-cols-[420px_1fr]">

                {/* Left Sidebar: Stats & Info */}
                <div className="border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/50 p-6 overflow-y-auto space-y-8">
                    <section>
                        <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">Meeting Timeline</h3>
                        <div className="space-y-6 relative pl-2">
                            <div className="absolute left-[5px] top-2 bottom-2 w-px bg-zinc-200 dark:bg-zinc-800" />

                            <div className="relative flex gap-4">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-black z-10" />
                                <div>
                                    <div className="text-sm font-medium text-zinc-900 dark:text-white">Started</div>
                                    <div className="text-xs text-zinc-500">{new Date(meeting.startedAt || meeting.startTime).toLocaleTimeString()}</div>
                                </div>
                            </div>

                            <div className="relative flex gap-4">
                                <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 dark:bg-zinc-700 ring-4 ring-white dark:ring-black z-10" />
                                <div className="py-2">
                                    <div className="text-xs text-zinc-500 italic">Meeting in progress for {formatDuration(actualDuration)}</div>
                                </div>
                            </div>

                            <div className="relative flex gap-4">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 ring-4 ring-white dark:ring-black z-10" />
                                <div>
                                    <div className="text-sm font-medium text-zinc-900 dark:text-white">Ended</div>
                                    <div className="text-xs text-zinc-500">{meeting.endedAt ? new Date(meeting.endedAt).toLocaleTimeString() : 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">Details</h3>
                        <div className="bg-white dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Host</span>
                                <span className="text-zinc-900 dark:text-zinc-300">System</span>
                            </div>
                            <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">ID</span>
                                <span className="text-zinc-900 dark:text-zinc-300 font-mono text-xs">{meeting.id.substring(0, 8)}...</span>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Main Content: Participant Table */}
                <div className="flex flex-col min-w-0 bg-background dark:bg-black">
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <History className="w-5 h-5 text-muted-foreground" />
                            Participants
                        </h2>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-background/95 dark:bg-black/90 backdrop-blur-sm z-10">
                                <tr className="text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border">
                                    <th className="p-6 font-medium">Connect Info</th>
                                    <th className="p-6 font-medium">Join Time</th>
                                    <th className="p-6 font-medium">Leave Time</th>
                                    <th className="p-6 font-medium text-right">Duration</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {meeting.participants.map(p => {
                                    // Logic for "broken" or forced-end participants
                                    let leaveTime = p.lastLeftAt ? new Date(p.lastLeftAt) : null;
                                    let duration = p.totalDurationSeconds;

                                    if (!leaveTime && meeting.status === 'Ended' && meeting.endedAt) {
                                        leaveTime = new Date(meeting.endedAt);
                                        // Estimate duration
                                        const start = new Date(p.firstJoinedAt);
                                        duration = (leaveTime.getTime() - start.getTime()) / 1000;
                                    }

                                    return (
                                        <tr key={p.id} className="group hover:bg-muted/50 transition-colors">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-accent border border-border flex items-center justify-center text-foreground font-bold text-sm">
                                                        {p.avatar ? (
                                                            <img src={p.avatar} alt={p.name} className="w-full h-full rounded-full object-cover" />
                                                        ) : (
                                                            p.name?.substring(0, 2).toUpperCase() || "??"
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-foreground group-hover:text-foreground transition-colors">{p.name || "Unknown"}</div>
                                                        <div className="text-xs text-muted-foreground">{p.isGuest ? "Guest User" : "Member"}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-muted-foreground font-mono text-sm">
                                                {new Date(p.firstJoinedAt).toLocaleTimeString()}
                                            </td>
                                            <td className="p-6 text-muted-foreground font-mono text-sm">
                                                {leaveTime
                                                    ? leaveTime.toLocaleTimeString()
                                                    : <span className="text-green-600 dark:text-green-500 font-bold bg-green-100 dark:bg-green-500/10 px-2 py-0.5 rounded text-xs animate-pulse">ACTIVE</span>
                                                }
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="inline-block px-3 py-1 rounded bg-accent border border-border text-foreground font-mono text-sm">
                                                    {formatDuration(duration)}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {meeting.participants.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center text-muted-foreground italic">No participants recorded for this session.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
