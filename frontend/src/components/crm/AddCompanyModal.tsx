import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCrmStore } from '@/stores/crmStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import type { Company } from '@/stores/crmStore';

interface CompanyModalProps {
    isOpen: boolean;
    onClose: () => void;
    company?: Company;
}

export function CompanyModal({ isOpen, onClose, company }: CompanyModalProps) {
    const { createCompany, updateCompany } = useCrmStore();
    const { activeWorkspace } = useWorkspaces();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [domain, setDomain] = useState('');
    const [industry, setIndustry] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (company) {
                setName(company.name);
                setDomain(company.domain);
                setIndustry(company.industry);
            } else {
                setName('');
                setDomain('');
                setIndustry('');
            }
        }
    }, [isOpen, company]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeWorkspace) return;

        setIsLoading(true);
        try {
            if (company) {
                await updateCompany(activeWorkspace.id, company.id, { name, domain, industry });
            } else {
                await createCompany(activeWorkspace.id, { name, domain, industry });
            }
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold">{company ? 'Edit Company' : 'Add New Company'}</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Company Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Acme Corp"
                            className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Domain</label>
                        <input
                            type="text"
                            value={domain}
                            onChange={e => setDomain(e.target.value)}
                            placeholder="e.g. acme.com"
                            className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Industry</label>
                        <input
                            type="text"
                            value={industry}
                            onChange={e => setIndustry(e.target.value)}
                            placeholder="e.g. Technology"
                            className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !name}
                            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {company ? 'Save Changes' : 'Create Company'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
