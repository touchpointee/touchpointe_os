import { useEffect, useState, useRef, useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChatStore } from '@/stores/chatStore';
import type { Message, MessageAttachment } from '@/stores/chatStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { useRealtimeStore } from '@/stores/realtimeStore';
import { getCurrentUser } from '@/lib/auth';
import { ChatMessageItem } from './ChatMessageItem';
import { MentionSuggestion } from '../shared/MentionSuggestion';
import { format, isToday, isYesterday } from 'date-fns';
import { X, Plus, Send, Mic, Smile, File as FileIcon, Trash2, CheckCircle2 } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import { ReactionDetailsModal } from './ReactionDetailsModal';
import { MediaPreviewModal } from './MediaPreviewModal';

const USER_COLORS = [
    '#a13ee7ff', '#ff9b04ff', '#fd543adb',
    '#ee32ffff', '#d6be00', '#178d7d94', '#6d65dbff',
];

function getUserColor(name?: string) {
    if (!name) return USER_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}



interface LocalAttachment {
    id: string;
    file: File;
    previewUrl?: string;
    uploading: boolean;
    error?: string;
    data?: MessageAttachment;
}

export function ChatWindow() {
    const {
        activeChannelId, activeDmGroupId,
        channels, dmGroups, messages, members,
        fetchMessages, postMessage, fetchWorkspaceMembers,
        addReaction, removeReaction,
        uploadAttachment,
        isLoading, error
    } = useChatStore();
    const {
        emitTyping,
        emitStopTyping,
        typingUsers
    } = useRealtimeStore();
    const { activeWorkspace } = useWorkspaces();
    const currentUser = getCurrentUser();
    const [searchParams] = useSearchParams();

    const [isSending, setIsSending] = useState(false);
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionPosition, setMentionPosition] = useState<{ top?: number, bottom?: number, left: number }>({ left: 0 });
    const [hasContent, setHasContent] = useState(false);
    const [replyingTo, setReplyingTo] = useState<any | null>(null); // Type Message
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [selectedMessageForReactionDetails, setSelectedMessageForReactionDetails] = useState<Message | null>(null);
    const [localAttachments, setLocalAttachments] = useState<LocalAttachment[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);


    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const emojiButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                showEmojiPicker &&
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(event.target as Node) &&
                emojiButtonRef.current &&
                !emojiButtonRef.current.contains(event.target as Node)
            ) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Media Preview State
    const [previewMedia, setPreviewMedia] = useState<{ isOpen: boolean; src: string; type: 'image' | 'video'; fileName: string } | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);

            timerIntervalRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = async (shouldSend: boolean) => {
        if (!mediaRecorderRef.current) return;

        return new Promise<void>((resolve) => {
            if (!mediaRecorderRef.current) return resolve();

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                audioChunksRef.current = []; // Clear chunks

                // Stop all tracks to release microphone
                mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());

                if (shouldSend && activeWorkspace) {
                    setIsSending(true); // Show sending state
                    const file = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });

                    try {
                        // Upload as attachment
                        const attachment = await uploadAttachment(activeWorkspace.id, file);
                        if (attachment) {
                            // Send message with empty content but including attachment
                            await postMessage(
                                activeWorkspace.id,
                                "", // Empty text content
                                currentUser?.id || "",
                                currentUser?.name || currentUser?.email || "Unknown",
                                replyingTo?.id,
                                [attachment]
                            );
                        }
                    } catch (err) {
                        console.error("Failed to send voice message", err);
                    } finally {
                        setIsSending(false);
                    }
                }
                resolve();
            };

            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        });
    };

    const cancelRecording = () => {
        stopRecording(false);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };


    const onEmojiClick = (emojiData: EmojiClickData) => {
        if (inputRef.current) {
            const img = `<img src="${emojiData.imageUrl}" alt="${emojiData.emoji}" class="inline-block w-6 h-6 align-middle mx-0.5 object-contain" />`;

            inputRef.current.innerHTML += img;
            setHasContent(true);
            // Move cursor to end
            const range = document.createRange();
            const sel = window.getSelection();
            if (sel) {
                range.selectNodeContents(inputRef.current);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    };

    const activeId = activeChannelId || activeDmGroupId;
    const isDm = !!activeDmGroupId;

    const currentMessages = activeId ? (messages[activeId] || []) : [];

    const activeChannel = activeChannelId ? channels.find(c => c.id === activeChannelId) : null;
    const activeDm = activeDmGroupId ? dmGroups.find(d => d.id === activeDmGroupId) : null;

    // Get typing users for current channel, excluding specific user if needed (though backend filters sender usually)
    const currentTypingUsers = activeId ? (typingUsers[activeId] || []) : [];

    const filteredMembers = useMemo(() => {
        if (mentionQuery === null) return [];
        return members.filter(u =>
            (u.fullName.toLowerCase().includes(mentionQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(mentionQuery.toLowerCase())) &&
            u.id !== currentUser?.id // Exclude self
        ).slice(0, 5);
    }, [members, mentionQuery, currentUser]);

    useEffect(() => {
        if (activeWorkspace && activeId) {
            fetchMessages(activeWorkspace.id, activeId, isDm);
            fetchWorkspaceMembers(activeWorkspace.id);
        }
    }, [activeWorkspace, activeId, isDm, fetchMessages, fetchWorkspaceMembers]);



    // Track if we just switched channels to force instant scroll
    const [isChannelSwitch, setIsChannelSwitch] = useState(false);

    useEffect(() => {
        setIsChannelSwitch(true);
    }, [activeId]);

    useEffect(() => {
        const messageId = searchParams.get('messageId');
        if (messageId && currentMessages.length > 0) {
            const el = document.getElementById(messageId);
            if (el) {
                // Determine scroll behavior: instant if switching channel, smooth if just navigating? 
                // Using smooth for specific message navigation is usually fine.
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Double call often used to ensure alignment in some browsers, but one should suffice or use timeout
            } else {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        } else if (currentMessages.length > 0) {
            // If it's a channel switch or initial load, scroll instantly.
            // Otherwise (new message), scroll smoothly.
            if (isChannelSwitch) {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
                setIsChannelSwitch(false);
            } else {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [currentMessages.length, activeId, searchParams, isChannelSwitch]);

    const handleInput = () => {
        if (!inputRef.current) return;
        const text = inputRef.current.textContent || '';
        setHasContent(text.trim().length > 0);

        // Typing logic
        if (activeId) {
            if (text.trim().length > 0) {
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                } else {
                    emitTyping(activeId);
                }

                typingTimeoutRef.current = setTimeout(() => {
                    emitStopTyping(activeId);
                    typingTimeoutRef.current = null;
                }, 2000);
            }
        }

        if (isDm) {
            setMentionQuery(null);
            return;
        }

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;

        if (textNode.nodeType === Node.TEXT_NODE) {
            const textContent = textNode.textContent || '';
            const cursorMap = range.startOffset;
            const textBefore = textContent.slice(0, cursorMap);

            const lastAt = textBefore.lastIndexOf('@');

            if (lastAt !== -1) {
                const charBefore = lastAt > 0 ? textBefore[lastAt - 1] : ' ';
                if (charBefore === ' ' || charBefore === '\n' || charBefore === '\u00A0') {
                    const query = textBefore.slice(lastAt + 1);
                    // Allow spaces but don't start with space
                    if (!query.startsWith(' ') && query.length < 50) {
                        setMentionQuery(query);

                        // Anchor to input box NOT cursor
                        const inputRect = inputRef.current.getBoundingClientRect();
                        setMentionPosition({
                            bottom: window.innerHeight - inputRect.top + 8, // 8px padding above input
                            left: inputRect.left
                        });
                        return;
                    }
                }
            }
        }

        setMentionQuery(null);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            // Only prevent send if we have a valid mention query AND suggestions to select
            if (mentionQuery !== null && filteredMembers.length > 0) {
                e.preventDefault();
                return;
            }
            e.preventDefault();
            handleSend();
        }
    };

    const selectUser = (user: { id: string; fullName: string }) => {
        if (!inputRef.current) return;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;

        if (textNode.nodeType === Node.TEXT_NODE) {
            const textContent = textNode.textContent || '';
            const cursorMap = range.startOffset;
            const lastAt = textContent.lastIndexOf('@', cursorMap - 1);

            if (lastAt !== -1) {
                range.setStart(textNode, lastAt);
                range.setEnd(textNode, cursorMap);
                range.deleteContents();

                const span = document.createElement('span');
                span.textContent = `@${user.fullName}`;
                span.className = "text-primary font-bold bg-primary/10 rounded px-1 mx-0.5 select-none";
                span.dataset.id = user.id;
                span.contentEditable = "false";

                range.insertNode(span);

                const space = document.createTextNode('\u00A0');
                range.collapse(false);
                range.insertNode(space);

                range.setStartAfter(space);
                range.setEndAfter(space);
                selection.removeAllRanges();
                selection.addRange(range);

                setMentionQuery(null);
                setHasContent(true);

                // Keep focus
                inputRef.current.focus();
            }
        }
    };

    const handleSend = async () => {
        if (!inputRef.current || !activeWorkspace || !currentUser) return;

        // Clear typing
        if (activeId && typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            emitStopTyping(activeId);
            typingTimeoutRef.current = null;
        }

        let content = '';
        inputRef.current.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                content += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                if (el.tagName === 'SPAN' && el.dataset.id) {
                    content += `<@${el.dataset.id}|${el.textContent?.replace('@', '')}>`;
                } else if (el.tagName === 'IMG' && el.getAttribute('alt')) {
                    content += el.getAttribute('alt');
                } else if (el.tagName === 'DIV' || el.tagName === 'BR') {
                    content += '\n';
                    if (el.tagName === 'DIV' && el.textContent) content += el.textContent;
                } else {
                    content += el.textContent;
                }
            }
        });

        content = content.trim();
        if (!content && localAttachments.length === 0) return;

        setIsSending(true);
        try {
            const validAttachments = localAttachments
                .filter(a => a.data && !a.error)
                .map(a => a.data!);

            await postMessage(
                activeWorkspace.id,
                content,
                currentUser.id,
                currentUser.name || currentUser.email,
                replyingTo?.id,
                validAttachments.length > 0 ? validAttachments : undefined
            );

            if (inputRef.current) {
                inputRef.current.innerHTML = '';
            }
            setHasContent(false);
            setMentionQuery(null);
            setReplyingTo(null);
            setLocalAttachments([]);
        } catch (err) {
            console.error("Failed to send", err);
        } finally {
            setIsSending(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !activeWorkspace) return;

        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newAttachments: LocalAttachment[] = files.map(file => ({
            id: Math.random().toString(36).substring(7),
            file,
            previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
            uploading: true
        }));

        setLocalAttachments(prev => [...prev, ...newAttachments]);

        for (const local of newAttachments) {
            try {
                const result = await uploadAttachment(activeWorkspace.id, local.file);
                setLocalAttachments(prev => prev.map(p =>
                    p.id === local.id
                        ? { ...p, uploading: false, data: result || undefined, error: result ? undefined : 'Upload failed' }
                        : p
                ));
            } catch (err) {
                setLocalAttachments(prev => prev.map(p =>
                    p.id === local.id
                        ? { ...p, uploading: false, error: 'Upload failed' }
                        : p
                ));
            }
        }

        // Reset input so same file can be selected again if needed
        e.target.value = '';
        setHasContent(true); // Enable send button
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
        if (!activeWorkspace) return;
        const items = e.clipboardData.items;
        const files: File[] = [];

        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const file = items[i].getAsFile();
                if (file) files.push(file);
            }
        }

        if (files.length > 0) {
            e.preventDefault();
            const newAttachments: LocalAttachment[] = files.map(file => ({
                id: Math.random().toString(36).substring(7),
                file,
                previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
                uploading: true
            }));

            setLocalAttachments(prev => [...prev, ...newAttachments]);

            for (const local of newAttachments) {
                try {
                    const result = await uploadAttachment(activeWorkspace.id, local.file);
                    setLocalAttachments(prev => prev.map(p =>
                        p.id === local.id
                            ? { ...p, uploading: false, data: result || undefined, error: result ? undefined : 'Upload failed' }
                            : p
                    ));
                } catch (err) {
                    setLocalAttachments(prev => prev.map(p =>
                        p.id === local.id
                            ? { ...p, uploading: false, error: 'Upload failed' }
                            : p
                    ));
                }
            }
            setHasContent(true); // Enable send button
        }
    };

    const removeAttachment = (id: string) => {
        setLocalAttachments(prev => {
            const attachment = prev.find(a => a.id === id);
            if (attachment?.previewUrl) {
                URL.revokeObjectURL(attachment.previewUrl);
            }
            return prev.filter(a => a.id !== id);
        });
    };

    const getHeaderTitle = () => {
        if (activeChannel) return activeChannel.name.replace(/^#/, '');
        if (activeDm) {
            const otherMembers = activeDm.members.filter(m => m.id !== currentUser?.id);
            return otherMembers.map(m => m.fullName).join(', ') || 'Me';
        }
        return 'Chat';
    };

    if (!activeId) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a channel or DM to start chatting
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-background relative">
            {mentionQuery !== null && (
                <MentionSuggestion
                    users={filteredMembers}
                    onSelect={selectUser}
                    onClose={() => setMentionQuery(null)}
                    position={mentionPosition}
                />
            )}

            {/* Header */}
            <div className="h-14 border-b border-border flex items-center px-4 bg-card/10">
                <div className="flex items-center gap-3 font-semibold">
                    {activeChannel ? (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                            {activeChannel.name.replace(/^#/, '').charAt(0).toUpperCase()}
                        </div>
                    ) : activeDm ? (
                        (() => {
                            const otherMembers = activeDm.members.filter(m => (m.id || (m as any).Id) !== currentUser?.id);
                            const displayName = otherMembers.length > 0 ? otherMembers.map(m => m.fullName).join(', ') : "Me";
                            const avatarUrl = otherMembers.length > 0
                                ? (otherMembers[0].avatarUrl || (otherMembers[0] as any).AvatarUrl)
                                : (currentUser?.avatarUrl || (currentUser as any)?.AvatarUrl);

                            // Single DM or Me
                            if (avatarUrl) {
                                return (
                                    <img
                                        src={avatarUrl}
                                        alt={displayName}
                                        className="w-8 h-8 rounded-full object-cover border border-border"
                                    />
                                );
                            }
                            // Group DM or no avatar
                            return (
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold border border-border">
                                    {otherMembers.length > 0 ? otherMembers[0].fullName.charAt(0).toUpperCase() : 'M'}
                                </div>
                            );
                        })()
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            {/* Generic fallback */}
                            <div className="w-4 h-4 rounded-full bg-muted-foreground/30" />
                        </div>
                    )}

                    {/* Title Text - REFINED (No #) */}
                    <div className="flex flex-col justify-center gap-1">
                        <span className="text-foreground font-semibold leading-tight">{activeChannel ? activeChannel.name.replace(/^#/, '') : getHeaderTitle()}</span>
                        {activeChannel && <span className="text-[10px] text-muted-foreground font-normal truncate max-w-[600px] block">{members.map(m => m.fullName).join(', ')}</span>}
                    </div>
                </div>

                {/* Meeting Icon Button */}
                <button
                    className="ml-auto p-2 hover:bg-muted/50 rounded-full transition-colors"
                    title="Start video meeting"
                    onClick={() => {
                        // TODO: Implement video meeting functionality
                        console.log('Start video meeting');
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-muted-foreground"
                    >
                        <path d="m22 8-6 4 6 4V8Z" />
                        <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
                    </svg>
                </button>

                {/* More Options Icon Button */}
                <div className="relative">
                    <button
                        className="p-2 hover:bg-muted/50 rounded-full transition-colors"
                        title="More options"
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-muted-foreground"
                        >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showMoreMenu && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--chat-bg-secondary)] border border-[var(--chat-border)] rounded-lg shadow-lg overflow-hidden z-50">
                            <button
                                className="w-full px-4 py-3 text-left text-sm text-[var(--chat-text-primary)] hover:bg-[var(--chat-bg-hover)] transition-colors flex items-center gap-3"
                                onClick={() => {
                                    setShowMoreMenu(false);
                                    console.log('Contact info');
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                Contact info
                            </button>
                            <button
                                className="w-full px-4 py-3 text-left text-sm text-[var(--chat-text-primary)] hover:bg-[var(--chat-bg-hover)] transition-colors flex items-center gap-3"
                                onClick={() => {
                                    setShowMoreMenu(false);
                                    console.log('Select messages');
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 11 12 14 22 4" />
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                </svg>
                                Select messages
                            </button>
                            <button
                                className="w-full px-4 py-3 text-left text-sm text-[var(--chat-text-primary)] hover:bg-[var(--chat-bg-hover)] transition-colors flex items-center gap-3"
                                onClick={() => {
                                    setShowMoreMenu(false);
                                    console.log('Mute notifications');
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                </svg>
                                Mute notifications
                            </button>
                            <button
                                className="w-full px-4 py-3 text-left text-sm text-[var(--chat-text-primary)] hover:bg-[var(--chat-bg-hover)] transition-colors flex items-center gap-3"
                                onClick={() => {
                                    setShowMoreMenu(false);
                                    console.log('Search');
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.3-4.3" />
                                </svg>
                                Search
                            </button>
                            <div className="h-px bg-[#2a3942] my-1" />
                            <button
                                className="w-full px-4 py-3 text-left text-sm text-[#ea4335] hover:bg-[#2a3942] transition-colors flex items-center gap-3"
                                onClick={() => {
                                    setShowMoreMenu(false);
                                    console.log('Clear chat');
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Clear chat
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div
                className="flex-1 overflow-y-auto px-4 py-4 chat-background"
            >
                {isLoading ? (
                    <div className="flex justify-center p-4"><span className="animate-spin">⌛</span></div>
                ) : currentMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground mt-10">No messages yet. Say hello!</div>
                ) : (
                    currentMessages.map((msg, idx) => {
                        const isMe = msg.senderId === currentUser?.id;
                        // Use 5 minutes threshold for grouping
                        const isSequence = idx > 0 && currentMessages[idx - 1].senderId === msg.senderId && (new Date(msg.createdAt).getTime() - new Date(currentMessages[idx - 1].createdAt).getTime() < 60000 * 5);
                        const showHeader = idx === 0 || !isSequence;

                        // Date Separator Logic
                        let dateSeparator = null;
                        if (idx === 0) {
                            dateSeparator = new Date(msg.createdAt);
                        } else {
                            const prevDate = new Date(currentMessages[idx - 1].createdAt);
                            const currDate = new Date(msg.createdAt);
                            if (prevDate.getDate() !== currDate.getDate() || prevDate.getMonth() !== currDate.getMonth() || prevDate.getFullYear() !== currDate.getFullYear()) {
                                dateSeparator = currDate;
                            }
                        }

                        let dateLabel = '';
                        if (dateSeparator) {
                            if (isToday(dateSeparator)) dateLabel = 'Today';
                            else if (isYesterday(dateSeparator)) dateLabel = 'Yesterday';
                            else dateLabel = format(dateSeparator, 'MMMM d, yyyy');
                        }

                        return (
                            <div key={msg.id} className={`flex flex-col ${showHeader ? 'mt-4' : 'mt-[2px]'}`}>
                                {dateSeparator && (
                                    <div className="flex items-center justify-center my-4">
                                        <div className="bg-[#202c33] text-xs text-[#e9edef] px-3 py-1 rounded-md shadow-sm">{dateLabel}</div>
                                    </div>
                                )}

                                <ChatMessageItem
                                    message={msg}
                                    currentUser={currentUser ? { id: currentUser.id, name: currentUser.name, email: currentUser.email || '' } : null}
                                    isMe={isMe}
                                    showHeader={showHeader}
                                    onReply={(m) => {
                                        setReplyingTo(m);
                                        inputRef.current?.focus();
                                    }}
                                    onReact={(mid, emoji) => {
                                        if (activeWorkspace) addReaction(activeWorkspace.id, mid, emoji);
                                    }}
                                    onRemoveReaction={(mid, emoji) => {
                                        if (activeWorkspace) removeReaction(activeWorkspace.id, mid, emoji);
                                    }}
                                    onOpenReactionDetails={(m) => setSelectedMessageForReactionDetails(m)}
                                    onPreview={(src, type, fileName) => setPreviewMedia({ isOpen: true, src, type, fileName })}
                                />
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Media Preview Modal */}
            {previewMedia && (
                <MediaPreviewModal
                    isOpen={previewMedia.isOpen}
                    onClose={() => setPreviewMedia(null)}
                    src={previewMedia.src}
                    type={previewMedia.type}
                    fileName={previewMedia.fileName}
                />
            )}

            {/* Input Area */}
            <div className="p-2 shrink-0 relative z-10">
                {/* Typing Indicator */}
                {currentTypingUsers.length > 0 && (
                    <div className="absolute top-[-25px] left-4 text-xs text-muted-foreground animate-pulse">
                        {currentTypingUsers.length === 1
                            ? `${currentTypingUsers[0].userName} is typing...`
                            : `${currentTypingUsers.length} people are typing...`
                        }
                    </div>
                )}

                {/* Reply Banner */}
                {replyingTo && (
                    <div className="flex items-center justify-between bg-[#1f2c34] p-2 mb-2 rounded-lg border-l-[4px] relative"
                        style={{ borderLeftColor: getUserColor(replyingTo.senderName) }}
                    >
                        <div className="flex flex-col ml-2 overflow-hidden">
                            <span
                                className="text-[12px] font-bold mb-0.5"
                                style={{ color: getUserColor(replyingTo.senderName) }}
                            >
                                Replying to {replyingTo.senderName}
                            </span>
                            <span className="text-[12px] text-[#8696a0] truncate">
                                {replyingTo.content}
                            </span>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-white/10 rounded-full self-start mt-1">
                            <X className="w-4 h-4 text-[#8696a0]" />
                        </button>
                    </div>
                )}

                {localAttachments.length > 0 && (
                    <div className="flex gap-2 p-2 overflow-x-auto mb-2">
                        {localAttachments.map(att => (
                            <div
                                key={att.id}
                                className={`relative group bg-[#2a3942] rounded-lg p-2 flex items-center gap-2 min-w-[200px] ${att.previewUrl ? 'cursor-pointer hover:bg-[#2a3942]/80' : ''}`}
                                onClick={() => {
                                    if (att.previewUrl) {
                                        setPreviewMedia({
                                            isOpen: true,
                                            src: att.previewUrl,
                                            type: 'image',
                                            fileName: att.file.name
                                        });
                                    }
                                }}
                            >
                                {att.previewUrl ? (
                                    <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-black/20">
                                        <img src={att.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="bg-[#202c33] p-2 rounded">
                                        <FileIcon className="w-5 h-5 text-[#8696a0]" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-[#e9edef] truncate">{att.file.name}</div>
                                    <div className="text-xs text-[#8696a0]">
                                        {att.uploading ? 'Uploading...' : att.error ? 'Failed' : `${(att.file.size / 1024).toFixed(1)} KB`}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent opening preview
                                        removeAttachment(att.id);
                                    }}
                                    className="absolute -top-1 -right-1 bg-[#374045] rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3 text-[#e9edef]" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-end gap-2 bg-[var(--chat-bg-secondary)] rounded-[24px] p-1 border border-[var(--chat-border)] relative">
                    {isRecording ? (
                        <div className="flex-1 flex items-center justify-between px-3 h-[40px]">
                            <div className="flex items-center gap-3 text-red-500 animate-pulse">
                                <Mic className="w-5 h-5 fill-current" />
                                <span className="font-mono text-sm">{formatDuration(recordingDuration)}</span>
                            </div>
                            <div className="text-[var(--chat-text-secondary)] text-sm hidden sm:block">
                                Recording... Click check to send
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={cancelRecording}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                                    title="Cancel recording"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => stopRecording(true)}
                                    className="p-2 text-[#00a884] hover:bg-[#00a884]/10 rounded-full transition-colors"
                                    title="Send voice message"
                                >
                                    <CheckCircle2 className="w-6 h-6 fill-current" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {showEmojiPicker && (
                                <div ref={emojiPickerRef} className="absolute bottom-full left-0 mb-2 z-50 bg-[#202c33] border border-[#2a3942] rounded-[16px] shadow-2xl flex flex-col overflow-hidden w-[430px]">
                                    <div className="flex-1 bg-[#111b21] emoji-picker-custom">
                                        <style>{`
                                            .emoji-picker-custom aside.EmojiPickerReact {
                                                --epr-emoji-size: 26px !important;
                                                --epr-search-input-height: 32px !important;
                                                --epr-category-label-height: 28px !important;
                                                --epr-category-navigation-button-size: 24px !important;
                                            }
                                            /* Reduce icon scaling */
                                            .emoji-picker-custom .epr-cat-btn > img {
                                                width: 20px !important;
                                                height: 20px !important;
                                            }
                                            /* Active Category Circle */
                                            /* Active Category Circle */
                                            .emoji-picker-custom .epr-cat-btn[aria-selected="true"] {
                                                background-color: #374045 !important;
                                                border-radius: 50% !important;
                                                border: none !important;
                                                outline: none !important;
                                                box-shadow: 0 0 0 6px #374045 !important;
                                                color: white !important;
                                            }
                                            /* Remove pseudo-elements */
                                            .emoji-picker-custom .epr-cat-btn[aria-selected="true"]::before,
                                            .emoji-picker-custom .epr-cat-btn[aria-selected="true"]::after {
                                                display: none !important;
                                                content: none !important;
                                            }
                                            /* White Icon for Active */
                                            .emoji-picker-custom .epr-cat-btn[aria-selected="true"] > * {
                                                filter: grayscale(1) brightness(0) invert(1) !important;
                                                opacity: 1 !important;
                                            }
                                            .emoji-picker-custom .epr-emoji-img {
                                                width: 25px !important;
                                                height: 25px !important;
                                                max-width: 25px !important;
                                                max-height: 25px !important;
                                            }
                                            .emoji-picker-custom li.epr-emoji-category > .epr-emoji-category-content {
                                                grid-template-columns: repeat(auto-fill, 36px) !important;
                                            }
                                            .emoji-picker-custom .epr-body {
                                                padding: 0 0 0 0 !important;
                                            }
                                            /* Compact Search */
                                            .emoji-picker-custom .epr-search-container {
                                                padding: 10px 10px 8px 10px !important;
                                                margin-bottom: 0 !important;
                                            }
                                            .emoji-picker-custom .epr-category-nav {
                                                padding-top: 0 !important;
                                                padding-bottom: 0 !important;
                                                margin-top: 5px !important;
                                                margin-bottom: 20px !important;
                                            }
                                            .emoji-picker-custom input.epr-search {
                                                height: 32px !important;
                                                font-size: 13px !important;
                                                border-radius: 8px !important;
                                            }
                                            /* Smaller Text */
                                            .emoji-picker-custom .epr-emoji-category-label {
                                                font-size: 12px !important;
                                                line-height: 28px !important;
                                            }
                                        `}</style>
                                        <EmojiPicker
                                            onEmojiClick={onEmojiClick}
                                            theme={Theme.DARK}
                                            width="100%"
                                            height={350}
                                            previewConfig={{ showPreview: false }}
                                            skinTonesDisabled
                                        />
                                    </div>
                                </div>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple
                                onChange={handleFileSelect}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-1.5 text-[#8696a0] hover:text-[#e9edef] transition-colors shrink-0 rounded-full hover:bg-white/5 pb-1.5"
                            >
                                <Plus className="w-6 h-6" />
                            </button>

                            <button
                                ref={emojiButtonRef}
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className={`p-1.5 transition-colors shrink-0 rounded-full hover:bg-white/5 pb-1.5 -ml-1 ${showEmojiPicker ? 'text-[#00a884]' : 'text-[#8696a0] hover:text-[#e9edef]'}`}
                            >
                                <Smile className="w-6 h-6" />
                            </button>

                            <div
                                ref={inputRef}
                                contentEditable
                                onInput={handleInput}
                                onKeyDown={handleKeyDown}
                                onPaste={handlePaste}
                                className="flex-1 max-h-[100px] overflow-y-auto py-2 px-2 text-[15px] text-[var(--chat-text-primary)] outline-none min-h-[24px] empty:before:content-[attr(data-placeholder)] empty:before:text-[var(--chat-text-secondary)]"
                                role="textbox"
                                aria-multiline="true"
                                data-placeholder={`Message ${getHeaderTitle()}...`}
                            />

                            <button
                                onClick={startRecording}
                                disabled={isSending}
                                className="p-1.5 rounded-full shrink-0 transition-all pb-1.5 text-[var(--chat-text-secondary)] hover:bg-[var(--chat-bg-hover)]"
                            >
                                <Mic className="w-5 h-5" />
                            </button>

                            <button
                                onClick={handleSend}
                                disabled={isSending || (!hasContent && localAttachments.length === 0)}
                                className={`p-1.5 rounded-full shrink-0 transition-all pb-1.5 ${hasContent || localAttachments.length > 0
                                    ? 'text-[var(--chat-accent)] hover:bg-[var(--chat-accent)]/10'
                                    : 'text-[var(--chat-text-muted)] opacity-50 cursor-not-allowed'
                                    }`}
                            >
                                <Send className="w-5 h-5 ml-0.5" />
                            </button>
                        </>
                    )}
                </div>
            </div>
            {/* Reaction Details Modal */}
            {selectedMessageForReactionDetails && (
                <ReactionDetailsModal
                    isOpen={true}
                    onClose={() => setSelectedMessageForReactionDetails(null)}
                    reactions={selectedMessageForReactionDetails.reactions || []}
                    currentUser={currentUser ? { id: currentUser.id, name: currentUser.name, email: currentUser.email || '' } : null}
                    onRemoveReaction={(mid, emoji) => {
                        if (activeWorkspace) removeReaction(activeWorkspace.id, mid, emoji);
                    }}
                />
            )}
        </div>
    );
}
