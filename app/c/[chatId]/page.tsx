'use client';

import { useParams } from 'next/navigation';
import { ChatView } from '@/components/chat-view';

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;

  return <ChatView initialConversationId={chatId} />;
}
