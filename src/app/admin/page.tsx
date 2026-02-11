"use client";

import { useState, useEffect, useCallback } from "react";

interface Order {
  id: string;
  product_type: string;
  size: string | null;
  price_cents: number;
  status: string;
  billing_id: string;
  tracking_code: string | null;
  shipping_address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
  } | null;
  notes: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  created_at: string;
  customers: {
    name: string;
    email: string;
    cellphone: string;
    tax_id: string;
  };
  generations: {
    style: string;
    generated_image_path: string;
    watermarked_image_path: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  paid: "bg-green-500/20 text-green-400 border-green-500/30",
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  delivered: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  refunded: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Aguardando Pagamento",
  paid: "Pago",
  processing: "Em Produção",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

const PRODUCT_LABELS: Record<string, string> = {
  digital: "📥 Digital",
  print: "🖼️ Fine Art Print",
  canvas: "🎨 Canvas",
};

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/orders?status=${statusFilter}&page=${page}`,
        {
          headers: { "x-admin-key": adminKey },
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          setAuthenticated(false);
          return;
        }
        throw new Error("Erro ao buscar pedidos");
      }

      const data = await res.json();
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [adminKey, statusFilter, page]);

  useEffect(() => {
    if (authenticated) {
      fetchOrders();
    }
  }, [authenticated, fetchOrders]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey.trim()) {
      setAuthenticated(true);
    }
  };

  const updateOrder = async (
    orderId: string,
    updates: { status?: string; trackingCode?: string; notes?: string }
  ) => {
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({ orderId, ...updates }),
      });

      if (!res.ok) throw new Error("Erro ao atualizar");

      await fetchOrders();
      setSelectedOrder(null);
      setTrackingInput("");
      setNotesInput("");
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar pedido");
    } finally {
      setUpdating(false);
    }
  };

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
        <form onSubmit={handleLogin} className="max-w-[360px] w-full">
          <h1 className="font-['Playfair_Display'] text-3xl font-bold italic mb-2 text-center">
            Fable Admin
          </h1>
          <p className="text-white/40 text-sm text-center mb-8">
            Painel de gerenciamento de pedidos
          </p>

          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Chave de admin"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm outline-none focus:border-[#c9a96e] transition-colors placeholder:text-white/20 mb-4"
          />

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-br from-[#c9a96e] to-[#dfc08a] text-[#0a0a0a] font-bold text-sm"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-['Playfair_Display'] text-2xl font-bold">
              Fable <span className="text-[#c9a96e]">Admin</span>
            </h1>
          </div>
          <button
            onClick={() => {
              setAuthenticated(false);
              setAdminKey("");
            }}
            className="text-sm text-white/40 hover:text-white transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-sm text-white/40 font-medium">Filtrar:</span>
          {["all", "pending_payment", "paid", "processing", "shipped", "delivered"].map(
            (s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  statusFilter === s
                    ? "bg-[#c9a96e]/20 text-[#c9a96e] border-[#c9a96e]/30"
                    : "bg-white/[0.03] text-white/50 border-white/10 hover:border-white/20"
                }`}
              >
                {s === "all" ? "Todos" : STATUS_LABELS[s]}
              </button>
            )
          )}

          <button
            onClick={fetchOrders}
            className="ml-auto text-sm text-[#c9a96e] hover:text-[#dfc08a] transition-colors"
          >
            ↻ Atualizar
          </button>
        </div>

        {/* Orders table */}
        {loading ? (
          <div className="text-center py-20 text-white/30">Carregando...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/30 text-lg mb-2">Nenhum pedido encontrado</p>
            <p className="text-white/20 text-sm">
              Os pedidos aparecerão aqui quando os clientes comprarem.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 hover:border-white/10 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedOrder(order);
                  setTrackingInput(order.tracking_code || "");
                  setNotesInput(order.notes || "");
                }}
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold">
                        {PRODUCT_LABELS[order.product_type] || order.product_type}
                      </span>
                      {order.size && (
                        <span className="text-xs text-white/40">({order.size})</span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          STATUS_COLORS[order.status] || "bg-white/10 text-white/50"
                        }`}
                      >
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                    <p className="text-sm text-white/60">
                      {order.customers?.name} · {order.customers?.email}
                    </p>
                    {order.tracking_code && (
                      <p className="text-xs text-[#c9a96e] mt-1">
                        Rastreio: {order.tracking_code}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold">
                      R$ {(order.price_cents / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-white/30">
                      {new Date(order.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-sm bg-white/[0.03] border border-white/10 disabled:opacity-30"
            >
              ← Anterior
            </button>
            <span className="text-sm text-white/40">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-sm bg-white/[0.03] border border-white/10 disabled:opacity-30"
            >
              Próxima →
            </button>
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center z-[200] p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-[#141414] rounded-[20px] p-8 max-w-[600px] w-full relative border border-white/[0.06] max-h-[90vh] overflow-y-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 bg-white/5 border-none text-white/50 w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer"
              onClick={() => setSelectedOrder(null)}
            >
              ✕
            </button>

            <h2 className="font-['Playfair_Display'] text-xl font-bold italic mb-6">
              Detalhes do Pedido
            </h2>

            {/* Order info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">
                  Produto
                </span>
                <span className="text-sm font-semibold">
                  {PRODUCT_LABELS[selectedOrder.product_type]}
                  {selectedOrder.size && ` (${selectedOrder.size})`}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">
                  Valor
                </span>
                <span className="text-sm font-semibold">
                  R$ {(selectedOrder.price_cents / 100).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">
                  Status
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                    STATUS_COLORS[selectedOrder.status]
                  }`}
                >
                  {STATUS_LABELS[selectedOrder.status]}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">
                  Estilo
                </span>
                <span className="text-sm capitalize">
                  {selectedOrder.generations?.style}
                </span>
              </div>
            </div>

            {/* Customer info */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-4">
              <span className="text-[10px] text-white/30 uppercase tracking-wider block mb-2">
                Cliente
              </span>
              <p className="text-sm font-semibold">{selectedOrder.customers?.name}</p>
              <p className="text-xs text-white/50 mt-1">
                {selectedOrder.customers?.email} · {selectedOrder.customers?.cellphone}
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                CPF: {selectedOrder.customers?.tax_id}
              </p>
            </div>

            {/* Shipping address */}
            {selectedOrder.shipping_address && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 mb-4">
                <span className="text-[10px] text-white/30 uppercase tracking-wider block mb-2">
                  Endereço de Entrega
                </span>
                <p className="text-sm text-white/70">
                  {selectedOrder.shipping_address.street},{" "}
                  {selectedOrder.shipping_address.number}
                  {selectedOrder.shipping_address.complement &&
                    ` - ${selectedOrder.shipping_address.complement}`}
                </p>
                <p className="text-sm text-white/70">
                  {selectedOrder.shipping_address.neighborhood} ·{" "}
                  {selectedOrder.shipping_address.city}/{selectedOrder.shipping_address.state}
                </p>
                <p className="text-sm text-white/70">
                  CEP: {selectedOrder.shipping_address.zip}
                </p>
              </div>
            )}

            {/* Tracking code input */}
            {(selectedOrder.product_type === "print" ||
              selectedOrder.product_type === "canvas") && (
              <div className="mb-4">
                <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1.5">
                  Código de Rastreio (Correios)
                </label>
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="AA123456789BR"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm outline-none focus:border-[#c9a96e] transition-colors placeholder:text-white/20"
                />
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1.5">
                Observações internas
              </label>
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Notas sobre o pedido..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm outline-none focus:border-[#c9a96e] transition-colors placeholder:text-white/20 resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              {selectedOrder.status === "processing" && (
                <button
                  onClick={() =>
                    updateOrder(selectedOrder.id, {
                      status: "shipped",
                      trackingCode: trackingInput || undefined,
                      notes: notesInput || undefined,
                    })
                  }
                  disabled={updating}
                  className="flex-1 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm font-semibold hover:bg-purple-500/30 transition-all disabled:opacity-50"
                >
                  {updating ? "Salvando..." : "📦 Marcar como Enviado"}
                </button>
              )}

              {selectedOrder.status === "shipped" && (
                <button
                  onClick={() =>
                    updateOrder(selectedOrder.id, {
                      status: "delivered",
                      notes: notesInput || undefined,
                    })
                  }
                  disabled={updating}
                  className="flex-1 py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/30 transition-all disabled:opacity-50"
                >
                  {updating ? "Salvando..." : "✅ Marcar como Entregue"}
                </button>
              )}

              {selectedOrder.status === "paid" && (
                <button
                  onClick={() =>
                    updateOrder(selectedOrder.id, {
                      status: "processing",
                      notes: notesInput || undefined,
                    })
                  }
                  disabled={updating}
                  className="flex-1 py-3 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-semibold hover:bg-blue-500/30 transition-all disabled:opacity-50"
                >
                  {updating ? "Salvando..." : "🖨️ Iniciar Produção"}
                </button>
              )}

              <button
                onClick={() =>
                  updateOrder(selectedOrder.id, {
                    trackingCode: trackingInput || undefined,
                    notes: notesInput || undefined,
                  })
                }
                disabled={updating}
                className="px-6 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/[0.06] transition-all disabled:opacity-50"
              >
                💾 Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
