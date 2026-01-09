import { create } from 'zustand';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import type { TaskDto, CreateTaskRequest, UpdateTaskRequest, TaskActivityDto, TaskDetailDto } from '@/types/task';

interface TaskState {
    tasks: Record<string, TaskDto[]>; // keyed by listId
    activities: Record<string, TaskActivityDto[]>; // keyed by taskId
    loading: boolean;
    error: string | null;

    // Detail Panel State
    activeTaskId: string | null;
    isDetailPanelOpen: boolean;
    taskDetails: Record<string, TaskDetailDto>; // Cache details

    // Actions
    fetchTasks: (workspaceId: string, listId: string) => Promise<void>;
    createTask: (workspaceId: string, request: CreateTaskRequest) => Promise<TaskDto>;
    updateTask: (workspaceId: string, taskId: string, listId: string, request: UpdateTaskRequest) => Promise<void>;
    fetchActivities: (workspaceId: string, taskId: string) => Promise<void>;

    // Detail Actions
    openTaskDetail: (taskId: string) => void;
    closeTaskDetail: () => void;
    fetchTaskDetails: (workspaceId: string, taskId: string) => Promise<void>;
    addSubtask: (workspaceId: string, taskId: string, title: string, assigneeId?: string) => Promise<void>;
    toggleSubtask: (workspaceId: string, subtaskId: string) => Promise<void>;
    addComment: (workspaceId: string, taskId: string, content: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks: {},
    activities: {},
    taskDetails: {},
    activeTaskId: null,
    isDetailPanelOpen: false,
    loading: false,
    error: null,

    fetchTasks: async (workspaceId, listId) => {
        set({ loading: true, error: null });
        try {
            const tasks = await apiGet<TaskDto[]>(`/${workspaceId}/tasks/list/${listId}`);
            set(state => ({
                tasks: { ...state.tasks, [listId]: tasks },
                loading: false
            }));
        } catch (e) {
            set({ error: (e as Error).message, loading: false });
        }
    },

    createTask: async (workspaceId, request) => {
        try {
            const newTask = await apiPost<TaskDto>(`/${workspaceId}/tasks`, request);
            await get().fetchTasks(workspaceId, request.listId);
            return newTask;
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    updateTask: async (workspaceId, taskId, listId, request) => {
        try {
            // Find existing task to preserve existing values (Backend treats missing fields as null/wipe)
            const listTasks = get().tasks[listId] || [];
            const existingTask = listTasks.find(t => t.id === taskId);

            // Construct full payload by merging existing values with request
            const fullRequest: UpdateTaskRequest = {
                title: request.title !== undefined ? request.title : existingTask?.title,
                description: request.description !== undefined ? request.description : existingTask?.description,
                status: request.status !== undefined ? request.status : existingTask?.status as any,
                priority: request.priority !== undefined ? request.priority : existingTask?.priority,
                assigneeId: request.assigneeId !== undefined ? request.assigneeId : existingTask?.assigneeId,
                dueDate: request.dueDate !== undefined ? request.dueDate : existingTask?.dueDate,
                orderIndex: request.orderIndex,
                subDescription: request.subDescription !== undefined ? request.subDescription : existingTask?.subDescription
            };

            set(state => {
                const listTasks = state.tasks[listId] || [];
                const updatedTasks = listTasks.map(t =>
                    t.id === taskId ? { ...t, ...request } : t
                ) as TaskDto[];
                return {
                    tasks: { ...state.tasks, [listId]: updatedTasks }
                };
            });

            await apiPut<TaskDto>(`/${workspaceId}/tasks/${taskId}`, fullRequest);
            await get().fetchTasks(workspaceId, listId);

            // If detail panel is open for this task, refresh details
            if (get().isDetailPanelOpen && get().activeTaskId === taskId) {
                await get().fetchTaskDetails(workspaceId, taskId);
            }
        } catch (e) {
            set({ error: (e as Error).message });
            await get().fetchTasks(workspaceId, listId);
        }
    },

    fetchActivities: async (workspaceId, taskId) => {
        try {
            const activities = await apiGet<TaskActivityDto[]>(`/${workspaceId}/tasks/${taskId}/activities`);
            set(state => ({
                activities: { ...state.activities, [taskId]: activities }
            }));
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    openTaskDetail: (taskId) => set({ activeTaskId: taskId, isDetailPanelOpen: true }),
    closeTaskDetail: () => set({ activeTaskId: null, isDetailPanelOpen: false }),

    fetchTaskDetails: async (workspaceId, taskId) => {
        try {
            const details = await apiGet<TaskDetailDto>(`/${workspaceId}/tasks/${taskId}`);
            set(state => ({
                taskDetails: { ...state.taskDetails, [taskId]: details }
            }));
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    addSubtask: async (workspaceId, taskId, title, assigneeId) => {
        try {
            // Optimistic? Maybe later. For now, fetch after add.
            await apiPost(`/${workspaceId}/tasks/${taskId}/subtasks`, { title, assigneeId });
            await get().fetchTaskDetails(workspaceId, taskId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    toggleSubtask: async (workspaceId, subtaskId) => {
        try {
            // We need to know parent taskId to refresh details. 
            // Ideally API returns updated Subtask, but we need to update cache.
            // For now, let's just toggle in UI optimistically if we can find it?
            // Or just call API and refresh active task details.
            const activeTaskId = get().activeTaskId;
            if (!activeTaskId) return;

            await apiPut(`/${workspaceId}/tasks/subtasks/${subtaskId}/toggle`, {});
            await get().fetchTaskDetails(workspaceId, activeTaskId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    addComment: async (workspaceId, taskId, content) => {
        try {
            await apiPost(`/${workspaceId}/tasks/${taskId}/comments`, { content });
            await get().fetchTaskDetails(workspaceId, taskId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    }
}));
