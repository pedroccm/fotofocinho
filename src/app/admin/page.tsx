"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

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
  pets_customers: {
    name: string;
    email: string;
    cellphone: string;
    tax_id: string;
  };
  pets_generations: {
    style: string;
    generated_image_path: string;
    watermarked_image_path: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-yellow-500/15 text-yellow-700 border-yellow-500/20",
  paid: "bg-emerald-500/15 text-emerald-700 border-emerald-500/20",
  processing: "bg-blue-500/15 text-blue-700 border-blue-500/20",
  shipped: "bg-purple-500/15 text-purple-700 border-purple-500/20",
  delivered: "bg-emerald-500/15 text-emerald-700 border-emerald-500/20",
  cancelled: "bg-red-500/15 text-red-700 border-red-500/20",
  refunded: "bg-gray-500/15 text-gray-600 border-gray-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Aguardando Pagamento",
  paid: "Pago",
  processing: "Em Producao",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

const PRODUCT_LABELS: Record<string, string> = {
  digital: "Download Digital",
  print: "Fine Art Print",
  canvas: "Quadro Canvas",
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
      <div className="min-h-screen bg-[var(--sand)] flex items-center justify-center px-6 relative overflow-hidden">
        <div className="blob-1 fixed top-[-150px] right-[-100px] w-[500px] h-[500px] bg-[var(--sage-light)] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] opacity-40 z-0" />
        <div className="blob-2 fixed bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-[var(--terracotta)] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] opacity-20 z-0" />

        <form onSubmit={handleLogin} className="max-w-[360px] w-full relative z-10">
          <h1 className="font-[var(--font-fraunces)] text-3xl font-semibold text-[var(--earth)] mb-1 text-center">
            fotofocinho
          </h1>
          <p className="text-[var(--text-muted)] text-sm text-center mb-8">
            Painel de gerenciamento
          </p>

          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Chave de admin"
            className="w-full px-4 py-3 rounded-xl bg-[var(--cream)] border border-[var(--sage-light)]/40 text-[var(--text)] text-sm outline-none focus:border-[var(--terracotta)] transition-colors placeholder:text-[var(--text-muted)]/50 mb-4"
          />

          <button
            type="submit"
            className="w-full py-3 rounded-full bg-[var(--terracotta)] text-white font-bold text-sm hover:bg-[var(--terracotta-dark)] transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-[var(--sand)] relative overflow-hidden">
      {/* Blobs */}
      <div className="blob-1 fixed top-[-150px] right-[-100px] w-[500px] h-[500px] bg-[var(--sage-light)] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] opacity-40 z-0" />
      <div className="blob-2 fixed bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-[var(--terracotta)] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] opacity-20 z-0" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 py-5 flex items-center justify-between bg-gradient-to-b from-[var(--sand)] to-transparent">
        <Link href="/" className="font-[var(--font-fraunces)] text-[28px] font-semibold text-[var(--earth)]">
          fotofocinho
        </Link>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-[var(--terracotta)]/15 text-[var(--terracotta)] text-xs font-bold">
            Admin
          </span>
          <button
            onClick={() => {
              setAuthenticated(false);
              setAdminKey("");
            }}
            className="px-5 py-2.5 text-sm font-semibold text-[var(--text-muted)] rounded-full transition-all hover:text-red-500 hover:bg-red-500/10"
          >
            Sair
          </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 pt-[120px] pb-12">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {["all", "pending_payment", "paid", "processing", "shipped", "delivered"].map(
            (s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                  statusFilter === s
                    ? "bg-[var(--terracotta)] text-white border-[var(--terracotta)]"
                    : "bg-[var(--cream)] text-[var(--text-muted)] border-[var(--sage-light)]/40 hover:border-[var(--terracotta)]/40"
                }`}
              >
                {s === "all" ? "Todos" : STATUS_LABELS[s]}
              </button>
            )
          )}

          <button
            onClick={fetchOrders}
            className="ml-auto text-sm text-[var(--terracotta)] font-semibold hover:text-[var(--terracotta-dark)] transition-colors"
          >
            Atualizar
          </button>
        </div>

        {/* Orders */}
        {loading ? (
          <div className="text-center py-20 text-[var(--text-muted)]">Carregando...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-[var(--earth)] text-lg font-medium mb-2">Nenhum pedido encontrado</p>
            <p className="text-[var(--text-muted)] text-sm">
              Os pedidos aparecerao aqui quando os clientes comprarem.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-[var(--cream)] border border-[var(--sage-light)]/30 rounded-2xl p-5 hover:border-[var(--terracotta)]/30 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedOrder(order);
                  setTrackingInput(order.tracking_code || "");
                  setNotesInput(order.notes || "");
                }}
              >
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-[var(--earth)]">
                        {PRODUCT_LABELS[order.product_type] || order.product_type}
                      </span>
                      {order.size && (
                        <span className="text-xs text-[var(--text-muted)]">({order.size})</span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          STATUS_COLORS[order.status] || "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">
                      {order.pets_customers?.name} · {order.pets_customers?.email}
                    </p>
                    {order.tracking_code && (
                      <p className="text-xs text-[var(--terracotta)] font-medium mt-1">
                        Rastreio: {order.tracking_code}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-[var(--earth)]">
                      R$ {(order.price_cents / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
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
              className="px-4 py-2 rounded-full text-sm bg-[var(--cream)] border border-[var(--sage-light)]/40 text-[var(--text-muted)] disabled:opacity-30"
            >
              Anterior
            </button>
            <span className="text-sm text-[var(--text-muted)]">
              Pagina {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-full text-sm bg-[var(--cream)] border border-[var(--sage-light)]/40 text-[var(--text-muted)] disabled:opacity-30"
            >
              Proxima
            </button>
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-[var(--cream)] rounded-[20px] p-8 max-w-[600px] w-full relative border border-[var(--sage-light)]/30 max-h-[90vh] overflow-y-auto animate-scaleIn shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 bg-[var(--sage-light)]/20 border-none text-[var(--text-muted)] w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--sage-light)]/40 transition-all cursor-pointer"
              onClick={() => setSelectedOrder(null)}
            >
              ✕
            </button>

            <h2 className="font-[var(--font-fraunces)] text-xl font-semibold text-[var(--earth)] mb-6">
              Detalhes do Pedido
            </h2>

            {/* Order info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Produto
                </span>
                <span className="text-sm font-semibold text-[var(--earth)]">
                  {PRODUCT_LABELS[selectedOrder.product_type]}
                  {selectedOrder.size && ` (${selectedOrder.size})`}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Valor
                </span>
                <span className="text-sm font-semibold text-[var(--earth)]">
                  R$ {(selectedOrder.price_cents / 100).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Status
                </span>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    STATUS_COLORS[selectedOrder.status]
                  }`}
                >
                  {STATUS_LABELS[selectedOrder.status]}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  Estilo
                </span>
                <span className="text-sm capitalize text-[var(--earth)]">
                  {selectedOrder.pets_generations?.style}
                </span>
              </div>
            </div>

            {/* Customer info */}
            <div className="bg-[var(--sand)] border border-[var(--sage-light)]/30 rounded-xl p-4 mb-4">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                Cliente
              </span>
              <p className="text-sm font-semibold text-[var(--earth)]">{selectedOrder.pets_customers?.name}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {selectedOrder.pets_customers?.email} · {selectedOrder.pets_customers?.cellphone}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                CPF: {selectedOrder.pets_customers?.tax_id}
              </p>
            </div>

            {/* Shipping address */}
            {selectedOrder.shipping_address && (
              <div className="bg-[var(--sand)] border border-[var(--sage-light)]/30 rounded-xl p-4 mb-4">
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-2">
                  Endereco de Entrega
                </span>
                <p className="text-sm text-[var(--earth)]">
                  {selectedOrder.shipping_address.street},{" "}
                  {selectedOrder.shipping_address.number}
                  {selectedOrder.shipping_address.complement &&
                    ` - ${selectedOrder.shipping_address.complement}`}
                </p>
                <p className="text-sm text-[var(--earth)]">
                  {selectedOrder.shipping_address.neighborhood} ·{" "}
                  {selectedOrder.shipping_address.city}/{selectedOrder.shipping_address.state}
                </p>
                <p className="text-sm text-[var(--earth)]">
                  CEP: {selectedOrder.shipping_address.zip}
                </p>
              </div>
            )}

            {/* Tracking code input */}
            {(selectedOrder.product_type === "print" ||
              selectedOrder.product_type === "canvas") && (
              <div className="mb-4">
                <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                  Codigo de Rastreio (Correios)
                </label>
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="AA123456789BR"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--sand)] border border-[var(--sage-light)]/40 text-[var(--text)] text-sm outline-none focus:border-[var(--terracotta)] transition-colors placeholder:text-[var(--text-muted)]/50"
                />
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1.5">
                Observacoes internas
              </label>
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Notas sobre o pedido..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-[var(--sand)] border border-[var(--sage-light)]/40 text-[var(--text)] text-sm outline-none focus:border-[var(--terracotta)] transition-colors placeholder:text-[var(--text-muted)]/50 resize-none"
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
                  className="flex-1 py-3 rounded-full bg-purple-500/15 border border-purple-500/20 text-purple-700 text-sm font-semibold hover:bg-purple-500/25 transition-all disabled:opacity-50"
                >
                  {updating ? "Salvando..." : "Marcar como Enviado"}
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
                  className="flex-1 py-3 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-700 text-sm font-semibold hover:bg-emerald-500/25 transition-all disabled:opacity-50"
                >
                  {updating ? "Salvando..." : "Marcar como Entregue"}
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
                  className="flex-1 py-3 rounded-full bg-blue-500/15 border border-blue-500/20 text-blue-700 text-sm font-semibold hover:bg-blue-500/25 transition-all disabled:opacity-50"
                >
                  {updating ? "Salvando..." : "Iniciar Producao"}
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
                className="px-6 py-3 rounded-full bg-[var(--sage-light)]/20 border border-[var(--sage-light)]/40 text-[var(--text-muted)] text-sm font-semibold hover:bg-[var(--sage-light)]/40 transition-all disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
