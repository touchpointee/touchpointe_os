import { jwtDecode } from 'jwt-decode';

export interface User {
    id: string;
    email: string;
    name?: string;
    exp: number;
}

export function getCurrentUser(): User | null {
    // Return null if no user in storage (AuthGuard checks actual session)
    try {
        const storage = localStorage.getItem('user-storage');
        if (storage) {
            const parsed = JSON.parse(storage);
            return parsed.state?.user || null;
        }
    } catch (e) {
        return null;
    }
    return null;
}

import { useAiStore } from '@/stores/aiStore';
import { apiPost } from '@/lib/api';

export async function logout(): Promise<void> {
    try {
        await apiPost('/auth/logout', {});
    } catch (e) {
        console.error('Logout failed', e);
    }
    localStorage.removeItem('token'); // Cleanup legacy
    localStorage.removeItem('user-storage');
    localStorage.removeItem('workspace-storage');
    useAiStore.getState().clearState();
    window.location.href = '/login';
}

export function getToken(): string | null {
    return null; // Token is now HttpOnly cookie not accessible to JS
}
