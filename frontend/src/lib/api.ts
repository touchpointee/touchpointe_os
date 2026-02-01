import { toast } from '@/contexts/ToastContext';

const API_BASE = import.meta.env.VITE_API_URL;
if (!API_BASE) {
    console.error('VITE_API_URL is not defined');
}

function getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    return headers;
}

export class ApiError extends Error {
    public status: number;
    public validationErrors?: Record<string, string[]>;

    constructor(message: string, status: number, validationErrors?: Record<string, string[]>) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.validationErrors = validationErrors;
    }
}

async function handleResponse(res: Response) {
    if (res.status === 401) {
        // Global 401 handler
        localStorage.removeItem('token');
        localStorage.removeItem('user-storage');
        localStorage.removeItem('workspace-storage');
        window.location.href = '/login';
        throw new ApiError('Session expired', 401);
    }
    if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = errorText || res.statusText;
        let validationErrors: Record<string, string[]> | undefined;

        try {
            // Try to parse error as JSON if possible to get "error" field
            const errorJson = JSON.parse(errorText);

            // Handle structured validation errors (ASP.NET Core ProblemDetails)
            if (errorJson.errors && typeof errorJson.errors === 'object') {
                validationErrors = errorJson.errors;
                const messages = Object.values(errorJson.errors).flat();
                if (messages.length > 0) {
                    errorMessage = messages.join('\n');
                }
            }

            // Fallback to standard error fields if no validation errors found
            if (!errorMessage || errorMessage === errorText || errorMessage === res.statusText) {
                errorMessage = errorJson.Error || errorJson.error || errorJson.Message || errorJson.message || errorJson.title || errorText;
            }
        } catch {
            // Keep errorMessage as raw text if JSON parsing fails
        }

        // Trigger Global Error Toast
        toast.error('Action Failed', errorMessage as string);
        throw new ApiError(errorMessage as string, res.status, validationErrors);
    }

    // Check for empty content
    const text = await res.text();
    return text ? JSON.parse(text) : {};
}

export async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: getHeaders(),
        credentials: 'include',
    });
    return handleResponse(res);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}

export async function apiPostMultipart<T>(path: string, formData: FormData): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: {
            // 'Content-Type': 'multipart/form-data' // Do NOT set this header, browser sets it with boundary
        },
        credentials: 'include',
        body: formData,
    });
    return handleResponse(res);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PATCH',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}

export async function apiDelete(path: string): Promise<void> {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include',
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
        },
        credentials: 'include',
    });
    return handleResponse(res);
}
