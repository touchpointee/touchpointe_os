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
        <div className="h-full flex flex-col p-4 gap-4">
            <div className="flex items-center justify-between shrink-0">
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

            <div className="flex-1 border rounded-md overflow-visible flex flex-col">
                {/* Header - Hidden on Mobile */}
                <div className="hidden md:grid grid-cols-[1.5fr_1.5fr_1fr_1fr_50px] bg-muted/50 text-left text-sm font-medium text-muted-foreground border-b shrink-0">
                    <div className="p-3">Name</div>
                    <div className="p-3">Domain</div>
                    <div className="p-3">Industry</div>
                    <div className="p-3">Added</div>
                    <div className="p-3"></div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto overflow-x-visible divide-y divide-border">
                    {isLoading ? (
                        <div className="p-4 text-center text-sm">Loading...</div>
                    ) : companies.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">No companies found</div>
                    ) : (
                        companies.map(company => (
                            <div key={company.id} className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_1fr_1fr_50px] hover:bg-muted/50 transition-colors group text-sm relative">
                                {/* Name */}
                                <div className="p-3 font-medium flex items-center gap-2">
                                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <Building2 size={16} />
                                    </div>
                                    <span className="truncate">{company.name}</span>
                                </div>

                                {/* Domain */}
                                <div className="px-3 pb-1 md:p-3 text-muted-foreground truncate">
                                    {company.domain}
                                </div>

                                {/* Industry */}
                                <div className="px-3 pb-1 md:p-3">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                        {company.industry}
                                    </span>
                                </div>

                                {/* Added Date */}
                                <div className="px-3 pb-3 md:p-3 flex items-center text-muted-foreground text-xs md:text-sm">
                                    <span className="md:hidden mr-2">Added:</span>
                                    {format(new Date(company.createdAt), 'MMM d, yyyy')}
                                </div>

                                {/* Actions */}
                                <div className="absolute top-2 right-2 md:static md:p-3 md:text-right">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpenId(menuOpenId === company.id ? null : company.id);
                                        }}
                                        className="p-2 hover:bg-muted rounded-md text-muted-foreground md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                    >
                                        <MoreHorizontal size={16} />
                                    </button>

                                    {menuOpenId === company.id && (
                                        <div className="absolute right-0 top-full mt-1 w-32 bg-background border border-border rounded-lg shadow-xl z-50 py-1">
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
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
