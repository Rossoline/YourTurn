"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 bg-zinc-950">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-3xl font-bold mb-4">Перевірте пошту</h1>
          <p className="text-zinc-400">
            Ми надіслали лист на <span className="text-white">{email}</span>.
            Перейдіть за посиланням для підтвердження.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 text-white hover:underline"
          >
            Повернутися до входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 bg-zinc-950">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center mb-2">YourTurn</h1>
        <p className="text-zinc-500 text-center mb-8">Створіть акаунт</p>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Ваше ім'я"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
          />
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
            placeholder="Пароль (мін. 6 символів)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {loading ? "Реєструю..." : "Зареєструватися"}
          </button>
        </form>

        <p className="text-zinc-500 text-center mt-6">
          Вже є акаунт?{" "}
          <Link href="/login" className="text-white hover:underline">
            Увійти
          </Link>
        </p>
      </div>
    </div>
  );
}
