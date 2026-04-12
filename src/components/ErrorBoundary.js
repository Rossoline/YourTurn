"use client";

import { Component } from "react";
import * as Sentry from "@sentry/nextjs";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info?.componentStack);
    Sentry.captureException(error, { extra: { componentStack: info?.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-zinc-950 gap-4 px-6">
          <div className="text-4xl">😵</div>
          <h1 className="text-xl font-bold text-white">Щось пішло не так</h1>
          <p className="text-zinc-400 text-center text-sm">
            Виникла непередбачена помилка. Спробуйте оновити сторінку.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors text-sm"
          >
            Оновити сторінку
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
