import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from '@/contexts/ToastContext';
import { useUserStore } from '@/stores/userStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { apiPost } from '@/lib/api';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility is available or I should write without it if not, but previous file used it so it's safe.

export function RegisterPage() {
    const navigate = useNavigate();
    const { fetchUser } = useUserStore();
    const { fetchWorkspaces } = useWorkspaces();

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false); // Ensure loading state is reset if validation fails
            return;
        }

        try {
            // Register Request
            // Using PascalCase keys to match backend DTO validation errors
            const response = await apiPost<{ token: string }>('/auth/register', {
                FullName: formData.fullName,
                Username: formData.username,
                Email: formData.email,
                Password: formData.password
            });

            const { token } = response;
            localStorage.setItem('token', token);
            toast.success('Account Created', 'Welcome to Touchpointe!');

            // Fetch Data
            await fetchUser();
            const workspaces = await fetchWorkspaces();

            // Navigation
            if (workspaces.length === 0) {
                // The backend should technically create a default workspace or we should redirect to an onboarding flow
                // But for now, we assume standard flow
                navigate('/home');
            } else {
                navigate('/home');
            }

        } catch (err: any) {
            setError(err.message || 'Failed to create account');
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="bg-white p-8 rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] w-full transition-all duration-500 ease-out animate-in fade-in slide-in-from-bottom-4">
                <div className="mb-8">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900 text-left">Create your account</h2>
                    <p className="text-slate-500 mt-2 text-sm text-left">
                        Get started with your free workspace.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 block text-left" htmlFor="fullName">
                            Full Name
                        </label>
                        <input
                            id="fullName"
                            type="text"
                            required
                            className={cn(
                                "flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-indigo-600 focus-visible:ring-1 focus-visible:ring-indigo-600 transition-all shadow-sm",
                                error && "border-red-500 focus-visible:ring-red-500/10"
                            )}
                            placeholder="John Doe"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        />
                    </div>

                    {/* Username */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 block text-left" htmlFor="username">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            required
                            className={cn(
                                "flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-indigo-600 focus-visible:ring-1 focus-visible:ring-indigo-600 transition-all shadow-sm",
                                error && "border-red-500 focus-visible:ring-red-500/10"
                            )}
                            placeholder="johndoe"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 block text-left" htmlFor="email">
                            Work Email
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

                    {/* Password */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 block text-left" htmlFor="password">
                            Password
                        </label>
                        <div className="relative group">
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

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700 block text-left" htmlFor="confirmPassword">
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            required
                            className={cn(
                                "flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-indigo-600 focus-visible:ring-1 focus-visible:ring-indigo-600 transition-all shadow-sm",
                                error && "border-red-500 focus-visible:ring-red-500/10"
                            )}
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-md flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-11 inline-flex items-center justify-center rounded-md bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white shadow-none transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:opacity-70 disabled:pointer-events-none mt-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-left text-sm">
                    <span className="text-slate-500">Already have an account? </span>
                    <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                        Sign in
                    </Link>
                </div>
            </div>
        </AuthLayout>
    );
}
