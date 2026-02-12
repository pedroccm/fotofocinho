export const STYLES = [
  { id: "renaissance", name: "Renascença", emoji: "👑" },
  { id: "baroque", name: "Barroco", emoji: "🏰" },
  { id: "victorian", name: "Vitoriano", emoji: "🎩" },
];

export const PRICING = [
  {
    id: "digital" as const,
    name: "Digital",
    price: "R$ 29",
    originalPrice: null,
    badge: null,
    badgeColor: "",
    features: ["Alta resolução", "Pronto em 5 min", "Download ilimitado", "3 estilos"],
    sizes: null,
    cta: "Escolher",
    highlighted: false,
  },
  {
    id: "canvas" as const,
    name: "Canvas",
    price: "R$ 199",
    originalPrice: null,
    badge: "Favorito",
    badgeColor: "bg-[var(--terracotta)]",
    features: ["Impressão em canvas", "Moldura inclusa", "Frete grátis", "Garantia vitalícia"],
    sizes: ["30x40cm", "40x60cm", "50x70cm"],
    cta: "Escolher",
    highlighted: true,
  },
  {
    id: "print" as const,
    name: "Fine Art",
    price: "R$ 89",
    originalPrice: null,
    badge: null,
    badgeColor: "",
    features: ["Papel fine art", "Cores vibrantes", "Vários tamanhos", "Envio seguro"],
    sizes: ["20x30cm", "30x40cm", "40x50cm"],
    cta: "Escolher",
    highlighted: false,
  },
];

export type ProductType = "digital" | "print" | "canvas";
