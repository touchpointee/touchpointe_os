import { toast } from '@/contexts/ToastContext';

const API_BASE = import.meta.env.VITE_API_URL;
if (!API_BASE) {
    console.error('VITE_API_URL is not defined');
}

function getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

async function handleResponse(res: Response) {
    if (res.status === 401) {
        // Global 401 handler
        localStorage.removeItem('token');
        localStorage.removeItem('user-storage');
        localStorage.removeItem('workspace-storage');
        window.location.href = '/login';
        throw new Error('Session expired');
    }
    if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = errorText || res.statusText;
        try {
            // Try to parse error as JSON if possible to get "error" field
            const errorJson = JSON.parse(errorText);
            // Support { error: "msg" } or { message: "msg" } or { title: "...", message: "..." }
            errorMessage = errorJson.message || errorJson.error || errorText;

            // Trigger Global Error Toast
            toast.error('Action Failed', errorMessage);

            throw new Error(errorMessage);
        } catch {
            // Trigger Global Error Toast for non-JSON errors
            toast.error('System Error', errorMessage);
            throw new Error(errorMessage);
        }
    }

    // Check for empty content
    const text = await res.text();
    return text ? JSON.parse(text) : {};
}

export async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: getHeaders()
    });
    return handleResponse(res);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}

export async function apiDelete(path: string): Promise<void> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user-storage');
        localStorage.removeItem('workspace-storage');
        window.location.href = '/login';
        throw new Error('Session expired');
    }
    if (!res.ok) throw new Error(await res.text());
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...getHeaders(),
            ...options.headers as Record<string, string>
        }
    });
    return handleResponse(res);
}
