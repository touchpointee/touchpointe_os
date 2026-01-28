import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export function HomePage() {
    const particlesRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);

    // Preload and initialize galaxy animations
    useEffect(() => {
        // Preload particles
        const particlesContainer = particlesRef.current;
        if (particlesContainer) {
            const fragment = document.createDocumentFragment();
            const particleCount = 30;

            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';

                const left = Math.random() * 100;
                const top = Math.random() * 100; // Random vertical position
                const animationDuration = 15 + Math.random() * 20;
                const animationDelay = -Math.random() * 15; // Negative delay for immediate start at different positions
                const drift = (Math.random() - 0.5) * 200;
                const size = 2 + Math.random() * 2;

                particle.style.left = `${left}%`;
                particle.style.top = `${top}%`; // Start at random height
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                particle.style.setProperty('--drift', `${drift}px`);
                particle.style.animationDuration = `${animationDuration}s`;
                particle.style.animationDelay = `${animationDelay}s`; // Negative delay

                fragment.appendChild(particle);
            }

            particlesContainer.appendChild(fragment);
        }

        // Mark as ready after a short delay to ensure CSS is loaded
        const timer = requestAnimationFrame(() => {
            setIsReady(true);
        });

        return () => cancelAnimationFrame(timer);
    }, []);

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
        <div className="no-scrollbar bg-background-dark text-white font-display overflow-x-hidden antialiased selection:bg-primary/30 selection:text-white" style={{ minHeight: '100vh' }}>
            {/* Galaxy Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="stars"></div>
                <div className="nebula nebula-1"></div>
                <div className="nebula nebula-2"></div>
                <div className="nebula nebula-3"></div>
                <div className="particles" ref={particlesRef}></div>
                <div className="comet"></div>
                <div className="comet-2"></div>
                <div className="comet-3"></div>
                <div className="comet-4"></div>

                {/* Original background */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[800px] bg-blue-900/20 rounded-full blur-[120px] opacity-40 mix-blend-screen animate-pulse-slow"></div>
                <div className="absolute inset-0 bg-grid-pattern bg-grid [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-20"></div>
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* Header */}
                <header id="header" className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background-dark/80 border-b border-white/5 transition-all duration-300">
                    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                        <div className="flex items-center gap-3 scroll-reveal-left revealed">
                            <div className="size-8 flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-700 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.4)] animate-glow">
                                <span className="material-symbols-outlined text-white text-[20px]">hub</span>
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white">Touchpointe OS</span>
                        </div>
                        {/* <nav className="hidden md:flex items-center gap-8 scroll-reveal revealed">
                            <a className="text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors relative group" href="#">
                                Product
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all group-hover:w-full"></span>
                            </a>
                            <a className="text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors relative group" href="#">
                                Pricing
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all group-hover:w-full"></span>
                            </a>
                            <a className="text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors relative group" href="#">
                                Company
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all group-hover:w-full"></span>
                            </a>
                            <a className="text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors relative group" href="#">
                                Blog
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all group-hover:w-full"></span>
                            </a>
                        </nav> */}
                        <div className="flex items-center gap-4 scroll-reveal-right revealed">
                            <Link to="/my-tasks" className="h-10 px-6 rounded-full bg-white/5 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-semibold backdrop-blur-sm transition-all flex items-center gap-2 group hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:text-white hover:border-blue-500 hover:scale-105">
                                <span>Log In</span>
                                <span className="material-symbols-outlined text-xs group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative pt-20 pb-32 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                        <h1 className="hero-title text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-blue-200 drop-shadow-sm max-w-4xl mx-auto">
                            Stop the chaos.<br />
                            <span className="hero-subtitle bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 text-glow gradient-animate">
                                Start the flow.
                            </span>
                        </h1>
                        <p className="hero-description text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
                            Manage leads, automate workflows, and close deals faster with the world's most intelligent CRM platform.
                        </p>
                        <div className="flex justify-center mb-20">
                            <Link to="/my-tasks" className="hero-button bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-300 hover:to-blue-400 text-black px-8 py-4 rounded-full font-bold text-lg shadow-[0_0_30px_rgba(96,165,250,0.6)] hover:shadow-[0_0_50px_rgba(96,165,250,0.8)] transition-all transform hover:-translate-y-1 hover:scale-105 btn-shimmer">
                                Launch app
                            </Link>
                        </div>

                        {/* Dashboard Mockup */}
                        <div className="relative w-full max-w-6xl mx-auto h-[600px] md:h-[750px] scroll-scale revealed">
                            {/* Desktop Browser Mockup */}
                            <div className="absolute left-1/2 top-10 -translate-x-1/2 w-[95%] md:w-[900px] h-[550px] bg-background-dark border border-slate-700/50 rounded-2xl shadow-2xl z-20 overflow-hidden ring-1 ring-white/10 transition-all duration-300 hover:scale-105 hover:shadow-[0_25px_50px_-12px_rgba(59,130,246,0.5)]">
                                {/* Browser Header */}
                                <div className="h-10 border-b border-white/5 bg-slate-800/30 backdrop-blur-md flex items-center px-4 gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/40"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/40"></div>
                                    </div>
                                    <div className="mx-auto w-1/3 h-6 bg-black/20 rounded flex items-center justify-center border border-white/5">
                                        <span className="text-[10px] text-slate-500 font-mono tracking-tight">app.ABC-crm.io</span>
                                    </div>
                                    <div className="w-10"></div>
                                </div>

                                {/* Dashboard Content */}
                                <div className="w-full h-[calc(100%-40px)] bg-slate-900/40 relative p-6">
                                    <div className="grid grid-cols-12 gap-6 h-full">
                                        {/* Sidebar */}
                                        <div className="col-span-3 space-y-4 border-r border-white/5 pr-6 hidden md:block">
                                            <div className="h-4 w-2/3 bg-blue-500/20 rounded"></div>
                                            <div className="space-y-2">
                                                <div className="h-3 w-full bg-white/5 rounded"></div>
                                                <div className="h-3 w-4/5 bg-white/5 rounded"></div>
                                                <div className="h-3 w-full bg-white/5 rounded"></div>
                                                <div className="h-3 w-3/4 bg-white/5 rounded"></div>
                                            </div>
                                            <div className="pt-4 h-4 w-1/2 bg-white/10 rounded"></div>
                                            <div className="space-y-2">
                                                <div className="h-8 w-full bg-blue-500/10 rounded border border-blue-500/20 flex items-center px-3">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                                    <div className="h-2 w-1/2 bg-blue-500/50 rounded"></div>
                                                </div>
                                                <div className="h-8 w-full bg-black/20 rounded"></div>
                                            </div>
                                        </div>

                                        {/* Main Content Area */}
                                        <div className="col-span-12 md:col-span-9 space-y-6 overflow-y-auto no-scrollbar">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-white font-bold text-xl mb-1">Work Operations Dashboard</h3>
                                                    <p className="text-slate-500 text-[10px] uppercase tracking-widest">Q3 Performance Analysis</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-slate-400 text-sm">notifications</span>
                                                    </div>
                                                    <div className="size-8 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Stats Cards */}
                                                <div className="bg-gradient-to-br from-blue-500/10 to-transparent p-5 rounded-xl border border-blue-500/20">
                                                    <div className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Total Task Velocity</div>
                                                    <div className="text-3xl font-bold text-white mb-2 counter" data-target="84200">0</div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-blue-400 font-bold text-[10px]">+12.5%</span>
                                                        <span className="text-slate-500 text-[10px]">from last month</span>
                                                    </div>
                                                </div>

                                                <div className="bg-white/5 p-5 rounded-xl border border-white/5">
                                                    <div className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Closed Tasks</div>
                                                    <div className="text-3xl font-bold text-blue-400 mb-2 counter" data-target="94.2">0</div>
                                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 animate-pulse" style={{ width: '94%' }}></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Chart Visual */}
                                            <div className="bg-black/20 rounded-xl p-5 border border-white/5 h-40 relative overflow-hidden">
                                                <div className="absolute inset-0 opacity-10 flex items-end gap-1 px-4">
                                                    <div className="flex-1 bg-blue-500 h-[60%] rounded-t"></div>
                                                    <div className="flex-1 bg-blue-500 h-[40%] rounded-t"></div>
                                                    <div className="flex-1 bg-blue-500 h-[80%] rounded-t"></div>
                                                    <div className="flex-1 bg-blue-500 h-[55%] rounded-t"></div>
                                                    <div className="flex-1 bg-blue-500 h-[90%] rounded-t"></div>
                                                    <div className="flex-1 bg-blue-500 h-[70%] rounded-t"></div>
                                                    <div className="flex-1 bg-blue-400 h-[85%] rounded-t"></div>
                                                </div>
                                                <div className="relative z-10 flex justify-between">
                                                    <span className="text-white text-xs font-medium">Monthly Work Flow</span>
                                                    <div className="flex gap-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="size-2 rounded-full bg-blue-500"></div>
                                                            <span className="text-slate-500 text-[10px]">Inbound</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-slate-500">
                                                            <div className="size-2 rounded-full bg-white/20"></div>
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
                                <div className="w-64 bg-surface-dark/40 border border-blue-500/20 rounded-2xl p-5 shadow-2xl box-glow backdrop-blur-xl hover-lift card-shine">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-slate-400 text-sm font-medium">Active Tasks</span>
                                        <span className="material-symbols-outlined text-blue-500 text-sm">trending_up</span>
                                    </div>
                                    <div className="flex items-end gap-3">
                                        <span className="text-4xl font-bold text-white counter" data-target="48">0</span>
                                        <span className="text-xs font-bold text-black bg-blue-400 px-2 py-0.5 rounded-full mb-1.5">+24.1%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute top-80 -left-20 z-50 hidden xl:block animate-[float_7s_ease-in-out_infinite_0s] scroll-reveal-left stagger-2">
                                <div className="w-72 bg-surface-dark/40 border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-xl hover-lift card-shine">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-white font-medium text-sm">Total Tasks Completed</span>
                                        <span className="material-symbols-outlined text-blue-400 text-sm">analytics</span>
                                    </div>
                                    <div className="flex items-end gap-2 h-16 w-full px-2">
                                        <div className="w-1/4 h-[40%] bg-blue-500/40 rounded-t-sm transition-all hover:h-[45%]"></div>
                                        <div className="w-1/4 h-[80%] bg-blue-500/80 rounded-t-sm transition-all hover:h-[85%]"></div>
                                        <div className="w-1/4 h-[55%] bg-blue-400/60 rounded-t-sm transition-all hover:h-[60%]"></div>
                                        <div className="w-1/4 h-[90%] bg-blue-500 rounded-t-sm transition-all hover:h-[95%]"></div>
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
                                <div className="w-64 bg-surface-dark/40 border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-xl hover-lift card-shine">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-white text-sm font-medium">Recent Activity</span>
                                        <span className="material-symbols-outlined text-slate-500 text-sm">more_vert</span>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-xs hover:translate-x-1 transition-transform">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                            <span className="text-slate-300">Acme Corp - $12,400</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs hover:translate-x-1 transition-transform">
                                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                                            <span className="text-slate-300">Global Tech - $8,900</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs hover:translate-x-1 transition-transform">
                                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                                            <span className="text-slate-300">Starlight Inc - $5,200</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-20 -right-24 z-50 hidden xl:block animate-[float_8s_ease-in-out_infinite_1.5s] scroll-reveal-right stagger-2">
                                <div className="w-60 bg-surface-dark/40 border border-blue-500/20 rounded-2xl p-5 shadow-2xl box-glow backdrop-blur-xl hover-lift card-shine">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-slate-400 text-sm font-medium">Team Productivity Score</span>
                                        <span className="material-symbols-outlined text-blue-500 text-sm">equalizer</span>
                                    </div>
                                    <div className="flex items-end gap-3">
                                        <span className="text-4xl font-bold text-blue-400 text-glow counter" data-target="73">0</span>
                                        <span className="text-xs font-bold text-slate-400 bg-white/10 px-2 py-0.5 rounded-full mb-1.5">+10.7%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Trusted Brands Section */}
                <section style={{ background: '#00000069' }} className="border-b border-white/5 bg-background-dark">
                    <div className="max-w-7xl mx-auto px-6 py-12">
                        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 scroll-reveal revealed">
                            <div className="flex items-center gap-2 text-xl font-bold text-white hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined">rocket_launch</span> StarShip
                            </div>
                            <div className="flex items-center gap-2 text-xl font-bold text-white hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined">all_inclusive</span> Loop
                            </div>
                            <div className="flex items-center gap-2 text-xl font-bold text-white hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined">hive</span> HiveMind
                            </div>
                            <div className="flex items-center gap-2 text-xl font-bold text-white hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined">bolt</span> Energy
                            </div>
                            <div className="flex items-center gap-2 text-xl font-bold text-white hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined">deployed_code</span> CodeBase
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-24 relative">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-20 scroll-reveal">
                            <div className="inline-flex justify-center items-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6 shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl text-slate-400">shield</span>
                            </div>
                            <p className="text-blue-500 text-xs font-bold tracking-widest uppercase mb-3">Loved by Users</p>
                            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">Why choose us?</h2>
                            <p className="text-slate-400 max-w-xl mx-auto">The all-in-one work operating system for teams that value clarity, speed, and intelligent collaboration.</p>
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
                                <div key={idx} className={`scroll-reveal stagger-${idx + 1} hover-lift`}>
                                    <div className="mb-4 text-blue-400">
                                        <span className="material-symbols-outlined text-3xl animate-pulse">{feature.icon}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Bento Grid Section */}
                <section className="py-24 relative bg-[#030507]">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-20 scroll-reveal">
                            <p className="text-blue-500 text-xs font-bold tracking-widest uppercase mb-3">Revenue Operations</p>
                            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">All your work tools in <br />one workspace</h2>
                            <p className="text-slate-400 max-w-xl mx-auto">Touchpointe OS brings tasks, teams, communication, meetings, AI, and CRM together — so work flows without switching tools.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                            {/* Grid Item 1 */}
                            <div className="bg-surface-dark border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300 scroll-reveal stagger-1 hover-lift card-shine">
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none"></div>
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="flex justify-center py-6">
                                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.4)] animate-glow">
                                            <span className="text-2xl font-bold text-white">AI</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">Agentic AI at the Core</h3>
                                        <p className="text-sm text-slate-400">Touchpointe's agentic AI prioritizes tasks and helps teams move work forward.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Grid Item 2 */}
                            <div className="bg-surface-dark border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300 flex flex-col justify-center items-center text-center scroll-reveal stagger-2 hover-lift card-shine">
                                <div className="mb-6 relative">
                                    <div className="w-20 h-20 border-4 border-blue-500 rounded-full flex items-center justify-center animate-pulse">
                                        <span className="material-symbols-outlined text-4xl text-blue-400">verified_user</span>
                                    </div>
                                </div>
                                <div className="text-5xl font-bold text-white mb-2 counter" data-target="100">0</div>
                                <h3 className="text-lg font-bold text-blue-400 mb-2">One OS. Total Control</h3>
                                <p className="text-xs text-slate-500">One OS for tasks, teams, chats, meetings, and customers.</p>
                            </div>

                            {/* Continuing in next part... */}
                            {/* Grid Item 3 */}
                            <div className="bg-surface-dark border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300 scroll-reveal stagger-3 hover-lift card-shine">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                                <div className="relative h-full flex flex-col">
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-4 w-full backdrop-blur-sm hover:scale-105 transition-transform">
                                            <div className="flex items-start gap-3">
                                                <div className="bg-blue-500 p-2 rounded-lg animate-pulse">
                                                    <span className="material-symbols-outlined text-white text-sm">shield</span>
                                                </div>
                                                <div>
                                                    <div className="text-white text-sm font-bold">Real-Time Team Updates</div>
                                                    <div className="text-slate-400 text-[10px] mt-1">Real-time updates for tasks, mentions, meetings, and customer activity.</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <h3 className="text-lg font-bold text-white mb-1">Never miss what matters.</h3>
                                        <p className="text-xs text-slate-400">Get instant updates on task changes, mentions, meetings, and customer activity.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Grid Item 4 */}
                            <div className="bg-surface-dark border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300 md:col-span-1 scroll-reveal stagger-4 hover-lift card-shine">
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="flex justify-center items-center py-4">
                                        <div className="relative w-40 h-20 overflow-hidden">
                                            <div className="w-40 h-40 rounded-full border-[12px] border-slate-700 border-t-blue-400 border-l-blue-400 rotate-45 box-border animate-rotate"></div>
                                        </div>
                                        <div className="absolute text-center mt-6">
                                            <div className="text-xs text-slate-500 font-mono">km/h</div>
                                            <div className="text-4xl font-bold text-white counter" data-target="170">0</div>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">Move Faster as a Team</h3>
                                        <p className="text-sm text-slate-400">Collaborate, assign, and resolve tasks instantly with live updates across teams and projects.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Grid Item 5 */}
                            <div className="bg-surface-dark border border-white/5 rounded-3xl p-0 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300 flex items-center justify-center bg-gradient-to-br from-slate-900 to-black scroll-reveal stagger-5 hover-lift">
                                <div className="w-[180px] bg-black border-[4px] border-slate-700 rounded-[24px] h-[90%] shadow-2xl overflow-hidden relative transform translate-y-4 hover:scale-105 transition-transform">
                                    <div className="p-3">
                                        <div className="h-1 w-8 bg-slate-800 rounded mx-auto mb-4"></div>
                                        <div className="text-center mb-4">
                                            <div className="text-blue-400 font-bold text-xl counter" data-target="80.9">0</div>
                                            <div className="text-[8px] text-slate-500 uppercase">Score</div>
                                        </div>
                                        <div className="bg-slate-800/50 rounded p-2 mb-2">
                                            <div className="h-1 w-1/2 bg-blue-500 rounded mb-1 animate-pulse"></div>
                                            <div className="h-1 w-1/3 bg-blue-500/50 rounded animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Grid Item 6 */}
                            <div className="bg-surface-dark border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300 scroll-reveal stagger-6 hover-lift card-shine">
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-blue-900/10"></div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
                                <div className="relative h-full flex flex-col justify-end">
                                    <div className="flex-1 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-6xl text-blue-300 drop-shadow-[0_0_15px_rgba(147,197,253,0.5)] animate-glow">lock</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">Enterprise-Ready Platform</h3>
                                        <p className="text-sm text-slate-400">Built for growing teams with role-based access, structured workflows, and secure collaboration.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Wide Card */}
                        <div className="mt-6 bg-surface-dark border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 hover:border-blue-500/30 transition-all duration-300 scroll-reveal hover-lift card-shine">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 animate-pulse">
                                    <span className="material-symbols-outlined text-4xl">headset_mic</span>
                                </div>
                                <div>
                                    <div className="text-4xl font-bold text-white mb-1">REAL-TIME COLLABORATION</div>
                                    <div className="text-sm text-blue-400 font-bold uppercase tracking-wider">Always Connected. Always In Sync.</div>
                                </div>
                            </div>
                            <p className="text-slate-400 max-w-md text-sm md:text-right">Live updates across tasks, chats, meetings, and customers. <br />No more silos.</p>
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section className="py-24 border-t border-white/5 bg-background-dark">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-16 scroll-reveal">
                            <p className="text-blue-500 text-xs font-bold tracking-widest uppercase mb-3">Pricing</p>
                            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">Choose the perfect plan</h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">Wherever your challenges, we offer plans that are right for you.</p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Basic Plan */}
                            <div className="bg-surface-dark border border-white/5 rounded-3xl p-8 flex flex-col scroll-reveal stagger-1 hover-lift card-shine">
                                <h3 className="text-white font-bold mb-2">Basic plan</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl font-bold text-white">$10</span>
                                    <span className="text-slate-500 text-sm">/per month</span>
                                </div>
                                <p className="text-slate-400 text-sm mb-8">Starter protection for your data.</p>
                                <button className="w-full py-3 rounded-full bg-white text-black font-bold text-sm mb-8 hover:bg-slate-200 transition-all hover:scale-105">Get started</button>
                                <div className="space-y-4">
                                    <p className="text-xs text-slate-300 font-bold">Basic plan includes</p>
                                    {['Real-time data protection', 'Threat alerts', 'Monthly security report'].map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-3 text-sm text-slate-400 hover:translate-x-1 transition-transform">
                                            <span className="material-symbols-outlined text-blue-500 text-lg">check_circle</span>
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Advanced Plan */}
                            <div className="bg-blue-900/20 border border-blue-500/50 rounded-3xl p-8 flex flex-col relative shadow-[0_0_30px_rgba(59,130,246,0.1)] transform md:-translate-y-4 scroll-reveal stagger-2 hover:shadow-[0_0_50px_rgba(59,130,246,0.3)] hover:-translate-y-8 transition-all duration-300 card-shine">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-t-3xl"></div>
                                <h3 className="text-white font-bold mb-2">Advanced plan</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-5xl font-bold text-white">$20</span>
                                    <span className="text-blue-200 text-sm">/per month</span>
                                </div>
                                <p className="text-slate-300 text-sm mb-8">Expanded opportunities for confidence.</p>
                                <button className="w-full py-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-300 hover:to-blue-400 text-black font-bold text-sm mb-8 shadow-lg shadow-blue-500/20 transition-all hover:scale-105">Get started</button>
                                <div className="space-y-4">
                                    <p className="text-xs text-blue-200 font-bold">Advanced plan includes</p>
                                    {['All features of Basic plan', 'Advanced AI algorithms', 'Personalized recommendations', 'Weekly reports'].map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-3 text-sm text-white hover:translate-x-1 transition-transform">
                                            <span className="material-symbols-outlined text-blue-400 text-lg">check_circle</span>
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Premium Plan */}
                            <div className="bg-surface-dark border border-white/5 rounded-3xl p-8 flex flex-col scroll-reveal stagger-3 hover-lift card-shine">
                                <h3 className="text-white font-bold mb-2">Premium plan</h3>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-4xl font-bold text-white">$40</span>
                                    <span className="text-slate-500 text-sm">/per month</span>
                                </div>
                                <p className="text-slate-400 text-sm mb-8">Maximum protection and support.</p>
                                <button className="w-full py-3 rounded-full bg-white text-black font-bold text-sm mb-8 hover:bg-slate-200 transition-all hover:scale-105">Get started</button>
                                <div className="space-y-4">
                                    <p className="text-xs text-slate-300 font-bold">Premium plan includes</p>
                                    {['All features of Advanced plan', '24/7 expert support', 'Customized protection settings', 'Unlimited analytical reports'].map((feature, idx) => (
                                        <div key={idx} className="flex items-center gap-3 text-sm text-slate-400 hover:translate-x-1 transition-transform">
                                            <span className="material-symbols-outlined text-blue-500 text-lg">check_circle</span>
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
                        <div className="bg-black rounded-[3rem] scroll-reveal stagger-1 card-shine p-12 lg:p-24 text-center text-white relative overflow-hidden transition-transform duration-300 hover:scale-105 border-2 border-blue-500/20 hover:border-blue-500/50 hover:shadow-[0_0_50px_rgba(59,130,246,0.3)]">
                            {/* Background  radial gradient */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent"></div>

                            {/* Content */}
                            <div className="relative z-10">
                                <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
                                    Ready to unify your workflow?
                                </h2>

                                <p className="text-slate-400 mb-12 max-w-2xl mx-auto">
                                    Join 10,000+ teams who have replaced 5+ apps with Touchpointe.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link to="/my-tasks" className="px-8 py-4 bg-white text-black font-bold rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-300 hover:to-blue-400 shadow-2xl inline-block shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
                                        Get Started for Free
                                    </Link>

                                    <Link to="/my-tasks" className="px-8 py-4 bg-white/5 rounded-lg hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-semibold backdrop-blur-sm transition-all flex items-center gap-2 group hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:text-white hover:border-blue-500 hover:scale-105 inline-block">
                                        Book a Demo
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-white/5 bg-black pt-16 pb-8 scroll-reveal">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                            <div className="col-span-2 md:col-span-1">
                                <div className="flex items-center gap-2 mb-4 hover:scale-105 transition-transform">
                                    <div className="size-6 bg-blue-500 rounded flex items-center justify-center animate-glow">
                                        <span className="material-symbols-outlined text-white text-[16px]">hub</span>
                                    </div>
                                    <span className="text-lg font-bold text-white">Touchpointe OS</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <h4 className="font-bold text-white text-sm mb-1">Product</h4>
                                {['Features', 'Integrations', 'Pricing'].map((item, idx) => (
                                    <a key={idx} className="text-xs text-slate-400 hover:text-blue-400 transition-all hover:translate-x-1" href="#">{item}</a>
                                ))}
                            </div>
                            <div className="flex flex-col gap-3">
                                <h4 className="font-bold text-white text-sm mb-1">Company</h4>
                                {['Our team', 'Our values', 'Blog'].map((item, idx) => (
                                    <a key={idx} className="text-xs text-slate-400 hover:text-blue-400 transition-all hover:translate-x-1" href="#">{item}</a>
                                ))}
                            </div>
                            <div className="flex flex-col gap-3">
                                <h4 className="font-bold text-white text-sm mb-1">Resources</h4>
                                {['Downloads', 'Contact'].map((item, idx) => (
                                    <a key={idx} className="text-xs text-slate-400 hover:text-blue-400 transition-all hover:translate-x-1" href="#">{item}</a>
                                ))}
                            </div>
                        </div>
                        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                            <p className="text-xs text-slate-600">© 2025 Touchpointe. All rights reserved.</p>
                            <div className="flex gap-4">
                                {['public', 'alternate_email', 'share'].map((icon, idx) => (
                                    <a key={idx} className="text-slate-500 hover:text-white transition-all hover:scale-110" href="#">
                                        <i className="material-symbols-outlined text-[18px]">{icon}</i>
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
