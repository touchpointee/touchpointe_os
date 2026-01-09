import { createContext, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    duration: number;
}

// Global hook ref for usage outside components
let toastRef: ((toast: Omit<Toast, 'id'>) => void) | null = null;

export const toast = {
    success: (title: string, message: string) => addToast('success', title, message),
    error: (title: string, message: string) => addToast('error', title, message),
    warning: (title: string, message: string) => addToast('warning', title, message),
    info: (title: string, message: string) => addToast('info', title, message),
};

function addToast(type: ToastType, title: string, message: string) {
    if (toastRef) {
        toastRef({
            type,
            title,
            message,
            duration: type === 'error' ? 8000 : 5000
        });
    } else {
        console.warn('Toast called before provider mounted', { type, title, message });
    }
}

const ToastContext = createContext(toast);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        // Register global ref
        toastRef = (newToast) => {
            const id = Math.random().toString(36).substring(2, 9);
            setToasts((prev) => {
                const updated = [{ ...newToast, id }, ...prev];
                return updated.slice(0, 5); // Limit to 5
            });
        };
        return () => { toastRef = null; };
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {createPortal(
                <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none w-[380px] max-w-[90vw]">
                    {toasts.map((t) => (
                        <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleDismiss();
        }, toast.duration);
        return () => clearTimeout(timer);
    }, [toast.duration]);

    const handleDismiss = () => {
        setIsExiting(true);
        // Wait for animation
        setTimeout(onDismiss, 300);
    };

    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />
    };

    const styles = {
        success: "border-l-4 border-l-green-500",
        error: "border-l-4 border-l-red-500",
        warning: "border-l-4 border-l-amber-500",
        info: "border-l-4 border-l-blue-500"
    };

    return (
        <div
            className={cn(
                "pointer-events-auto flex w-full overflow-hidden rounded-md border bg-background shadow-lg transition-all duration-300 ease-in-out",
                styles[toast.type],
                isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100 animate-in slide-in-from-right-full"
            )}
            role="alert"
        >
            <div className="p-4 flex gap-4 w-full">
                <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
                <div className="flex-1 space-y-1">
                    {toast.title && <p className="font-semibold text-sm text-foreground">{toast.title}</p>}
                    <p className="text-sm text-muted-foreground leading-relaxed">{toast.message}</p>
                </div>
                <button
                    onClick={handleDismiss}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors self-start -mt-1 -mr-1 p-1 rounded-sm hover:bg-muted"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export function useToast() {
    return toast;
}
