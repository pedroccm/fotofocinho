"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const product = searchParams.get("product");
  const generationId = searchParams.get("generationId");

  const isPhysical = product === "print" || product === "canvas";

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="max-w-[500px] w-full text-center">
        <div className="text-6xl mb-6">
          {isPhysical ? "🎨" : "✨"}
        </div>

        <h1 className="font-['Playfair_Display'] text-4xl font-bold italic mb-4 bg-gradient-to-br from-white to-[#c9a96e] bg-clip-text text-transparent">
          Obrigado!
        </h1>

        <p className="text-white/60 text-base leading-relaxed mb-8">
          {isPhysical ? (
            <>
              Seu pedido foi confirmado! Estamos preparando seu{" "}
              <span className="text-[#c9a96e] font-semibold">
                {product === "canvas" ? "Quadro Canvas" : "Fine Art Print"}
              </span>{" "}
              com carinho. Você receberá um e-mail com o código de rastreio assim
              que enviarmos.
            </>
          ) : (
            <>
              Seu pagamento foi confirmado! Seu{" "}
              <span className="text-[#c9a96e] font-semibold">
                download digital
              </span>{" "}
              em alta resolução está pronto. Verifique seu e-mail para o link de
              download.
            </>
          )}
        </p>

        {isPhysical && (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 mb-8 text-left">
            <h3 className="font-['Cormorant_Garamond'] text-lg font-semibold mb-3 text-[#c9a96e]">
              Próximos passos
            </h3>
            <ul className="space-y-2 text-sm text-white/50">
              <li className="flex items-start gap-2">
                <span className="text-[#2dd4a0] mt-0.5">✓</span>
                <span>Pagamento confirmado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/30 mt-0.5">○</span>
                <span>Impressão em andamento (1-2 dias úteis)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/30 mt-0.5">○</span>
                <span>Envio pelos Correios com rastreio</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/30 mt-0.5">○</span>
                <span>Entrega estimada: 5-10 dias úteis</span>
              </li>
            </ul>
          </div>
        )}

        <a
          href="/"
          className="inline-block bg-gradient-to-br from-[#c9a96e] to-[#dfc08a] text-[#0a0a0a] px-8 py-3.5 rounded-xl font-bold text-[15px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(201,169,110,0.3)]"
        >
          Criar Outro Retrato
        </a>
      </div>
    </div>
  );
}

export default function ObrigadoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <span className="text-white/40">Carregando...</span>
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
