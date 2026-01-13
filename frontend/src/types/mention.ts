export type MentionType = 'TASK' | 'COMMENT' | 'CHAT';

export interface UserMention {
    type: MentionType;
    workspaceId: string;
    createdAt: string;
    previewText: string;

    taskId?: string;
    channelId?: string;
    dmGroupId?: string;
    messageId?: string;

    actorName: string;
    actorAvatar?: string;

    // Additional Context
    taskTitle?: string;
    channelName?: string;
}
