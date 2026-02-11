"use client";

import { useState, useCallback } from "react";
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

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  productType: "digital" | "print" | "canvas";
  productName: string;
  price: string;
  size?: string;
  generationId: string;
}

type FieldErrors = Record<string, string>;

export default function CheckoutModal({
  isOpen,
  onClose,
  productType,
  productName,
  price,
  size,
  generationId,
}: CheckoutModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const isPhysical = productType === "print" || productType === "canvas";

  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    cellphone: "",
    taxId: "",
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

  const handleCEPChange = useCallback(
    async (value: string) => {
      const masked = maskCEP(value);
      setAddress((prev) => ({ ...prev, zip: masked }));
      clearFieldError("zip");

      // Auto-fetch address when CEP is complete
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
    },
    []
  );

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

  const goToStep2 = () => {
    if (validateStep1()) {
      setStep(2);
      setFieldErrors({});
    }
  };

  const handleSubmit = async () => {
    if (!isPhysical && !validateStep1()) return;
    if (isPhysical && step === 2 && !validateStep2()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType,
          generationId,
          size,
          customer: {
            name: customer.name.trim(),
            email: customer.email.trim(),
            cellphone: customer.cellphone,
            taxId: customer.taxId,
          },
          shippingAddress: isPhysical ? address : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar pagamento");
      }

      window.location.href = data.paymentUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl bg-white/[0.03] border text-white text-sm outline-none transition-colors placeholder:text-white/20 ${
      fieldErrors[field]
        ? "border-red-500/50 focus:border-red-500"
        : "border-white/10 focus:border-[#c9a96e]"
    }`;

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center z-[200] p-4 animate-[fadeIn_0.3s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-[#141414] rounded-[20px] p-6 sm:p-8 max-w-[480px] w-full relative animate-scaleIn border border-white/[0.06] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          className="absolute top-4 right-4 bg-white/5 border-none text-white/50 w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 hover:text-white transition-all cursor-pointer"
          onClick={onClose}
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="font-['Playfair_Display'] text-xl sm:text-2xl font-bold italic mb-1">
            Finalizar Pedido
          </h2>
          <div className="flex items-center gap-2 text-sm text-white/50 flex-wrap">
            <span className="text-[#c9a96e] font-semibold">{productName}</span>
            {size && <span>· {size}</span>}
            <span>· {price}</span>
          </div>
        </div>

        {/* Step indicator */}
        {isPhysical && (
          <div className="flex items-center gap-2 mb-6">
            <button
              className={`flex items-center gap-2 ${step === 1 ? "text-[#c9a96e]" : "text-white/30"}`}
              onClick={() => { setStep(1); setFieldErrors({}); }}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? "bg-[#c9a96e] text-[#0a0a0a]" : "bg-white/10 text-white/40"}`}>
                1
              </span>
              <span className="text-sm font-medium">Dados</span>
            </button>
            <div className="flex-1 h-px bg-white/10" />
            <button
              className={`flex items-center gap-2 ${step === 2 ? "text-[#c9a96e]" : "text-white/30"}`}
              onClick={() => { if (validateStep1()) { setStep(2); setFieldErrors({}); } }}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? "bg-[#c9a96e] text-[#0a0a0a]" : "bg-white/10 text-white/40"}`}>
                2
              </span>
              <span className="text-sm font-medium">Endereço</span>
            </button>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* STEP 1: Customer data */}
        {(step === 1 || !isPhysical) && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/40 font-medium mb-1.5 tracking-wide uppercase">
                Nome completo *
              </label>
              <input
                type="text"
                value={customer.name}
                onChange={(e) => { setCustomer({ ...customer, name: e.target.value }); clearFieldError("name"); }}
                placeholder="Maria da Silva"
                className={inputClass("name")}
              />
              {fieldErrors.name && <p className="text-red-400 text-xs mt-1">{fieldErrors.name}</p>}
            </div>

            <div>
              <label className="block text-xs text-white/40 font-medium mb-1.5 tracking-wide uppercase">
                E-mail *
              </label>
              <input
                type="email"
                value={customer.email}
                onChange={(e) => { setCustomer({ ...customer, email: e.target.value }); clearFieldError("email"); }}
                placeholder="maria@email.com"
                className={inputClass("email")}
              />
              {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/40 font-medium mb-1.5 tracking-wide uppercase">
                  Celular *
                </label>
                <input
                  type="tel"
                  value={customer.cellphone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className={inputClass("cellphone")}
                />
                {fieldErrors.cellphone && <p className="text-red-400 text-xs mt-1">{fieldErrors.cellphone}</p>}
              </div>
              <div>
                <label className="block text-xs text-white/40 font-medium mb-1.5 tracking-wide uppercase">
                  CPF *
                </label>
                <input
                  type="text"
                  value={customer.taxId}
                  onChange={(e) => handleCPFChange(e.target.value)}
                  placeholder="123.456.789-01"
                  className={inputClass("taxId")}
                />
                {fieldErrors.taxId && <p className="text-red-400 text-xs mt-1">{fieldErrors.taxId}</p>}
              </div>
            </div>

            {isPhysical ? (
              <button
                onClick={goToStep2}
                className="w-full py-3.5 rounded-xl bg-gradient-to-br from-[#c9a96e] to-[#dfc08a] text-[#0a0a0a] text-[15px] font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(201,169,110,0.3)] mt-2"
              >
                Próximo: Endereço →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-br from-[#c9a96e] to-[#dfc08a] text-[#0a0a0a] text-[15px] font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(201,169,110,0.3)] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a] rounded-full inline-block animate-[spin_0.8s_linear_infinite]" />
                    Processando...
                  </span>
                ) : (
                  `Pagar ${price} via Pix`
                )}
              </button>
            )}
          </div>
        )}

        {/* STEP 2: Shipping address */}
        {step === 2 && isPhysical && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/40 font-medium mb-1.5 tracking-wide uppercase">
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
                    <span className="w-4 h-4 border-2 border-[#c9a96e]/30 border-t-[#c9a96e] rounded-full inline-block animate-[spin_0.8s_linear_infinite]" />
                  </div>
                )}
              </div>
              {fieldErrors.zip && <p className="text-red-400 text-xs mt-1">{fieldErrors.zip}</p>}
            </div>

            <div className="grid grid-cols-[1fr_100px] gap-3">
              <div>
                <label className="block text-xs text-white/40 font-medium mb-1.5 tracking-wide uppercase">
                  Rua *
                </label>
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => { setAddress({ ...address, street: e.target.value }); clearFieldError("street"); }}
                  placeholder="Rua das Flores"
                  className={inputClass("street")}
                />
                {fieldErrors.street && <p className="text-red-400 text-xs mt-1">{fieldErrors.street}</p>}
              </div>
              <div>
                <label className="block text-xs text-white/40 font-medium mb-1.5 tracking-wide uppercase">
                  Nº *
                </label>
                <input
                  type="text"
                  value={address.number}
                  onChange={(e) => { setAddress({ ...address, number: e.target.value }); clearFieldError("number"); }}
                  placeholder="123"
                  className={inputClass("number")}
                />
                {fieldErrors.number && <p className="text-red-400 text-xs mt-1">{fieldErrors.number}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/40 font-medium mb-1.5 tracking-wide uppercase">
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
              <label className="block text-xs text-white/40 font-medium mb-1.5 tracking-wide uppercase">
                Bairro *
              </label>
              <input
                type="text"
                value={address.neighborhood}
                onChange={(e) => { setAddress({ ...address, neighborhood: e.target.value }); clearFieldError("neighborhood"); }}
                placeholder="Centro"
                className={inputClass("neighborhood")}
              />
              {fieldErrors.neighborhood && <p className="text-red-400 text-xs mt-1">{fieldErrors.neighborhood}</p>}
            </div>

            <div className="grid grid-cols-[1fr_100px] gap-3">
              <div>
                <label className="block text-xs text-white/40 font-medium mb-1.5 tracking-wide uppercase">
                  Cidade *
                </label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => { setAddress({ ...address, city: e.target.value }); clearFieldError("city"); }}
                  placeholder="São Paulo"
                  className={inputClass("city")}
                />
                {fieldErrors.city && <p className="text-red-400 text-xs mt-1">{fieldErrors.city}</p>}
              </div>
              <div>
                <label className="block text-xs text-white/40 font-medium mb-1.5 tracking-wide uppercase">
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
                {fieldErrors.state && <p className="text-red-400 text-xs mt-1">{fieldErrors.state}</p>}
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => { setStep(1); setFieldErrors({}); }}
                className="flex-1 py-3.5 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/5 transition-all"
              >
                ← Voltar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] py-3.5 rounded-xl bg-gradient-to-br from-[#c9a96e] to-[#dfc08a] text-[#0a0a0a] text-[15px] font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(201,169,110,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#0a0a0a]/20 border-t-[#0a0a0a] rounded-full inline-block animate-[spin_0.8s_linear_infinite]" />
                    Processando...
                  </span>
                ) : (
                  `Pagar ${price} via Pix`
                )}
              </button>
            </div>
          </div>
        )}

        {/* Security */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-white/25">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Pagamento seguro via Abacate Pay</span>
        </div>
      </div>
    </div>
  );
}
