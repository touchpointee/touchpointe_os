import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from '@/contexts/ToastContext';
import { Plus } from 'lucide-react';
import { TaskViewSwitcher, type TaskViewType } from '@/components/tasks/TaskViewSwitcher';
import { TaskListView } from '@/components/tasks/TaskListView';
import { TaskBoardView } from '@/components/tasks/TaskBoardView';
import { TaskCalendarView } from '@/components/tasks/TaskCalendarView';
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { useWorkspaces, isValidUUID } from '@/stores/workspaceStore';
import { useTaskStore } from '@/stores/taskStore';
import type { CreateTaskRequest } from '@/types/task';

const VIEW_STORAGE_KEY = 'tasks-view-preference';

export function TasksPage() {
    const { listId } = useParams<{ listId: string }>();
    const { activeWorkspace } = useWorkspaces();
    const { createTask, fetchTasks, isDetailPanelOpen } = useTaskStore();

    const workspaceId = activeWorkspace?.id;

    // View state with localStorage persistence
    const [currentView, setCurrentView] = useState<TaskViewType>(() => {
        const saved = localStorage.getItem(VIEW_STORAGE_KEY);
        return (saved as TaskViewType) || 'list';
    });

    // Create task modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Persist view preference
    const handleViewChange = (view: TaskViewType) => {
        setCurrentView(view);
        localStorage.setItem(VIEW_STORAGE_KEY, view);
    };

    // Load tasks when list changes
    useEffect(() => {
        if (listId && workspaceId && isValidUUID(workspaceId)) {
            fetchTasks(workspaceId, listId);
        }
    }, [listId, workspaceId, fetchTasks]);

    // Guard: show loading if workspace not ready
    if (!workspaceId || !isValidUUID(workspaceId)) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
                Loading workspace...
            </div>
        );
    }

    // Handle task creation from modal
    const handleCreateTask = async (data: Partial<CreateTaskRequest>) => {
        if (!listId) throw new Error('No list selected');

        await createTask(workspaceId, {
            ...data,
            listId: listId
        } as CreateTaskRequest);

        toast.success(`Task Created`, `Task '${data.title}' created successfully.`);
    };

    // Render view based on selection
    const renderView = () => {
        switch (currentView) {
            case 'board':
                return <TaskBoardView />;
            case 'calendar':
                return <TaskCalendarView />;
            case 'list':
            default:
                return <TaskListView />;
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
                    <p className="text-sm text-muted-foreground">Manage your team's tasks and projects.</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Switcher */}
                    <TaskViewSwitcher
                        currentView={currentView}
                        onViewChange={handleViewChange}
                    />

                    {/* Add Task Button */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        disabled={!listId}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Task
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                {listId ? (
                    renderView()
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <div className="p-4 bg-muted rounded-full mb-4">
                            <Plus className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground">Select a list</h3>
                        <p className="text-sm">Choose a list from the sidebar to view tasks.</p>
                    </div>
                )}
            </div>

            {/* Task Detail Panel */}
            {isDetailPanelOpen && <TaskDetailPanel />}

            {/* Create Task Modal */}
            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreateTask}
                workspaceId={workspaceId}
            />
        </div>
    );
}
