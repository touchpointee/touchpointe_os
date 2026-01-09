import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from '@/contexts/ToastContext';
import { useUserStore } from '@/stores/userStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { apiPost } from '@/lib/api';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoginPage() {
    const navigate = useNavigate();
    const { fetchUser } = useUserStore();
    const { fetchWorkspaces } = useWorkspaces();

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Login Request
            const response = await apiPost<{ token: string }>('/auth/login', {
                email: formData.email,
                password: formData.password
            });

            const { token } = response;
            localStorage.setItem('token', token);
            toast.success('Welcome back', 'Successfully signed in to your account.');

            // Fetch Data
            await fetchUser();
            const workspaces = await fetchWorkspaces();

            // Navigation Logic
            if (workspaces.length === 0) {
                // Should not happen ideally due to zero data policy but safe fallback
                navigate('/home');
            } else {
                // Workspace store handles active selection logic in fetchWorkspaces
                // We'll just go to home and let AuthGuard/App enforce the rest
                navigate('/home');
            }
        } catch (err: any) {
            setError(err.message || 'Invalid email or password');
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="bg-white p-8 rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] w-full transition-all duration-500 ease-out animate-in fade-in slide-in-from-bottom-4">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 text-left">Sign in to your workspace</h2>
                    <p className="text-slate-500 mt-2 text-sm text-left">
                        Enter your email and password to continue.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email Field */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 block text-left" htmlFor="email">
                            Email address
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            className={cn(
                                "flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-indigo-600 focus-visible:ring-1 focus-visible:ring-indigo-600 transition-all shadow-sm",
                                error && "border-red-500 focus-visible:ring-red-500/10"
                            )}
                            placeholder="name@company.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    {/* Password Field */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-700 block" htmlFor="password">
                                Password
                            </label>
                        </div>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                className={cn(
                                    "flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-indigo-600 focus-visible:ring-1 focus-visible:ring-indigo-600 transition-all shadow-sm pr-10",
                                    error && "border-red-500 focus-visible:ring-red-500/10"
                                )}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-md flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            {error}
                        </div>
                    )}

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="remember"
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600/20 transition-all cursor-pointer"
                                checked={formData.rememberMe}
                                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                            />
                            <label
                                htmlFor="remember"
                                className="text-xs font-medium text-slate-600 cursor-pointer select-none"
                            >
                                Remember me
                            </label>
                        </div>
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-11 inline-flex items-center justify-center rounded-md bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white shadow-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:opacity-70 disabled:pointer-events-none mt-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-left text-sm">
                    <span className="text-slate-500">Don't have an account? </span>
                    <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                        Create account
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
