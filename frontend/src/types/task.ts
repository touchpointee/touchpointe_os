export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type Task = TaskDto;

export interface TaskDto {
    id: string;
    workspaceId: string;
    listId: string;
    title: string;
    description?: string;
    subDescription?: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId: string;
    assigneeName: string;
    assigneeAvatar?: string;
    createdById: string;
    createdByName: string;
    dueDate?: string;
    orderIndex: number;
    createdAt: string;
    updatedAt: string;
}

export interface TaskActivityDto {
    id: string;
    activityType: string;
    oldValue?: string;
    newValue?: string;
    changedById: string;
    changedByName: string;
    timestamp: string;
}

export interface SubtaskDto {
    id: string;
    title: string;
    isCompleted: boolean;
    assigneeId: string;
    assigneeName: string;
    orderIndex: number;
}

export interface TaskCommentDto {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    content: string;
    createdAt: string;
}

export interface TaskDetailDto {
    task: TaskDto;
    subtasks: SubtaskDto[];
    comments: TaskCommentDto[];
    activities: TaskActivityDto[];
}

export interface CreateTaskRequest {
    listId: string;
    title: string;
    description?: string;
    subDescription?: string;
    priority: TaskPriority;
    assigneeId?: string;
    dueDate?: string;
}

export interface UpdateTaskRequest {
    title?: string;
    description?: string;
    subDescription?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    dueDate?: string | null;
    orderIndex?: number;
}
