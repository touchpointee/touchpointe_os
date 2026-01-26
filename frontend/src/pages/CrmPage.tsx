import { Routes, Route, Navigate } from 'react-router-dom';
import { CompaniesView } from '@/components/crm/CompaniesView';
import { ContactsView } from '@/components/crm/ContactsView';
import { DealsView } from '@/components/crm/DealsView';
import { LeadsKanban } from '@/components/crm/LeadsKanban';
import { CrmDashboardPage } from '@/components/crm/CrmDashboardPage';

export function CrmPage() {
    return (
        <div className="h-full w-full bg-background no-doc-scroll">
            {/* Main Content Area - Full Width/Height */}
            <div className="h-full w-full overflow-hidden">
                <Routes>
                    <Route path="/" element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<CrmDashboardPage />} />
                    <Route path="leads" element={<LeadsKanban />} />
                    <Route path="companies" element={<CompaniesView />} />
                    <Route path="contacts" element={<ContactsView />} />
                    <Route path="deals" element={<DealsView />} />
                </Routes>
            </div>
        </div>
    );
}
