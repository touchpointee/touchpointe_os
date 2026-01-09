import { create } from 'zustand';
import { apiGet, apiPost } from '@/lib/api';

export interface Notification {
    id: string;
    type: number;
    title: string;
    message: string;
    data?: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationStore {
    notifications: Notification[];
    isLoading: boolean;
    error: string | null;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
    notifications: [],
    isLoading: false,
    error: null,

    fetchNotifications: async () => {
        set({ isLoading: true, error: null });
        try {
            const notifications = await apiGet<Notification[]>('/notifications');
            set({ notifications, isLoading: false });
        } catch (error: any) {
            set({ error: error.message || 'Failed to fetch notifications', isLoading: false });
        }
    },

    markAsRead: async (id: string) => {
        try {
            await apiPost(`/notifications/${id}/read`, {});
            set((state) => ({
                notifications: state.notifications.map((n) =>
                    n.id === id ? { ...n, isRead: true } : n
                ),
            }));
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    },
}));
