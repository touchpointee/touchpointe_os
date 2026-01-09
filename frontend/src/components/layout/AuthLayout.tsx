import type { ReactNode } from 'react';
import { Sparkles, Check } from 'lucide-react';

interface AuthLayoutProps {
    children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full bg-white grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] font-sans text-slate-900 overflow-x-hidden">

            {/* LEFT SECTION - Content */}
            <div className="hidden lg:flex flex-col justify-center h-full px-16 xl:px-24">
                <div className="w-full max-w-[640px]">

                    {/* Clean Text Logo */}
                    <div className="flex items-center gap-2 mb-12">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        <span className="text-xl font-bold tracking-tight text-slate-900">Touchpointe</span>
                    </div>

                    {/* Professional Headline */}
                    <h1 className="text-5xl font-bold tracking-tight text-slate-900 leading-[1.15] mb-8">
                        Manage tasks, pipelines, <br />
                        and team chat in <br />
                        <span className="text-indigo-600">one unified platform.</span>
                    </h1>

                    <p className="text-xl text-slate-500 mb-12 leading-relaxed max-w-[580px]">
                        Stop switching between disconnected tools. Touchpointe brings your team, tasks, and customers together.
                    </p>

                    {/* Simple Feature List */}
                    <ul className="space-y-5">
                        <li className="flex items-center gap-3.5 text-lg text-slate-700 font-medium">
                            <Check className="w-5 h-5 text-indigo-600 shrink-0" />
                            <span>Advanced Project & Task Management</span>
                        </li>
                        <li className="flex items-center gap-3.5 text-lg text-slate-700 font-medium">
                            <Check className="w-5 h-5 text-indigo-600 shrink-0" />
                            <span>CRM & Sales Pipeline Tracking</span>
                        </li>
                        <li className="flex items-center gap-3.5 text-lg text-slate-700 font-medium">
                            <Check className="w-5 h-5 text-indigo-600 shrink-0" />
                            <span>Real-time Team Collaboration Channels</span>
                        </li>
                        <li className="flex items-center gap-3.5 text-lg text-slate-700 font-medium">
                            <Check className="w-5 h-5 text-indigo-600 shrink-0" />
                            <span>AI-Powered Insights & Automation</span>
                        </li>
                    </ul>

                    <div className="mt-20 text-sm text-slate-400 font-medium">
                        Trusted by 4,000+ forward-thinking teams.
                    </div>
                </div>
            </div>

            {/* RIGHT SECTION - Auth Form */}
            <div className="flex flex-col justify-center h-full px-6 lg:px-16 xl:px-24 bg-white relative">
                {/* Mobile Logo */}
                <div className="lg:hidden flex items-center gap-2 mb-8 justify-center absolute top-8 left-0 right-0">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <span className="text-xl font-bold text-slate-900">Touchpointe</span>
                </div>

                <div className="w-full flex flex-col items-center lg:items-end">
                    <div className="w-full max-w-[420px]">
                        {children}

                        {/* Footer */}
                        <div className="mt-8 text-center lg:text-left text-xs text-slate-400">
                            © {new Date().getFullYear()} Touchpointe Inc. All rights reserved.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
