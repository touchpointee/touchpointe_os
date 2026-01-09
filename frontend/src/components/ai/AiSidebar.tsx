import { useAiStore, type AgentType } from '@/stores/aiStore';
import {
    LayoutDashboard,
    AlertTriangle,
    CalendarClock,
    Briefcase,
    Zap,
    Users,
    CheckSquare,
    Globe,
    HelpCircle,
    IndianRupee
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';

export function AiSidebar() {
    const { activeAgent, setActiveAgent, sendMessage, isProcessing } = useAiStore();

    const agents: { id: AgentType; label: string; icon: any }[] = [
        { id: 'workspace', label: 'Overview', icon: Globe },
        { id: 'task', label: 'Tasks', icon: CheckSquare },
        { id: 'crm', label: 'CRM', icon: Users },
        { id: 'team', label: 'Team', icon: Briefcase },
        { id: 'channel', label: 'Channels', icon: Zap },
    ];

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
            { label: "What can I finish quickly?", intent: "quick_wins", desc: "Easy wins", icon: CheckSquare }
        ],
        crm: [
            { label: "How's the pipeline?", intent: "pipeline_summary", desc: "Deal flow overview", icon: Users },
            { label: "Check deal risks", intent: "risks", desc: "Stalled or waning", icon: AlertTriangle },
            { label: "Show stalled deals", intent: "stalled", desc: "No activity > 7 days", icon: CalendarClock },
            { label: "Show top opportunities", intent: "high_value", desc: "High value active", icon: IndianRupee },
            { label: "Forecast revenue", intent: "forecast", desc: "Projected earnings", icon: Globe }
        ],
        team: [
            { label: "Who is overloaded?", intent: "overloaded", desc: "Capacity analysis", icon: AlertTriangle },
            { label: "Check team availability", intent: "availability", desc: "Who is free?", icon: Users },
            { label: "Who is on leave?", intent: "leaves", desc: "Capacity planning", icon: CalendarClock }
        ],
        channel: [
            { label: "Summarize active channels", intent: "summarize_channels", desc: "What's happening?", icon: Zap },
            { label: "What was discussed in #general?", intent: "general_summary", desc: "Recent topics", icon: Globe }
        ]
    };

    const currentActions = allActions[activeAgent] || [];

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border/50">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <Bot className="w-4 h-4" /> Hattie's Brain
                </h2>

                {/* Agent Selector */}
                <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-lg">
                    {agents.map((agent) => (
                        <button
                            key={agent.id}
                            onClick={() => setActiveAgent(agent.id)}
                            className={cn(
                                "flex items-center justify-center gap-2 p-1.5 rounded-md text-[11px] font-medium transition-all",
                                activeAgent === agent.id
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            <agent.icon className="w-3 h-3" />
                            {agent.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                <div className="px-2 py-2">
                    <p className="text-xs font-medium text-foreground mb-1">
                        {agents.find(a => a.id === activeAgent)?.label} Actions
                    </p>
                </div>

                {currentActions.length === 0 ? (
                    <div className="px-2 py-4 text-center">
                        <p className="text-xs text-muted-foreground">No specific actions.</p>
                    </div>
                ) : (
                    currentActions.map((action) => (
                        <button
                            key={action.label}
                            disabled={isProcessing}
                            // Using sendMessage to trigger the action as a query/intent
                            // We can map intent to query text or assume backend handles intent if we pass it differently
                            // But store only has sendMessage(query). 
                            // Plan: Pass intent as query text but maybe prefixed or handled by backend logic if query matches?
                            // Actually, AiService checks Intent OR UserQuery. 
                            // But sendMessage only sends 'userQuery' (and hardcodes intent='query').
                            // Workaround: Send the prompt text associated with the action?
                            // Or better: update store to allow sending intent.
                            // BUT: Store refactor removed `performAction`.
                            // Let's check store again. It sends `userQuery: query, intent: 'query'`.
                            // So I should send the text "Summarize active channels" as the query.
                            // The backend handles natural language now.
                            onClick={() => sendMessage(action.label)}
                            className="w-full group flex items-start gap-3 p-2 rounded-md hover:bg-accent transition-colors text-left disabled:opacity-50"
                        >
                            <div className="mt-0.5 text-muted-foreground group-hover:text-primary">
                                <action.icon className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xs font-medium text-foreground">{action.label}</div>
                                <div className="text-[10px] text-muted-foreground">{action.desc}</div>
                            </div>
                        </button>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-border/50 bg-muted/20">
                <div className="flex gap-2 items-start opacity-70">
                    <HelpCircle className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Agents are scoped to your workspace data and do not guess.
                    </p>
                </div>
            </div>
        </div>
    );
}
