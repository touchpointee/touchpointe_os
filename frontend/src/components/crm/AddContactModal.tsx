import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCrmStore } from '@/stores/crmStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import type { Contact } from '@/stores/crmStore';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    contact?: Contact;
}

export function ContactModal({ isOpen, onClose, contact }: ContactModalProps) {
    const { createContact, updateContact, companies, fetchCompanies } = useCrmStore();
    const { activeWorkspace } = useWorkspaces();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [companyId, setCompanyId] = useState('');

    useEffect(() => {
        if (isOpen && activeWorkspace) {
            fetchCompanies(activeWorkspace.id);
            if (contact) {
                setFirstName(contact.firstName);
                setLastName(contact.lastName);
                setEmail(contact.email);
                setPhone(contact.phone);
                setCompanyId(contact.companyId || '');
            } else {
                setFirstName('');
                setLastName('');
                setEmail('');
                setPhone('');
                setCompanyId('');
            }
        }
    }, [isOpen, activeWorkspace, fetchCompanies, contact]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeWorkspace) return;

        setIsLoading(true);
        try {
            if (contact) {
                await updateContact(activeWorkspace.id, contact.id, {
                    firstName,
                    lastName,
                    email,
                    phone,
                    companyId: companyId || undefined
                });
            } else {
                await createContact(activeWorkspace.id, {
                    firstName,
                    lastName,
                    email,
                    phone,
                    companyId: companyId || undefined
                });
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
                    <h2 className="text-lg font-semibold">{contact ? 'Edit Contact' : 'Add New Contact'}</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">First Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                placeholder="John"
                                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Last Name <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                placeholder="Doe"
                                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email <span className="text-red-500">*</span></label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Phone</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="+1 (555) 000-0000"
                            className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Company</label>
                        <select
                            value={companyId}
                            onChange={e => setCompanyId(e.target.value)}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                        >
                            <option value="">No Company</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
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
                            disabled={isLoading || !firstName || !lastName || !email}
                            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {contact ? 'Save Changes' : 'Create Contact'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
