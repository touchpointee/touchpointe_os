import { X, Download, Play, Pause } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface MediaPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    src: string;
    type: 'image' | 'video';
    fileName: string;
}

export function MediaPreviewModal({ isOpen, onClose, src, type, fileName }: MediaPreviewModalProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-16 bg-black/40 absolute top-0 left-0 right-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-white font-medium text-sm truncate max-w-[300px]">{fileName}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href={src}
                        download={fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                        title="Download"
                    >
                        <Download className="w-5 h-5" />
                    </a>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden" onClick={onClose}>
                <div className="relative max-w-full max-h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                    {type === 'image' ? (
                        <img
                            src={src}
                            alt={fileName}
                            className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-sm"
                        />
                    ) : (
                        <div className="relative group">
                            <video
                                ref={videoRef}
                                src={src}
                                className="max-w-full max-h-[85vh] shadow-2xl rounded-sm"
                                controls={false}
                                onEnded={() => setIsPlaying(false)}
                                onClick={togglePlay}
                            />
                            {!isPlaying && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors pointer-events-none">
                                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                        <Play className="w-8 h-8 text-white fill-current ml-1" />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
