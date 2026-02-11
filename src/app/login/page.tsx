"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "Email ou senha incorretos"
        : error.message);
      setLoading(false);
      return;
    }

    router.push("/minha-conta");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--sand)] flex items-center justify-center px-6">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="flex flex-col items-center mb-10">
          <span className="font-['Fraunces'] text-[32px] font-bold tracking-tight leading-none">
            Fotofocinho
          </span>
          <span className="text-[9px] font-medium tracking-[0.3em] text-[var(--text)]/40 mt-0.5">
            PET PORTRAITS
          </span>
        </Link>

        <div className="bg-[var(--cream)] border border-[var(--sage-light)]/30 rounded-2xl p-8">
          <h1 className="font-['Fraunces'] text-2xl font-bold text-center mb-2">
            Bem-vindo de volta
          </h1>
          <p className="text-sm text-[var(--text)]/50 text-center mb-8">
            Entre para acessar seus retratos
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white border border-[var(--sage-light)]/50 text-[var(--text)] placeholder:text-[var(--text)]/30 focus:outline-none focus:border-[var(--terracotta)] transition-colors"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white border border-[var(--sage-light)]/50 text-[var(--text)] placeholder:text-[var(--text)]/30 focus:outline-none focus:border-[var(--terracotta)] transition-colors"
                  placeholder="Sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text)]/40 hover:text-[var(--text)]/70 transition-colors"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-br from-[var(--terracotta)] to-[var(--terracotta-dark)] text-[var(--cream)] text-[15px] font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(201,169,110,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text)]/50">
              Não tem uma conta?{" "}
              <Link href="/register" className="text-[var(--terracotta)] hover:underline font-medium">
                Criar conta
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--text)]/30 mt-6">
          <Link href="/" className="hover:text-[var(--text)]/50 transition-colors">
            Voltar para a página inicial
          </Link>
        </p>
      </div>
    </div>
  );
}
