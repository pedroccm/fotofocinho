"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase-browser";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError("Erro ao conectar com Google");
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        setError("Este email já está cadastrado");
      } else {
        setError(error.message);
      }
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
          <Image src="/logo.png" alt="Fotofocinho" width={200} height={60} className="h-14 w-auto" />
        </Link>

        <div className="bg-[var(--cream)] border border-[var(--sage-light)]/30 rounded-2xl p-8">
          <h1 className="font-display text-2xl font-bold text-center mb-2">
            Criar Conta
          </h1>
          <p className="text-sm text-[var(--text)]/50 text-center mb-8">
            Cadastre-se para salvar e acessar seus retratos
          </p>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white border border-[var(--sage-light)]/50 text-[var(--text)] text-[15px] font-medium transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_15px_rgba(0,0,0,0.08)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>

          <div className="flex items-center gap-4 my-2">
            <div className="flex-1 h-px bg-[var(--sage-light)]/30" />
            <span className="text-xs text-[var(--text)]/30 font-medium">ou</span>
            <div className="flex-1 h-px bg-[var(--sage-light)]/30" />
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white border border-[var(--sage-light)]/50 text-[var(--text)] placeholder:text-[var(--text)]/30 focus:outline-none focus:border-[var(--terracotta)] transition-colors"
                placeholder="Seu nome"
              />
            </div>

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
                  minLength={6}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white border border-[var(--sage-light)]/50 text-[var(--text)] placeholder:text-[var(--text)]/30 focus:outline-none focus:border-[var(--terracotta)] transition-colors"
                  placeholder="Mínimo 6 caracteres"
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

            <div>
              <label className="block text-sm font-medium mb-2">Confirmar Senha</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white border border-[var(--sage-light)]/50 text-[var(--text)] placeholder:text-[var(--text)]/30 focus:outline-none focus:border-[var(--terracotta)] transition-colors"
                  placeholder="Digite a senha novamente"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text)]/40 hover:text-[var(--text)]/70 transition-colors"
                >
                  {showConfirmPassword ? (
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
              {loading ? "Criando conta..." : "Criar Conta"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--text)]/50">
              Já tem uma conta?{" "}
              <Link href="/login" className="text-[var(--terracotta)] hover:underline font-medium">
                Entrar
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
