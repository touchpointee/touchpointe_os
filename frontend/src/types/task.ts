export type TaskStatus = string;
export type TaskPriority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type Task = TaskDto;

export interface TagDto {
    id: string;
    name: string;
    color: string;
}

export interface TaskDto {
    id: string;
    workspaceId: string;
    listId: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    assigneeId: string | null;
    assigneeName: string | null;
    assigneeAvatarUrl: string | null;
    createdById: string;
    createdByName: string;
    dueDate: string | null;
    orderIndex: number;
    createdAt: string;
    updatedAt: string;
    subDescription: string | null;
    customStatus: string | null;
    tags: TagDto[];
    estimate: number | null;
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

export interface TaskAttachmentDto {
    id: string;
    taskId: string;
    userId: string;
    userName: string;
    fileName: string;
    contentType: string;
    size: number;
    url: string;
    createdAt: string;
}

export interface TaskDetailDto {
    task: TaskDto;
    subtasks: SubtaskDto[];
    comments: TaskCommentDto[];
    activities: TaskActivityDto[];
    attachments: TaskAttachmentDto[];
}

export interface CreateTaskRequest {
    listId: string;
    title: string;
    description?: string;
    subDescription?: string;
    customStatus?: string;
    priority?: string;
    assigneeId?: string;
    dueDate?: string;
    tagIds?: string[];
    estimate?: number;
}

export interface UpdateTaskRequest {
    title?: string;
    description?: string;
    subDescription?: string;
    status?: string;
    customStatus?: string;
    priority?: TaskPriority | string;
    assigneeId?: string | null;
    dueDate?: string | null;
    orderIndex?: number;
    tagIds?: string[];
    estimate?: number;
}
