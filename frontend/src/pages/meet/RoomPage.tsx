import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { meetApi } from '@/lib/meet-api';
import { getCurrentUser } from '@/lib/auth';

export function RoomPage() {
    const { joinCode } = useParams<{ joinCode: string }>();
    const navigate = useNavigate();
    const user = useMemo(() => getCurrentUser(), []);

    // State
    const [token, setToken] = useState<string>("");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    // Guest Name Input if not logged in
    const [guestName, setGuestName] = useState("");
    const [showGuestInput, setShowGuestInput] = useState(!user);

    const liveKitUrl = import.meta.env.VITE_LIVEKIT_URL;

    useEffect(() => {
        if (user && joinCode) {
            connectToMeeting();
        }
    }, [user?.id, joinCode]);

    const connectToMeeting = async (name?: string) => {
        if (!joinCode) return;
        setIsConnecting(true);
        setError(null);

        try {
            const res = await meetApi.joinMeeting(joinCode, name);
            setToken(res.token);
            setSessionId(res.sessionId);
            setShowGuestInput(false);
        } catch (err) {
            console.error(err);
            setError((err as Error).message || "Failed to join meeting");
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (sessionId) {
            try {
                await meetApi.leaveMeeting(sessionId);
            } catch (e) {
                console.error("Failed to report leave", e);
            }
        }
        // Redirect home or to workspace
        if (user) {
            // Try to get workspace from storage or history? 
            // Ideally we pass workspaceId in state or query param
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    if (showGuestInput) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
                <div className="w-full max-w-md p-8 bg-zinc-900 rounded-xl space-y-4">
                    <h1 className="text-2xl font-bold">Join Meeting</h1>
                    {error && <div className="text-red-500 p-2 bg-red-500/10 rounded">{error}</div>}
                    <div className="space-y-2">
                        <label className="text-sm text-zinc-400">Your Name</label>
                        <input
                            type="text"
                            className="w-full p-2 rounded bg-zinc-800 border border-zinc-700 text-white"
                            placeholder="Enter your name"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => connectToMeeting(guestName)}
                        disabled={!guestName.trim() || isConnecting}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded font-medium disabled:opacity-50"
                    >
                        {isConnecting ? "Joining..." : "Join Meeting"}
                    </button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
                <div className="text-red-500 text-xl">{error}</div>
                <button onClick={() => navigate('/')} className="mt-4 text-blue-400 hover:text-blue-300">Go Home</button>
            </div>
        );
    }

    if (!token) return <div className="flex items-center justify-center h-screen bg-black text-white">Loading...</div>;

    return (
        <div className="h-screen w-screen bg-zinc-950">
            <LiveKitRoom
                video={true}
                audio={true}
                token={token}
                serverUrl={liveKitUrl}
                data-lk-theme="default"
                style={{ height: '100vh' }}
                onDisconnected={handleDisconnect}
            >
                {/* 
                  VideoConference is a pre-built component that includes:
                  - Video Grid
                  - Controls (Mute, Video, Share, Chat, Leave)
                  - Participant List
                */}
                <VideoConference />
            </LiveKitRoom>
        </div>
    );
}
