import { useAiStore, type AgentType } from '@/stores/aiStore';
import { Bot, User, Loader2, FileText, DollarSign, Briefcase, ChevronDown, CheckSquare, Globe, Users, Zap, CalendarClock, AlertTriangle, LayoutDashboard } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import * as React from 'react';

export function AiFeed() {
    const { activeAgent, messages, isLoadingHistory, fetchHistory, sendMessage, setActiveAgent } = useAiStore();
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [showAgentMenu, setShowAgentMenu] = React.useState(false);

    const agents: { id: AgentType; label: string; icon: any }[] = [
        { id: 'workspace', label: 'Overview', icon: Globe },
        { id: 'task', label: 'Tasks', icon: CheckSquare },
        { id: 'crm', label: 'CRM', icon: Users },
        { id: 'channel', label: 'Channels', icon: Zap },
    ];

    React.useEffect(() => {
        fetchHistory();
    }, [activeAgent, fetchHistory]);

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, activeAgent]);

    const allActions = {
        workspace: [
            { label: "What should I know?", intent: "brief", desc: "Daily summary", icon: Zap },
            { label: "Check workspace health", intent: "health", desc: "Activity & bottlenecks", icon: Globe }
        ],
        task: [
            { label: "What do I need to do?", intent: "due_today", desc: "Focus for today", icon: CalendarClock },
            { label: "Show me overdue tasks", intent: "overdue", desc: "Missed deadlines", icon: AlertTriangle },
            { label: "What's high priority?", intent: "high_priority", desc: "Urgent items", icon: AlertTriangle },
            { label: "Summarize my plate", intent: "summarize_tasks", desc: "Workload overview", icon: LayoutDashboard },
        ],
        crm: [
            { label: "How's the pipeline?", intent: "pipeline_summary", desc: "Deal flow overview", icon: Users },
            { label: "Check deal risks", intent: "risks", desc: "Stalled or waning", icon: AlertTriangle },
            { label: "Show top opportunities", intent: "high_value", desc: "High value active", icon: DollarSign },
        ],
        channel: [
            { label: "Summarize active channels", intent: "summarize_channels", desc: "What's happening?", icon: Zap },
            { label: "What was discussed in #general?", intent: "general_summary", desc: "Recent topics", icon: Globe }
        ]
    };

    const currentActions = allActions[activeAgent] || [];

    return (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-gradient-to-b from-background via-background/80 to-muted/20">
            {/* Feed Header / Context */}
            <div className="h-14 flex items-center justify-between px-8 bg-background/50 backdrop-blur-md border-b border-border/40 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg shadow-purple-500/20">
                        <img src="/hattie.png" alt="Hattie AI" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <span className="text-sm font-semibold text-foreground tracking-tight">
                            Hattie AI
                        </span>
                        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                            {activeAgent === 'workspace' ? 'Workspace Overview' : `${activeAgent.charAt(0).toUpperCase() + activeAgent.slice(1)} Agent`}
                        </div>
                    </div>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-0">
                {isLoadingHistory && (
                    <div className="flex justify-center p-8 mt-20">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                )}

                {!isLoadingHistory && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="mb-12 text-center space-y-4">
                            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl ring-1 ring-white/20 overflow-hidden bg-background">
                                <img src="/hattie.png" alt="Hattie AI" className="w-full h-full object-cover" />
                            </div>
                            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">
                                How can I help with your {activeAgent === 'workspace' ? 'workspace' : activeAgent}?
                            </h2>
                            <p className="text-muted-foreground max-w-md mx-auto text-base">
                                I can analyze data, summarize updates, and help you stay on top of your work.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-4">
                            {currentActions.map((action) => (
                                <button
                                    key={action.label}
                                    onClick={() => sendMessage(action.label)}
                                    className="group flex items-center gap-4 p-4 rounded-xl bg-card/50 hover:bg-card border border-border/40 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 text-left"
                                >
                                    <div className="p-2.5 rounded-lg bg-background/80 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors text-muted-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 shrink-0">
                                        <action.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                            {action.label}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {action.desc}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.length > 0 && (
                    <div className="flex-1 p-8 space-y-8 pb-32">
                        {messages.map((card) => (
                            <div key={card.id} className={`flex gap-4 ${card.role === 'user' ? 'flex-row-reverse' : ''} max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                                {/* Avatar */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${card.role === 'assistant' ? 'bg-purple-600 shadow-lg shadow-purple-900/20' : 'bg-muted border border-border'}`}>
                                    {card.role === 'assistant' ? <img src="/hattie.png" alt="Hattie" className="w-full h-full object-cover" /> : <User className="w-5 h-5 text-muted-foreground" />}
                                </div>

                                {/* Content */}
                                <div className={`flex flex-col gap-2 max-w-[80%] ${card.role === 'user' ? 'items-end' : ''}`}>
                                    {/* Header */}
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-foreground">
                                                {card.role === 'assistant' ? 'Hattie' : 'You'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {card.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        {card.role === 'assistant' && (
                                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide">
                                                {activeAgent === 'workspace' ? 'Main Brain' : `${activeAgent.charAt(0).toUpperCase() + activeAgent.slice(1)} Assistant`}
                                            </span>
                                        )}
                                    </div>

                                    {/* Card Body */}
                                    <div className={`rounded-2xl p-5 ${card.role === 'assistant'
                                        ? 'bg-card border border-border text-foreground shadow-sm'
                                        : 'bg-primary text-primary-foreground shadow-md'
                                        }`}>
                                        {card.isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span className="text-sm">Agent is thinking...</span>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Text Content */}
                                                {card.content && <p className="text-sm leading-relaxed">{card.content}</p>}
                                                {card.markdown && (
                                                    <div className="prose prose-sm max-w-none dark:prose-invert prose-zinc">
                                                        <ReactMarkdown>{card.markdown}</ReactMarkdown>
                                                    </div>
                                                )}

                                                {/* Related Data Renderers */}
                                                {card.relatedData && (
                                                    <div className="mt-4 flex flex-col gap-2 animate-in fade-in duration-700">
                                                        {/* Tasks Renderer */}
                                                        {card.relatedData.tasks && (
                                                            <div className="bg-muted/50 rounded-xl p-3 border border-border/50">
                                                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                                                    <FileText className="w-3 h-3" /> Referenced Tasks
                                                                </h4>
                                                                <div className="space-y-1">
                                                                    {card.relatedData.tasks.map((t: any) => (
                                                                        <div key={t.id || t.Id || Math.random()} className="flex justify-between items-center p-2 rounded hover:bg-background transition-colors text-xs border-b border-border/50 last:border-0">
                                                                            <div className="flex flex-col min-w-0 flex-1 mr-2">
                                                                                <span className="text-foreground truncate font-medium">{t.title || t.Title || 'Untitled Task'}</span>
                                                                                {(t.subDescription || t.SubDescription) && (
                                                                                    <div className="text-[10px] text-muted-foreground truncate">{t.subDescription || t.SubDescription}</div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex gap-2 shrink-0">
                                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground capitalize`}>{(t.status || t.Status || 'todo').toLowerCase().replace('_', ' ')}</span>
                                                                                <span className="text-muted-foreground">{new Date(t.dueDate || t.DueDate || Date.now()).toLocaleDateString()}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Deals Renderer */}
                                                        {card.relatedData.deals && (
                                                            <div className="bg-muted/50 rounded-xl p-3 border border-border/50">
                                                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                                                    <DollarSign className="w-3 h-3" /> Referenced Deals
                                                                </h4>
                                                                <div className="space-y-1">
                                                                    {card.relatedData.deals.map((d: any) => (
                                                                        <div key={d.id || d.Id || Math.random()} className="flex justify-between items-center p-2 rounded hover:bg-background transition-colors text-xs border-b border-border/50 last:border-0">
                                                                            <span className="text-foreground truncate font-medium">{d.name || d.Name || 'Untitled Deal'}</span>
                                                                            <div className="flex gap-2">
                                                                                <span className="text-emerald-500 font-mono">₹{(d.value || d.Value || 0).toLocaleString('en-IN')}</span>
                                                                                <span className="text-muted-foreground capitalize">{(d.stage || d.Stage || 'new').toLowerCase().replace('_', ' ')}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Channels Renderer */}
                                                        {card.relatedData.channels && (
                                                            <div className="bg-muted/50 rounded-xl p-3 border border-border/50">
                                                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                                                    <Briefcase className="w-3 h-3" /> Active Channels
                                                                </h4>
                                                                <div className="space-y-1">
                                                                    {card.relatedData.channels.map((c: any) => (
                                                                        <div key={c.id || c.Id} className="flex justify-between items-center p-2 rounded hover:bg-background transition-colors text-xs border-b border-border/50 last:border-0">
                                                                            <span className="text-foreground truncate font-medium">#{c.name || c.Name}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Team/Stats Renderer */}
                                                        {card.relatedData.stats && (
                                                            <div className="bg-muted/50 rounded-xl p-3 border border-border/50 flex gap-4">
                                                                <div className="text-center">
                                                                    <div className="text-lg font-bold text-foreground">{card.relatedData.stats.OpenTasks}</div>
                                                                    <div className="text-[10px] text-muted-foreground uppercase">Tasks</div>
                                                                </div>
                                                                <div className="text-center">
                                                                    <div className="text-lg font-bold text-emerald-500">{card.relatedData.stats.ActiveDeals}</div>
                                                                    <div className="text-[10px] text-muted-foreground uppercase">Deals</div>
                                                                </div>
                                                                <div className="text-center">
                                                                    <div className="text-lg font-bold text-blue-500">{card.relatedData.stats.TeamSize}</div>
                                                                    <div className="text-[10px] text-muted-foreground uppercase">Members</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-6">
                <div className="max-w-4xl mx-auto relative group">
                    <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex gap-2 bg-card border border-input rounded-full p-2 shadow-lg ring-1 ring-black/5 dark:ring-white/10 items-center">

                        {/* Agent Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowAgentMenu(!showAgentMenu)}
                                className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full hover:bg-muted/50 transition-colors text-xs font-medium text-foreground border-r border-border/50 mr-1"
                            >
                                {(() => {
                                    const current = agents.find(a => a.id === activeAgent) || agents[0];
                                    const Icon = current.icon;
                                    return (
                                        <>
                                            <Icon className="w-3.5 h-3.5 text-purple-600" />
                                            <span>{current.label}</span>
                                            <ChevronDown className="w-3 h-3 text-muted-foreground" />
                                        </>
                                    );
                                })()}
                            </button>

                            {/* Dropdown Menu */}
                            {showAgentMenu && (
                                <div className="absolute bottom-full left-0 mb-2 w-48 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                                    <div className="p-1 space-y-0.5">
                                        {agents.map((agent) => (
                                            <button
                                                key={agent.id}
                                                onClick={() => {
                                                    setActiveAgent(agent.id);
                                                    setShowAgentMenu(false);
                                                }}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${activeAgent === agent.id
                                                    ? 'bg-purple-600 text-white'
                                                    : 'hover:bg-muted text-foreground'
                                                    }`}
                                            >
                                                <agent.icon className="w-3.5 h-3.5" />
                                                {agent.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <input
                            type="text"
                            placeholder={`Ask ${activeAgent} agent...`}
                            className="flex-1 bg-transparent border-none focus:outline-none px-2 text-sm text-foreground placeholder:text-muted-foreground min-w-0"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    sendMessage(e.currentTarget.value);
                                    e.currentTarget.value = '';
                                }
                            }}
                        />
                        <button className="p-2 bg-secondary hover:bg-purple-600 hover:text-white text-foreground rounded-full transition-colors shrink-0">
                            <Bot className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
