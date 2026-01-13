
export interface MyTask {
    taskId: string;
    workspaceId: string;
    title: string;

    workspaceName: string;
    spaceName: string;
    listName: string;

    status: string;
    priority: string;
    dueDate?: string;
    lastActivityAt: string;

    assigneeName: string;
    assigneeAvatarUrl: string;

    subtaskCount: number;
    completedSubtasks: number;
    commentCount: number;

    isAssigned: boolean;
    isWatching: boolean;
    isMentioned: boolean;

    isOverdue: boolean;
    isDueToday: boolean;
    isDueThisWeek: boolean;
    isBlocked: boolean;

    urgencyScore: number;
}
