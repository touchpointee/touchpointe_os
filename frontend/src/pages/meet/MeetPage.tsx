import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, Video, Calendar, Users, Copy, Square, Link as LinkIcon, ArrowRight } from 'lucide-react';
import { meetApi, type Meeting } from '@/lib/meet-api';
import { useWorkspaces } from '@/stores/workspaceStore';
import { getCurrentUser } from '@/lib/auth';
import { useToast } from '@/contexts/ToastContext';
import { cn } from '@/lib/utils';

export function MeetPage() {
    const { workspaceId: paramWorkspaceId } = useParams<{ workspaceId: string }>();
    const { activeWorkspace } = useWorkspaces();
    const workspaceId = activeWorkspace?.id || paramWorkspaceId;
    const toast = useToast();
    const currentUser = getCurrentUser();

    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Create Form State
    const [newTitle, setNewTitle] = useState("");

    useEffect(() => {
        if (workspaceId) loadMeetings();
    }, [workspaceId]);

    const loadMeetings = async () => {
        try {
            const data = await meetApi.getWorkspaceMeetings(workspaceId!);
            setMeetings(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newTitle.trim() || !workspaceId) return;
        try {
            const start = new Date();
            const end = new Date(start.getTime() + 60 * 60 * 1000);

            await meetApi.createMeeting(workspaceId, newTitle, start.toISOString(), end.toISOString());
            setNewTitle("");
            setIsCreating(false);
            loadMeetings();
            toast.success("Success", "Meeting created!");
        } catch (e) {
            toast.error("Error", "Failed to create meeting");
        }
    };

    const handleEndMeeting = async (meetingId: string) => {
        if (!confirm("Are you sure you want to end this meeting for everyone?")) return;
        try {
            await meetApi.endMeeting(meetingId);
            toast.success("Success", "Meeting ended");
            loadMeetings();
        } catch (e) {
            toast.error("Error", "Failed to end meeting");
        }
    };

    if (isLoading) return (
        <div className="h-full flex items-center justify-center text-zinc-400">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
                <p>Loading your meetings space...</p>
            </div>
        </div>
    );

    const liveMeetings = meetings.filter(m => m.status === 'Live');
    const upcomingMeetings = meetings.filter(m => m.status === 'Scheduled');
    const pastMeetings = meetings.filter(m => m.status === 'Ended');

    return (
        <div className="min-h-full flex flex-col relative overflow-hidden bg-background dark:bg-black transition-colors duration-200">
            {/* Header Section */}
            <div className="relative z-10 px-8 py-8 md:py-12 border-b border-border">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/50 text-muted-foreground text-xs font-medium border border-border">
                            <Video className="w-3 h-3" />
                            <span>Video Conferencing</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                            Touchpointe Meet
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-xl">
                            Connect with your team in high definition. fast, secure, and built for collaboration.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsCreating(true)}
                            className="group relative inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-zinc-900/10 dark:shadow-none"
                        >
                            <Plus className="w-5 h-5" />
                            <span>New Meeting</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Meeting Overlay/Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-zinc-950 dark:text-white">Start Instant Meeting</h3>
                            <button onClick={() => setIsCreating(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                X
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Meeting Topic</label>
                                <input
                                    type="text"
                                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-white text-lg focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all placeholder:text-zinc-400"
                                    placeholder="e.g. Design Sync"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreate}
                                    className="flex-1 py-3.5 bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black rounded-xl font-bold transition-all"
                                >
                                    Start Meeting
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 pb-12 space-y-12 pt-8">

                {/* Live Section */}
                {liveMeetings.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-wide uppercase">Happening Now</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {liveMeetings.map(m => (
                                <MeetingCard
                                    key={m.id}
                                    meeting={m}
                                    isLive
                                    onEnd={currentUser?.id === (m as any).createdBy ? () => handleEndMeeting(m.id) : undefined}
                                />
                            ))}
                        </div>
                    </section>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 md:gap-12">
                    {/* Upcoming */}
                    <section className="xl:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-wide uppercase">Upcoming</h2>
                            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800 ml-4"></div>
                        </div>

                        {upcomingMeetings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 bg-zinc-50 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-center">
                                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                                    <Calendar className="w-6 h-6 text-zinc-400 dark:text-zinc-600" />
                                </div>
                                <h3 className="text-zinc-900 dark:text-zinc-200 font-medium mb-1">No scheduled meetings</h3>
                                <p className="text-zinc-500 text-sm">Your calendar is clear for now.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {upcomingMeetings.map(m => (
                                    <MeetingCard
                                        key={m.id}
                                        meeting={m}
                                        onEnd={currentUser?.id === (m as any).createdBy ? () => handleEndMeeting(m.id) : undefined}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* History */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white tracking-wide uppercase">Recent History</h2>
                            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800 ml-4"></div>
                        </div>

                        <div className="space-y-3">
                            {pastMeetings.length === 0 && (
                                <div className="p-8 text-center text-zinc-500 text-sm italic">
                                    No past meetings found.
                                </div>
                            )}
                            {pastMeetings.slice(0, 8).map(m => (
                                <Link
                                    to={`/meet/history/${m.id}`}
                                    key={m.id}
                                    className="group flex flex-col p-4 bg-zinc-50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl transition-all"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors line-clamp-1">{m.title}</h4>
                                        <ArrowRight className="w-4 h-4 text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-400 group-hover:-rotate-45 transition-all" />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-zinc-500">
                                        <span>{new Date(m.startTime).toLocaleDateString()}</span>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {m.participantCount}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

function MeetingCard({ meeting, isLive, onEnd }: { meeting: Meeting, isLive?: boolean, onEnd?: () => void }) {
    const toast = useToast();

    const copyLink = (e: React.MouseEvent) => {
        e.preventDefault();
        const link = `${window.location.origin}/meet/${meeting.joinCode}`;
        navigator.clipboard.writeText(link);
        toast.success("Success", "Link copied to clipboard");
    };

    return (
        <div className={cn(
            "group relative p-6 rounded-3xl border transition-all duration-300 hover:shadow-xl flex flex-col gap-5 overflow-hidden",
            isLive
                ? "bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-black border-red-200 dark:border-red-900/50"
                : "bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
        )}>
            <div className="flex justify-between items-start z-10">
                <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-bold text-zinc-900 dark:text-white text-xl truncate leading-tight mb-1">{meeting.title}</h3>
                    {isLive && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider border border-red-200 dark:border-red-500/20">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            Live Now
                        </div>
                    )}
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-200">
                    <button onClick={copyLink} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors" title="Copy Link">
                        <LinkIcon className="w-4 h-4" />
                    </button>
                    {isLive && onEnd && (
                        <button onClick={onEnd} className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl text-red-500 transition-colors" title="End Meeting for All">
                            <Square className="w-4 h-4 fill-current" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2 z-10">
                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                    <div className="p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                        <Calendar className="w-3.5 h-3.5" />
                    </div>
                    {new Date(meeting.startTime).toLocaleString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                    })}
                </div>
                {isLive && (
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                        <div className="p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg text-zinc-500 dark:text-zinc-400">
                            <Users className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium">{meeting.participantCount}</span> <span className="text-zinc-500">Participating</span>
                    </div>
                )}
            </div>

            <div className="mt-auto grid grid-cols-[1fr_auto] gap-3 z-10">
                <Link
                    to={`/meet/${meeting.joinCode}`}
                    target="_blank"
                    className={cn(
                        "flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all shadow-sm active:scale-95",
                        isLive
                            ? "bg-red-600 hover:bg-red-500 text-white shadow-red-500/20"
                            : "bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-zinc-500/10 dark:shadow-none"
                    )}
                >
                    {isLive ? 'Join Now' : 'Start Meeting'}
                </Link>
                <button
                    onClick={copyLink}
                    className="aspect-square flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl border border-transparent transition-colors"
                >
                    <Copy className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
