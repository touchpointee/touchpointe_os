import { create } from 'zustand';
import { apiGet } from '@/lib/api';
import type { Task } from '@/types/task';

// Redefine types here or import if unified
export interface DashboardStats {
    openTasks: number;
    dueToday: number;
    overdue: number;
    activeDeals: number;
    completedTasksToday: number;
}

export interface DashboardActivity {
    id: string;
    type: 'Task' | 'Deal' | 'Comment';
    description: string;
    createdAt: string;
    userInitial: string;
    linkId: string;
}

interface DashboardState {
    stats: DashboardStats | null;
    myTasks: Task[]; // Using Task type from types/task
    recentActivity: DashboardActivity[];
    isLoading: boolean;
    error: string | null;

    fetchDashboardData: (workspaceId: string) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>()((set) => ({
    stats: null,
    myTasks: [],
    recentActivity: [],
    isLoading: false,
    error: null,

    fetchDashboardData: async (workspaceId: string) => {
        set({ isLoading: true, error: null });
        try {
            const data = await apiGet<any>(`/workspaces/${workspaceId}/dashboard`);
            // Map API response to state
            set({
                stats: data.stats,
                myTasks: data.myTasks, // Ensure backend DTO matches frontend Task type closely enough or map it
                recentActivity: data.recentActivity,
                isLoading: false
            });
        } catch (error: any) {
            console.error("Dashboard fetch failed", error);
            set({ error: error.message || 'Failed to load dashboard', isLoading: false });
        }
    }
}));
