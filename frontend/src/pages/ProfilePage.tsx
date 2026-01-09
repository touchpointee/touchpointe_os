import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, User } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { apiPut } from '@/lib/api';

export function ProfilePage() {
    const navigate = useNavigate();
    const user = getCurrentUser();

    const [fullName, setFullName] = useState(user?.name || '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const userInitial = fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setSuccess(false);

        try {
            await apiPut('/auth/profile', { fullName });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-background/50 backdrop-blur-sm">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
                    <p className="text-sm text-muted-foreground">Manage your account settings</p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 max-w-2xl">
                {/* Avatar Section */}
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground text-3xl font-bold">{userInitial}</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">{fullName || user?.email}</h2>
                        <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                </div>

                {/* Form */}
                <div className="space-y-6">
                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Success */}
                    {success && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 text-sm">
                            Profile updated successfully!
                        </div>
                    )}

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            <User className="w-4 h-4 inline mr-1" />
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Your full name"
                            className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                    </div>

                    {/* Email (read-only) */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full px-4 py-2.5 bg-muted/30 border border-border rounded-lg text-muted-foreground cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !fullName.trim()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
