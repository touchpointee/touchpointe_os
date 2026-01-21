import React from 'react';
import type { MyTask } from '@/types/myTasks';
import {
    CheckSquare,
    Timer,
    MessageSquare
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface TaskListRowProps {
    task: MyTask;
    onStatusChange: (taskId: string, newStatus: string) => void;
    onClick: (taskId: string) => void;
}

export const MyTaskListRow: React.FC<TaskListRowProps> = ({ task, onClick, onStatusChange }) => {
    const isDone = task.status === 'DONE';

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'URGENT': return 'text-red-400 bg-red-400/10';
            case 'HIGH': return 'text-orange-400 bg-orange-400/10';
            case 'MEDIUM': return 'text-blue-400 bg-blue-400/10';
            case 'LOW': return 'text-gray-400 bg-gray-400/10';
            default: return 'text-gray-400 bg-gray-400/10';
        }
    };

    return (
        <div
            onClick={() => onClick(task.taskId)}
            className="group flex items-center gap-4 p-3 rounded-lg bg-card/40 border border-white/5 hover:bg-card/60 hover:border-white/10 transition-colors cursor-pointer"
        >
            {/* Status Checkbox */}
            <div
                onClick={(e) => {
                    e.stopPropagation();
                    onStatusChange(task.taskId, isDone ? 'TODO' : 'DONE');
                }}
                className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isDone
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-white/20 hover:border-white/40 text-transparent'
                    }`}
            >
                <CheckSquare className="w-3.5 h-3.5" />
            </div>

            {/* Title & Path */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className={`text-sm font-medium truncate ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'
                    }`}>
                    {task.title}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                    {task.spaceName} • {task.listName}
                </p>
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {task.dueDate && (
                    <span className={task.isOverdue && !isDone ? 'text-red-400' : ''}>
                        {format(parseISO(task.dueDate), 'MMM d')}
                    </span>
                )}

                {task.priority !== 'NONE' && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                    </span>
                )}
            </div>

            {/* Actions (visible on hover) */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        // handle timer
                    }}
                    className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Timer className="w-4 h-4" />
                </button>
                <button
                    className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <MessageSquare className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
