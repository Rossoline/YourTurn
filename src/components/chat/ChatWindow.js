"use client";

import { useState, useEffect, useRef } from "react";
import { getChatMessages, saveChatMessage, chatWithClaude, renameChat } from "@/services/chatService";
import { useToast } from "@/components/Toast";

export default function ChatWindow({ supabase, familyId, userId, chat, onBack, onRename }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const hasNamed = useRef(false);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;

    async function loadMessages() {
      try {
        const msgs = await getChatMessages(supabase, chat.id);
        if (cancelled) return;
        setMessages(msgs);
        // Don't auto-rename if chat already has messages or a custom name
        hasNamed.current = msgs.length > 0 || chat.name !== "Новий чат";
      } catch {
        toast?.("Не вдалося завантажити повідомлення", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMessages();
    return () => { cancelled = true; };
  }, [chat.id, chat.name, supabase, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    // Optimistic update
    const optimistic = [
      ...messages,
      { role: "user", content: userMessage, created_at: new Date().toISOString() },
    ];
    setMessages(optimistic);

    try {
      // Auto-name from first message (first 40 chars)
      if (!hasNamed.current) {
        const name = userMessage.slice(0, 40).trim();
        await renameChat(chat.id, name);
        onRename(chat.id, name);
        hasNamed.current = true;
      }

      await saveChatMessage(supabase, chat.id, userId, "user", userMessage);

      const response = await chatWithClaude(chat.id, familyId, userMessage, optimistic);

      await saveChatMessage(supabase, chat.id, userId, "assistant", response);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response, created_at: new Date().toISOString() },
      ]);
    } catch (error) {
      toast?.("Помилка при відправленні", "error");
      setMessages(messages); // Revert optimistic update
      setInput(userMessage);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <button
          onClick={onBack}
          className="text-zinc-400 hover:text-white transition-colors text-lg leading-none"
          aria-label="Назад"
        >
          ←
        </button>
        <h2 className="text-white text-sm font-medium truncate flex-1">{chat.name}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-zinc-400 text-sm">Завантаження...</div>
          </div>
        ) : messages.length === 0 ? (
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
            <div className="bg-zinc-800 px-4 py-2 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 bg-zinc-900 p-4">
        <form onSubmit={handleSend} className="flex gap-2">
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
            {sending ? "..." : "→"}
          </button>
        </form>
      </div>
    </div>
  );
}
