import { useAiStore } from '@/stores/aiStore';
import { Bot, User, Loader2, FileText, DollarSign, Briefcase } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import * as React from 'react';

export function AiFeed() {
    const { activeAgent, messages, isLoadingHistory, fetchHistory, sendMessage } = useAiStore();
    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        fetchHistory();
    }, [activeAgent, fetchHistory]);

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, activeAgent]);

    return (
        <div className="flex-1 flex flex-col bg-muted/10 relative overflow-hidden">
            {/* Feed Header / Context */}
            <div className="h-10 border-b border-border flex items-center px-6 bg-card/50 backdrop-blur-sm">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Hattie &middot; {activeAgent === 'workspace' ? 'Overview' : activeAgent.charAt(0).toUpperCase() + activeAgent.slice(1)}
                </span>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
                {isLoadingHistory && (
                    <div className="flex justify-center p-8">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                    </div>
                )}

                {!isLoadingHistory && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                        <Bot className="w-12 h-12 mb-4" />
                        <p>No messages yet. Start a conversation!</p>
                    </div>
                )}

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

            <div className="p-6">
                <div className="max-w-4xl mx-auto relative group">
                    <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex gap-2 bg-card border border-input rounded-full p-2 shadow-lg ring-1 ring-black/5 dark:ring-white/10">
                        <input
                            type="text"
                            placeholder={`Ask ${activeAgent} agent...`}
                            className="flex-1 bg-transparent border-none focus:outline-none px-4 text-sm text-foreground placeholder:text-muted-foreground"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                    sendMessage(e.currentTarget.value);
                                    e.currentTarget.value = '';
                                }
                            }}
                        />
                        <button className="p-2 bg-secondary hover:bg-purple-600 hover:text-white text-foreground rounded-full transition-colors">
                            <Bot className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
