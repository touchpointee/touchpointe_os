import { useState } from 'react';
import { useLeadStore, type LeadForm } from '@/stores/leadStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { X, Plus, Trash2, GripVertical, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormField {
    id: string;
    name: string;
    label: string;
    type: 'text' | 'email' | 'phone' | 'textarea' | 'select';
    required: boolean;
    placeholder?: string;
    options?: string[]; // For select fields
}

const DEFAULT_FIELDS: FormField[] = [
    { id: '1', name: 'firstName', label: 'First Name', type: 'text', required: true, placeholder: 'John' },
    { id: '2', name: 'lastName', label: 'Last Name', type: 'text', required: true, placeholder: 'Doe' },
    { id: '3', name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'john@example.com' },
    { id: '4', name: 'phone', label: 'Phone', type: 'phone', required: false, placeholder: '+1 234 567 8900' },
    { id: '5', name: 'companyName', label: 'Company', type: 'text', required: false, placeholder: 'Acme Inc.' },
];

interface FormBuilderProps {
    form?: LeadForm | null;
    onClose: () => void;
    onSave: () => void;
}

export function FormBuilder({ form, onClose, onSave }: FormBuilderProps) {
    const { createForm, updateForm } = useLeadStore();
    const { activeWorkspace } = useWorkspaces();

    const [name, setName] = useState(form?.name || '');
    const [description, setDescription] = useState(form?.description || '');
    const [successMessage, setSuccessMessage] = useState(form?.successMessage || 'Thank you for your submission!');
    const [successRedirectUrl, setSuccessRedirectUrl] = useState(form?.successRedirectUrl || '');
    const [isActive, setIsActive] = useState(form?.isActive ?? true);
    const [fields, setFields] = useState<FormField[]>(() => {
        if (form?.fieldsConfig) {
            try {
                let parsed = form.fieldsConfig;
                // If it's a JSON string, parse it
                if (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }
                // Ensure it's an array
                if (Array.isArray(parsed)) {
                    return parsed as FormField[];
                }
                return DEFAULT_FIELDS;
            } catch (e) {
                console.error("Failed to parse form fields:", e);
                return DEFAULT_FIELDS;
            }
        }
        return DEFAULT_FIELDS;
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'fields' | 'settings' | 'preview'>('fields');

    const handleAddField = () => {
        const newField: FormField = {
            id: Date.now().toString(),
            name: `custom_${Date.now()}`,
            label: 'New Field',
            type: 'text',
            required: false,
            placeholder: ''
        };
        setFields([...fields, newField]);
    };

    const handleRemoveField = (id: string) => {
        // Don't allow removing required core fields
        const coreFields = ['firstName', 'lastName', 'email'];
        const field = fields.find(f => f.id === id);
        if (field && coreFields.includes(field.name)) return;
        setFields(fields.filter(f => f.id !== id));
    };

    const handleUpdateField = (id: string, updates: Partial<FormField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeWorkspace || !name.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const formData = {
                name: name.trim(),
                description: description.trim() || undefined,
                successMessage,
                successRedirectUrl: successRedirectUrl.trim() || undefined,
                isActive,
                fieldsConfig: fields
            };

            if (form) {
                await updateForm(activeWorkspace.id, form.id, formData);
            } else {
                await createForm(activeWorkspace.id, formData);
            }
            onSave();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save form');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg w-full max-w-4xl mx-4 shadow-xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold">
                        {form ? 'Edit Form' : 'Create Lead Capture Form'}
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                    {(['fields', 'settings', 'preview'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-4 py-2.5 text-sm font-medium capitalize transition-colors",
                                activeTab === tab
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {tab === 'fields' && '📝 '}
                            {tab === 'settings' && '⚙️ '}
                            {tab === 'preview' && '👁️ '}
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4">
                        {error && (
                            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded">
                                {error}
                            </div>
                        )}

                        {/* Fields Tab */}
                        {activeTab === 'fields' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Form Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g., Contact Us Form"
                                        className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Brief description of this form"
                                        className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>

                                <div className="border-t border-border pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold">Form Fields</h3>
                                        <button
                                            type="button"
                                            onClick={handleAddField}
                                            className="flex items-center gap-1 text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:opacity-90"
                                        >
                                            <Plus size={14} />
                                            Add Field
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {fields.map((field) => (
                                            <FieldEditor
                                                key={field.id}
                                                field={field}
                                                onUpdate={(updates) => handleUpdateField(field.id, updates)}
                                                onRemove={() => handleRemoveField(field.id)}
                                                isCore={['firstName', 'lastName', 'email'].includes(field.name)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Settings Tab */}
                        {activeTab === 'settings' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Success Message</label>
                                    <textarea
                                        value={successMessage}
                                        onChange={(e) => setSuccessMessage(e.target.value)}
                                        rows={2}
                                        placeholder="Message shown after form submission"
                                        className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Redirect URL (Optional)</label>
                                    <input
                                        type="url"
                                        value={successRedirectUrl}
                                        onChange={(e) => setSuccessRedirectUrl(e.target.value)}
                                        placeholder="https://example.com/thank-you"
                                        className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        If set, users will be redirected here after submission
                                    </p>
                                </div>

                                <div className="flex items-center justify-between p-3 border border-border rounded-md">
                                    <div>
                                        <p className="text-sm font-medium">Form Status</p>
                                        <p className="text-xs text-muted-foreground">
                                            {isActive ? 'Form is accepting submissions' : 'Form is disabled'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsActive(!isActive)}
                                        className={cn(
                                            "p-1 rounded transition-colors",
                                            isActive ? "text-green-500" : "text-muted-foreground"
                                        )}
                                    >
                                        {isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Preview Tab */}
                        {activeTab === 'preview' && (
                            <div className="bg-muted/30 rounded-lg p-6">
                                <div className="max-w-md mx-auto bg-card border border-border rounded-lg p-6 shadow-sm">
                                    <h3 className="text-lg font-semibold mb-4">{name || 'Form Title'}</h3>
                                    {description && (
                                        <p className="text-sm text-muted-foreground mb-4">{description}</p>
                                    )}
                                    <div className="space-y-4">
                                        {fields.map((field) => (
                                            <div key={field.id}>
                                                <label className="block text-sm font-medium mb-1">
                                                    {field.label}
                                                    {field.required && <span className="text-destructive ml-0.5">*</span>}
                                                </label>
                                                {field.type === 'textarea' ? (
                                                    <textarea
                                                        placeholder={field.placeholder}
                                                        disabled
                                                        rows={3}
                                                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm resize-none"
                                                    />
                                                ) : field.type === 'select' ? (
                                                    <select
                                                        disabled
                                                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                                                    >
                                                        <option>{field.placeholder || 'Select...'}</option>
                                                        {field.options?.map((opt, i) => (
                                                            <option key={i}>{opt}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type={field.type}
                                                        placeholder={field.placeholder}
                                                        disabled
                                                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            disabled
                                            className="w-full py-2.5 bg-primary text-primary-foreground rounded-md font-medium"
                                        >
                                            Submit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-2 p-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : form ? 'Update Form' : 'Create Form'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ========== Field Editor Component ==========

interface FieldEditorProps {
    field: FormField;
    onUpdate: (updates: Partial<FormField>) => void;
    onRemove: () => void;
    isCore: boolean;
}

function FieldEditor({ field, onUpdate, onRemove, isCore }: FieldEditorProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="border border-border rounded-md bg-card">
            <div
                className="flex items-center gap-2 p-3 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <GripVertical size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium flex-1">{field.label}</span>
                <span className="text-xs text-muted-foreground">{field.type}</span>
                {field.required && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Required</span>
                )}
                {!isCore && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        className="p-1 text-muted-foreground hover:text-destructive"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-border space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium mb-1">Label</label>
                            <input
                                type="text"
                                value={field.label}
                                onChange={(e) => onUpdate({ label: e.target.value })}
                                className="w-full px-2 py-1.5 text-sm border border-border rounded bg-background"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1">Type</label>
                            <select
                                value={field.type}
                                onChange={(e) => onUpdate({ type: e.target.value as FormField['type'] })}
                                disabled={isCore}
                                className="w-full px-2 py-1.5 text-sm border border-border rounded bg-background"
                            >
                                <option value="text">Text</option>
                                <option value="email">Email</option>
                                <option value="phone">Phone</option>
                                <option value="textarea">Text Area</option>
                                <option value="select">Dropdown</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium mb-1">Placeholder</label>
                        <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => onUpdate({ placeholder: e.target.value })}
                            className="w-full px-2 py-1.5 text-sm border border-border rounded bg-background"
                        />
                    </div>

                    {!isCore && (
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => onUpdate({ required: e.target.checked })}
                                className="w-4 h-4"
                            />
                            Required field
                        </label>
                    )}
                </div>
            )}
        </div>
    );
}
