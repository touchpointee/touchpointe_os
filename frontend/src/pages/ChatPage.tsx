import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useChatStore } from '@/stores/chatStore';

export function ChatPage() {
    const { channelId, dmGroupId } = useParams();
    const { setActiveChannel, setActiveDmInfo } = useChatStore();

    useEffect(() => {
        if (channelId) {
            setActiveChannel(channelId);
        } else if (dmGroupId) {
            setActiveDmInfo(dmGroupId);
        }
    }, [channelId, dmGroupId, setActiveChannel, setActiveDmInfo]);

    return (
        <div className="h-full flex">
            <ChatWindow />
        </div>
    );
}
