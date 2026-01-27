import { useState, useEffect } from 'react';
import { useWorkspaces } from '@/stores/workspaceStore';
import { apiGet, apiPost } from '@/lib/api';
import { Facebook, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useSearchParams, useNavigate, useLocation, useParams } from 'react-router-dom';

interface FacebookPage {
    id: string;
    name: string;
    category?: string;
    accessToken: string;
}

interface FacebookIntegration {
    id: string;
    pageId: string;
    pageName: string;
    isActive: boolean;
    connectedAt: string;
    pageAccessToken?: string; // Added for API calls
}

export function CrmIntegrationsPage() {
    const { activeWorkspace } = useWorkspaces();
    const { workspaceId } = useParams<{ workspaceId: string }>();
    const effectiveWorkspaceId = activeWorkspace?.id || workspaceId;
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [isLoading, setIsLoading] = useState(true);
    const [integration, setIntegration] = useState<FacebookIntegration | null>(null);
    const [availablePages, setAvailablePages] = useState<FacebookPage[]>([]);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check for OAuth callback token
    // Check for OAuth callback token - Robust check
    let fbToken = searchParams.get('facebook_token');
    if (!fbToken) {
        // Fallback for some browsers/situations where searchParams might miss it
        const params = new URLSearchParams(window.location.search);
        fbToken = params.get('facebook_token');
    }
    const oauthError = searchParams.get('error');

    useEffect(() => {
        if (!effectiveWorkspaceId) return;
        checkStatus();
    }, [effectiveWorkspaceId]);

    useEffect(() => {
        if (effectiveWorkspaceId && fbToken && !integration) {
            fetchPages(fbToken);
        } else if (oauthError) {
            setError(decodeURIComponent(oauthError));
            setIsLoading(false);
        }
    }, [effectiveWorkspaceId, fbToken, oauthError, integration]);

    const checkStatus = async () => {
        try {
            const data = await apiGet<FacebookIntegration>(`/workspaces/${effectiveWorkspaceId}/integrations/facebook`);
            // data might be {} if 204 No Content
            if (data && data.id) {
                setIntegration(data);
            } else {
                setIntegration(null);
            }
        } catch (err: any) {
            console.error("Failed to check status", err);
            setIntegration(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectClick = async () => {
        if (!effectiveWorkspaceId) return;
        setIsConnecting(true);
        try {
            const res = await apiGet<{ url: string }>(`/workspaces/${effectiveWorkspaceId}/integrations/facebook/connect`);
            window.location.href = res.url;
        } catch (err: any) {
            setError(err.message || "Failed to start connection");
            setIsConnecting(false);
        }
    };

    const fetchPages = async (token: string) => {
        setIsLoading(true);
        try {
            const pages = await apiGet<FacebookPage[]>(`/workspaces/${effectiveWorkspaceId}/integrations/facebook/pages?userAccessToken=${token}`);
            setAvailablePages(pages);

            // Clean URL params but keep token in state? 
            // Actually, if we navigate away/refresh, we lose token. 
            // We rely on token being in URL or availablePages being set.
        } catch (err: any) {
            setError(err.message || "Failed to fetch Facebook pages");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePageSelect = async (page: FacebookPage) => {
        if (!effectiveWorkspaceId || !fbToken) return;
        setIsConnecting(true);
        try {
            await apiPost(`/workspaces/${effectiveWorkspaceId}/integrations/facebook/subscribe`, {
                pageId: page.id,
                userAccessToken: fbToken
            });

            // Refresh status
            await checkStatus();
            setAvailablePages([]);

            // Clean URL
            navigate(location.pathname, { replace: true });
        } catch (err: any) {
            console.error("Connect Page Error:", err);
            // Try to extract server error message if available
            const serverMsg = err.response?.data?.error || err.message || "Failed to connect page";
            setError(serverMsg);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm("Are you sure? This will stop leads from syncing.")) return;
        alert("Disconnect feature coming soon. You can revoke access in Facebook Business Settings.");
    };

    // --- Import Modal State ---
    const [showImportModal, setShowImportModal] = useState(false);
    const [forms, setForms] = useState<any[]>([]); // simplified type
    const [selectedForm, setSelectedForm] = useState<string>("");
    const [leads, setLeads] = useState<any[]>([]); // simplified type
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
    const [isImporting, setIsImporting] = useState(false);

    const handleOpenImport = async () => {
        if (!integration) return;
        setShowImportModal(true);
        setIsLoading(true);
        try {
            const res = await apiGet<any[]>(`/workspaces/${effectiveWorkspaceId}/integrations/facebook/forms?pageId=${integration.pageId}&accessToken=${integration.pageAccessToken || fbToken}`);
            setForms(res);
        } catch (err: any) {
            console.error("Failed to load forms", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSelect = async (formId: string) => {
        setSelectedForm(formId);
        setIsLoading(true);
        try {
            const res = await apiGet<any[]>(`/workspaces/${effectiveWorkspaceId}/integrations/facebook/forms/${formId}/leads?accessToken=${integration?.pageAccessToken || fbToken}`);
            setLeads(res);
            setSelectedLeads(new Set()); // clear previous selection
        } catch (err: any) {
            console.error("Failed to load leads", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleLead = (leadId: string) => {
        const next = new Set(selectedLeads);
        if (next.has(leadId)) next.delete(leadId);
        else next.add(leadId);
        setSelectedLeads(next);
    };

    const handleImport = async () => {
        if (!integration || !selectedForm || selectedLeads.size === 0) return;
        setIsImporting(true);
        try {
            const payload = {
                pageId: integration.pageId,
                formId: selectedForm,
                leadIds: Array.from(selectedLeads)
            };
            const res = await apiPost<{ imported: number, failed: number }>(`/workspaces/${effectiveWorkspaceId}/integrations/facebook/leads/import`, payload);
            alert(`Imported ${res.imported} leads! (${res.failed} failed)`);
            setShowImportModal(false);
        } catch (err: any) {
            alert("Import failed: " + err.message);
        } finally {
            setIsImporting(false);
        }
    };


    if (isLoading && !fbToken && !showImportModal) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">CRM Integrations</h1>

            {error && (
                <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
                    <AlertCircle size={20} />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto hover:opacity-75"><X size={16} /></button>
                </div>
            )}

            <div className="grid gap-6">
                {/* Facebook Card */}
                <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-lg text-white">
                                <Facebook size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Facebook Lead Ads</h3>
                                <p className="text-sm text-muted-foreground">Sync leads from Facebook Forms directly to CRM</p>
                            </div>
                        </div>
                        {integration && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <CheckCircle size={12} /> Connected
                            </span>
                        )}
                    </div>

                    <div className="py-4">
                        {integration ? (
                            <div className="bg-muted/50 rounded-lg p-4 border border-border">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-medium">Connected to Page</p>
                                        <p className="text-lg font-semibold">{integration.pageName}</p>
                                        <p className="text-xs text-muted-foreground mt-1">ID: {integration.pageId}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleOpenImport}
                                            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-sm font-medium"
                                        >
                                            Import Existing Leads
                                        </button>
                                        <button
                                            onClick={handleDisconnect}
                                            className="text-sm text-destructive hover:underline px-2"
                                        >
                                            Disconnect
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : fbToken && availablePages.length > 0 ? (
                            <div className="space-y-3">
                                <p className="text-sm font-medium">Select a Facebook Page to connect:</p>
                                <div className="grid gap-2 max-h-60 overflow-y-auto">
                                    {availablePages.map(page => (
                                        <div key={page.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-primary/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="font-medium">{page.name}</span>
                                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{page.category}</span>
                                            </div>
                                            <button
                                                onClick={() => handlePageSelect(page)}
                                                disabled={isConnecting}
                                                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
                                            >
                                                {isConnecting ? 'Connecting...' : 'Connect'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-amber-50 p-4 rounded-lg text-sm text-amber-900 mb-4 border border-amber-200">
                                <p className="font-semibold mb-1">No Facebook Pages Found</p>
                                <p className="mb-3">We couldn't find any Facebook Pages managed by you. Please ensure you granted "Pages" permission when connecting.</p>
                                <button
                                    onClick={() => {
                                        // Clear token from URL to reset state
                                        window.location.href = window.location.pathname;
                                    }}
                                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-md font-medium transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>

                    {!integration && !fbToken && (
                        <button
                            onClick={handleConnectClick}
                            disabled={isConnecting}
                            className="w-full sm:w-auto px-4 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-md font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                        >
                            {isConnecting ? <Loader2 className="animate-spin w-4 h-4" /> : <Facebook size={18} />}
                            Connect with Facebook
                        </button>
                    )}
                </div>
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Import Historical Leads</h2>
                            <button onClick={() => setShowImportModal(false)}><X size={20} /></button>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto">
                            {!selectedForm ? (
                                <div>
                                    <p className="mb-4 text-sm text-muted-foreground">Select a Lead Form to view leads:</p>
                                    <div className="grid gap-2">
                                        {forms.map(form => (
                                            <button
                                                key={form.id}
                                                onClick={() => handleFormSelect(form.id)}
                                                className="flex justify-between p-3 border rounded text-left hover:bg-muted"
                                            >
                                                <span className="font-medium">{form.name}</span>
                                                <span className="text-sm text-muted-foreground">{form.leadCount} leads • {form.status}</span>
                                            </button>
                                        ))}
                                        {forms.length === 0 && <p className="text-center text-muted-foreground py-4">No forms found.</p>}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <button onClick={() => setSelectedForm("")} className="mb-4 text-sm text-blue-600 hover:underline">← Back to Forms</button>

                                    <div className="border rounded-md overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-muted text-muted-foreground">
                                                <tr>
                                                    <th className="p-2 w-10">
                                                        {/* Select All Checkbox could go here */}
                                                    </th>
                                                    <th className="p-2">Name</th>
                                                    <th className="p-2">Email</th>
                                                    <th className="p-2">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leads.map(lead => (
                                                    <tr key={lead.id} className="border-t hover:bg-muted/50">
                                                        <td className="p-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedLeads.has(lead.id)}
                                                                onChange={() => toggleLead(lead.id)}
                                                            />
                                                        </td>
                                                        <td className="p-2 font-medium">{lead.fullName || "N/A"}</td>
                                                        <td className="p-2">{lead.email || "N/A"}</td>
                                                        <td className="p-2 text-muted-foreground">{new Date(lead.createdTime).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                                {leads.length === 0 && (
                                                    <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No leads found for this form.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t flex justify-end gap-2">
                            <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-sm">Cancel</button>
                            {selectedForm && (
                                <button
                                    onClick={handleImport}
                                    disabled={selectedLeads.size === 0 || isImporting}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
                                >
                                    {isImporting ? "Importing..." : `Import ${selectedLeads.size} Leads`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
