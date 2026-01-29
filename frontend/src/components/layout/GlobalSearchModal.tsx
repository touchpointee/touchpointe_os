import { useNavigate } from 'react-router-dom';
import {
    Search,
    CheckCircle2,
    UserPlus,
    Users,
    Building2,
    DollarSign,
    Hash,
    Loader2
} from 'lucide-react';
import { useSearchStore, type SearchResult } from '@/stores/searchStore';

export function GlobalSearchResults() {
    const navigate = useNavigate();
    const {
        query,
        results,
        isLoading,
        isOpen,
        setIsOpen
    } = useSearchStore();

    const handleResultClick = (result: SearchResult) => {
        setIsOpen(false);
        navigate(result.url);
    };

    if (!isOpen) return null;

    const getIcon = (type: SearchResult['type']) => {
        switch (type) {
            case 'Task': return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
            case 'Lead': return <UserPlus className="w-4 h-4 text-orange-500" />;
            case 'Contact': return <Users className="w-4 h-4 text-green-500" />;
            case 'Company': return <Building2 className="w-4 h-4 text-purple-500" />;
            case 'Deal': return <DollarSign className="w-4 h-4 text-yellow-500" />;
            case 'Channel': return <Hash className="w-4 h-4 text-pink-500" />;
            default: return <Search className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border shadow-xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
            {/* Results Area */}
            <div className="max-h-[60vh] overflow-y-auto no-scrollbar py-2">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <p className="text-xs">Searching...</p>
                    </div>
                ) : results.length > 0 ? (
                    <div className="space-y-1 px-2">
                        {results.map((result) => (
                            <button
                                key={`${result.type}-${result.id}`}
                                onClick={() => handleResultClick(result)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-background transition-colors">
                                    {getIcon(result.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-medium text-sm truncate">{result.title}</span>
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                                            {result.type}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : query.length > 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Search className="w-6 h-6 mb-2 opacity-20" />
                        <p className="text-sm">No results found for "{query}"</p>
                    </div>
                ) : (
                    <div className="px-4 py-4 text-center text-muted-foreground">
                        <p className="text-xs">Type to search tasks, contacts, and more...</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-border bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <span className="px-1 py-0.5 rounded bg-background border border-border">Enter</span>
                        <span>to select</span>
                    </div>
                    <span>ESC to close</span>
                </div>
            </div>
        </div>
    );
}
