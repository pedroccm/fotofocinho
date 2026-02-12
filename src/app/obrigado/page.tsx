"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const product = searchParams.get("product");

  const isPhysical = product === "print" || product === "canvas";

  return (
    <div className="min-h-screen bg-[var(--sand)] relative overflow-hidden">
      {/* Blob backgrounds */}
      <div className="blob-1 fixed top-[-150px] right-[-100px] w-[500px] h-[500px] bg-[var(--sage-light)] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] opacity-40 z-0" />
      <div className="blob-2 fixed bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-[var(--terracotta)] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] opacity-20 z-0" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-5 flex items-center justify-between bg-gradient-to-b from-[var(--sand)] to-transparent">
        <Link href="/" className="font-['Fraunces'] text-[28px] font-semibold text-[var(--earth)]">
          fotofocinho
        </Link>
        <div className="hidden md:flex items-center gap-2">
          <Link href="/" className="px-5 py-2.5 text-sm font-bold text-white bg-[var(--sage)] rounded-full transition-all hover:bg-[var(--sage-dark)]">
            Criar outro retrato
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-[500px] w-full text-center">
          <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center bg-[var(--sage)]/20 rounded-full">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 className="font-['Fraunces'] text-4xl md:text-5xl font-medium text-[var(--earth)] mb-4">
            Obrigado!
          </h1>

          <p className="text-[var(--text-muted)] text-base leading-relaxed mb-8">
            {isPhysical ? (
              <>
                Seu pedido foi confirmado! Estamos preparando seu{" "}
                <span className="text-[var(--terracotta)] font-semibold">
                  {product === "canvas" ? "Quadro Canvas" : "Fine Art Print"}
                </span>{" "}
                com carinho. Você receberá um e-mail com o código de rastreio assim
                que enviarmos.
              </>
            ) : (
              <>
                Seu pagamento foi confirmado! Seu{" "}
                <span className="text-[var(--terracotta)] font-semibold">
                  download digital
                </span>{" "}
                em alta resolução está pronto. Verifique seu e-mail para o link de
                download.
              </>
            )}
          </p>

          {isPhysical && (
            <div className="bg-[var(--cream)] border-2 border-[var(--sage-light)] rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-['Fraunces'] text-lg font-semibold mb-3 text-[var(--terracotta)]">
                Próximos passos
              </h3>
              <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--success)] mt-0.5 font-bold">✓</span>
                  <span>Pagamento confirmado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--text-muted)] mt-0.5">○</span>
                  <span>Impressão em andamento (1-2 dias úteis)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--text-muted)] mt-0.5">○</span>
                  <span>Envio pelos Correios com rastreio</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--text-muted)] mt-0.5">○</span>
                  <span>Entrega estimada: 5-10 dias úteis</span>
                </li>
              </ul>
            </div>
          )}

          <Link
            href="/"
            className="inline-block bg-[var(--terracotta)] text-white px-8 py-3.5 rounded-full font-bold text-[15px] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--terracotta-dark)] hover:shadow-[0_8px_24px_rgba(193,127,89,0.3)]"
          >
            Criar Outro Retrato
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes morph {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
        }
        .blob-1 { animation: morph 15s ease-in-out infinite; }
        .blob-2 { animation: morph 20s ease-in-out infinite reverse; }
      `}</style>
    </div>
  );
}

export default function ObrigadoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--sand)] flex items-center justify-center">
          <span className="text-[var(--text-muted)]">Carregando...</span>
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
