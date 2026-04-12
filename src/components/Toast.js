"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

function ToastItem({ message, type, onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  const bg = type === "error"
    ? "bg-red-900/90 text-red-200"
    : type === "success"
      ? "bg-emerald-900/90 text-emerald-200"
      : "bg-zinc-800/90 text-zinc-200";

  return (
    <div
      className={`px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg backdrop-blur-sm transition-all duration-300 ${bg} ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      {message}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} message={t.message} type={t.type} onDone={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
