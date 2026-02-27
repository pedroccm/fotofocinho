"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { PRICING } from "@/lib/constants";
import type { ProductType } from "@/lib/constants";
import {
  maskCPF,
  maskPhone,
  maskCEP,
  validateCPF,
  validateEmail,
  validatePhone,
  validateCEP,
  fetchAddressByCEP,
} from "@/lib/masks";

interface ResultCheckoutFlowProps {
  generatedImage: string;
  generationId: string;
  onReset: () => void;
}

type CheckoutStep = "select-product" | "customer-data" | "shipping-address" | "pix-payment" | "success";

type FieldErrors = Record<string, string>;

interface PixData {
  orderId: string;
  pixId: string;
  brCode: string;
  brCodeBase64: string;
  expiresAt: string;
}

export default function ResultCheckoutFlow({
  generatedImage,
  generationId,
  onReset,
}: ResultCheckoutFlowProps) {
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("select-product");
  const [selectedProduct, setSelectedProduct] = useState<{
    type: ProductType;
    name: string;
    price: string;
    size?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    cellphone: "",
    taxId: "",
    password: "",
  });

  const [address, setAddress] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zip: "",
  });

  const isPhysical = selectedProduct
    ? selectedProduct.type === "print" || selectedProduct.type === "canvas"
    : false;

  // Poll payment status when QR code is shown
  useEffect(() => {
    if (!pixData || !selectedProduct) return;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/checkout/status?pixId=${pixData.pixId}&orderId=${pixData.orderId}`
        );
        const data = await res.json();

        if (data.status === "PAID") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setCheckoutStep("success");
        } else if (data.status === "EXPIRED" || data.status === "CANCELLED") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setError("QR Code expirado. Tente novamente.");
          setPixData(null);
          setCheckoutStep("customer-data");
        }
      } catch {
        // Silently retry on network errors
      }
    };

    pollingRef.current = setInterval(poll, 3000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [pixData, generationId, selectedProduct]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleCPFChange = (value: string) => {
    const masked = maskCPF(value);
    setCustomer((prev) => ({ ...prev, taxId: masked }));
    clearFieldError("taxId");
  };

  const handlePhoneChange = (value: string) => {
    const masked = maskPhone(value);
    setCustomer((prev) => ({ ...prev, cellphone: masked }));
    clearFieldError("cellphone");
  };

  const handleCEPChange = useCallback(async (value: string) => {
    const masked = maskCEP(value);
    setAddress((prev) => ({ ...prev, zip: masked }));
    clearFieldError("zip");

    const digits = value.replace(/\D/g, "");
    if (digits.length === 8) {
      setCepLoading(true);
      const result = await fetchAddressByCEP(digits);
      setCepLoading(false);

      if (result) {
        setAddress((prev) => ({
          ...prev,
          zip: masked,
          street: result.logradouro || prev.street,
          neighborhood: result.bairro || prev.neighborhood,
          city: result.localidade || prev.city,
          state: result.uf || prev.state,
          complement: result.complemento || prev.complement,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateStep1 = (): boolean => {
    const errors: FieldErrors = {};

    if (!customer.name.trim() || customer.name.trim().split(" ").length < 2) {
      errors.name = "Digite nome e sobrenome";
    }
    if (!validateEmail(customer.email)) {
      errors.email = "E-mail inválido";
    }
    if (!validatePhone(customer.cellphone)) {
      errors.cellphone = "Celular inválido";
    }
    if (!validateCPF(customer.taxId)) {
      errors.taxId = "CPF inválido";
    }
    if (customer.password.length < 6) {
      errors.password = "Mínimo 6 caracteres";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errors: FieldErrors = {};

    if (!validateCEP(address.zip)) errors.zip = "CEP inválido";
    if (!address.street.trim()) errors.street = "Obrigatório";
    if (!address.number.trim()) errors.number = "Obrigatório";
    if (!address.neighborhood.trim()) errors.neighborhood = "Obrigatório";
    if (!address.city.trim()) errors.city = "Obrigatório";
    if (!address.state) errors.state = "Obrigatório";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSelectProduct = (productId: string) => {
    const plan = PRICING.find((p) => p.id === productId);
    if (!plan) return;
    const size = plan.sizes ? (selectedSizes[plan.id] || plan.sizes[0]) : undefined;
    setSelectedProduct({
      type: plan.id as ProductType,
      name: plan.name,
      price: plan.price,
      size,
    });
    setCheckoutStep("customer-data");
    setError(null);
    setFieldErrors({});
  };

  const handleCustomerNext = () => {
    if (!validateStep1()) return;
    setFieldErrors({});
    if (isPhysical) {
      setCheckoutStep("shipping-address");
    } else {
      handleSubmitPayment();
    }
  };

  const handleAddressNext = () => {
    if (!validateStep2()) return;
    handleSubmitPayment();
  };

  const handleSubmitPayment = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType: selectedProduct.type,
          generationId,
          size: selectedProduct.size,
          customer: {
            name: customer.name.trim(),
            email: customer.email.trim(),
            cellphone: customer.cellphone,
            taxId: customer.taxId,
          },
          password: customer.password,
          shippingAddress: isPhysical ? address : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar pagamento");
      }

      setPixData({
        orderId: data.orderId,
        pixId: data.pixId,
        brCode: data.brCode,
        brCodeBase64: data.brCodeBase64,
        expiresAt: data.expiresAt,
      });
      setCheckoutStep("pix-payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBrCode = async () => {
    if (!pixData) return;
    try {
      await navigator.clipboard.writeText(pixData.brCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = pixData.brCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBack = () => {
    setFieldErrors({});
    setError(null);
    if (checkoutStep === "customer-data") {
      setSelectedProduct(null);
      setCheckoutStep("select-product");
    } else if (checkoutStep === "shipping-address") {
      setCheckoutStep("customer-data");
    } else if (checkoutStep === "pix-payment") {
      if (pollingRef.current) clearInterval(pollingRef.current);
      setPixData(null);
      setCheckoutStep(isPhysical ? "shipping-address" : "customer-data");
    }
  };

  // Step indicator logic
  const steps = isPhysical
    ? [
        { key: "select-product", label: "Produto", num: 1 },
        { key: "customer-data", label: "Dados", num: 2 },
        { key: "shipping-address", label: "Endereço", num: 3 },
        { key: "pix-payment", label: "Pagamento", num: 4 },
        { key: "success", label: "Pronto", num: 5 },
      ]
    : [
        { key: "select-product", label: "Produto", num: 1 },
        { key: "customer-data", label: "Dados", num: 2 },
        { key: "pix-payment", label: "Pagamento", num: 3 },
        { key: "success", label: "Pronto", num: 4 },
      ];

  const currentStepIndex = steps.findIndex((s) => s.key === checkoutStep);

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl bg-white border text-[var(--text)] text-sm outline-none transition-colors placeholder:text-[var(--text-muted)]/40 ${
      fieldErrors[field]
        ? "border-red-400 focus:border-red-500"
        : "border-[var(--sage-light)] focus:border-[var(--terracotta)]"
    }`;

  return (
    <section id="result" className="py-[80px] px-6 md:px-12">
      <div className="max-w-[1100px] mx-auto">
        {/* Section header */}
        <div className="text-center mb-10">
          <span className="inline-block text-xs font-bold tracking-[0.15em] uppercase text-[var(--sage)] mb-3">
            SUA OBRA-PRIMA
          </span>
          <h2 className="font-[var(--font-fraunces)] text-[36px] md:text-[44px] font-medium text-[var(--earth)] mb-4">
            Retrato pronto!
          </h2>
          <p className="text-[17px] text-[var(--text-muted)]">
            Escolha como deseja receber sua arte
          </p>
        </div>

        {/* Step indicator */}
        {checkoutStep !== "select-product" && (
          <div className="flex items-center justify-center gap-0 mb-10 max-w-[500px] mx-auto animate-fadeInUp">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      i < currentStepIndex
                        ? "bg-[var(--sage)] text-white"
                        : i === currentStepIndex
                        ? "bg-[var(--terracotta)] text-white"
                        : "bg-[var(--sand)] text-[var(--text-muted)] border-2 border-[var(--sage-light)]"
                    }`}
                  >
                    {i < currentStepIndex ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      s.num
                    )}
                  </div>
                  <span className={`text-[11px] mt-1.5 font-semibold ${
                    i <= currentStepIndex ? "text-[var(--earth)]" : "text-[var(--text-muted)]"
                  }`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-10 md:w-16 h-0.5 mx-2 mb-5 ${
                    i < currentStepIndex ? "bg-[var(--sage)]" : "bg-[var(--sage-light)]"
                  }`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Main layout */}
        <div className="grid md:grid-cols-[420px_1fr] gap-8 md:gap-12 items-start">
          {/* Left: Generated image */}
          <div className="md:sticky md:top-[100px]">
            {selectedProduct && (selectedProduct.type === "canvas" || selectedProduct.type === "print") ? (
              <div className="rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                <div
                  className="relative flex items-center justify-center py-12 px-8"
                  style={{
                    background: "linear-gradient(180deg, #f0ebe3 0%, #e8e0d4 60%, #d6cec2 100%)",
                    minHeight: 320,
                  }}
                >
                  {/* Shadow on wall */}
                  <div
                    className="absolute"
                    style={{
                      width: "70%",
                      height: "75%",
                      background: "rgba(0,0,0,0.08)",
                      filter: "blur(20px)",
                      borderRadius: 8,
                      transform: "translateY(12px)",
                    }}
                  />
                  {/* Frame */}
                  <div
                    className="relative bg-white"
                    style={{
                      padding: selectedProduct.type === "canvas" ? 0 : 12,
                      boxShadow: selectedProduct.type === "canvas"
                        ? "inset 0 0 0 3px rgba(92,75,58,0.15), 0 4px 16px rgba(0,0,0,0.15)"
                        : "0 2px 12px rgba(0,0,0,0.12)",
                      borderRadius: selectedProduct.type === "canvas" ? 2 : 0,
                    }}
                  >
                    <img
                      src={generatedImage}
                      alt="Retrato gerado"
                      className="block"
                      style={{
                        width: "auto",
                        maxWidth: 260,
                        maxHeight: 260,
                        borderRadius: selectedProduct.type === "canvas" ? 2 : 0,
                      }}
                    />
                  </div>
                </div>
                <div className="bg-[var(--cream)] text-center py-3 px-4">
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {selectedProduct.type === "canvas" ? "Preview: Canvas na parede" : "Preview: Fine Art Print emoldurado"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                <img
                  src={generatedImage}
                  alt="Retrato gerado"
                  className="w-full h-auto rounded-2xl"
                />
                {checkoutStep === "select-product" && (
                  <p className="text-center text-[12px] text-[var(--text-muted)] mt-3 mb-1">
                    Imagem com marca d&apos;água — escolha um formato para receber sem marca
                  </p>
                )}
              </div>
            )}
            {checkoutStep === "select-product" ? (
              <button
                onClick={onReset}
                className="mt-4 w-full py-3 rounded-full border-2 border-[var(--sage-light)] text-[var(--text-muted)] text-sm font-semibold hover:bg-[var(--sage)]/10 hover:border-[var(--sage)] transition-all"
              >
                Gerar outro retrato
              </button>
            ) : selectedProduct && (
              <div className="mt-4 bg-[var(--cream)] rounded-2xl p-4 border-2 border-[var(--sage-light)] text-center">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-medium mb-1">Produto selecionado</p>
                <p className="font-[var(--font-fraunces)] text-lg font-medium text-[var(--earth)]">
                  {selectedProduct.name}
                  {selectedProduct.size && <span className="text-[var(--text-muted)] text-sm font-[var(--font-nunito)]"> · {selectedProduct.size}</span>}
                </p>
                <p className="font-[var(--font-fraunces)] text-xl font-semibold text-[var(--terracotta)]">{selectedProduct.price}</p>
              </div>
            )}
          </div>

          {/* Right: Step content */}
          <div>
            {/* Error banner */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* STEP: Select Product */}
            {checkoutStep === "select-product" && (
              <div key="select-product" className="animate-slideInRight space-y-4">
                {PRICING.map((plan) => (
                  <div
                    key={plan.id}
                    className={`bg-[var(--cream)] rounded-2xl p-6 relative transition-all duration-300 cursor-pointer group ${
                      plan.highlighted
                        ? "border-2 border-[var(--terracotta)] bg-white"
                        : "border-2 border-transparent hover:border-[var(--sage-light)]"
                    }`}
                    onClick={() => {
                      const size = plan.sizes ? (selectedSizes[plan.id] || plan.sizes[0]) : undefined;
                      setSelectedProduct({
                        type: plan.id as ProductType,
                        name: plan.name,
                        price: plan.price,
                        size,
                      });
                    }}
                  >
                    {plan.badge && (
                      <span className="absolute -top-3 left-6 px-4 py-1 bg-[var(--terracotta)] text-white text-xs font-bold rounded-full">
                        {plan.badge}
                      </span>
                    )}
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <h3 className="font-[var(--font-fraunces)] text-[22px] font-medium text-[var(--earth)] mb-1">
                          {plan.name}
                        </h3>
                        <p className="text-sm text-[var(--text-muted)]">
                          {plan.features.join(" · ")}
                        </p>
                        {plan.sizes && (
                          <select
                            value={selectedSizes[plan.id] || plan.sizes[0]}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelectedSizes((prev) => ({ ...prev, [plan.id]: e.target.value }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 px-3 py-1.5 rounded-lg border border-[var(--sage-light)] bg-white text-[var(--text)] text-sm outline-none cursor-pointer"
                          >
                            {plan.sizes.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-[var(--font-fraunces)] text-[32px] font-semibold ${
                          plan.highlighted ? "text-[var(--terracotta)]" : "text-[var(--earth)]"
                        }`}>
                          {plan.price}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectProduct(plan.id);
                          }}
                          className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 ${
                            plan.highlighted
                              ? "bg-[var(--terracotta)] text-white hover:bg-[var(--terracotta-dark)]"
                              : plan.id === "print"
                              ? "bg-[var(--sage)] text-white hover:bg-[var(--sage-dark)]"
                              : "border-2 border-[var(--sage)] text-[var(--sage-dark)] hover:bg-[var(--sage)] hover:text-white"
                          }`}
                        >
                          {plan.cta}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STEP: Customer Data */}
            {checkoutStep === "customer-data" && (
              <div key="customer-data" className="animate-slideInRight">
                <div className="bg-[var(--cream)] rounded-2xl p-6 md:p-8 border-2 border-[var(--sage-light)]">
                  <h3 className="font-[var(--font-fraunces)] text-[22px] font-medium text-[var(--earth)] mb-1">
                    Seus dados
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mb-6">
                    Preencha para finalizar o pedido de{" "}
                    <span className="font-semibold text-[var(--terracotta)]">{selectedProduct?.name}</span>
                    {selectedProduct?.size && <span> · {selectedProduct.size}</span>}
                    {" · "}<span className="font-semibold">{selectedProduct?.price}</span>
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] font-medium mb-1.5 tracking-wide uppercase">
                        Nome completo *
                      </label>
                      <input
                        type="text"
                        value={customer.name}
                        onChange={(e) => { setCustomer({ ...customer, name: e.target.value }); clearFieldError("name"); }}
                        placeholder="Maria da Silva"
                        className={inputClass("name")}
                      />
                      {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-xs text-[var(--text-muted)] font-medium mb-1.5 tracking-wide uppercase">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        value={customer.email}
                        onChange={(e) => { setCustomer({ ...customer, email: e.target.value }); clearFieldError("email"); }}
                        placeholder="maria@email.com"
                        className={inputClass("email")}
                      />
                      {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-xs text-[var(--text-muted)] font-medium mb-1.5 tracking-wide uppercase">
                        Crie uma senha *
                      </label>
                      <input
                        type="password"
                        value={customer.password}
                        onChange={(e) => { setCustomer({ ...customer, password: e.target.value }); clearFieldError("password"); }}
                        placeholder="Mínimo 6 caracteres"
                        className={inputClass("password")}
                      />
                      <p className="text-[var(--text-muted)] text-[11px] mt-1.5">
                        Use essa senha para acompanhar seu pedido em Minha Conta
                      </p>
                      {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-[var(--text-muted)] font-medium mb-1.5 tracking-wide uppercase">
                          Celular *
                        </label>
                        <input
                          type="tel"
                          value={customer.cellphone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          placeholder="(11) 99999-9999"
                          className={inputClass("cellphone")}
                        />
                        {fieldErrors.cellphone && <p className="text-red-500 text-xs mt-1">{fieldErrors.cellphone}</p>}
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--text-muted)] font-medium mb-1.5 tracking-wide uppercase">
                          CPF *
                        </label>
                        <input
                          type="text"
                          value={customer.taxId}
                          onChange={(e) => handleCPFChange(e.target.value)}
                          placeholder="123.456.789-01"
                          className={inputClass("taxId")}
                        />
                        {fieldErrors.taxId && <p className="text-red-500 text-xs mt-1">{fieldErrors.taxId}</p>}
                      </div>
                    </div>

                    <div className="flex gap-3 mt-2 pt-2">
                      <button
                        onClick={handleBack}
                        className="px-6 py-3.5 rounded-full border-2 border-[var(--sage-light)] text-[var(--text-muted)] text-sm font-semibold hover:bg-[var(--sage)]/10 transition-all"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={handleCustomerNext}
                        disabled={loading}
                        className="flex-1 py-3.5 rounded-full bg-[var(--terracotta)] text-white text-[15px] font-bold transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--terracotta-dark)] hover:shadow-[0_8px_24px_rgba(193,127,89,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block animate-spin" />
                            Gerando QR Code...
                          </span>
                        ) : isPhysical ? (
                          "Próximo: Endereço"
                        ) : (
                          `Pagar ${selectedProduct?.price} via Pix`
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP: Shipping Address */}
            {checkoutStep === "shipping-address" && (
              <div key="shipping-address" className="animate-slideInRight">
                <div className="bg-[var(--cream)] rounded-2xl p-6 md:p-8 border-2 border-[var(--sage-light)]">
                  <h3 className="font-[var(--font-fraunces)] text-[22px] font-medium text-[var(--earth)] mb-1">
                    Endereço de entrega
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mb-6">
                    Para onde devemos enviar seu{" "}
                    <span className="font-semibold text-[var(--terracotta)]">{selectedProduct?.name}</span>?
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] font-medium mb-1.5 tracking-wide uppercase">
                        CEP *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={address.zip}
                          onChange={(e) => handleCEPChange(e.target.value)}
                          placeholder="01234-567"
                          className={inputClass("zip")}
                        />
                        {cepLoading && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <span className="w-4 h-4 border-2 border-[var(--terracotta)]/30 border-t-[var(--terracotta)] rounded-full inline-block animate-spin" />
                          </div>
                        )}
                      </div>
                      {fieldErrors.zip && <p className="text-red-500 text-xs mt-1">{fieldErrors.zip}</p>}
                    </div>

                    <div className="grid grid-cols-[1fr_100px] gap-3">
                      <div>
                        <label className="block text-xs text-[var(--text-muted)] font-medium mb-1.5 tracking-wide uppercase">
                          Rua *
                        </label>
                        <input
                          type="text"
                          value={address.street}
                          onChange={(e) => { setAddress({ ...address, street: e.target.value }); clearFieldError("street"); }}
                          placeholder="Rua das Flores"
                          className={inputClass("street")}
                        />
                        {fieldErrors.street && <p className="text-red-500 text-xs mt-1">{fieldErrors.street}</p>}
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--text-muted)] font-medium mb-1.5 tracking-wide uppercase">
                          No *
                        </label>
                        <input
                          type="text"
                          value={address.number}
                          onChange={(e) => { setAddress({ ...address, number: e.target.value }); clearFieldError("number"); }}
                          placeholder="123"
                          className={inputClass("number")}
                        />
                        {fieldErrors.number && <p className="text-red-500 text-xs mt-1">{fieldErrors.number}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-[var(--text-muted)] font-medium mb-1.5 tracking-wide uppercase">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={address.complement}
                        onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                        placeholder="Apto 42"
                        className={inputClass("complement")}
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[var(--text-muted)] font-medium mb-1.5 tracking-wide uppercase">
                        Bairro *
                      </label>
                      <input
                        type="text"
                        value={address.neighborhood}
                        onChange={(e) => { setAddress({ ...address, neighborhood: e.target.value }); clearFieldError("neighborhood"); }}
                        placeholder="Centro"
                        className={inputClass("neighborhood")}
                      />
                      {fieldErrors.neighborhood && <p className="text-red-500 text-xs mt-1">{fieldErrors.neighborhood}</p>}
                    </div>

                    <div className="grid grid-cols-[1fr_100px] gap-3">
                      <div>
                        <label className="block text-xs text-[var(--text-muted)] font-medium mb-1.5 tracking-wide uppercase">
                          Cidade *
                        </label>
                        <input
                          type="text"
                          value={address.city}
                          onChange={(e) => { setAddress({ ...address, city: e.target.value }); clearFieldError("city"); }}
                          placeholder="Sao Paulo"
                          className={inputClass("city")}
                        />
                        {fieldErrors.city && <p className="text-red-500 text-xs mt-1">{fieldErrors.city}</p>}
                      </div>
                      <div>
                        <label className="block text-xs text-[var(--text-muted)] font-medium mb-1.5 tracking-wide uppercase">
                          UF *
                        </label>
                        <select
                          value={address.state}
                          onChange={(e) => { setAddress({ ...address, state: e.target.value }); clearFieldError("state"); }}
                          className={`${inputClass("state")} appearance-none cursor-pointer`}
                        >
                          <option value="">UF</option>
                          {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(
                            (uf) => <option key={uf} value={uf}>{uf}</option>
                          )}
                        </select>
                        {fieldErrors.state && <p className="text-red-500 text-xs mt-1">{fieldErrors.state}</p>}
                      </div>
                    </div>

                    <div className="flex gap-3 mt-2 pt-2">
                      <button
                        onClick={handleBack}
                        className="px-6 py-3.5 rounded-full border-2 border-[var(--sage-light)] text-[var(--text-muted)] text-sm font-semibold hover:bg-[var(--sage)]/10 transition-all"
                      >
                        Voltar
                      </button>
                      <button
                        onClick={handleAddressNext}
                        disabled={loading}
                        className="flex-1 py-3.5 rounded-full bg-[var(--terracotta)] text-white text-[15px] font-bold transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--terracotta-dark)] hover:shadow-[0_8px_24px_rgba(193,127,89,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block animate-spin" />
                            Gerando QR Code...
                          </span>
                        ) : (
                          `Pagar ${selectedProduct?.price} via Pix`
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP: Success */}
            {checkoutStep === "success" && (
              <div key="success" className="animate-slideInRight">
                <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-[var(--sage)] text-center">
                  <div className="w-16 h-16 mx-auto mb-5 flex items-center justify-center bg-[var(--sage)]/20 rounded-full">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--sage)" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>

                  <h3 className="font-[var(--font-fraunces)] text-[28px] font-medium text-[var(--earth)] mb-2">
                    Obrigado!
                  </h3>

                  <p className="text-[var(--text-muted)] text-base leading-relaxed mb-6">
                    {isPhysical ? (
                      <>
                        Seu pedido foi confirmado! Estamos preparando seu{" "}
                        <span className="text-[var(--terracotta)] font-semibold">
                          {selectedProduct?.type === "canvas" ? "Quadro Canvas" : "Fine Art Print"}
                        </span>{" "}
                        com carinho. Você receberá um e-mail com o código de rastreio assim que enviarmos.
                      </>
                    ) : (
                      <>
                        Seu pagamento foi confirmado! Seu{" "}
                        <span className="text-[var(--terracotta)] font-semibold">
                          download digital
                        </span>{" "}
                        em alta resolução está pronto. Verifique seu e-mail para o link de download.
                      </>
                    )}
                  </p>

                  {isPhysical && (
                    <div className="bg-[var(--cream)] border-2 border-[var(--sage-light)] rounded-2xl p-5 mb-6 text-left">
                      <h4 className="font-[var(--font-fraunces)] text-base font-semibold mb-3 text-[var(--terracotta)]">
                        Próximos passos
                      </h4>
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

                  <button
                    onClick={onReset}
                    className="w-full py-3.5 rounded-full bg-[var(--terracotta)] text-white text-[15px] font-bold transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--terracotta-dark)] hover:shadow-[0_8px_24px_rgba(193,127,89,0.3)]"
                  >
                    Criar outro retrato
                  </button>
                </div>
              </div>
            )}

            {/* STEP: PIX Payment */}
            {checkoutStep === "pix-payment" && pixData && (
              <div key="pix-payment" className="animate-slideInRight">
                <div className="bg-white rounded-2xl p-6 md:p-8 border-2 border-[var(--sage-light)] text-center">
                  <h3 className="font-[var(--font-fraunces)] text-[26px] font-medium text-[var(--earth)] mb-1">
                    Pague com Pix
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mb-6">
                    Escaneie o QR Code ou copie o código
                  </p>

                  {/* QR Code */}
                  <div className="flex justify-center mb-5">
                    <div className="bg-[var(--sand)] rounded-2xl p-4">
                      <img
                        src={pixData.brCodeBase64}
                        alt="QR Code PIX"
                        className="w-[200px] h-[200px]"
                      />
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    <span className="text-2xl font-bold text-[var(--terracotta)]">{selectedProduct?.price}</span>
                    <div className="flex items-center justify-center gap-2 mt-2 text-sm text-[var(--text-muted)]">
                      <span className="text-[var(--terracotta)] font-medium">{selectedProduct?.name}</span>
                      {selectedProduct?.size && <span>· {selectedProduct.size}</span>}
                    </div>
                  </div>

                  {/* Copy br code */}
                  <button
                    onClick={handleCopyBrCode}
                    className="w-full py-3 rounded-full border-2 border-[var(--sage-light)] text-sm font-medium transition-all hover:bg-[var(--sage)]/10 mb-4 flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <span className="text-[var(--success)] font-semibold">Copiado!</span>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                        <span className="text-[var(--text-muted)]">Copiar código Pix</span>
                      </>
                    )}
                  </button>

                  {/* Waiting indicator */}
                  <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
                    <span className="w-2 h-2 bg-[var(--terracotta)] rounded-full animate-pulse" />
                    <span>Aguardando pagamento...</span>
                  </div>

                  {/* Dev-only: Simulate payment */}
                  {typeof window !== "undefined" && window.location.hostname === "localhost" && (
                    <button
                      onClick={async () => {
                        if (!pixData || !selectedProduct) return;
                        try {
                          const res = await fetch(
                            `/api/checkout/status?pixId=${pixData.pixId}&orderId=${pixData.orderId}&simulate=true`
                          );
                          const data = await res.json();
                          if (data.status === "PAID") {
                            if (pollingRef.current) clearInterval(pollingRef.current);
                            setCheckoutStep("success");
                          }
                        } catch {
                          // ignore
                        }
                      }}
                      className="w-full mt-3 py-2.5 rounded-full border-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 text-sm font-medium hover:bg-emerald-500/20 transition-all"
                    >
                      [DEV] Simular Pagamento
                    </button>
                  )}

                  {/* Security */}
                  <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-[var(--text-muted)]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>Pagamento seguro via Pix</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
