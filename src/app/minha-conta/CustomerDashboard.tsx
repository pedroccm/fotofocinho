"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";

interface Order {
  order_id: string;
  product_type: string;
  size: string | null;
  price_cents: number;
  status: string;
  tracking_code: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  created_at: string;
  style: string;
  generated_image_path: string | null;
  watermarked_image_path: string | null;
}

interface Props {
  userName: string;
  userEmail: string;
  orders: Order[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "Aguardando Pagamento", color: "bg-yellow-500/20 text-yellow-400" },
  paid: { label: "Pago", color: "bg-emerald-500/20 text-emerald-400" },
  processing: { label: "Processando", color: "bg-blue-500/20 text-blue-400" },
  shipped: { label: "Enviado", color: "bg-purple-500/20 text-purple-400" },
  delivered: { label: "Entregue", color: "bg-emerald-500/20 text-emerald-400" },
  cancelled: { label: "Cancelado", color: "bg-red-500/20 text-red-400" },
  refunded: { label: "Reembolsado", color: "bg-gray-500/20 text-gray-400" },
};

const PRODUCT_LABELS: Record<string, string> = {
  digital: "Download Digital",
  print: "Fine Art Print",
  canvas: "Quadro Canvas",
};

const STYLE_LABELS: Record<string, string> = {
  renaissance: "Renascença",
  baroque: "Barroco",
  victorian: "Vitoriano",
};

export default function CustomerDashboard({ userName, userEmail, orders }: Props) {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (cents: number) => {
    return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
  };

  const handleDownload = async (orderId: string, generatedPath: string | null) => {
    if (!generatedPath) return;

    // For paid orders, fetch the clean image
    try {
      const response = await fetch(`/api/download?orderId=${orderId}`);
      if (!response.ok) {
        throw new Error("Download failed");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fotofocinho-portrait-${orderId}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--sand)] flex flex-col">
      {/* Navbar */}
      <nav className="bg-[var(--sand)]/95 backdrop-blur-xl border-b border-[var(--sage-light)]/20 px-6">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between h-[72px]">
          <Link href="/" className="flex flex-col">
            <span className="font-['Fraunces'] text-[26px] font-bold tracking-tight leading-none">
              Fotofocinho
            </span>
            <span className="text-[8px] font-medium tracking-[0.3em] text-[var(--text)]/40 mt-0.5">
              PET PORTRAITS
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-[var(--text)]/60 text-sm font-medium hover:text-[var(--terracotta)] transition-colors"
            >
              Criar Novo
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-[var(--text)]/60 text-sm font-medium hover:text-red-400 transition-colors"
            >
              {loggingOut ? "..." : "Sair"}
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-[1000px] mx-auto px-6 py-12 flex-1">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-['Fraunces'] text-3xl font-bold mb-2">
            Olá, {userName}!
          </h1>
          <p className="text-[var(--text)]/50 text-sm">{userEmail}</p>
        </div>

        {/* Orders */}
        <div>
          <h2 className="font-['Cormorant_Garamond'] text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="text-[var(--terracotta)]">Meus Pedidos</span>
            <span className="text-[var(--text)]/30 text-sm font-normal">({orders.length})</span>
          </h2>

          {orders.length === 0 ? (
            <div className="bg-[var(--cream)] border border-[var(--sage-light)]/30 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-4">🖼️</div>
              <h3 className="text-lg font-medium mb-2">Nenhum pedido ainda</h3>
              <p className="text-[var(--text)]/50 text-sm mb-6">
                Crie seu primeiro retrato e veja aqui!
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-gradient-to-br from-[var(--terracotta)] to-[var(--terracotta-dark)] text-[var(--cream)] rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-transform"
              >
                Criar Retrato
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const status = STATUS_LABELS[order.status] || { label: order.status, color: "bg-gray-500/20 text-gray-400" };
                const canDownload = order.status === "paid" || order.status === "delivered";
                const watermarkedUrl = order.watermarked_image_path
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/watermarked/${order.watermarked_image_path}`
                  : null;

                return (
                  <div
                    key={order.order_id}
                    className="bg-[var(--cream)] border border-[var(--sage-light)]/30 rounded-2xl p-6 flex gap-6 items-start"
                  >
                    {/* Thumbnail */}
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-[var(--sage-light)]/20 flex-shrink-0">
                      {watermarkedUrl ? (
                        <img
                          src={watermarkedUrl}
                          alt="Portrait"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🎨
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <h3 className="font-medium">
                            {PRODUCT_LABELS[order.product_type] || order.product_type}
                            {order.size && <span className="text-[var(--text)]/50 ml-2">({order.size})</span>}
                          </h3>
                          <p className="text-sm text-[var(--text)]/40">
                            Estilo {STYLE_LABELS[order.style] || order.style}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-[var(--text)]/50 mb-3">
                        <span>{formatDate(order.created_at)}</span>
                        <span>•</span>
                        <span className="font-medium text-[var(--text)]">{formatPrice(order.price_cents)}</span>
                      </div>

                      {order.tracking_code && (
                        <p className="text-sm text-[var(--text)]/50 mb-3">
                          Rastreio: <span className="text-[var(--text)] font-mono">{order.tracking_code}</span>
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3">
                        {canDownload && order.generated_image_path && (
                          <button
                            onClick={() => handleDownload(order.order_id, order.generated_image_path)}
                            className="px-4 py-2 bg-[var(--terracotta)]/20 text-[var(--terracotta)] rounded-lg text-sm font-medium hover:bg-[var(--terracotta)]/30 transition-colors"
                          >
                            Download HD
                          </button>
                        )}
                        {order.status === "pending_payment" && (
                          <span className="px-4 py-2 text-yellow-400/70 text-sm">
                            Complete o pagamento para baixar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--sage-light)]/30 py-6 px-6 mt-auto">
        <div className="max-w-[1000px] mx-auto text-center">
          <p className="text-xs text-[var(--text)]/30">
            &copy; 2025 Fotofocinho. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
