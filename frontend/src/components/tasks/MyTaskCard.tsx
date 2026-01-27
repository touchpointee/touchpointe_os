import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MyTask } from '@/types/myTasks';
import {
    CheckSquare,
    Timer,
    MessageSquare,
    Play,
    Pause
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useTaskStore } from '@/stores/taskStore';
import { useChatStore } from '@/stores/chatStore';
import { useUserStore } from '@/stores/userStore';
import { cn } from '@/lib/utils';

interface TaskCardProps {
    task: MyTask;
    onStatusChange: (taskId: string, newStatus: string) => void;
    onClick: (taskId: string) => void;
}

export const MyTaskCard: React.FC<TaskCardProps> = ({ task, onClick, onStatusChange }) => {
    const isDone = task.status === 'DONE';
    const navigate = useNavigate();

    // Stores
    const { activeTimer, startTimer, stopTimer } = useTaskStore();
    const { channels, fetchChannels, postMessage, setActiveChannel } = useChatStore();
    const { user } = useUserStore();

    // Timer Logic
    const isRunning = activeTimer?.taskId === task.taskId;
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        let interval: any;
        if (isRunning && activeTimer?.startTime) {
            const start = new Date(activeTimer.startTime).getTime();
            setSeconds(Math.floor((Date.now() - start) / 1000));

            interval = setInterval(() => {
                setSeconds(Math.floor((Date.now() - start) / 1000));
            }, 1000);
        } else {
            setSeconds(0);
        }
        return () => clearInterval(interval);
    }, [isRunning, activeTimer?.startTime]);

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleTimer = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (isRunning) {
            await stopTimer(task.workspaceId, task.taskId);
        } else {
            await startTimer(task.workspaceId, task.taskId);
        }
    };

    // Message Logic
    const handleMessageClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const listName = task.listName;
        if (!listName) return;

        // Find Channel
        let targetChannel = channels.find(c => c.name === listName);
        if (!targetChannel) {
            await fetchChannels(task.workspaceId);
            targetChannel = useChatStore.getState().channels.find(c => c.name === listName);
        }

        if (targetChannel && user) {
            // Set Active Channel FIRST
            setActiveChannel(targetChannel.id);

            // Post Message
            const messageContent = `Shared Task: **${task.title}**\nID: ${task.taskId.substring(0, 8)}\nStatus: ${task.status}\nAssignee: ${task.assigneeName || 'Unassigned'}`;
            await postMessage(task.workspaceId, messageContent, user.id, user.fullName || 'User');

            // Redirect
            navigate(`/chat/channel/${targetChannel.id}`);
        }
    };

    const getPriorityPill = (p: string) => {
        switch (p) {
            case 'URGENT':
                return 'bg-red-500/15 text-red-400';
            case 'HIGH':
                return 'bg-orange-500/15 text-orange-400';
            case 'MEDIUM':
                return 'bg-blue-500/15 text-blue-400';
            case 'LOW':
                return 'bg-gray-500/15 text-gray-400';
            default:
                return '';
        }
    };

    return (
        <div
            onClick={() => onClick(task.taskId)}
            className="
        relative rounded-2xl
        bg-task-card
        backdrop-blur-md border border-task-card-border
        shadow-[inset_0_0_25px_0_rgba(117,117,117,0.25)] hover:border-white/20
        transition cursor-pointer
      "
        >
            {/* Top Section */}
            <div className="flex justify-between gap-4 p-4">
                <div>
                    <h3
                        className={`text-lg font-semibold ${isDone ? 'text-task-card-muted line-through' : 'text-task-card-foreground'
                            }`}
                    >
                        {task.title}
                    </h3>

                    <p className="mt-1 text-xs text-task-card-muted">
                        {task.spaceName} / {task.listName}
                    </p>
                </div>

                {task.priority !== 'NONE' && (
                    <span
                        className={`h-fit w-16 text-center rounded-full px-3 py-1 text-[0.65rem] font-medium ${getPriorityPill(
                            task.priority
                        )}`}
                    >
                        {task.priority}
                    </span>
                )}
            </div>

            {/* Status + Due Date */}
            <div className="flex items-center justify-between px-6">
                <div className="flex items-center gap-2 text-sm">
                    <span
                        className={`h-2 w-2 rounded-full ${isDone ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                    />
                    <span className="text-xs text-task-card-foreground/80 capitalize">
                        {task.status.toLowerCase().replace(/_/g, ' ')}
                    </span>
                </div>

                {task.dueDate && (
                    <div className="text-xs text-task-card-muted">
                        Due Date
                        <span className="ml-1 text-task-card-foreground font-medium">
                            {format(parseISO(task.dueDate), 'dd MMM, yyyy')}
                        </span>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="my-3 h-px bg-task-card-border" />

            {/* Bottom Actions */}
            <div className="flex items-center justify-between px-4 pb-4">
                <div className="flex gap-3 text-task-card-muted">
                    {/* Timer Button */}
                    <button
                        onClick={toggleTimer}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className={cn(
                            "flex items-center gap-1 text-[10px] font-medium transition-colors hover:bg-white/5 rounded p-1.5 -ml-1",
                            (isRunning || seconds > 0) ? "text-blue-400" : "hover:text-gray-400"
                        )}
                    >
                        {isRunning ? (
                            <Pause className="w-4 h-4" />
                        ) : seconds > 0 ? (
                            <Play className="w-4 h-4" />
                        ) : (
                            <Timer className="w-4 h-4" />
                        )}
                        {(isRunning || seconds > 0) && <span>{formatTime(seconds)}</span>}
                    </button>

                    {/* Message Button */}
                    <button
                        onClick={handleMessageClick}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-[10px] font-medium hover:text-gray-400 transition-colors"
                        title="Share to Channel"
                    >
                        <MessageSquare className="w-4 h-4" />
                    </button>
                </div>

                <div
                    className={`flex items-center gap-2 text-xs font-medium cursor-pointer transition-colors ${isDone ? 'text-green-500 hover:text-green-400' : 'text-task-card-muted hover:text-task-card-foreground'
                        }`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(task.taskId, isDone ? 'TODO' : 'DONE');
                    }}
                >
                    <CheckSquare className="w-4 h-4" />
                    {isDone ? 'Completed' : 'Done'}
                </div>
            </div>
        </div>
    );
};
