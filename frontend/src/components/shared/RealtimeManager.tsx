import { useEffect } from 'react';
import { useRealtimeStore, type RealtimeState } from '@/stores/realtimeStore';
import { useWorkspaces } from '@/stores/workspaceStore';

export function RealtimeManager() {
    const connect = useRealtimeStore((state: RealtimeState) => state.connect);
    const disconnect = useRealtimeStore((state: RealtimeState) => state.disconnect);
    const { activeWorkspace } = useWorkspaces();

    useEffect(() => {
        if (activeWorkspace?.id) {
            connect(activeWorkspace.id);
        }

        return () => {
            disconnect();
        };
    }, [connect, disconnect, activeWorkspace?.id]);

    return null; // Headless component
}
