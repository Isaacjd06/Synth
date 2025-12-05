"use client";

import ChatLayout from "./ChatLayout";
import MessageList from "./MessageList";
import ChatComposer from "./ChatComposer";
import TypingIndicator from "./TypingIndicator";
import { useChat } from "./useChat";

export default function ChatClient() {
  const {
    messages,
    loading,
    error,
    isSending,
    sendMessage,
    messagesEndRef,
    handleScroll,
  } = useChat();

  if (loading) {
    return (
      <ChatLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-[#194c92] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Loading chat history...</p>
          </div>
        </div>
      </ChatLayout>
    );
  }

  if (error) {
    return (
      <ChatLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <p className="text-red-400 text-lg mb-2">Error loading chat</p>
            <p className="text-gray-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#194c92] text-white rounded-md hover:bg-[#1a5ba8] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </ChatLayout>
    );
  }

  return (
    <ChatLayout>
      <MessageList
        messages={messages}
        messagesEndRef={messagesEndRef}
        onScroll={handleScroll}
      />
      {isSending && <TypingIndicator />}
      <ChatComposer onSend={sendMessage} disabled={isSending} isLoading={isSending} />
    </ChatLayout>
  );
}

