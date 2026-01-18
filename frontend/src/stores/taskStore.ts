import { create } from 'zustand';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';
import type { TaskDto, CreateTaskRequest, UpdateTaskRequest, TaskActivityDto, TaskDetailDto } from '@/types/task';
import type { TimeEntryDto, StartTimerRequest, ManualTimeRequest } from '@/types/timeTracking';

interface TaskState {
    tasks: Record<string, TaskDto[]>; // keyed by listId
    activities: Record<string, TaskActivityDto[]>; // keyed by taskId
    loading: boolean;
    error: string | null;

    // Detail Panel State
    activeTaskId: string | null;
    isDetailPanelOpen: boolean;
    taskDetails: Record<string, TaskDetailDto>; // Cache details
    timeEntries: Record<string, TimeEntryDto[]>; // keyed by taskId

    // Actions
    fetchTasks: (workspaceId: string, listId: string) => Promise<void>;
    createTask: (workspaceId: string, request: CreateTaskRequest) => Promise<TaskDto>;
    updateTask: (workspaceId: string, taskId: string, listId: string, request: UpdateTaskRequest) => Promise<void>;
    fetchActivities: (workspaceId: string, taskId: string) => Promise<void>;

    // Time Tracking
    fetchTimeEntries: (workspaceId: string, taskId: string) => Promise<void>;
    startTimer: (workspaceId: string, taskId: string, request?: StartTimerRequest) => Promise<void>;
    stopTimer: (workspaceId: string, taskId: string) => Promise<void>;
    logManualTime: (workspaceId: string, taskId: string, request: ManualTimeRequest) => Promise<void>;
    deleteTimeEntry: (workspaceId: string, entryId: string) => Promise<void>;

    // Detail Actions
    openTaskDetail: (taskId: string) => void;
    closeTaskDetail: () => void;
    fetchTaskDetails: (workspaceId: string, taskId: string) => Promise<void>;
    addSubtask: (workspaceId: string, taskId: string, title: string, assigneeId?: string) => Promise<void>;
    toggleSubtask: (workspaceId: string, subtaskId: string) => Promise<void>;
    addComment: (workspaceId: string, taskId: string, content: string) => Promise<void>;
    deleteTask: (workspaceId: string, taskId: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks: {},
    activities: {},
    taskDetails: {},
    timeEntries: {},
    activeTaskId: null,
    isDetailPanelOpen: false,
    loading: false,
    error: null,

    fetchTasks: async (workspaceId, listId) => {
        set({ loading: true, error: null });
        try {
            const tasks = await apiGet<TaskDto[]>(`/workspaces/${workspaceId}/tasks/list/${listId}`);
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
            const newTask = await apiPost<TaskDto>(`/workspaces/${workspaceId}/tasks`, request);
            await get().fetchTasks(workspaceId, request.listId);
            return newTask;
        } catch (e) {
            set({ error: (e as Error).message });
            throw e;
        }
    },

    updateTask: async (workspaceId, taskId, listId, request) => {
        try {
            // Only send fields that were explicitly provided in the request
            // The backend handles partial updates - we don't need to merge with existing values
            const fullRequest: Partial<UpdateTaskRequest> = {};

            if (request.title !== undefined) fullRequest.title = request.title;
            if (request.description !== undefined) fullRequest.description = request.description;
            if (request.subDescription !== undefined) fullRequest.subDescription = request.subDescription;
            if (request.status !== undefined) fullRequest.status = request.status;
            if (request.priority !== undefined) fullRequest.priority = request.priority;
            if (request.assigneeId !== undefined) fullRequest.assigneeId = request.assigneeId;
            if (request.dueDate !== undefined) fullRequest.dueDate = request.dueDate;
            if (request.orderIndex !== undefined) fullRequest.orderIndex = request.orderIndex;
            if (request.orderIndex !== undefined) fullRequest.orderIndex = request.orderIndex;
            if (request.customStatus !== undefined) fullRequest.customStatus = request.customStatus;
            if (request.tagIds !== undefined) fullRequest.tagIds = request.tagIds;

            set(state => {
                const listTasks = state.tasks[listId] || [];
                const updatedTasks = listTasks.map(t =>
                    t.id === taskId ? { ...t, ...request } : t
                ) as TaskDto[];
                return {
                    tasks: { ...state.tasks, [listId]: updatedTasks }
                };
            });

            await apiPut<TaskDto>(`/workspaces/${workspaceId}/tasks/${taskId}`, fullRequest);
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
            const activities = await apiGet<TaskActivityDto[]>(`/workspaces/${workspaceId}/tasks/${taskId}/activities`);
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
            const details = await apiGet<TaskDetailDto>(`/workspaces/${workspaceId}/tasks/${taskId}`);
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
            await apiPost(`/workspaces/${workspaceId}/tasks/${taskId}/subtasks`, { title, assigneeId });
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

            await apiPut(`/workspaces/${workspaceId}/tasks/subtasks/${subtaskId}/toggle`, {});
            await get().fetchTaskDetails(workspaceId, activeTaskId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    addComment: async (workspaceId, taskId, content) => {
        try {
            await apiPost(`/workspaces/${workspaceId}/tasks/${taskId}/comments`, { content });
            await get().fetchTaskDetails(workspaceId, taskId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    deleteTask: async (workspaceId, taskId) => {
        try {
            await apiDelete(`/workspaces/${workspaceId}/tasks/${taskId}`);
            // Close the detail panel and remove from all caches
            set(state => {
                const { [taskId]: _, ...restDetails } = state.taskDetails;

                // Remove task from all lists in the tasks cache
                const updatedTasks: Record<string, any[]> = {};
                for (const [listId, taskList] of Object.entries(state.tasks)) {
                    updatedTasks[listId] = taskList.filter(t => t.id !== taskId);
                }

                return {
                    activeTaskId: null,
                    isDetailPanelOpen: false,
                    taskDetails: restDetails,
                    tasks: updatedTasks
                };
            });
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    fetchTimeEntries: async (workspaceId, taskId) => {
        try {
            const entries = await apiGet<TimeEntryDto[]>(`/workspaces/${workspaceId}/tasks/${taskId}/time`);
            set(state => ({
                timeEntries: { ...state.timeEntries, [taskId]: entries }
            }));
        } catch (e) {
            console.error(e);
        }
    },

    startTimer: async (workspaceId, taskId, request) => {
        try {
            await apiPost(`/workspaces/${workspaceId}/tasks/${taskId}/time/start`, request || {});
            await get().fetchTimeEntries(workspaceId, taskId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    stopTimer: async (workspaceId, taskId) => {
        try {
            await apiPost(`/workspaces/${workspaceId}/tasks/${taskId}/time/stop`, {});
            await get().fetchTimeEntries(workspaceId, taskId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    logManualTime: async (workspaceId, taskId, request) => {
        try {
            await apiPost(`/workspaces/${workspaceId}/tasks/${taskId}/time/manual`, request);
            await get().fetchTimeEntries(workspaceId, taskId);
        } catch (e) {
            set({ error: (e as Error).message });
        }
    },

    deleteTimeEntry: async (workspaceId, entryId) => {
        try {
            await apiDelete(`/workspaces/${workspaceId}/time/${entryId}`);
            set(state => {
                const newEntries = { ...state.timeEntries };
                for (const tid in newEntries) {
                    newEntries[tid] = newEntries[tid].filter(e => e.id !== entryId);
                }
                return { timeEntries: newEntries };
            });
        } catch (e) {
            set({ error: (e as Error).message });
        }
    }
}));
