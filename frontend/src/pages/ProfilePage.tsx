import { useState, useRef } from 'react';
import { Save, User, Camera, Mail, Shield, AlertCircle } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { apiPut, apiPostMultipart } from '@/lib/api';
import { toast } from 'sonner';

export function ProfilePage() {
    const { user, fetchUser } = useUserStore();

    const [fullName, setFullName] = useState(user?.fullName || '');
    const [username, setUsername] = useState(user?.username || '');
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const userInitial = fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await apiPut('/profile', { fullName, username });
            await fetchUser(true); // Silent update
            toast.success('Profile updated successfully');
        } catch (err: any) {
            toast.error(err.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        // Show loading toast or optimistic UI could happen here
        const toastId = toast.loading('Uploading avatar...');

        try {
            await apiPostMultipart<any>('/profile/avatar', formData);
            await fetchUser(true);
            toast.success('Avatar updated', { id: toastId });
        } catch (err: any) {
            toast.error(err.message || 'Failed to upload avatar', { id: toastId });
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col h-full bg-background overflow-y-auto">
            {/* Page Header */}
            <div className="px-8 py-6 border-b border-border shrink-0">
                <h1 className="text-2xl font-semibold text-foreground tracking-tight">Profile Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage your personal information and account preferences</p>
            </div>

            <div className="flex-1 p-8 w-full h-full">
                <div className="grid grid-cols-1 md:grid-cols-[480px_1fr] gap-8 h-full">

                    {/* Left Column: Avatar & Summary */}
                    <section className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center text-center h-full">
                        <div className="relative group cursor-pointer mb-6" onClick={handleAvatarClick}>
                            <div className="w-40 h-40 rounded-full ring-4 ring-background shadow-lg overflow-hidden bg-muted relative">
                                {user?.avatarUrl ? (
                                    <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-5xl font-semibold">
                                        {userInitial}
                                    </div>
                                )}

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white">
                                    <Camera className="w-10 h-10 mb-2" />
                                    <span className="text-sm font-medium">Change</span>
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>

                        <h3 className="text-2xl font-semibold text-foreground mb-1">{fullName || 'Your Name'}</h3>
                        <p className="text-sm text-muted-foreground text-center break-all mb-4">{user?.email}</p>

                        <div className="px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full border border-primary/20">
                            Workspace Member
                        </div>
                    </section>

                    {/* Right Column: Edit Forms */}
                    <div className="space-y-6">

                        {/* Personal Information */}
                        <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-border bg-muted/30">
                                <h2 className="font-semibold text-foreground flex items-center gap-2">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    Public Profile
                                </h2>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Full Name</label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all"
                                            placeholder="Enter your name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Username</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="w-full pl-7 pr-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all"
                                                placeholder="username"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-muted/30 border-t border-border flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {isSaving ? 'Saving...' : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </section>

                        {/* Account Information (Read Only) */}
                        <section className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-border bg-muted/30">
                                <h2 className="font-semibold text-foreground flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-muted-foreground" />
                                    Account Security
                                </h2>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="w-full pl-9 pr-3 py-2 bg-muted text-muted-foreground border border-input rounded-md cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        Email is managed by your workspace administrator
                                    </div>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}
