import { useEffect, useState } from 'react';
import { X, MessageCircle, Users, ListTodo, ClipboardList, Zap, FileText, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';

const RELEASE_VERSION = '1.0.0';
const RELEASE_DATE = 'February 1, 2026';

interface Feature {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    summary: string;
    details: string[];
}

const features: Feature[] = [
    {
        icon: MessageCircle,
        title: 'Team Chat',
        summary: 'Real-time communication for your entire team.',
        details: [
            'Create public and private channels for organized discussions',
            'Send direct messages to team members one-on-one',
            'Share files, images, videos, and voice notes',
            'Reply to specific messages with threaded conversations',
            'React to messages with emojis',
            'See real-time typing indicators',
            'Mention team members with @username notifications',
        ],
    },
    {
        icon: Zap,
        title: 'AI Assistant (Hattie)',
        summary: 'Your intelligent workplace companion.',
        details: [
            'Ask questions about your tasks, deals, and CRM data',
            'Get instant help with HR policies and procedures',
            'Receive smart suggestions and insights',
            'Navigate the app with natural language commands',
            'Get quick summaries of your workload',
        ],
    },
    {
        icon: ListTodo,
        title: 'Task Management',
        summary: 'Organize work with spaces, lists, and tasks.',
        details: [
            'Create Spaces to group related projects together',
            'Organize tasks into Lists within each Space',
            'Set task priorities (Urgent, High, Normal, Low)',
            'Assign due dates and track deadlines',
            'Assign tasks to team members',
            'Add comments and collaborate on tasks',
            'Track task status from To Do to Done',
            'Create subtasks for complex work items',
        ],
    },
    {
        icon: ClipboardList,
        title: 'My Tasks',
        summary: 'Your personal productivity dashboard.',
        details: [
            'View all tasks assigned to you in one place',
            'See overdue and due-today items at a glance',
            'Filter tasks by status, priority, and space',
            'Track mentions where you\'ve been tagged',
            'Get personalized greetings and task summaries',
            'Quick access to urgent and blocked items',
        ],
    },
    {
        icon: Users,
        title: 'CRM & Leads',
        summary: 'Manage your sales pipeline and contacts.',
        details: [
            'Capture and manage leads from multiple sources',
            'Track leads through customizable pipeline stages',
            'Kanban-style board for visual pipeline management',
            'Store contact information and notes',
            'Track deals and opportunities',
            'Manage your contacts database',
            'Phone number validation for data quality',
        ],
    },
    {
        icon: FileText,
        title: 'Lead Capture Forms',
        summary: 'Generate leads from your website.',
        details: [
            'Build custom forms with a drag-and-drop builder',
            'Embed forms on your website or share via link',
            'Customize form fields (text, email, phone, dropdown)',
            'Automatic lead creation when forms are submitted',
            'Track UTM parameters for campaign attribution',
            'Mobile-friendly, responsive design',
        ],
    },
];

interface FeatureCardProps {
    feature: Feature;
    isExpanded: boolean;
    onToggle: () => void;
}

function FeatureCard({ feature, isExpanded, onToggle }: FeatureCardProps) {
    return (
        <div className="border border-border rounded-lg overflow-hidden bg-muted/20">
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors text-left"
            >
                <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{feature.summary}</p>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
            </button>
            {isExpanded && (
                <div className="px-4 pb-3 pt-1 border-t border-border/50 bg-background/50">
                    <ul className="space-y-1.5">
                        {feature.details.map((detail, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{detail}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

interface ReleaseNotesModalProps {
    onClose: () => void;
}

function ReleaseNotesModal({ onClose }: ReleaseNotesModalProps) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

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
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-1 rounded-xl bg-primary/20 overflow-hidden">
                            <img src="/logo.jpeg" alt="TouchPointe" className="w-10 h-10 object-contain rounded-lg" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">TouchPointe v{RELEASE_VERSION}</h2>
                            <p className="text-sm text-muted-foreground">First Release</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 w-fit px-2.5 py-1 rounded-full">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{RELEASE_DATE}</span>
                    </div>
                </div>

                {/* Description */}
                <div className="px-6 pt-4 pb-2">
                    <p className="text-sm text-muted-foreground">
                        Welcome to <span className="font-semibold text-foreground">TouchPointe</span> — your all-in-one workspace for team collaboration, task management, and customer relationships. Explore the features below to get started!
                    </p>
                </div>

                {/* Features List */}
                <div className="px-4 pb-4 max-h-[45vh] overflow-y-auto">
                    <div className="space-y-2">
                        {features.map((feature, index) => (
                            <FeatureCard
                                key={index}
                                feature={feature}
                                isExpanded={expandedIndex === index}
                                onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
                            />
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
                    <p className="text-[10px] text-center text-muted-foreground mt-2">
                        You can dismiss this. It won't show again.
                    </p>
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
