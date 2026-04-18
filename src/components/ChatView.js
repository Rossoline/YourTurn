"use client";

import { useState, useEffect, useRef } from "react";
import { getChatMessages, saveChatMessage, chatWithClaude } from "@/services/chatService";
import { useToast } from "@/components/Toast";

export default function ChatView({ supabase, familyId, userId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const toast = useToast();

  // Load chat history
  useEffect(() => {
    async function loadMessages() {
      try {
        const msgs = await getChatMessages(supabase, familyId);
        setMessages(msgs);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load messages:", error);
        toast?.("Не вдалося завантажити чат", "error");
        setLoading(false);
      }
    }

    loadMessages();
  }, [familyId, supabase, toast]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    try {
      // Save user message
      await saveChatMessage(supabase, familyId, userId, "user", userMessage);

      // Add to local state
      setMessages((prev) => [
        ...prev,
        { role: "user", content: userMessage, created_at: new Date().toISOString() },
      ]);

      // Get Claude response
      const response = await chatWithClaude(familyId, userMessage, messages);

      // Save assistant message
      await saveChatMessage(supabase, familyId, userId, "assistant", response);

      // Add to local state
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response, created_at: new Date().toISOString() },
      ]);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast?.("Помилка при відправленні повідомлення", "error");
      setInput(userMessage); // Restore input
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-950">
        <div className="text-zinc-400">Завантаження чату...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-zinc-400">Почніть розмову з АІ помічником</p>
              <p className="text-zinc-500 text-sm mt-2">Запитайте про управління часом або статистику</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-200"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 text-zinc-200 px-4 py-2 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 bg-zinc-900 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Запитайте щось..."
            disabled={sending}
            className="flex-1 bg-zinc-800 text-white placeholder-zinc-500 rounded-lg px-4 py-2 text-sm border border-zinc-700 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {sending ? "..." : "Надіслати"}
          </button>
        </form>
      </div>
    </div>
  );
}
