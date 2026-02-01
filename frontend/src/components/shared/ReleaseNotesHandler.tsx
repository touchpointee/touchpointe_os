import { useEffect, useState } from 'react';
import { X, Sparkles, MessageCircle, Users, ListTodo, ClipboardList, Zap, FileText, ChevronRight } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';

const RELEASE_VERSION = '1.0.0';

interface ReleaseNotesModalProps {
    onClose: () => void;
}

const features = [
    {
        icon: MessageCircle,
        title: 'Team Chat',
        description: 'Real-time messaging with channels, direct messages, file sharing, and voice notes.',
    },
    {
        icon: Zap,
        title: 'AI Assistant (Hattie)',
        description: 'Your intelligent assistant for tasks, deals, CRM, and HR questions.',
    },
    {
        icon: ListTodo,
        title: 'Task Management',
        description: 'Create spaces, lists, and tasks with due dates, priorities, and team collaboration.',
    },
    {
        icon: ClipboardList,
        title: 'My Tasks',
        description: 'Personal dashboard showing your assigned tasks, mentions, and due items.',
    },
    {
        icon: Users,
        title: 'CRM & Leads',
        description: 'Manage leads, deals, and contacts with a Kanban-style pipeline.',
    },
    {
        icon: FileText,
        title: 'Lead Capture Forms',
        description: 'Create embeddable forms to capture leads directly from your website.',
    },
];

function ReleaseNotesModal({ onClose }: ReleaseNotesModalProps) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 pb-4">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted/50 transition-colors"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-primary/20">
                            <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">What's New in TouchPointe</h2>
                            <p className="text-sm text-muted-foreground">Version {RELEASE_VERSION}</p>
                        </div>
                    </div>
                </div>

                {/* Features List */}
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <p className="text-sm text-muted-foreground mb-4">
                        Welcome! Here's everything you can do with TouchPointe:
                    </p>
                    <div className="space-y-3">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                            >
                                <div className="p-2 rounded-lg bg-background group-hover:bg-primary/10 transition-colors">
                                    <feature.icon className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground/50 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-muted/20">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
}

export function ReleaseNotesHandler() {
    const [showModal, setShowModal] = useState(false);
    const { user } = useUserStore();

    useEffect(() => {
        if (!user) return;

        const key = `release-notes-seen-${RELEASE_VERSION}`;
        const hasSeen = localStorage.getItem(key);

        if (!hasSeen) {
            // Small delay to let the app load first
            const timer = setTimeout(() => {
                setShowModal(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const handleClose = () => {
        const key = `release-notes-seen-${RELEASE_VERSION}`;
        localStorage.setItem(key, 'true');
        setShowModal(false);
    };

    if (!showModal) return null;

    return <ReleaseNotesModal onClose={handleClose} />;
}
