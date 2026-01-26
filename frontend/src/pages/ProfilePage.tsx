import { useState, useRef } from 'react';
import { Save, User, Camera, Mail } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { apiPut, apiPostMultipart } from '@/lib/api';


export function ProfilePage() {
    const { user, fetchUser } = useUserStore();

    const [fullName, setFullName] = useState(user?.fullName || '');
    const [username, setUsername] = useState(user?.username || '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const userInitial = fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        setSuccess(false);

        try {
            await apiPut('/profile', { fullName, username });
            await fetchUser(true); // Silent update to prevent blinking
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
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
            setError('Please select an image file');
            return;
        }

        // 5MB limit
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size should be less than 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setIsSaving(true);
        setError(null);

        try {
            await apiPostMultipart<any>('/profile/avatar', formData);
            await fetchUser(true);
        } catch (err: any) {
            setError(err.message || 'Failed to upload avatar');
        } finally {
            setIsSaving(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-gradient-to-br from-background to-muted/20">
            <div className="min-h-full w-full flex items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    <div className="bg-card/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden relative">
                        {/* Decorative Header Background */}
                        <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent relative overflow-hidden">
                            <div className="absolute inset-0 bg-grid-white/5 opacity-50" />
                        </div>

                        <div className="px-8 pb-8">
                            {/* Avatar - Negative margin to pull it up */}
                            <div className="relative -mt-16 mb-6 flex justify-center">
                                <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                                    <div className="w-32 h-32 rounded-full bg-background p-1.5 shadow-xl ring-1 ring-white/10 relative z-10">
                                        <div className="w-full h-full rounded-full bg-muted flex items-center justify-center overflow-hidden relative">
                                            {user?.avatarUrl ? (
                                                <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            ) : (
                                                <span className="text-4xl font-bold text-muted-foreground">{userInitial}</span>
                                            )}

                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-white">
                                                <Camera className="w-6 h-6 mb-1" />
                                                <span className="text-[10px] font-medium uppercase tracking-wider">Change</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Indicator (Optional decorative element) */}
                                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-background rounded-full z-20" title="Online" />

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>

                            {/* Title Section */}
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                    {fullName || 'Update Your Profile'}
                                </h1>
                                <p className="text-sm text-muted-foreground mt-1">Manage your personal information</p>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-5">
                                {/* Error/Success Messages */}
                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        {error}
                                    </div>
                                )}

                                {success && (
                                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        Profile updated successfully!
                                    </div>
                                )}

                                {/* Full Name Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide ml-1">
                                        Full Name
                                    </label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Enter your full name"
                                            className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all placeholder:text-muted-foreground/50"
                                        />
                                    </div>
                                </div>

                                {/* Username Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide ml-1">
                                        Username
                                    </label>
                                    <div className="relative group">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">@</span>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="username"
                                            className="w-full pl-8 pr-4 py-3 bg-muted/30 border border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all placeholder:text-muted-foreground/50 font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Email Input */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide ml-1">
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="w-full pl-10 pr-4 py-3 bg-muted/20 border border-white/5 rounded-xl text-muted-foreground cursor-not-allowed font-mono text-sm opacity-70"
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground/60 ml-1">
                                        Email address is managed by your administrator and cannot be changed.
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-4">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving || !fullName.trim()}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                    >
                                        {isSaving ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Saving Changes...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                <span>Save Changes</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
}
