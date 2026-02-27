"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/login`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--sand)] flex items-center justify-center px-6">
      <div className="w-full max-w-[400px]">
        <Link href="/" className="flex flex-col items-center mb-10">
          <span className="font-[var(--font-fraunces)] text-[32px] font-bold tracking-tight leading-none">
            Fotofocinho
          </span>
          <span className="text-[9px] font-medium tracking-[0.3em] text-[var(--text)]/40 mt-0.5">
            PET PORTRAITS
          </span>
        </Link>

        <div className="bg-[var(--cream)] border border-[var(--sage-light)]/30 rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center bg-[var(--sage)]/20 rounded-full">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h1 className="font-[var(--font-fraunces)] text-2xl font-bold mb-2">
                Email enviado!
              </h1>
              <p className="text-sm text-[var(--text)]/50 mb-6">
                Se existe uma conta com <strong className="text-[var(--text)]/70">{email}</strong>,
                você receberá um link para redefinir sua senha.
              </p>
              <Link
                href="/login"
                className="inline-block w-full py-3.5 rounded-xl bg-gradient-to-br from-[var(--terracotta)] to-[var(--terracotta-dark)] text-[var(--cream)] text-[15px] font-bold text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(201,169,110,0.3)]"
              >
                Voltar para login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-[var(--font-fraunces)] text-2xl font-bold text-center mb-2">
                Esqueci minha senha
              </h1>
              <p className="text-sm text-[var(--text)]/50 text-center mb-8">
                Digite seu email e enviaremos um link para redefinir sua senha
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  {loading ? "Enviando..." : "Enviar link"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-[var(--text)]/50 hover:text-[var(--text)]/70 transition-colors">
                  Voltar para login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
