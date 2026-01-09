
import { useState, useEffect } from 'react';
import { useCrmStore } from '../../stores/crmStore';
import { useWorkspaces } from '../../stores/workspaceStore';
import { User2, Plus, MoreHorizontal, Mail, Phone, Building2, Pencil, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { ContactModal } from './AddContactModal';
import type { Contact } from '../../stores/crmStore';

export function ContactsView() {
    const { contacts, fetchContacts, deleteContact, isLoading } = useCrmStore();
    const { activeWorkspace } = useWorkspaces();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | undefined>(undefined);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    useEffect(() => {
        if (activeWorkspace) {
            fetchContacts(activeWorkspace.id);
        }
    }, [activeWorkspace, fetchContacts]);

    // Close menu on click outside
    useEffect(() => {
        const handleClick = () => setMenuOpenId(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleEdit = (contact: Contact) => {
        setSelectedContact(contact);
        setIsAddModalOpen(true);
        setMenuOpenId(null);
    };

    const handleDelete = async (id: string) => {
        if (!activeWorkspace) return;
        if (window.confirm('Are you sure you want to delete this contact?')) {
            await deleteContact(activeWorkspace.id, id);
        }
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setSelectedContact(undefined);
    };

    return (
        <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Contacts</h2>
                    <p className="text-sm text-muted-foreground">Manage your people and leads</p>
                </div>
                <button
                    onClick={() => { setSelectedContact(undefined); setIsAddModalOpen(true); }}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 text-sm font-medium"
                >
                    <Plus size={16} /> Add Contact
                </button>
            </div>

            <ContactModal
                isOpen={isAddModalOpen}
                onClose={handleCloseModal}
                contact={selectedContact}
            />

            <div className="border rounded-md overflow-visible">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-muted/50 text-left">
                            <th className="p-3 font-medium text-muted-foreground">Name</th>
                            <th className="p-3 font-medium text-muted-foreground">Email</th>
                            <th className="p-3 font-medium text-muted-foreground">Phone</th>
                            <th className="p-3 font-medium text-muted-foreground">Company</th>
                            <th className="p-3 font-medium text-muted-foreground">Added</th>
                            <th className="w-[50px]"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
                        ) : contacts.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No contacts found</td></tr>
                        ) : (
                            contacts.map(contact => (
                                <tr key={contact.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors group">
                                    <td className="p-3 font-medium flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <User2 size={16} />
                                        </div>
                                        {contact.firstName} {contact.lastName}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Mail size={14} />
                                            {contact.email}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        {contact.phone && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Phone size={14} />
                                                {contact.phone}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3">
                                        {contact.companyName && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Building2 size={14} />
                                                {contact.companyName}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3 text-muted-foreground">{format(new Date(contact.createdAt), 'MMM d, yyyy')}</td>
                                    <td className="p-3 text-right relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMenuOpenId(menuOpenId === contact.id ? null : contact.id);
                                            }}
                                            className="p-2 hover:bg-muted rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>

                                        {menuOpenId === contact.id && (
                                            <div className="absolute right-8 top-0 mt-2 w-32 bg-background border border-border rounded-lg shadow-xl z-50 py-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(contact); }}
                                                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted transition-colors text-sm"
                                                >
                                                    <Pencil size={14} /> Edit
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(contact.id); }}
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
