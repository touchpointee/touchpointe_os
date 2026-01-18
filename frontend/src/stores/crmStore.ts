import { create } from 'zustand';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export interface BaseCrmEntity {
    id: string;
    workspaceId: string;
    createdAt: string;
}

export interface Company extends BaseCrmEntity {
    name: string;
    domain: string;
    industry: string;
}

export interface Contact extends BaseCrmEntity {
    companyId?: string;
    companyName?: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string;
}

export interface Deal extends BaseCrmEntity {
    companyId?: string;
    companyName?: string;
    contacts: Contact[];
    contactNames: string;
    contactIds?: string[]; // For create/update
    name: string;
    value: number;
    stage: 'NEW' | 'DISCOVERY' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
    closeDate?: string;
    orderIndex: number;
}

export interface CrmActivity extends BaseCrmEntity {
    entityType: string;
    entityId: string;
    actionType: string;
    oldValue?: string;
    newValue?: string;
    userId: string;
    userName: string;
}

interface CrmStore {
    companies: Company[];
    contacts: Contact[];
    deals: Deal[];
    activities: CrmActivity[];
    isLoading: boolean;
    error: string | null;

    fetchCompanies: (workspaceId: string) => Promise<void>;
    createCompany: (workspaceId: string, data: Partial<Company>) => Promise<void>;
    updateCompany: (workspaceId: string, id: string, data: Partial<Company>) => Promise<void>;
    deleteCompany: (workspaceId: string, id: string) => Promise<void>;

    fetchContacts: (workspaceId: string) => Promise<void>;
    createContact: (workspaceId: string, data: Partial<Contact>) => Promise<void>;
    updateContact: (workspaceId: string, id: string, data: Partial<Contact>) => Promise<void>;
    deleteContact: (workspaceId: string, id: string) => Promise<void>;

    fetchDeals: (workspaceId: string) => Promise<void>;
    createDeal: (workspaceId: string, data: Partial<Deal>) => Promise<void>;
    updateDeal: (workspaceId: string, id: string, data: Partial<Deal>) => Promise<void>;
    updateDealStage: (workspaceId: string, id: string, stage: string, orderIndex: number) => Promise<void>;
    deleteDeal: (workspaceId: string, id: string) => Promise<void>;

    // UI State
    activeDealId: string | null;
    isDetailPanelOpen: boolean;
    openDealDetail: (id: string) => void;
    closeDealDetail: () => void;

    fetchActivities: (workspaceId: string, entityId?: string, entityType?: string) => Promise<void>;
}

export const useCrmStore = create<CrmStore>()((set, get) => ({
    companies: [],
    contacts: [],
    deals: [],
    activities: [],
    isLoading: false,
    error: null,

    fetchCompanies: async (workspaceId) => {
        set({ isLoading: true, error: null });
        try {
            const data = await apiGet<Company[]>(`/workspaces/${workspaceId}/crm/companies`);
            set({ companies: data });
        } catch (e: any) {
            set({ error: e.message || 'Failed to fetch companies' });
        } finally {
            set({ isLoading: false });
        }
    },

    createCompany: async (workspaceId, companyData) => {
        try {
            const data = await apiPost<Company>(`/workspaces/${workspaceId}/crm/companies`, companyData);
            set((state) => ({ companies: [...state.companies, data] }));
        } catch (e: any) {
            throw e;
        }
    },

    updateCompany: async (workspaceId, id, companyData) => {
        try {
            const data = await apiPut<Company>(`/workspaces/${workspaceId}/crm/companies/${id}`, companyData);
            set((state) => ({
                companies: state.companies.map((c) => (c.id === id ? data : c)),
            }));
        } catch (e: any) {
            throw e;
        }
    },

    deleteCompany: async (workspaceId, id) => {
        try {
            await apiDelete(`/workspaces/${workspaceId}/crm/companies/${id}`);
            set((state) => ({
                companies: state.companies.filter((c) => c.id !== id),
            }));
        } catch (e: any) {
            throw e;
        }
    },

    fetchContacts: async (workspaceId) => {
        set({ isLoading: true, error: null });
        try {
            const data = await apiGet<Contact[]>(`/workspaces/${workspaceId}/crm/contacts`);
            set({ contacts: data });
        } catch (e: any) {
            set({ error: e.message || 'Failed to fetch contacts' });
        } finally {
            set({ isLoading: false });
        }
    },

    createContact: async (workspaceId, contactData) => {
        try {
            const data = await apiPost<Contact>(`/workspaces/${workspaceId}/crm/contacts`, contactData);
            set((state) => ({ contacts: [...state.contacts, data] }));
        } catch (e: any) {
            throw e;
        }
    },

    updateContact: async (workspaceId, id, contactData) => {
        try {
            const data = await apiPut<Contact>(`/workspaces/${workspaceId}/crm/contacts/${id}`, contactData);
            set((state) => ({
                contacts: state.contacts.map((c) => (c.id === id ? data : c)),
            }));
        } catch (e: any) {
            throw e;
        }
    },

    deleteContact: async (workspaceId, id) => {
        try {
            await apiDelete(`/workspaces/${workspaceId}/crm/contacts/${id}`);
            set((state) => ({
                contacts: state.contacts.filter((c) => c.id !== id),
            }));
        } catch (e: any) {
            throw e;
        }
    },

    fetchDeals: async (workspaceId) => {
        set({ isLoading: true, error: null });
        try {
            const data = await apiGet<Deal[]>(`/workspaces/${workspaceId}/crm/deals`);
            set({ deals: data });
        } catch (e: any) {
            set({ error: e.message || 'Failed to fetch deals' });
        } finally {
            set({ isLoading: false });
        }
    },

    createDeal: async (workspaceId, dealData) => {
        try {
            const data = await apiPost<Deal>(`/workspaces/${workspaceId}/crm/deals`, dealData);
            set((state) => ({ deals: [...state.deals, data] }));
        } catch (e: any) {
            throw e;
        }
    },

    updateDeal: async (workspaceId, id, dealData) => {
        try {
            const data = await apiPut<Deal>(`/workspaces/${workspaceId}/crm/deals/${id}`, dealData);
            set((state) => ({
                deals: state.deals.map((d) => (d.id === id ? data : d)),
            }));
        } catch (e: any) {
            throw e;
        }
    },

    updateDealStage: async (workspaceId, id, stage, orderIndex) => {
        // Optimistic update
        const currentDeals = get().deals;
        const previousDeal = currentDeals.find(d => d.id === id);

        if (!previousDeal) return;

        // Apply change locally immediately
        set((state) => ({
            deals: state.deals.map((d) => (d.id === id ? { ...d, stage: stage as any, orderIndex } : d)),
        }));

        try {
            // Call API
            const data = await apiPut<Deal>(`/workspaces/${workspaceId}/crm/deals/${id}/stage`, { stage, orderIndex });

            // Update with confirmed data from server
            set((state) => ({
                deals: state.deals.map((d) => (d.id === id ? data : d)),
            }));
        } catch (e: any) {
            // Revert on failure
            set({ deals: currentDeals });
            throw e;
        }
    },

    deleteDeal: async (workspaceId, id) => {
        try {
            await apiDelete(`/workspaces/${workspaceId}/crm/deals/${id}`);
            set((state) => ({
                deals: state.deals.filter((d) => d.id !== id),
            }));
        } catch (e: any) {
            throw e;
        }
    },

    // UI Logic
    activeDealId: null,
    isDetailPanelOpen: false,
    openDealDetail: (id: string) => set({ activeDealId: id, isDetailPanelOpen: true }),
    closeDealDetail: () => set({ activeDealId: null, isDetailPanelOpen: false }),

    fetchActivities: async (workspaceId, entityId, entityType) => {
        set({ isLoading: true, error: null });
        try {
            const params = new URLSearchParams();
            if (entityId) params.append('entityId', entityId);
            if (entityType) params.append('entityType', entityType);

            const query = params.toString() ? `?${params.toString()}` : '';
            const data = await apiGet<CrmActivity[]>(`/workspaces/${workspaceId}/crm/activities${query}`);

            set({ activities: data });
        } catch (e: any) {
            set({ error: e.message || 'Failed to fetch activities' });
        } finally {
            set({ isLoading: false });
        }
    }
}));
