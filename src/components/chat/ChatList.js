"use client";

import { useState } from "react";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
}

function DeleteConfirmModal({ chatName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-zinc-900 rounded-t-2xl p-6 pb-8 border-t border-zinc-700">
        <h3 className="text-white font-semibold text-base mb-1">Видалити чат?</h3>
        <p className="text-zinc-400 text-sm mb-6">
          «{chatName}» та всі повідомлення будуть видалені назавжди.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            Скасувати
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Видалити
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatList({ chats, loading, onSelect, onCreate, onDelete }) {
  const [pendingDelete, setPendingDelete] = useState(null); // { id, name }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-zinc-950">
        <div className="text-zinc-400 text-sm">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <h2 className="text-white font-semibold">Мої чати</h2>
        <button
          onClick={onCreate}
          className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center text-xl leading-none transition-colors"
          aria-label="Новий чат"
        >
          +
        </button>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
            <div className="text-4xl">💬</div>
            <p className="text-zinc-400">Немає чатів</p>
            <button
              onClick={onCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Створити чат
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {chats.map((chat) => (
              <li
                key={chat.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-900 cursor-pointer"
                onClick={() => onSelect(chat)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{chat.name}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{formatDate(chat.created_at)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setPendingDelete({ id: chat.id, name: chat.name }); }}
                  className="text-zinc-600 hover:text-red-400 p-1 transition-colors shrink-0"
                  aria-label="Видалити чат"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <DeleteConfirmModal
          chatName={pendingDelete.name}
          onConfirm={() => { onDelete(pendingDelete.id); setPendingDelete(null); }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
