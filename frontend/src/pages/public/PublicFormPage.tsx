import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiGet, apiPost } from '@/lib/api';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FormField {
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    required: boolean;
    name: string;
    options?: string[];
}

interface PublicFormInfo {
    name: string;
    fieldsConfig: {
        fields: FormField[];
        submitLabel: string;
        submitColor: string;
        borderRadius: string;
    };
    successMessage: string;
}

export default function PublicFormPage() {
    const { token } = useParams<{ token: string }>();
    const [form, setForm] = useState<PublicFormInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState<Record<string, string>>({});

    useEffect(() => {
        if (token) {
            loadForm();
        }
    }, [token]);

    const loadForm = async () => {
        try {
            const data = await apiGet<PublicFormInfo>(`/public/forms/${token}`);
            setForm(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load form');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // Collect UTM params from URL
            const params = new URLSearchParams(window.location.search);
            const submitData = {
                ...formData,
                utmSource: params.get('utm_source'),
                utmMedium: params.get('utm_medium'),
                utmCampaign: params.get('utm_campaign')
            };

            await apiPost(`/public/forms/${token}/submit`, submitData);
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Submission failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error && !form) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm text-center">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                    <h1 className="text-xl font-bold mb-2">Form Not Found</h1>
                    <p className="text-muted-foreground">{error}</p>
                </div>
            </div>
        );
    }

    if (!form) return null;

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm text-center animate-in fade-in zoom-in duration-300">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
                    <p className="text-muted-foreground">{form.successMessage}</p>
                </div>
            </div>
        );
    }

    // Parse config (backend stores it as object/array, but might be stringified if using older format)
    let parsedConfig: any = form.fieldsConfig;
    if (typeof form.fieldsConfig === 'string') {
        try {
            parsedConfig = JSON.parse(form.fieldsConfig);
        } catch (e) {
            parsedConfig = [];
        }
    }

    // Handle both cases: Array (current FormBuilder) or Object (future/legacy)
    const fields: FormField[] = Array.isArray(parsedConfig) ? parsedConfig : (parsedConfig?.fields || []);

    // Default styles since they aren't saved in current builder
    const submitLabel = parsedConfig?.submitLabel || 'Submit';
    const submitColor = parsedConfig?.submitColor || '#000000';
    const borderRadius = parsedConfig?.borderRadius || '4px';

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-8">
                    <h1 className="text-2xl font-bold text-center mb-2">{form.name}</h1>
                    <p className="text-center text-muted-foreground text-sm mb-8">
                        Please fill out the form below
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {fields.map((field) => (
                            <div key={field.id} className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>

                                {field.type === 'textarea' ? (
                                    <textarea
                                        required={field.required}
                                        placeholder={field.placeholder}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 bg-white placeholder:text-gray-400"
                                        rows={3}
                                        style={{ borderRadius: `${parseInt(borderRadius) || 4}px` }}
                                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                                    />
                                ) : field.type === 'select' ? (
                                    <select
                                        required={field.required}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 bg-white"
                                        style={{ borderRadius: `${parseInt(borderRadius) || 4}px` }}
                                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                                        defaultValue=""
                                    >
                                        <option value="" disabled className="text-gray-400">Select an option</option>
                                        {field.options?.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={field.type}
                                        required={field.required}
                                        placeholder={field.placeholder}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow text-gray-900 bg-white placeholder:text-gray-400"
                                        style={{ borderRadius: `${parseInt(borderRadius) || 4}px` }}
                                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                                    />
                                )}
                            </div>
                        ))}

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-2.5 px-4 text-white font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                backgroundColor: submitColor || '#000000',
                                borderRadius: `${parseInt(borderRadius) || 4}px`
                            }}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Submitting...
                                </span>
                            ) : (
                                submitLabel || 'Submit'
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Branding Footer */}
            <div className="mt-8 text-center">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    Powered by <span className="font-bold text-gray-900">TouchPointe</span>
                </p>
            </div>
        </div>
    );
}
