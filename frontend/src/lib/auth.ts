import { jwtDecode } from 'jwt-decode';

export interface User {
    id: string;
    email: string;
    name?: string;
    exp: number;
}

export function getCurrentUser(): User | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const decoded = jwtDecode<any>(token);
        return {
            id: decoded.sub || decoded.nameid,
            email: decoded.email,
            name: decoded.unique_name || decoded.name,
            exp: decoded.exp
        };
    } catch (e) {
        return null;
    }
}

import { useAiStore } from '@/stores/aiStore';

export function logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('workspace-storage');
    useAiStore.getState().clearState();
    window.location.href = '/login';
}

export function getToken(): string | null {
    return localStorage.getItem('token');
}
