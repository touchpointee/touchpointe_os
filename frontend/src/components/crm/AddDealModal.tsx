import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useCrmStore } from '@/stores/crmStore';
import { useWorkspaces } from '@/stores/workspaceStore';

const DEAL_STAGES = [
    { id: 'NEW', label: 'New' },
    { id: 'DISCOVERY', label: 'Discovery' },
    { id: 'PROPOSAL', label: 'Proposal' },
    { id: 'NEGOTIATION', label: 'Negotiation' },
    { id: 'CLOSED_WON', label: 'Won' },
    { id: 'CLOSED_LOST', label: 'Lost' },
] as const;

interface AddDealModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultStage?: string;
}

export function AddDealModal({ isOpen, onClose, defaultStage = 'NEW' }: AddDealModalProps) {
    const { createDeal, contacts, fetchContacts } = useCrmStore();
    const { activeWorkspace } = useWorkspaces();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [value, setValue] = useState('');
    const [stage, setStage] = useState(defaultStage);
    const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen && activeWorkspace) {
            fetchContacts(activeWorkspace.id);
            setStage(defaultStage);
            setName('');
            setValue('');
            setSelectedContactIds([]);
        }
    }, [isOpen, defaultStage, activeWorkspace, fetchContacts]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeWorkspace) return;

        setIsLoading(true);
        try {
            await createDeal(activeWorkspace.id, {
                name,
                value: parseFloat(value) || 0,
                stage: stage as any,
                contactIds: selectedContactIds,
                // Owner is handled by backend (current user)
            });
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
                    <h2 className="text-lg font-semibold">Add New Deal</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Deal Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Acme Corp Contract"
                            className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Value</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={value}
                                    onChange={e => setValue(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full h-10 pl-7 pr-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Stage</label>
                            <select
                                value={stage}
                                onChange={e => setStage(e.target.value)}
                                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                            >
                                {DEAL_STAGES.map(s => (
                                    <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Contacts</label>
                        <select
                            multiple
                            value={selectedContactIds}
                            onChange={e => {
                                const selected = Array.from(e.target.selectedOptions, option => option.value);
                                setSelectedContactIds(selected);
                            }}
                            className="w-full h-24 px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        >
                            {contacts.map(c => (
                                <option key={c.id} value={c.id}>{c.fullName}</option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Owner</label>
                        <input
                            type="text"
                            disabled
                            value="Me (Current User)"
                            className="w-full h-10 px-3 rounded-md border border-border bg-muted text-muted-foreground cursor-not-allowed"
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
                            Create Deal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
