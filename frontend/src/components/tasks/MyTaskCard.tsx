import React from 'react';
import type { MyTask } from '@/types/myTasks';
import { CheckCircle2, Circle, Clock, Hash, AtSign, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface TaskCardProps {
    task: MyTask;
    onStatusChange: (taskId: string, newStatus: string) => void;
    onClick: (taskId: string) => void;
}

export const MyTaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onClick }) => {

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'URGENT': return 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20';
            case 'HIGH': return 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/20';
            case 'MEDIUM': return 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20';
            case 'LOW': return 'bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20';
            default: return 'bg-[#9E9E9E]/10 text-[#9E9E9E] border-[#9E9E9E]/20';
        }
    };

    return (
        <div
            onClick={() => onClick(task.taskId)}
            className="group relative flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-[#1C1C1E] hover:bg-[#2C2C2E] hover:border-white/10 transition-all cursor-pointer"
        >
            {/* Status Toggle */}
            <div
                className={`shrink-0 transition-colors ${task.status === 'DONE' ? 'text-green-500' : 'text-gray-500'}`}
            >
                {task.status === 'DONE' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{task.workspaceName}</span>
                    <span className="text-gray-700 mx-1">•</span>
                    <span className="text-xs text-gray-500">{task.spaceName} / {task.listName}</span>
                </div>

                <h3 className={`text-sm font-medium truncate ${task.status === 'DONE' ? 'text-gray-500 line-through' : 'text-white'}`}>
                    {task.title}
                </h3>

                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    {task.dueDate && (
                        <div className={`flex items-center gap-1 ${task.isOverdue ? 'text-red-400' : task.isDueToday ? 'text-orange-400' : ''}`}>
                            <Clock className="w-3 h-3" />
                            <span>{format(parseISO(task.dueDate), 'MMM d')}</span>
                        </div>
                    )}

                    {task.subtaskCount > 0 && (
                        <div className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            <span>{task.completedSubtasks}/{task.subtaskCount}</span>
                        </div>
                    )}

                </div>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2">
                {task.isBlocked && (
                    <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white">BLOCKED</div>
                )}

                {task.priority !== 'NONE' && (
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                    </div>
                )}

                {task.isMentioned && <AtSign className="w-4 h-4 text-orange-400" />}
                {task.isWatching && <Eye className="w-4 h-4 text-blue-400" />}
            </div>

            <div className="w-1 h-full absolute left-0 top-0 bottom-0 rounded-l-xl bg-transparent group-hover:bg-primary/50 transition-colors" />
        </div>
    );
};
