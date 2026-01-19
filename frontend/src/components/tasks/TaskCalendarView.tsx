import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTaskStore } from '@/stores/taskStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskStatus } from '@/types/task';

// Reuse config for consistency
const statusColors: Record<TaskStatus, string> = {
    TODO: 'bg-zinc-200 text-zinc-700',
    IN_PROGRESS: 'bg-blue-200 text-blue-800',
    IN_REVIEW: 'bg-yellow-200 text-yellow-800',
    DONE: 'bg-green-200 text-green-800',
};

export function TaskCalendarView() {
    const { listId } = useParams<{ listId: string }>();
    const { tasks, openTaskDetail } = useTaskStore();
    const listTasksData = tasks[listId || ''];
    const listTasks = listTasksData?.items || [];

    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const startDate = startOfWeek(startOfMonth(currentMonth));
    const endDate = endOfWeek(endOfMonth(currentMonth));

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const today = () => setCurrentMonth(new Date());

    // Group tasks by date
    const tasksByDate = (date: Date) => {
        return listTasks.filter((task) =>
            task.dueDate && isSameDay(new Date(task.dueDate), date)
        );
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold capitalize">
                        {format(currentMonth, 'MMMM yyyy')}
                    </h2>
                    <div className="flex items-center bg-muted rounded-md border border-border">
                        <button onClick={prevMonth} className="p-1 hover:bg-background rounded-l-md"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={today} className="px-3 text-xs font-medium border-x border-border hover:bg-background">Today</button>
                        <button onClick={nextMonth} className="p-1 hover:bg-background rounded-r-md"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-7 border-b border-border">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground border-r border-border last:border-r-0">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid Body */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                {calendarDays.map((day) => {
                    const dayTasks = tasksByDate(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);

                    return (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                "min-h-[100px] border-b border-r border-border p-1 flex flex-col gap-1 transition-colors hover:bg-accent/10",
                                !isCurrentMonth && "bg-muted/10 text-muted-foreground"
                            )}
                        >
                            <div className={cn(
                                "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ml-auto mb-1",
                                isSameDay(day, new Date()) ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                            )}>
                                {format(day, 'd')}
                            </div>

                            <div className="flex flex-col gap-1 overflow-y-auto max-h-[120px]">
                                {dayTasks.map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => openTaskDetail(task.id)}
                                        className={cn("text-[10px] px-1.5 py-0.5 rounded truncate font-medium cursor-pointer hover:brightness-95", statusColors[task.status])}
                                        title={task.title}
                                    >
                                        {task.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
