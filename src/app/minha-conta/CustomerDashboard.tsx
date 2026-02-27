"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  pending_payment: { label: "Aguardando Pagamento", color: "bg-yellow-500/20 text-yellow-600" },
  paid: { label: "Pago", color: "bg-emerald-500/20 text-emerald-600" },
  processing: { label: "Processando", color: "bg-blue-500/20 text-blue-600" },
  shipped: { label: "Enviado", color: "bg-purple-500/20 text-purple-600" },
  delivered: { label: "Entregue", color: "bg-emerald-500/20 text-emerald-600" },
  cancelled: { label: "Cancelado", color: "bg-red-500/20 text-red-600" },
  refunded: { label: "Reembolsado", color: "bg-gray-500/20 text-gray-600" },
};

const PRODUCT_LABELS: Record<string, string> = {
  digital: "Download Digital",
  print: "Fine Art Print",
  canvas: "Quadro Canvas",
};

const STYLE_LABELS: Record<string, string> = {
  renaissance: "Renascenca",
  baroque: "Barroco",
  victorian: "Vitoriano",
};

export default function CustomerDashboard({ userName, userEmail, orders }: Props) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "A senha deve ter pelo menos 6 caracteres" });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMsg({ type: "error", text: "As senhas não coincidem" });
      return;
    }

    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);

    if (error) {
      setPasswordMsg({ type: "error", text: error.message });
    } else {
      setPasswordMsg({ type: "success", text: "Senha alterada com sucesso!" });
      setNewPassword("");
      setConfirmNewPassword("");
    }
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
    <div className="min-h-screen bg-[var(--sand)] relative overflow-hidden">
      {/* Blob backgrounds (same as homepage) */}
      <div className="blob-1 fixed top-[-150px] right-[-100px] w-[500px] h-[500px] bg-[var(--sage-light)] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] opacity-40 z-0" />
      <div className="blob-2 fixed bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-[var(--terracotta)] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] opacity-20 z-0" />

      {/* Navigation (same style as homepage) */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-5 flex items-center justify-between bg-gradient-to-b from-[var(--sand)] to-transparent">
        <Link href="/" className="font-[var(--font-fraunces)] text-[28px] font-semibold text-[var(--earth)]">
          fotofocinho
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="px-5 py-2.5 text-sm font-semibold text-[var(--text-muted)] rounded-full transition-all hover:text-[var(--text)] hover:bg-[var(--sage)]/20"
          >
            Criar Novo
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-5 py-2.5 text-sm font-semibold text-[var(--text-muted)] rounded-full transition-all hover:text-red-500 hover:bg-red-500/10"
          >
            {loggingOut ? "..." : "Sair"}
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 max-w-[1000px] mx-auto px-6 pt-[120px] pb-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-[var(--font-fraunces)] text-[36px] md:text-[44px] font-medium leading-[1.1] text-[var(--earth)] mb-2">
            Ola, {userName}!
          </h1>
          <p className="text-[var(--text-muted)] text-sm">{userEmail}</p>
        </div>

        {/* Orders */}
        <div>
          <h2 className="font-[var(--font-fraunces)] text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="text-[var(--terracotta)]">Meus Pedidos</span>
            <span className="text-[var(--text-muted)] text-sm font-normal">({orders.length})</span>
          </h2>

          {orders.length === 0 ? (
            <div className="bg-[var(--cream)] border border-[var(--sage-light)]/30 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-4">🖼️</div>
              <h3 className="text-lg font-medium mb-2 text-[var(--earth)]">Nenhum pedido ainda</h3>
              <p className="text-[var(--text-muted)] text-sm mb-6">
                Crie seu primeiro retrato e veja aqui!
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2.5 px-8 py-4 bg-[var(--terracotta)] text-white text-[15px] font-bold rounded-full transition-all hover:bg-[var(--terracotta-dark)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(193,127,89,0.3)]"
              >
                Criar Retrato
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const status = STATUS_LABELS[order.status] || { label: order.status, color: "bg-gray-500/20 text-gray-600" };
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
                        <Image
                          src={watermarkedUrl}
                          alt="Portrait"
                          width={96}
                          height={96}
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
                          <h3 className="font-medium text-[var(--earth)]">
                            {PRODUCT_LABELS[order.product_type] || order.product_type}
                            {order.size && <span className="text-[var(--text-muted)] ml-2">({order.size})</span>}
                          </h3>
                          <p className="text-sm text-[var(--text-muted)]">
                            Estilo {STYLE_LABELS[order.style] || order.style}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-[var(--text-muted)] mb-3">
                        <span>{formatDate(order.created_at)}</span>
                        <span>·</span>
                        <span className="font-medium text-[var(--earth)]">{formatPrice(order.price_cents)}</span>
                      </div>

                      {order.tracking_code && (
                        <p className="text-sm text-[var(--text-muted)] mb-3">
                          Rastreio: <span className="text-[var(--earth)] font-mono">{order.tracking_code}</span>
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3">
                        {canDownload && order.generated_image_path && (
                          <button
                            onClick={() => handleDownload(order.order_id, order.generated_image_path)}
                            className="px-4 py-2 bg-[var(--terracotta)]/15 text-[var(--terracotta)] rounded-full text-sm font-medium hover:bg-[var(--terracotta)]/25 transition-colors"
                          >
                            Download HD
                          </button>
                        )}
                        {order.status === "pending_payment" && (
                          <span className="px-4 py-2 text-yellow-600/70 text-sm">
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

        {/* Change Password */}
        <div className="mt-12">
          <h2 className="font-[var(--font-fraunces)] text-xl font-semibold mb-6 text-[var(--terracotta)]">
            Alterar Senha
          </h2>
          <div className="bg-[var(--cream)] border border-[var(--sage-light)]/30 rounded-2xl p-6 max-w-[400px]">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nova senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[var(--sage-light)]/50 text-[var(--text)] placeholder:text-[var(--text)]/30 focus:outline-none focus:border-[var(--terracotta)] transition-colors"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirmar nova senha</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[var(--sage-light)]/50 text-[var(--text)] placeholder:text-[var(--text)]/30 focus:outline-none focus:border-[var(--terracotta)] transition-colors"
                  placeholder="Repita a nova senha"
                />
              </div>
              {passwordMsg && (
                <div className={`p-3 rounded-xl text-sm text-center ${
                  passwordMsg.type === "success"
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}>
                  {passwordMsg.text}
                </div>
              )}
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-br from-[var(--terracotta)] to-[var(--terracotta-dark)] text-[var(--cream)] text-[15px] font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(201,169,110,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {passwordLoading ? "Alterando..." : "Alterar Senha"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--sage-light)]/30 py-6 px-6 mt-auto">
        <div className="max-w-[1000px] mx-auto text-center">
          <p className="text-xs text-[var(--text-muted)]">
            &copy; {new Date().getFullYear()} Fotofocinho. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
