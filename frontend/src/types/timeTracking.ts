export interface TimeEntryDto {
    id: string;
    taskId: string;
    userId: string;
    userName: string;
    userAvatarUrl?: string;
    startTime?: string; // ISO date
    endTime?: string; // ISO date
    durationSeconds: number;
    description?: string;
    isManual: boolean;
    createdAt: string;
}

export interface StartTimerRequest {
    description?: string;
}

export interface ManualTimeRequest {
    durationSeconds: number;
    description?: string;
    date?: string; // ISO date
}

export interface UpdateTimeEntryRequest {
    durationSeconds?: number;
    description?: string;
    startTime?: string;
    endTime?: string;
}
