import { create } from 'zustand';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

// ========== TYPES ==========

export interface Lead {
    id: string;
    workspaceId: string;
    formId?: string;
    formName?: string;
    assignedToUserId?: string;
    assignedToName?: string;
    convertedToContactId?: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone?: string;
    companyName?: string;
    source: 'MANUAL' | 'FORM' | 'FACEBOOK' | 'GOOGLE' | 'ZAPIER' | 'REFERRAL';
    status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED';
    score: number;
    notes?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    createdAt: string;
    lastActivityAt?: string;
}

export interface LeadForm {
    id: string;
    workspaceId: string;
    name: string;
    token: string;
    description?: string;
    fieldsConfig?: object;
    successRedirectUrl?: string;
    successMessage: string;
    isActive: boolean;
    submissionCount: number;
    createdAt: string;
}

export interface LeadActivity {
    id: string;
    leadId: string;
    userId?: string;
    userName?: string;
    type: string;
    description?: string;
    scoreChange?: number;
    createdAt: string;
}

export interface DashboardSummary {
    totalLeads: number;
    newLeadsThisMonth: number;
    qualifiedLeads: number;
    convertedLeads: number;
    conversionRate: number;
    hotLeads: number;
    totalPipelineValue: number;
}

export interface LeadsBySource {
    source: string;
    count: number;
    percentage: number;
}

export interface ConversionFunnel {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
}

// ========== STORE ==========

interface LeadStore {
    // Data
    leads: Lead[];
    forms: LeadForm[];
    activities: LeadActivity[];
    dashboardSummary: DashboardSummary | null;
    leadsBySource: LeadsBySource[];
    conversionFunnel: ConversionFunnel | null;

    // UI State
    isLoading: boolean;
    error: string | null;
    activeLeadId: string | null;
    isDetailPanelOpen: boolean;

    // Lead CRUD
    fetchLeads: (workspaceId: string, status?: string, source?: string) => Promise<void>;
    createLead: (workspaceId: string, data: Partial<Lead>) => Promise<Lead>;
    updateLead: (workspaceId: string, id: string, data: Partial<Lead>) => Promise<Lead>;
    deleteLead: (workspaceId: string, id: string) => Promise<void>;
    convertLead: (workspaceId: string, id: string, data: {
        createCompany?: boolean;
        createDeal?: boolean;
        dealName?: string;
        dealValue?: number;
    }) => Promise<{ contactId: string; companyId?: string; dealId?: string }>;

    // Form CRUD
    fetchForms: (workspaceId: string) => Promise<void>;
    createForm: (workspaceId: string, data: Partial<LeadForm>) => Promise<LeadForm>;
    updateForm: (workspaceId: string, id: string, data: Partial<LeadForm>) => Promise<LeadForm>;
    deleteForm: (workspaceId: string, id: string) => Promise<void>;
    getEmbedCode: (workspaceId: string, id: string) => Promise<{ embedCode: string; formUrl: string }>;

    // Activities
    fetchLeadActivities: (workspaceId: string, leadId: string) => Promise<void>;

    // Dashboard
    fetchDashboardSummary: (workspaceId: string) => Promise<void>;
    fetchLeadsBySource: (workspaceId: string) => Promise<void>;
    fetchConversionFunnel: (workspaceId: string) => Promise<void>;

    // UI Actions
    openLeadDetail: (id: string) => void;
    closeLeadDetail: () => void;
    reset: () => void;
}

export const useLeadStore = create<LeadStore>()((set) => ({
    // Initial State
    leads: [],
    forms: [],
    activities: [],
    dashboardSummary: null,
    leadsBySource: [],
    conversionFunnel: null,
    isLoading: false,
    error: null,
    activeLeadId: null,
    isDetailPanelOpen: false,

    reset: () => set({
        leads: [],
        forms: [],
        activities: [],
        dashboardSummary: null,
        leadsBySource: [],
        conversionFunnel: null,
        isLoading: false,
        error: null,
        activeLeadId: null,
        isDetailPanelOpen: false
    }),

    // ========== LEAD CRUD ==========

    fetchLeads: async (workspaceId, status, source) => {
        set({ isLoading: true, error: null });
        try {
            const params = new URLSearchParams();
            if (status) params.append('status', status);
            if (source) params.append('source', source);
            const query = params.toString() ? `?${params.toString()}` : '';

            const data = await apiGet<Lead[]>(`/workspaces/${workspaceId}/crm/leads${query}`);
            set({ leads: data });
        } catch (e: any) {
            set({ error: e.message || 'Failed to fetch leads' });
        } finally {
            set({ isLoading: false });
        }
    },

    createLead: async (workspaceId, leadData) => {
        const data = await apiPost<Lead>(`/workspaces/${workspaceId}/crm/leads`, leadData);
        set((state) => ({ leads: [data, ...state.leads] }));
        return data;
    },

    updateLead: async (workspaceId, id, leadData) => {
        const data = await apiPut<Lead>(`/workspaces/${workspaceId}/crm/leads/${id}`, leadData);
        set((state) => ({
            leads: state.leads.map((l) => (l.id === id ? data : l)),
        }));
        return data;
    },

    deleteLead: async (workspaceId, id) => {
        await apiDelete(`/workspaces/${workspaceId}/crm/leads/${id}`);
        set((state) => ({
            leads: state.leads.filter((l) => l.id !== id),
        }));
    },

    convertLead: async (workspaceId, id, data) => {
        const response = await apiPost<{ contactId: string; companyId?: string; dealId?: string }>(
            `/workspaces/${workspaceId}/crm/leads/${id}/convert`,
            data
        );
        // Update lead status locally
        set((state) => ({
            leads: state.leads.map((l) =>
                l.id === id ? { ...l, status: 'CONVERTED' as const, convertedToContactId: response.contactId } : l
            ),
        }));
        return response;
    },

    // ========== FORM CRUD ==========

    fetchForms: async (workspaceId) => {
        set({ isLoading: true, error: null });
        try {
            const data = await apiGet<LeadForm[]>(`/workspaces/${workspaceId}/crm/forms`);
            set({ forms: data });
        } catch (e: any) {
            set({ error: e.message || 'Failed to fetch forms' });
        } finally {
            set({ isLoading: false });
        }
    },

    createForm: async (workspaceId, formData) => {
        const data = await apiPost<LeadForm>(`/workspaces/${workspaceId}/crm/forms`, formData);
        set((state) => ({ forms: [data, ...state.forms] }));
        return data;
    },

    updateForm: async (workspaceId, id, formData) => {
        const data = await apiPut<LeadForm>(`/workspaces/${workspaceId}/crm/forms/${id}`, formData);
        set((state) => ({
            forms: state.forms.map((f) => (f.id === id ? data : f)),
        }));
        return data;
    },

    deleteForm: async (workspaceId, id) => {
        await apiDelete(`/workspaces/${workspaceId}/crm/forms/${id}`);
        set((state) => ({
            forms: state.forms.filter((f) => f.id !== id),
        }));
    },

    getEmbedCode: async (workspaceId, id) => {
        return await apiGet<{ embedCode: string; formUrl: string }>(
            `/workspaces/${workspaceId}/crm/forms/${id}/embed`
        );
    },

    // ========== ACTIVITIES ==========

    fetchLeadActivities: async (workspaceId, leadId) => {
        try {
            const data = await apiGet<LeadActivity[]>(
                `/workspaces/${workspaceId}/crm/leads/${leadId}/activities`
            );
            set({ activities: data });
        } catch (e: any) {
            console.error('Failed to fetch lead activities:', e);
        }
    },

    // ========== DASHBOARD ==========

    fetchDashboardSummary: async (workspaceId) => {
        try {
            const data = await apiGet<DashboardSummary>(
                `/workspaces/${workspaceId}/crm/dashboard/summary`
            );
            set({ dashboardSummary: data });
        } catch (e: any) {
            console.error('Failed to fetch dashboard summary:', e);
        }
    },

    fetchLeadsBySource: async (workspaceId) => {
        try {
            const data = await apiGet<LeadsBySource[]>(
                `/workspaces/${workspaceId}/crm/dashboard/leads-by-source`
            );
            set({ leadsBySource: data });
        } catch (e: any) {
            console.error('Failed to fetch leads by source:', e);
        }
    },

    fetchConversionFunnel: async (workspaceId) => {
        try {
            const data = await apiGet<ConversionFunnel>(
                `/workspaces/${workspaceId}/crm/dashboard/conversion-funnel`
            );
            set({ conversionFunnel: data });
        } catch (e: any) {
            console.error('Failed to fetch conversion funnel:', e);
        }
    },

    // ========== UI ACTIONS ==========

    openLeadDetail: (id: string) => set({ activeLeadId: id, isDetailPanelOpen: true }),
    closeLeadDetail: () => set({ activeLeadId: null, isDetailPanelOpen: false }),
}));
