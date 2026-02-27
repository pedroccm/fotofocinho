"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
          <span className="font-[var(--font-fraunces)] text-[32px] font-bold tracking-tight leading-none">
            Fotofocinho
          </span>
          <span className="text-[9px] font-medium tracking-[0.3em] text-[var(--text)]/40 mt-0.5">
            PET PORTRAITS
          </span>
        </Link>

        <div className="bg-[var(--cream)] border border-[var(--sage-light)]/30 rounded-2xl p-8">
          <h1 className="font-[var(--font-fraunces)] text-2xl font-bold text-center mb-2">
            Criar Conta
          </h1>
          <p className="text-sm text-[var(--text)]/50 text-center mb-8">
            Cadastre-se para salvar e acessar seus retratos
          </p>

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
