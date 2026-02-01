import { useState, useEffect } from 'react';
import { useLeadStore, type LeadForm } from '@/stores/leadStore';
import { useWorkspaces } from '@/stores/workspaceStore';
import { X, Copy, Check, ExternalLink, Code2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormEmbedModalProps {
    form: LeadForm;
    onClose: () => void;
}

export function FormEmbedModal({ form, onClose }: FormEmbedModalProps) {
    const { getEmbedCode } = useLeadStore();
    const { activeWorkspace } = useWorkspaces();

    const [embedCode, setEmbedCode] = useState<string>('');
    const [formUrl, setFormUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedType, setCopiedType] = useState<'embed' | 'url' | null>(null);
    const [activeTab, setActiveTab] = useState<'iframe' | 'link'>('iframe');

    useEffect(() => {
        if (activeWorkspace) {
            loadEmbedCode();
        }
    }, [activeWorkspace, form.id]);

    const loadEmbedCode = async () => {
        if (!activeWorkspace) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await getEmbedCode(activeWorkspace.id, form.id);
            setEmbedCode(data.embedCode);
            // Construct frontend URL for direct link, ignoring backend's API URL
            const publicUrl = `${window.location.protocol}//${window.location.host}/forms/${form.token}`;
            setFormUrl(publicUrl);
        } catch (err: any) {
            setError(err.message || 'Failed to load embed code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async (type: 'embed' | 'url') => {
        const text = type === 'embed' ? embedCode : formUrl;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedType(type);
            setTimeout(() => setCopiedType(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleOpenPreview = () => {
        if (formUrl) {
            window.open(formUrl, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
            <div className="bg-card border border-border rounded-lg w-full max-w-2xl mx-4 shadow-xl my-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div>
                        <h2 className="text-lg font-semibold">Embed Form</h2>
                        <p className="text-sm text-muted-foreground">{form.name}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
                            {error}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Tabs */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveTab('iframe')}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                        activeTab === 'iframe'
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Code2 size={16} />
                                    Embed Code
                                </button>
                                <button
                                    onClick={() => setActiveTab('link')}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                                        activeTab === 'link'
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Globe size={16} />
                                    Direct Link
                                </button>
                            </div>

                            {activeTab === 'iframe' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            HTML Embed Code
                                        </label>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Copy and paste this code into your website where you want the form to appear.
                                        </p>
                                        <div className="relative group">
                                            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[300px] text-xs font-mono whitespace-pre-wrap break-all border border-border">
                                                {embedCode}
                                            </pre>
                                            <button
                                                onClick={() => handleCopy('embed')}
                                                className={cn(
                                                    "absolute top-2 right-2 px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1 transition-all shadow-sm z-10",
                                                    copiedType === 'embed'
                                                        ? "bg-green-500 text-white"
                                                        : "bg-background border border-border text-foreground hover:bg-muted opacity-80 group-hover:opacity-100"
                                                )}
                                                title="Copy to clipboard"
                                            >
                                                {copiedType === 'embed' ? (
                                                    <>
                                                        <Check size={14} />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy size={14} />
                                                        Copy Code
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-muted/50 p-3 rounded-md">
                                        <h4 className="text-sm font-medium mb-2">💡 Tips</h4>
                                        <ul className="text-xs text-muted-foreground space-y-1">
                                            <li>• The form will inherit your website's styling</li>
                                            <li>• Make sure the container is wide enough (min 400px)</li>
                                            <li>• Form submissions create leads automatically</li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'link' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Form URL
                                        </label>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Share this link directly or use it in emails, social media, etc.
                                        </p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={formUrl}
                                                readOnly
                                                className="flex-1 px-3 py-2 text-sm font-mono bg-muted border border-border rounded-md"
                                            />
                                            <button
                                                onClick={() => handleCopy('url')}
                                                className={cn(
                                                    "px-4 py-2 text-sm font-medium rounded-md flex items-center gap-1 transition-colors",
                                                    copiedType === 'url'
                                                        ? "bg-green-500 text-white"
                                                        : "bg-primary text-primary-foreground hover:opacity-90"
                                                )}
                                            >
                                                {copiedType === 'url' ? (
                                                    <>
                                                        <Check size={14} />
                                                        Copied!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy size={14} />
                                                        Copy
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={handleOpenPreview}
                                                className="px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 rounded-md flex items-center gap-1"
                                            >
                                                <ExternalLink size={14} />
                                                Preview
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-muted/50 p-3 rounded-md">
                                        <h4 className="text-sm font-medium mb-2">🔗 Quick Links</h4>
                                        <div className="flex flex-wrap gap-2">
                                            <a
                                                href={`mailto:?subject=Share Form&body=Fill out this form: ${formUrl}`}
                                                className="text-xs px-2 py-1 bg-card border border-border rounded hover:bg-muted"
                                            >
                                                📧 Share via Email
                                            </a>
                                            <a
                                                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(formUrl)}&text=Fill out this form`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs px-2 py-1 bg-card border border-border rounded hover:bg-muted"
                                            >
                                                🐦 Tweet
                                            </a>
                                            <a
                                                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(formUrl)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs px-2 py-1 bg-card border border-border rounded hover:bg-muted"
                                            >
                                                💼 LinkedIn
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Form Stats */}
                            <div className="pt-4 border-t border-border">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Total Submissions</span>
                                    <span className="font-semibold">{form.submissionCount}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm mt-1">
                                    <span className="text-muted-foreground">Status</span>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-xs font-medium",
                                        form.isActive
                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    )}>
                                        {form.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-4 border-t border-border">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 rounded-md"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
