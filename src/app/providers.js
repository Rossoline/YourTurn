"use client";

import { ToastProvider } from "@/components/Toast";

export function Providers({ children }) {
  return <ToastProvider>{children}</ToastProvider>;
}
