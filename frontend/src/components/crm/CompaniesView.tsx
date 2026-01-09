import { useState, useEffect } from 'react';
import { useCrmStore } from '../../stores/crmStore';
import { useWorkspaces } from '../../stores/workspaceStore';
import { Building2, Plus, MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { CompanyModal } from './AddCompanyModal';
import type { Company } from '../../stores/crmStore';

export function CompaniesView() {
    const { companies, fetchCompanies, deleteCompany, isLoading } = useCrmStore();
    const { activeWorkspace } = useWorkspaces();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(undefined);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    useEffect(() => {
        if (activeWorkspace) {
            fetchCompanies(activeWorkspace.id);
        }
    }, [activeWorkspace, fetchCompanies]);

    // Close menu on click outside
    useEffect(() => {
        const handleClick = () => setMenuOpenId(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleEdit = (company: Company) => {
        setSelectedCompany(company);
        setIsAddModalOpen(true);
        setMenuOpenId(null);
    };

    const handleDelete = async (id: string) => {
        if (!activeWorkspace) return;
        if (window.confirm('Are you sure you want to delete this company?')) {
            await deleteCompany(activeWorkspace.id, id);
        }
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setSelectedCompany(undefined);
    };

    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Companies</h2>
                    <p className="text-sm text-muted-foreground">Manage your business accounts</p>
                </div>
                <button
                    onClick={() => { setSelectedCompany(undefined); setIsAddModalOpen(true); }}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 text-sm font-medium"
                >
                    <Plus size={16} /> Add Company
                </button>
            </div>

            <CompanyModal
                isOpen={isAddModalOpen}
                onClose={handleCloseModal}
                company={selectedCompany}
            />

            <div className="border rounded-md overflow-visible">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50 text-left">
                            <th className="p-3 font-medium text-muted-foreground">Name</th>
                            <th className="p-3 font-medium text-muted-foreground">Domain</th>
                            <th className="p-3 font-medium text-muted-foreground">Industry</th>
                            <th className="p-3 font-medium text-muted-foreground">Added</th>
                            <th className="w-[50px]"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                        ) : companies.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No companies found</td></tr>
                        ) : (
                            companies.map(company => (
                                <tr key={company.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors group">
                                    <td className="p-3 font-medium flex items-center gap-2">
                                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                                            <Building2 size={16} />
                                        </div>
                                        {company.name}
                                    </td>
                                    <td className="p-3 text-muted-foreground">{company.domain}</td>
                                    <td className="p-3">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                            {company.industry}
                                        </span>
                                    </td>
                                    <td className="p-3 text-muted-foreground">{format(new Date(company.createdAt), 'MMM d, yyyy')}</td>
                                    <td className="p-3 text-right relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMenuOpenId(menuOpenId === company.id ? null : company.id);
                                            }}
                                            className="p-2 hover:bg-muted rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>

                                        {menuOpenId === company.id && (
                                            <div className="absolute right-8 top-0 mt-2 w-32 bg-background border border-border rounded-lg shadow-xl z-50 py-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(company); }}
                                                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted transition-colors text-sm"
                                                >
                                                    <Pencil size={14} /> Edit
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(company.id); }}
                                                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-50 text-red-600 transition-colors text-sm"
                                                >
                                                    <Trash size={14} /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
