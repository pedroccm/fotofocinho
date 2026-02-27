"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "fotofocinho-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6">
      <div className="max-w-[600px] mx-auto bg-[var(--cream)] border border-[var(--sage-light)]/40 rounded-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)] p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-[var(--text-muted)] leading-relaxed flex-1">
          Usamos cookies para melhorar sua experiência. Ao continuar, você concorda com nossa{" "}
          <a href="/privacidade" className="text-[var(--terracotta)] underline hover:text-[var(--terracotta-dark)]">
            Política de Privacidade
          </a>.
        </p>
        <button
          onClick={accept}
          className="px-6 py-2.5 bg-[var(--sage)] text-white text-sm font-bold rounded-full hover:bg-[var(--sage-dark)] transition-colors whitespace-nowrap"
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
