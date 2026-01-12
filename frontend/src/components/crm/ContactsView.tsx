
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

            <div className="border rounded-md overflow-hidden">
                {/* Header - Hidden on Mobile */}
                <div className="hidden md:grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_50px] bg-muted/50 text-left text-sm font-medium text-muted-foreground border-b">
                    <div className="p-3">Name</div>
                    <div className="p-3">Email</div>
                    <div className="p-3">Phone</div>
                    <div className="p-3">Company</div>
                    <div className="p-3">Added</div>
                    <div className="p-3"></div>
                </div>

                {/* Body */}
                <div className="divide-y divide-border">
                    {isLoading ? (
                        <div className="p-4 text-center text-sm">Loading...</div>
                    ) : contacts.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">No contacts found</div>
                    ) : (
                        contacts.map(contact => (
                            <div key={contact.id} className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_50px] hover:bg-muted/50 transition-colors group text-sm relative">
                                {/* Name */}
                                <div className="p-3 font-medium flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <User2 size={16} />
                                    </div>
                                    <span className="truncate">{contact.firstName} {contact.lastName}</span>
                                </div>

                                {/* Email */}
                                <div className="p-3 flex items-center md:items-start text-muted-foreground">
                                    <div className="flex items-center gap-2 max-w-full">
                                        <Mail size={14} className="shrink-0 md:hidden" />
                                        <span className="truncate">{contact.email}</span>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="px-3 pb-2 md:p-3 md:flex items-center">
                                    {contact.phone && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Phone size={14} className="shrink-0 md:hidden" />
                                            <span>{contact.phone}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Company */}
                                <div className="px-3 pb-2 md:p-3 md:flex items-center">
                                    {contact.companyName && (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Building2 size={14} className="shrink-0 md:hidden" />
                                            <span>{contact.companyName}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Added Date */}
                                <div className="px-3 pb-3 md:p-3 flex items-center text-muted-foreground text-xs md:text-sm">
                                    <span className="md:hidden mr-2">Added:</span>
                                    {format(new Date(contact.createdAt), 'MMM d, yyyy')}
                                </div>

                                {/* Actions */}
                                <div className="absolute top-2 right-2 md:static md:p-3 md:text-right">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpenId(menuOpenId === contact.id ? null : contact.id);
                                        }}
                                        className="p-2 hover:bg-muted rounded-md text-muted-foreground md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                    >
                                        <MoreHorizontal size={16} />
                                    </button>

                                    {menuOpenId === contact.id && (
                                        <div className="absolute right-0 top-full mt-1 w-32 bg-background border border-border rounded-lg shadow-xl z-50 py-1">
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
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
