"use client";

import { useState, useEffect } from "react";
import { getChats, createChat, deleteChat } from "@/services/chatService";
import ChatList from "@/components/chat/ChatList";
import ChatWindow from "@/components/chat/ChatWindow";
import { useToast } from "@/components/Toast";

export default function ChatView({ supabase, familyId, userId }) {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    async function loadChats() {
      try {
        const data = await getChats(supabase, familyId);
        setChats(data);
      } catch {
        toast?.("Не вдалося завантажити чати", "error");
      } finally {
        setLoading(false);
      }
    }
    loadChats();
  }, [familyId, supabase, toast]);

  async function handleCreate() {
    try {
      const chat = await createChat(familyId);
      setChats((prev) => [chat, ...prev]);
      setActiveChat(chat);
    } catch {
      toast?.("Не вдалося створити чат", "error");
    }
  }

  async function handleDelete(chatId) {
    try {
      await deleteChat(chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChat?.id === chatId) setActiveChat(null);
    } catch {
      toast?.("Не вдалося видалити чат", "error");
    }
  }

  function handleRename(chatId, name) {
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, name } : c)));
    setActiveChat((prev) => (prev?.id === chatId ? { ...prev, name } : prev));
  }

  if (activeChat) {
    return (
      <ChatWindow
        supabase={supabase}
        familyId={familyId}
        userId={userId}
        chat={activeChat}
        onBack={() => setActiveChat(null)}
        onRename={handleRename}
      />
    );
  }

  return (
    <ChatList
      chats={chats}
      loading={loading}
      onSelect={setActiveChat}
      onCreate={handleCreate}
      onDelete={handleDelete}
    />
  );
}
