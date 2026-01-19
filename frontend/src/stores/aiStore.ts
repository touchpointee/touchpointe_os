import { create } from 'zustand';
import { apiPost, apiGet } from '@/lib/api';
import { useWorkspaces } from './workspaceStore';

export type AgentType = 'workspace' | 'task' | 'crm' | 'channel';

export interface AgentCard {
    id: string;
    timestamp: Date;
    type: 'user' | 'agent';
    intent?: string; // Kept for legacy compatibility if needed
    content?: string;
    markdown?: string;
    relatedData?: any;
    isLoading?: boolean;
    role?: 'user' | 'assistant'; // Aligning with backend
}

interface AiState {
    activeAgent: AgentType;
    isOpen: boolean;
    messages: AgentCard[]; // Flat list for current conversation (history)
    isLoading: boolean;
    isProcessing: boolean; // Legacy support for sidebar
    isLoadingHistory: boolean;

    toggleOpen: () => void;
    setActiveAgent: (agent: AgentType) => void;

    // Core Actions
    sendMessage: (query: string, contextEntities?: { type: string; id: string; name: string }[]) => Promise<void>;
    fetchHistory: () => Promise<void>;
    clearHistory: () => void; // Clear current view
    clearState: () => void;   // Full reset (logout)
    reset: () => void;
}

export const useAiStore = create<AiState>((set, get) => ({
    activeAgent: 'workspace',
    isOpen: false,
    messages: [], // No default messages
    isLoading: false,
    isProcessing: false,
    isLoadingHistory: false,

    reset: () => get().clearState(),

    toggleOpen: () => set(state => ({ isOpen: !state.isOpen })),

    setActiveAgent: (agent) => {
        set({ activeAgent: agent, messages: [] }); // Clear old messages - ClickUp style
    },

    clearHistory: () => set({ messages: [] }),

    clearState: () => set({
        activeAgent: 'workspace',
        isOpen: false,
        messages: [],
        isLoading: false,
        isProcessing: false,
        isLoadingHistory: false
    }),

    fetchHistory: async () => {
        const { activeWorkspace } = useWorkspaces.getState();
        const { activeAgent } = get();

        if (!activeWorkspace) return;

        set({ isLoadingHistory: true });

        try {
            const history = await apiGet<any[]>(`/workspaces/${activeWorkspace.id}/ai/history?agentType=${activeAgent}`);

            // Map backend entity to frontend card
            const formattedMessages: AgentCard[] = history.map(msg => ({
                id: msg.id,
                timestamp: new Date(msg.timestamp),
                type: msg.role === 'user' ? 'user' : 'agent',
                role: msg.role as 'user' | 'assistant',
                content: msg.role === 'user' ? msg.content : undefined,
                markdown: msg.role === 'assistant' ? msg.content : undefined
            }));

            set({ messages: formattedMessages, isLoadingHistory: false });
        } catch (error) {
            console.error('Failed to fetch history:', error);
            set({ isLoadingHistory: false });
        }
    },

    sendMessage: async (query: string, contextEntities?: { type: string; id: string; name: string }[]) => {
        const { activeWorkspace } = useWorkspaces.getState();
        const { activeAgent, messages } = get();

        if (!activeWorkspace || !query.trim()) return;

        // Optimistic UI Update
        const tempId = Date.now().toString();
        const userCard: AgentCard = {
            id: tempId,
            timestamp: new Date(),
            type: 'user',
            role: 'user',
            content: query
        };

        const loadingCard: AgentCard = {
            id: tempId + '_loading',
            timestamp: new Date(),
            type: 'agent',
            role: 'assistant',
            isLoading: true
        };

        set({ messages: [...messages, userCard, loadingCard], isLoading: true, isProcessing: true });

        try {
            // Build conversation history from existing messages (for multi-turn context)
            const conversationHistory = messages
                .filter(msg => !msg.isLoading && (msg.content || msg.markdown))
                .slice(-6) // Last 6 messages for context
                .map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.content || msg.markdown || ''
                }));

            const response = await apiPost<any>(`/workspaces/${activeWorkspace.id}/ai/agent`, {
                agentType: activeAgent,
                userQuery: query,
                intent: 'query',
                contextEntities: contextEntities || [],
                conversationHistory: conversationHistory
            });

            const aiCard: AgentCard = {
                id: Date.now().toString(),
                timestamp: new Date(),
                type: 'agent',
                role: 'assistant',
                markdown: response.markdown,
                relatedData: response.relatedData,
                isLoading: false
            };

            set(state => ({
                messages: state.messages.map(msg =>
                    msg.id === loadingCard.id ? aiCard : msg
                ),
                isLoading: false,
                isProcessing: false
            }));

        } catch (error) {
            console.error(error);
            set(state => ({
                messages: state.messages.map(msg =>
                    msg.id === loadingCard.id ? { ...msg, isLoading: false, markdown: "Sorry, I encountered an error. Please try again." } : msg
                ),
                isLoading: false,
                isProcessing: false
            }));
        }
    }
}));
