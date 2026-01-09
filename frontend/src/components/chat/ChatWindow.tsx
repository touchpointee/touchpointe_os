import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { getCurrentUser } from '@/lib/auth';
import { Send, Hash, User } from 'lucide-react';

export function ChatWindow() {
    const {
        activeChannelId, activeDmGroupId,
        channels, dmGroups, messages,
        fetchMessages, postMessage
    } = useChatStore();
    const { activeWorkspace } = useWorkspaces();
    const currentUser = getCurrentUser();

    const [input, setInput] = useState('');
    const bottomsRef = useRef<HTMLDivElement>(null);

    const activeId = activeChannelId || activeDmGroupId;
    const isDm = !!activeDmGroupId;

    const currentMessages = activeId ? (messages[activeId] || []) : [];

    const activeChannel = activeChannelId ? channels.find(c => c.id === activeChannelId) : null;
    const activeDm = activeDmGroupId ? dmGroups.find(d => d.id === activeDmGroupId) : null;

    useEffect(() => {
        if (activeWorkspace && activeId) {
            fetchMessages(activeWorkspace.id, activeId, isDm);
            // Poll for messages (rudimentary real-time)
            const interval = setInterval(() => {
                fetchMessages(activeWorkspace.id, activeId, isDm);
            }, 5000); // 5 seconds poll
            return () => clearInterval(interval);
        }
    }, [activeWorkspace, activeId, isDm]);

    useEffect(() => {
        if (bottomsRef.current) {
            bottomsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [currentMessages.length, activeId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeWorkspace || !activeId || !input.trim() || !currentUser) return;

        const content = input;
        setInput('');

        await postMessage(activeWorkspace.id, content, currentUser.id, currentUser.name || currentUser.email);
    };

    if (!activeId) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a channel or DM to start chatting
            </div>
        );
    }

    const getHeaderTitle = () => {
        if (activeChannel) return `#${activeChannel.name}`;
        if (activeDm) {
            const otherMembers = activeDm.members.filter(m => m.id !== currentUser?.id);
            return otherMembers.map(m => m.fullName).join(', ') || 'Me';
        }
        return 'Chat';
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-background">
            {/* Header */}
            <div className="h-14 border-b border-border flex items-center px-4 bg-card/10">
                <div className="flex items-center gap-2 font-semibold">
                    {activeChannel ? <Hash className="w-5 h-5 text-muted-foreground" /> : <User className="w-5 h-5 text-muted-foreground" />}
                    {getHeaderTitle()}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {currentMessages.length === 0 && (
                    <div className="text-center text-muted-foreground mt-10">No messages yet. Say hello!</div>
                )}

                {currentMessages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser?.id;
                    const showHeader = idx === 0 || currentMessages[idx - 1].senderId !== msg.senderId || (new Date(msg.createdAt).getTime() - new Date(currentMessages[idx - 1].createdAt).getTime() > 60000 * 5);

                    return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {showHeader && (
                                <div className="flex items-center gap-2 mb-1 mt-2">
                                    <span className="text-xs font-semibold text-foreground/80">{msg.senderName}</span>
                                    <span className="text-[10px] text-muted-foreground">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            )}
                            <div
                                className={`px-3 py-2 rounded-2xl max-w-[70%] text-sm ${isMe
                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                    : 'bg-muted text-foreground rounded-tl-sm'
                                    } ${msg.isOptimistic ? 'opacity-70' : ''}`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomsRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card/10">
                <form onSubmit={handleSend} className="relative">
                    <input
                        className="w-full bg-background border border-input rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder={`Message ${getHeaderTitle()}`}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
