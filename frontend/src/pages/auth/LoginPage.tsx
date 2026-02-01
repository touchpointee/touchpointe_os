import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from '@/contexts/ToastContext';
import { useUserStore } from '@/stores/userStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { apiPost } from '@/lib/api';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoginPage() {
    const navigate = useNavigate();
    const { fetchUser } = useUserStore();
    const { fetchWorkspaces, setActiveWorkspace } = useWorkspaces();

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });

    const handleGoogleSuccess = async (tokenResponse: any) => {
        try {
            setIsLoading(true);
            const response = await apiPost<{ token: string; lastActiveWorkspaceId?: string }>('/auth/google', {
                token: tokenResponse.access_token
            });
            handleLoginSuccess(response);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Google sign in failed');
            setIsLoading(false);
        }
    };

    const loginWithGoogle = useGoogleLogin({
        onSuccess: handleGoogleSuccess,
        onError: () => {
            setError('Google sign in failed');
            setIsLoading(false);
        }
    });

    const handleLoginSuccess = async (response: { token: string; lastActiveWorkspaceId?: string }) => {
        const { lastActiveWorkspaceId } = response;
        toast.success('Welcome back', 'Successfully signed in to your account.');
        await fetchUser();
        const workspaces = await fetchWorkspaces();

        if (lastActiveWorkspaceId) {
            const targetWorkspace = workspaces.find(w => w.id.toLowerCase() === lastActiveWorkspaceId.toLowerCase());
            if (targetWorkspace) {
                setActiveWorkspace(targetWorkspace.id);
            }
        }

        if (workspaces.length > 0) {
            navigate('/my-tasks');
        } else {
            navigate('/create-workspace');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Login Request
            const response = await apiPost<{ token: string; lastActiveWorkspaceId?: string }>('/auth/login', {
                email: formData.email,
                password: formData.password
            });

            await handleLoginSuccess(response);
        } catch (err: any) {
            setError(err.message || 'Invalid email or password');
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="w-full max-w-md mx-auto">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <Sparkles className="w-6 h-6 text-blue-400" />
                    <span className="text-xl font-bold text-white">Touchpointe</span>
                </div>

                {/* Login Card */}
                <div className="bg-[#1a1a1a] border border-slate-700/50 rounded-2xl p-8 shadow-xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
                        <p className="text-slate-400 text-sm">Sign in to your workspace</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 block" htmlFor="email">
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                className={cn(
                                    "w-full h-12 rounded-lg border-2 bg-transparent px-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors",
                                    error ? "border-red-500" : "border-blue-500/30"
                                )}
                                placeholder=""
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 block" htmlFor="password">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className={cn(
                                        "w-full h-12 rounded-lg border-2 bg-transparent px-4 pr-12 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors",
                                        error ? "border-red-500" : "border-blue-500/30"
                                    )}
                                    placeholder=""
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Remember Me */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="remember"
                                className="h-4 w-4 rounded border-slate-600 bg-transparent text-blue-500 focus:ring-blue-500/20 transition-all cursor-pointer accent-blue-500"
                                checked={formData.rememberMe}
                                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                            />
                            <label
                                htmlFor="remember"
                                className="ml-2 text-sm text-slate-300 cursor-pointer select-none"
                            >
                                Remember me
                            </label>
                        </div>

                        {/* Sign In Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="inline-block mr-2 h-5 w-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>

                        {/* OAuth Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => loginWithGoogle()}
                                className="h-12 bg-transparent border border-slate-600 hover:border-slate-500 text-slate-300 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z" />
                                    <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z" />
                                    <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z" />
                                    <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z" />
                                </svg>
                                <span className="text-sm font-medium">Sign in with Google</span>
                            </button>
                            <button
                                type="button"
                                className="h-12 bg-transparent border border-slate-600 hover:border-slate-500 text-slate-300 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 23 23">
                                    <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                                    <path fill="#f35325" d="M1 1h10v10H1z" />
                                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                                </svg>
                                <span className="text-sm font-medium">Sign in with Microsoft</span>
                            </button>
                        </div>

                        {/* Create Account Link */}
                        <div className="text-center text-sm pt-2">
                            <span className="text-slate-400">Don't have an account? </span>
                            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                Create account
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Footer */}

            </div>
        </AuthLayout>
    );
}
