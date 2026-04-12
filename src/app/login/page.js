"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import GoogleAuthButton from "@/components/GoogleAuthButton";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 bg-zinc-950">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center mb-2">YourTurn</h1>
        <p className="text-zinc-500 text-center mb-8">Увійдіть в акаунт</p>

        <GoogleAuthButton label="Увійти через Google" />

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-zinc-500 text-sm">або</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
          />

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? "Входжу..." : "Увійти"}
          </button>
        </form>

        <p className="text-zinc-500 text-center mt-6">
          Немає акаунту?{" "}
          <Link href="/signup" className="text-white hover:underline">
            Зареєструватися
          </Link>
        </p>
      </div>
    </div>
  );
}
