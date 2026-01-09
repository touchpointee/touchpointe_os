import { useState, useRef, useEffect } from 'react';
import { useAiStore } from '@/stores/aiStore';
import { Bot, X, Send, Trash2, Loader2, Sparkles } from 'lucide-react';

export function AiAssistant() {
    const { isOpen, toggleOpen, messages, sendMessage, isLoading, isLoadingHistory, fetchHistory, clearHistory, activeAgent } = useAiStore();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen, fetchHistory]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const query = input;
        setInput('');
        await sendMessage(query);
    };

    if (!isOpen) {
        return (
            <button
                onClick={toggleOpen}
                className="fixed bottom-6 right-6 p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-all hover:scale-110 z-50 group"
            >
                <Sparkles className="w-6 h-6 animate-pulse group-hover:animate-none" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-card border border-border rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/50 flex justify-between items-center backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Touchpointe AI</h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={clearHistory}
                        className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                        title="Clear View"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={toggleOpen}
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-background/5">
                {isLoadingHistory && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                )}

                {!isLoadingHistory && messages.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground py-8">
                        No previous messages in this session.
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-tr-none'
                                : 'bg-muted/80 text-foreground rounded-tl-none border border-border/50'
                                }`}
                        >
                            {msg.content && msg.content.split('\n').map((line, i) => (
                                <p key={i} className="mb-1 last:mb-0">{line}</p>
                            ))}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-muted/50 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-background">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Ask ${activeAgent} agent...`}
                        className="flex-1 px-4 py-3 rounded-xl bg-muted/50 border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/70"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-95"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-[10px] text-center text-muted-foreground mt-2">
                    AI can make mistakes. Check important info.
                </p>
            </form>
        </div>
    );
}
