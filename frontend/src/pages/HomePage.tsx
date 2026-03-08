import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export function HomePage() {
    // Hide scrollbar on mount
    useEffect(() => {
        document.documentElement.classList.add('no-scrollbar');
        document.body.classList.add('no-scrollbar');
        return () => {
            document.documentElement.classList.remove('no-scrollbar');
            document.body.classList.remove('no-scrollbar');
        };
    }, []);

    // Scroll reveal animation
    useEffect(() => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, observerOptions);

        const revealElements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-scale');
        revealElements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    // Animated counter
    useEffect(() => {
        const animateCounter = (element: Element) => {
            const target = parseFloat(element.getAttribute('data-target') || '0');
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;
            const isDecimal = target % 1 !== 0;

            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    element.textContent = isDecimal ? current.toFixed(1) : Math.floor(current).toString();
                    requestAnimationFrame(updateCounter);
                } else {
                    element.textContent = isDecimal ? target.toFixed(1) : target.toString();
                }
            };

            updateCounter();
        };

        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    entry.target.classList.add('counted');
                    animateCounter(entry.target);
                }
            });
        }, { threshold: 0.5 });

        const counters = document.querySelectorAll('.counter');
        counters.forEach(counter => counterObserver.observe(counter));

        return () => counterObserver.disconnect();
    }, []);

    // Header scroll effect
    useEffect(() => {
        const header = document.getElementById('header');

        const handleScroll = () => {
            const currentScroll = window.pageYOffset;

            if (header) {
                if (currentScroll > 100) {
                    header.classList.add('shadow-lg');
                } else {
                    header.classList.remove('shadow-lg');
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="landing-light no-scrollbar bg-slate-50/80 text-slate-900 font-display overflow-x-hidden antialiased selection:bg-blue-600/20 selection:text-slate-900" style={{ minHeight: '100vh' }}>
            {/* Corporate background: soft gradient + grid */}
            <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-slate-100 via-slate-50/95 to-slate-100" />
            <div className="fixed inset-0 z-0 pointer-events-none bg-grid-pattern-light bg-grid opacity-25" />

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Corporate header - dark */}
                <header id="header" className="sticky top-0 z-50 w-full bg-slate-900 border-b border-slate-700/50 transition-all duration-300">
                    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3 scroll-reveal-left revealed">
                            <img src="/logo.jpeg" alt="Touchpointe Logo" className="size-9 rounded-lg object-cover ring-1 ring-slate-600" />
                            <span className="text-lg font-bold tracking-tight text-white">Touchpointe OS</span>
                        </div>
                        <nav className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Features</a>
                            <a href="#pricing" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Pricing</a>
                        </nav>
                        <div className="flex items-center gap-3 scroll-reveal-right revealed">
                            <Link to="/my-tasks" className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:inline">Log in</Link>
                            <Link to="/my-tasks" className="h-9 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all flex items-center gap-2">
                                Get started
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Hero Section - Corporate */}
                <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden bg-gradient-to-b from-slate-100/90 to-slate-50/80">
                    <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
                        {/* Eyebrow / Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-slate-200 text-slate-600 text-sm font-medium mb-8 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden />
                            Work OS for modern teams
                        </div>

                        {/* Headline */}
                        <h1 className="hero-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.08] max-w-4xl mx-auto mb-6">
                            One platform for
                            <span className="text-blue-600"> tasks, CRM & collaboration</span>
                        </h1>

                        {/* Subhead */}
                        <p className="hero-description text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Manage leads, automate workflows, and close deals in one place. Built for teams that value clarity and speed.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                            <Link
                                to="/my-tasks"
                                className="hero-button w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-base shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-200"
                            >
                                Get started free
                                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                            </Link>
                            <Link
                                to="/my-tasks"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base text-slate-700 bg-white/90 border border-slate-300 hover:border-slate-400 hover:bg-white shadow-sm transition-all duration-200"
                            >
                                Book a demo
                            </Link>
                        </div>

                        {/* Trust line */}
                        <p className="text-sm text-slate-500 mb-16">
                            No credit card required · Free 14-day trial · Cancel anytime
                        </p>

                        {/* Dashboard Mockup */}
                        <div className="relative w-full max-w-6xl mx-auto h-[600px] md:h-[750px] scroll-scale revealed">
                            {/* Desktop Browser Mockup */}
                            <div className="absolute left-1/2 top-10 -translate-x-1/2 w-[95%] md:w-[900px] h-[550px] bg-white border border-slate-200 rounded-xl shadow-2xl shadow-slate-900/10 z-20 overflow-hidden ring-1 ring-slate-200/60 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/15">
                                {/* Browser Header */}
                                <div className="h-10 border-b border-slate-200 bg-slate-50 flex items-center px-4 gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-300"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
                                    </div>
                                    <div className="mx-auto w-1/3 h-6 bg-slate-200/80 rounded flex items-center justify-center border border-slate-200">
                                        <span className="text-[10px] text-slate-500 font-mono tracking-tight">app.touchpointe.io</span>
                                    </div>
                                    <div className="w-10"></div>
                                </div>

                                {/* Dashboard Content */}
                                <div className="w-full h-[calc(100%-40px)] bg-slate-50 relative p-6">
                                    <div className="grid grid-cols-12 gap-6 h-full">
                                        {/* Sidebar */}
                                        <div className="col-span-3 space-y-4 border-r border-slate-200 pr-6 hidden md:block">
                                            <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
                                            <div className="space-y-2">
                                                <div className="h-3 w-full bg-slate-200/80 rounded"></div>
                                                <div className="h-3 w-4/5 bg-slate-200/80 rounded"></div>
                                                <div className="h-3 w-full bg-slate-200/80 rounded"></div>
                                                <div className="h-3 w-3/4 bg-slate-200/80 rounded"></div>
                                            </div>
                                            <div className="pt-4 h-4 w-1/2 bg-slate-300 rounded"></div>
                                            <div className="space-y-2">
                                                <div className="h-8 w-full bg-white rounded border border-slate-200 flex items-center px-3 shadow-sm">
                                                    <div className="w-2 h-2 rounded-full bg-slate-400 mr-2"></div>
                                                    <div className="h-2 w-1/2 bg-slate-300 rounded"></div>
                                                </div>
                                                <div className="h-8 w-full bg-slate-100 rounded"></div>
                                            </div>
                                        </div>

                                        {/* Main Content Area */}
                                        <div className="col-span-12 md:col-span-9 space-y-6 overflow-y-auto no-scrollbar">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-slate-800 font-bold text-xl mb-1">Work Operations Dashboard</h3>
                                                    <p className="text-slate-500 text-[10px] uppercase tracking-widest">Q3 Performance Analysis</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="size-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                                                        <span className="material-symbols-outlined text-slate-500 text-sm">notifications</span>
                                                    </div>
                                                    <div className="size-8 rounded-full bg-slate-400"></div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Stats Cards */}
                                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                                    <div className="text-slate-500 text-xs mb-1 uppercase tracking-wider">Total Task Velocity</div>
                                                    <div className="text-3xl font-bold text-slate-800 mb-2 counter" data-target="84200">0</div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-emerald-600 font-bold text-[10px]">+12.5%</span>
                                                        <span className="text-slate-500 text-[10px]">from last month</span>
                                                    </div>
                                                </div>

                                                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                                    <div className="text-slate-500 text-xs mb-1 uppercase tracking-wider">Closed Tasks</div>
                                                    <div className="text-3xl font-bold text-slate-800 mb-2 counter" data-target="94.2">0</div>
                                                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 animate-pulse" style={{ width: '94%' }}></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Chart Visual */}
                                            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm h-40 relative overflow-hidden">
                                                <div className="absolute inset-0 flex items-end gap-1 px-4 pt-8">
                                                    <div className="flex-1 bg-slate-300 h-[60%] rounded-t"></div>
                                                    <div className="flex-1 bg-slate-300 h-[40%] rounded-t"></div>
                                                    <div className="flex-1 bg-slate-300 h-[80%] rounded-t"></div>
                                                    <div className="flex-1 bg-slate-300 h-[55%] rounded-t"></div>
                                                    <div className="flex-1 bg-slate-300 h-[90%] rounded-t"></div>
                                                    <div className="flex-1 bg-slate-300 h-[70%] rounded-t"></div>
                                                    <div className="flex-1 bg-slate-400 h-[85%] rounded-t"></div>
                                                </div>
                                                <div className="relative z-10 flex justify-between">
                                                    <span className="text-slate-700 text-xs font-medium">Monthly Work Flow</span>
                                                    <div className="flex gap-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="size-2 rounded-full bg-slate-500"></div>
                                                            <span className="text-slate-500 text-[10px]">Inbound</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-slate-500">
                                                            <div className="size-2 rounded-full bg-slate-300"></div>
                                                            <span className="text-[10px]">Outbound</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Cards */}
                            <div className="absolute -top-12 -left-12 z-50 hidden xl:block animate-[float_6s_ease-in-out_infinite_1s] scroll-reveal-left stagger-1">
                                <div className="w-64 bg-white border border-slate-200 rounded-2xl p-5 shadow-lg hover-lift card-shine">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-slate-500 text-sm font-medium">Active Tasks</span>
                                        <span className="material-symbols-outlined text-slate-400 text-sm">trending_up</span>
                                    </div>
                                    <div className="flex items-end gap-3">
                                        <span className="text-4xl font-bold text-slate-900 counter" data-target="48">0</span>
                                        <span className="text-xs font-bold text-white bg-emerald-500 px-2 py-0.5 rounded-full mb-1.5">+24.1%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute top-80 -left-20 z-50 hidden xl:block animate-[float_7s_ease-in-out_infinite_0s] scroll-reveal-left stagger-2">
                                <div className="w-72 bg-white border border-slate-200 rounded-2xl p-5 shadow-lg hover-lift card-shine">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-slate-800 font-medium text-sm">Total Tasks Completed</span>
                                        <span className="material-symbols-outlined text-slate-600 text-sm">analytics</span>
                                    </div>
                                    <div className="flex items-end gap-2 h-16 w-full px-2">
                                        <div className="w-1/4 h-[40%] bg-slate-300 rounded-t-sm transition-all hover:h-[45%]"></div>
                                        <div className="w-1/4 h-[80%] bg-slate-400 rounded-t-sm transition-all hover:h-[85%]"></div>
                                        <div className="w-1/4 h-[55%] bg-slate-300 rounded-t-sm transition-all hover:h-[60%]"></div>
                                        <div className="w-1/4 h-[90%] bg-slate-500 rounded-t-sm transition-all hover:h-[95%]"></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-widest">
                                        <span>Week 1</span>
                                        <span>Week 2</span>
                                        <span>Week 3</span>
                                        <span>Week 4</span>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute top-0 -right-16 z-50 hidden xl:block animate-[float_5s_ease-in-out_infinite_2s] scroll-reveal-right stagger-1">
                                <div className="w-64 bg-white border border-slate-200 rounded-2xl p-5 shadow-lg hover-lift card-shine">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-slate-800 text-sm font-medium">Recent Activity</span>
                                        <span className="material-symbols-outlined text-slate-500 text-sm">more_vert</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-xs hover:translate-x-1 transition-transform text-slate-600">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                            Acme Corp - $12,400
                                        </div>
                                        <div className="flex items-center gap-3 text-xs hover:translate-x-1 transition-transform text-slate-600">
                                            <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></span>
                                            Global Tech - $8,900
                                        </div>
                                        <div className="flex items-center gap-3 text-xs hover:translate-x-1 transition-transform text-slate-600">
                                            <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></span>
                                            Starlight Inc - $5,200
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-20 -right-24 z-50 hidden xl:block animate-[float_8s_ease-in-out_infinite_1.5s] scroll-reveal-right stagger-2">
                                <div className="w-60 bg-white border border-slate-200 rounded-2xl p-5 shadow-lg hover-lift card-shine">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-slate-500 text-sm font-medium">Team Productivity Score</span>
                                        <span className="material-symbols-outlined text-slate-400 text-sm">equalizer</span>
                                    </div>
                                    <div className="flex items-end gap-3">
                                        <span className="text-4xl font-bold text-slate-900 counter" data-target="73">0</span>
                                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full mb-1.5">+10.7%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trusted Brands Section */}
                <section className="border-y border-slate-200/80 bg-white/60 backdrop-blur-sm">
                    <div className="max-w-7xl mx-auto px-6 py-10">
                        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400 mb-8">Trusted by teams everywhere</p>
                        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 text-slate-500 grayscale hover:grayscale-0 transition-all duration-500 scroll-reveal revealed">
                            <div className="flex items-center gap-2 text-xl font-bold hover:scale-110 transition-transform hover:text-slate-600">
                                <span className="material-symbols-outlined">rocket_launch</span> StarShip
                            </div>
                            <div className="flex items-center gap-2 text-xl font-bold hover:scale-110 transition-transform hover:text-slate-600">
                                <span className="material-symbols-outlined">all_inclusive</span> Loop
                            </div>
                            <div className="flex items-center gap-2 text-xl font-bold hover:scale-110 transition-transform hover:text-slate-600">
                                <span className="material-symbols-outlined">hive</span> HiveMind
                            </div>
                            <div className="flex items-center gap-2 text-xl font-bold hover:scale-110 transition-transform hover:text-slate-600">
                                <span className="material-symbols-outlined">bolt</span> Energy
                            </div>
                            <div className="flex items-center gap-2 text-xl font-bold hover:scale-110 transition-transform hover:text-slate-600">
                                <span className="material-symbols-outlined">deployed_code</span> CodeBase
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 relative bg-slate-50/70">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-20 scroll-reveal">
                            <p className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-3">Capabilities</p>
                            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900">Why choose Touchpointe</h2>
                            <p className="text-slate-600 max-w-xl mx-auto">The all-in-one work operating system for teams that value clarity, speed, and intelligent collaboration.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-x-8 gap-y-16">
                            {[
                                { icon: 'query_stats', title: 'Smart Task Management', desc: 'Plan, assign, and track tasks in real time with clear ownership and deadlines. Stay focused with priority-driven workflows that keep work moving forward.' },
                                { icon: 'auto_mode', title: 'Agentic AI Workspace', desc: "AI that doesn't just assist — it acts. Touchpointe's agentic AI plans tasks, prioritizes work, and takes autonomous actions so teams move faster with less manual effort." },
                                { icon: 'groups', title: 'Team Management Hub', desc: "Manage teams, roles, and responsibilities from one place. Get full visibility into who's doing what, progress updates, and workload balance across your organization." },
                                { icon: 'bolt', title: 'Real-Time Chat', desc: 'Instant, context-aware communication built right into your workspace. Chat 1-on-1 or in teams without switching tools or losing conversation history.' },
                                { icon: 'timeline', title: 'Meet & Collaborate', desc: 'Start secure video meetings directly from tasks or chats. Discuss, decide, and move work forward — all without leaving Touchpointe OS.' },
                                { icon: 'savings', title: 'Unified CRM View', desc: 'A single source of truth for customers, deals, and interactions. Track leads, conversations, and activities seamlessly across teams in one powerful CRM.' }
                            ].map((feature, idx) => (
                                <div key={idx} className={`scroll-reveal stagger-${idx + 1} hover-lift bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm shadow-slate-900/5`}>
                                    <div className="mb-4 text-slate-700">
                                        <span className="material-symbols-outlined text-3xl">{feature.icon}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Bento Grid Section */}
                <section className="py-24 relative bg-white/70">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-20 scroll-reveal">
                            <p className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-3">Revenue Operations</p>
                            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900">All your work tools in <br />one workspace</h2>
                            <p className="text-slate-600 max-w-xl mx-auto">Touchpointe OS brings tasks, teams, communication, meetings, AI, and CRM together — so work flows without switching tools.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                            {/* Grid Item 1 */}
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 relative overflow-hidden group shadow-sm shadow-slate-900/5 hover:border-slate-300 transition-all duration-300 scroll-reveal stagger-1 hover-lift card-shine">
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="flex justify-center py-6">
                                        <div className="w-24 h-24 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-blue-600">AI</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Agentic AI at the Core</h3>
                                        <p className="text-sm text-slate-600">Touchpointe's agentic AI prioritizes tasks and helps teams move work forward.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Grid Item 2 - accent */}
                            <div className="bg-white border-2 border-blue-200 rounded-3xl p-8 relative overflow-hidden group shadow-md hover:border-blue-300 transition-all duration-300 flex flex-col justify-center items-center text-center scroll-reveal stagger-2 hover-lift card-shine">
                                <div className="mb-6 relative">
                                    <div className="w-20 h-20 border-4 border-blue-200 rounded-full flex items-center justify-center bg-blue-50">
                                        <span className="material-symbols-outlined text-4xl text-blue-600">verified_user</span>
                                    </div>
                                </div>
                                <div className="text-5xl font-bold text-slate-900 mb-2 counter" data-target="100">0</div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">One OS. Total Control</h3>
                                <p className="text-xs text-slate-500">One OS for tasks, teams, chats, meetings, and customers.</p>
                            </div>

                            {/* Grid Item 3 */}
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden group shadow-sm shadow-slate-900/5 hover:border-slate-300 transition-all duration-300 scroll-reveal stagger-3 hover-lift card-shine">
                                <div className="relative h-full flex flex-col">
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 w-full hover:scale-105 transition-transform">
                                            <div className="flex items-start gap-3">
                                                <div className="bg-blue-100 p-2 rounded-lg">
                                                    <span className="material-symbols-outlined text-blue-600 text-sm">shield</span>
                                                </div>
                                                <div>
                                                    <div className="text-slate-800 text-sm font-bold">Real-Time Team Updates</div>
                                                    <div className="text-slate-500 text-[10px] mt-1">Real-time updates for tasks, mentions, meetings, and customer activity.</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <h3 className="text-lg font-bold text-slate-900 mb-1">Never miss what matters.</h3>
                                        <p className="text-xs text-slate-600">Get instant updates on task changes, mentions, meetings, and customer activity.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Grid Item 4 */}
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 relative overflow-hidden group shadow-sm shadow-slate-900/5 hover:border-slate-300 transition-all duration-300 md:col-span-1 scroll-reveal stagger-4 hover-lift card-shine">
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="flex justify-center items-center py-4">
                                        <div className="relative w-40 h-20 overflow-hidden">
                                            <div className="w-40 h-40 rounded-full border-[12px] border-slate-300 border-t-blue-200 border-l-blue-200 rotate-45 box-border animate-rotate"></div>
                                        </div>
                                        <div className="absolute text-center mt-6">
                                            <div className="text-xs text-slate-500 font-mono">km/h</div>
                                            <div className="text-4xl font-bold text-slate-900 counter" data-target="170">0</div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Move Faster as a Team</h3>
                                        <p className="text-sm text-slate-600">Collaborate, assign, and resolve tasks instantly with live updates across teams and projects.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Grid Item 5 */}
                            <div className="bg-white border border-slate-200 rounded-3xl p-0 relative overflow-hidden group shadow-sm hover:border-slate-300 transition-all duration-300 flex items-center justify-center scroll-reveal stagger-5 hover-lift">
                                <div className="w-[180px] bg-slate-100 border-2 border-slate-200 rounded-[24px] h-[90%] shadow-inner overflow-hidden relative transform translate-y-4 hover:scale-105 transition-transform">
                                    <div className="p-3">
                                        <div className="h-1 w-8 bg-slate-300 rounded mx-auto mb-4"></div>
                                        <div className="text-center mb-4">
                                            <div className="text-slate-800 font-bold text-xl counter" data-target="80.9">0</div>
                                            <div className="text-[8px] text-slate-500 uppercase">Score</div>
                                        </div>
                                        <div className="bg-slate-200 rounded p-2 mb-2">
                                            <div className="h-1 w-1/2 bg-slate-400 rounded mb-1 animate-pulse"></div>
                                            <div className="h-1 w-1/3 bg-slate-300 rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Grid Item 6 */}
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 relative overflow-hidden group shadow-sm shadow-slate-900/5 hover:border-slate-300 transition-all duration-300 scroll-reveal stagger-6 hover-lift card-shine">
                                <div className="relative h-full flex flex-col justify-end">
                                    <div className="flex-1 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-6xl text-blue-500">lock</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Enterprise-Ready Platform</h3>
                                        <p className="text-sm text-slate-600">Built for growing teams with role-based access, structured workflows, and secure collaboration.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Wide Card */}
                        <div className="mt-6 bg-white border border-slate-200/80 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm shadow-slate-900/5 hover:border-slate-300 transition-all duration-300 scroll-reveal hover-lift card-shine">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                                    <span className="material-symbols-outlined text-4xl">headset_mic</span>
                                </div>
                                <div>
                                    <div className="text-4xl font-bold text-slate-900 mb-1">REAL-TIME COLLABORATION</div>
                                    <div className="text-sm text-slate-600 font-bold uppercase tracking-wider">Always Connected. Always In Sync.</div>
                                </div>
                            </div>
                            <p className="text-slate-600 max-w-md text-sm md:text-right">Live updates across tasks, chats, meetings, and customers. <br />No more silos.</p>
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section id="pricing" className="py-24 border-t border-slate-200/80 bg-slate-50/70">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16 scroll-reveal">
                            <p className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-3">Pricing</p>
                            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900">Plans for every team</h2>
                            <p className="text-slate-600 max-w-2xl mx-auto">Wherever your challenges, we offer plans that are right for you.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Basic Plan */}
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 flex flex-col shadow-sm shadow-slate-900/5 scroll-reveal stagger-1 hover-lift card-shine">
                                <h3 className="text-slate-900 font-bold mb-2">Basic plan</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl font-bold text-slate-900">$10</span>
                                    <span className="text-slate-500 text-sm">/per month</span>
                                </div>
                                <p className="text-slate-600 text-sm mb-8">Starter protection for your data.</p>
                                <button className="w-full py-3 rounded-full bg-slate-100 text-slate-800 font-bold text-sm mb-8 hover:bg-slate-200 transition-all hover:scale-105 border border-slate-200">Get started</button>
                                <div className="space-y-4">
                                    <p className="text-xs text-slate-600 font-bold">Basic plan includes</p>
                                    {['Real-time data protection', 'Threat alerts', 'Monthly security report'].map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-3 text-sm text-slate-600 hover:translate-x-1 transition-transform">
                                            <span className="material-symbols-outlined text-slate-500 text-lg">check_circle</span>
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Advanced Plan - highlighted */}
                            <div className="bg-white border-2 border-blue-500 rounded-2xl p-8 flex flex-col relative shadow-lg shadow-slate-900/10 transform md:-translate-y-4 scroll-reveal stagger-2 hover:shadow-xl hover:-translate-y-6 transition-all duration-300 card-shine ring-2 ring-blue-500/20">
                                <div className="absolute top-0 left-0 w-full h-1 bg-blue-600 rounded-t-3xl"></div>
                                <h3 className="text-slate-900 font-bold mb-2">Advanced plan</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-5xl font-bold text-slate-900">$20</span>
                                    <span className="text-blue-600 text-sm">/per month</span>
                                </div>
                                <p className="text-slate-600 text-sm mb-8">Expanded opportunities for confidence.</p>
                                <button className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm mb-8 shadow-md transition-all hover:scale-105">Get started</button>
                                <div className="space-y-4">
                                    <p className="text-xs text-blue-600 font-bold">Advanced plan includes</p>
                                    {['All features of Basic plan', 'Advanced AI algorithms', 'Personalized recommendations', 'Weekly reports'].map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-3 text-sm text-slate-700 hover:translate-x-1 transition-transform">
                                            <span className="material-symbols-outlined text-blue-500 text-lg">check_circle</span>
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Premium Plan */}
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-8 flex flex-col shadow-sm shadow-slate-900/5 scroll-reveal stagger-3 hover-lift card-shine">
                                <h3 className="text-slate-900 font-bold mb-2">Premium plan</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl font-bold text-slate-900">$40</span>
                                    <span className="text-slate-500 text-sm">/per month</span>
                                </div>
                                <p className="text-slate-600 text-sm mb-8">Maximum protection and support.</p>
                                <button className="w-full py-3 rounded-full bg-slate-100 text-slate-800 font-bold text-sm mb-8 hover:bg-slate-200 transition-all hover:scale-105 border border-slate-200">Get started</button>
                                <div className="space-y-4">
                                    <p className="text-xs text-slate-600 font-bold">Premium plan includes</p>
                                    {['All features of Advanced plan', '24/7 expert support', 'Customized protection settings', 'Unlimited analytical reports'].map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-3 text-sm text-slate-600 hover:translate-x-1 transition-transform">
                                            <span className="material-symbols-outlined text-slate-500 text-lg">check_circle</span>
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="max-w-[1200px] mx-auto px-6 pt-20 pb-20">
                    <div style={{ width: '100%' }}>
                        <div className="bg-slate-900 rounded-2xl scroll-reveal stagger-1 card-shine p-12 lg:p-24 text-center text-white relative overflow-hidden border border-slate-700/80 shadow-xl shadow-slate-900/20">
                            {/* Content */}
                            <div className="relative z-10">
                                <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
                                    Ready to unify your workflow?
                                </h2>

                                <p className="text-slate-300 mb-12 max-w-2xl mx-auto">
                                    Join 10,000+ teams who have replaced 5+ apps with Touchpointe.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link to="/my-tasks" className="px-8 py-4 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 shadow-lg transition-all hover:scale-105 inline-block">
                                        Get Started for Free
                                    </Link>

                                    <Link to="/my-tasks" className="px-8 py-4 bg-transparent rounded-lg hover:bg-white/10 border border-slate-500 text-white text-sm font-semibold transition-all flex items-center gap-2 group hover:border-slate-400 hover:scale-105 inline-block">
                                        Book a Demo
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer - corporate dark */}
                <footer className="bg-slate-900 border-t border-slate-700/50 pt-16 pb-8 scroll-reveal">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
                            <div className="col-span-2 md:col-span-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <img src="/logo.jpeg" alt="Touchpointe Logo" className="size-8 rounded object-cover ring-1 ring-slate-600" />
                                    <span className="text-lg font-bold text-white">Touchpointe OS</span>
                                </div>
                                <p className="text-slate-400 text-sm">One platform for tasks, CRM & collaboration.</p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <h4 className="font-bold text-white text-sm mb-1">Product</h4>
                                {['Features', 'Integrations', 'Pricing'].map((item, idx) => (
                                    <a key={idx} className="text-sm text-slate-400 hover:text-white transition-colors" href="#">{item}</a>
                                ))}
                            </div>
                            <div className="flex flex-col gap-3">
                                <h4 className="font-bold text-white text-sm mb-1">Company</h4>
                                {['About', 'Careers', 'Contact'].map((item, idx) => (
                                    <a key={idx} className="text-sm text-slate-400 hover:text-white transition-colors" href="#">{item}</a>
                                ))}
                            </div>
                            <div className="flex flex-col gap-3">
                                <h4 className="font-bold text-white text-sm mb-1">Resources</h4>
                                {['Documentation', 'Support', 'Status'].map((item, idx) => (
                                    <a key={idx} className="text-sm text-slate-400 hover:text-white transition-colors" href="#">{item}</a>
                                ))}
                            </div>
                        </div>
                        <div className="border-t border-slate-700/80 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                            <p className="text-sm text-slate-500">© 2025 Touchpointe. All rights reserved.</p>
                            <div className="flex gap-6">
                                {['public', 'alternate_email', 'share'].map((icon, idx) => (
                                    <a key={idx} className="text-slate-500 hover:text-slate-300 transition-colors" href="#">
                                        <span className="material-symbols-outlined text-[20px]">{icon}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
