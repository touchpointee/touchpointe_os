import React from 'react';
import type { MyTask } from '@/types/myTasks';
import {
    CheckSquare,
    Timer,
    MessageSquare,
    RotateCcw,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface TaskCardProps {
    task: MyTask;
    onStatusChange: (taskId: string, newStatus: string) => void;
    onClick: (taskId: string) => void;
}

export const MyTaskCard: React.FC<TaskCardProps> = ({ task, onClick, onStatusChange }) => {
    const isDone = task.status === 'DONE';

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
        bg-gradient-to-br from-white/10 to-white/5
        backdrop-blur-md border border-white/10
        shadow-[inset_0_0_25px_0_rgba(117,117,117,0.25)] hover:border-white/20
        transition cursor-pointer
      "
        >
            {/* Top Section */}
            <div className="flex justify-between gap-4 p-4">
                <div>
                    <h3
                        className={`text-lg font-semibold ${isDone ? 'text-gray-500 line-through' : 'text-white'
                            }`}
                    >
                        {task.title}
                    </h3>

                    <p className="mt-1 text-xs text-white/60">
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
                    <span className="text-xs text-white/80">
                        {isDone ? 'Done' : 'In Progress'}
                    </span>
                </div>

                {task.dueDate && (
                    <div className="text-xs text-white/60">
                        Due Date
                        <span className="ml-1 text-white font-medium">
                            {format(parseISO(task.dueDate), 'dd MMM, yyyy')}
                        </span>
                    </div>
                )}
            </div>

            {/* Divider */}
            <div className="my-3 h-px bg-white/10" />

            {/* Bottom Actions */}
            <div className="flex items-center justify-between px-4 pb-4">
                <div className="flex gap-3 text-white/60">
                    <Timer
                        className="w-4 h-4 hover:text-white cursor-pointer transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            // handle timer click
                        }}
                    />
                    <MessageSquare className="w-4 h-4 hover:text-white cursor-pointer transition-colors" />
                </div>

                <div
                    className={`flex items-center gap-2 text-xs font-medium cursor-pointer transition-colors ${isDone ? 'text-green-500 hover:text-green-400' : 'text-white/40 hover:text-white'
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
