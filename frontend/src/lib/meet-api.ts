import { apiRequest } from './api';

export interface Meeting {
    id: string;
    title: string;
    joinCode: string;
    status: 'Scheduled' | 'Live' | 'Ended';
    startTime: string;
    endTime?: string;
    activeParticipants?: { id: string, name: string, avatar?: string }[];
    participantCount: number;
}

export interface JoinResponse {
    token: string;
    meeting: {
        title: string;
        status: string;
    };
    participantId: string;
    sessionId: string;
}

export const meetApi = {
    getWorkspaceMeetings: (workspaceId: string) =>
        apiRequest<Meeting[]>(`/meet/workspace/${workspaceId}`, { method: 'GET' }),

    getMeetingDetails: (meetingId: string) =>
        apiRequest<Meeting & {
            participants: {
                id: string;
                name: string;
                avatar?: string;
                isGuest: boolean;
                totalDurationSeconds: number;
                firstJoinedAt: string;
                lastLeftAt?: string;
                sessions: { joinTime: string; leaveTime?: string; durationSeconds: number }[]
            }[]
        }>(`/meet/${meetingId}`, { method: 'GET' }),

    createMeeting: (workspaceId: string, title: string, startTime: string, endTime: string) =>
        apiRequest<{ id: string, joinCode: string }>('/meet/create', {
            method: 'POST',
            body: JSON.stringify({ workspaceId, title, startTime, endTime })
        }),

    joinMeeting: (joinCode: string, guestName?: string) =>
        apiRequest<JoinResponse>(`/meet/join/${joinCode}`, {
            method: 'POST',
            body: JSON.stringify({ guestName })
        }),

    leaveMeeting: (sessionId: string) =>
        apiRequest('/meet/leave', {
            method: 'POST',
            body: JSON.stringify({ sessionId })
        }),

    endMeeting: (meetingId: string) =>
        apiRequest(`/meet/${meetingId}/end`, {
            method: 'POST'
        })
};
