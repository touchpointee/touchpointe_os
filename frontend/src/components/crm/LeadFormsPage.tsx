import { useEffect, useState } from 'react';
import { useLeadStore, type LeadForm } from '@/stores/leadStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { FormBuilder } from '@/components/crm/FormBuilder';
import { FormEmbedModal } from '@/components/crm/FormEmbedModal';
import {
    Plus,
    FileText,
    MoreVertical,
    Edit2,
    Trash2,
    Code2,
    ToggleLeft,
    ToggleRight,
    Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function LeadFormsPage() {
    const { activeWorkspace } = useWorkspaces();
    const { forms, fetchForms, updateForm, deleteForm, isLoading } = useLeadStore();

    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [editingForm, setEditingForm] = useState<LeadForm | null>(null);
    const [embedForm, setEmbedForm] = useState<LeadForm | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    useEffect(() => {
        if (activeWorkspace?.id) {
            fetchForms(activeWorkspace.id);
        }
    }, [activeWorkspace?.id]);

    const handleEdit = (form: LeadForm) => {
        setEditingForm(form);
        setIsBuilderOpen(true);
        setMenuOpenId(null);
    };

    const handleDelete = async (form: LeadForm) => {
        if (!activeWorkspace) return;
        if (confirm(`Delete "${form.name}"? This cannot be undone.`)) {
            await deleteForm(activeWorkspace.id, form.id);
        }
        setMenuOpenId(null);
    };

    const handleToggleActive = async (form: LeadForm) => {
        if (!activeWorkspace) return;
        await updateForm(activeWorkspace.id, form.id, { isActive: !form.isActive });
        setMenuOpenId(null);
    };

    const handleCloseBuilder = () => {
        setIsBuilderOpen(false);
        setEditingForm(null);
    };

    const handleSaveForm = () => {
        if (activeWorkspace?.id) {
            fetchForms(activeWorkspace.id);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                    <h1 className="text-xl font-bold">Lead Capture Forms</h1>
                    <p className="text-sm text-muted-foreground">
                        Create embeddable forms to capture leads on your website
                    </p>
                </div>
                <button
                    onClick={() => setIsBuilderOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
                >
                    <Plus size={18} />
                    Create Form
                </button>
            </div>

            {/* Forms Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : forms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <FileText size={28} className="text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Forms Yet</h3>
                        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                            Create your first lead capture form to start collecting leads from your website.
                        </p>
                        <button
                            onClick={() => setIsBuilderOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90"
                        >
                            <Plus size={18} />
                            Create Your First Form
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {forms.map((form) => (
                            <FormCard
                                key={form.id}
                                form={form}
                                onEdit={() => handleEdit(form)}
                                onDelete={() => handleDelete(form)}
                                onEmbed={() => setEmbedForm(form)}
                                onToggleActive={() => handleToggleActive(form)}
                                isMenuOpen={menuOpenId === form.id}
                                onMenuToggle={() => setMenuOpenId(menuOpenId === form.id ? null : form.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Form Builder Modal */}
            {isBuilderOpen && (
                <FormBuilder
                    form={editingForm}
                    onClose={handleCloseBuilder}
                    onSave={handleSaveForm}
                />
            )}

            {/* Embed Modal */}
            {embedForm && (
                <FormEmbedModal
                    form={embedForm}
                    onClose={() => setEmbedForm(null)}
                />
            )}
        </div>
    );
}

// ========== Form Card Component ==========

interface FormCardProps {
    form: LeadForm;
    onEdit: () => void;
    onDelete: () => void;
    onEmbed: () => void;
    onToggleActive: () => void;
    isMenuOpen: boolean;
    onMenuToggle: () => void;
}

function FormCard({
    form,
    onEdit,
    onDelete,
    onEmbed,
    onToggleActive,
    isMenuOpen,
    onMenuToggle
}: FormCardProps) {
    return (
        <div className="bg-card border border-border rounded-lg hover:shadow-md transition-shadow">
            <div className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{form.name}</h3>
                        {form.description && (
                            <p className="text-sm text-muted-foreground truncate mt-0.5">
                                {form.description}
                            </p>
                        )}
                    </div>
                    <div className="relative ml-2">
                        <button
                            onClick={onMenuToggle}
                            className="p-1 hover:bg-muted rounded"
                        >
                            <MoreVertical size={16} />
                        </button>

                        {isMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={onMenuToggle}
                                />
                                <div className="absolute right-0 top-8 w-40 bg-card border border-border rounded-md shadow-lg z-20 py-1">
                                    <button
                                        onClick={onEdit}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                                    >
                                        <Edit2 size={14} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={onEmbed}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                                    >
                                        <Code2 size={14} />
                                        Get Embed Code
                                    </button>
                                    <button
                                        onClick={onToggleActive}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                                    >
                                        {form.isActive ? (
                                            <>
                                                <ToggleLeft size={14} />
                                                Disable
                                            </>
                                        ) : (
                                            <>
                                                <ToggleRight size={14} />
                                                Enable
                                            </>
                                        )}
                                    </button>
                                    <hr className="my-1 border-border" />
                                    <button
                                        onClick={onDelete}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-destructive"
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-1.5">
                        <span className={cn(
                            "w-2 h-2 rounded-full",
                            form.isActive ? "bg-green-500" : "bg-gray-400"
                        )} />
                        <span className="text-xs text-muted-foreground">
                            {form.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {form.submissionCount} submission{form.submissionCount !== 1 ? 's' : ''}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={12} />
                        {format(new Date(form.createdAt), 'MMM d, yyyy')}
                    </div>
                    <button
                        onClick={onEmbed}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                        <Code2 size={12} />
                        Embed
                    </button>
                </div>
            </div>
        </div>
    );
}
