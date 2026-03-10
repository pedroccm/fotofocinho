export const STYLES = [
  { id: "renaissance", name: "Renascença", emoji: "👑" },
  { id: "baroque", name: "Barroco", emoji: "🏰" },
  { id: "victorian", name: "Vitoriano", emoji: "🎩" },
];

export function formatPrice(cents: number): string {
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  return centavos === 0 ? `R$ ${reais}` : `R$ ${reais},${String(centavos).padStart(2, "0")}`;
}

export const PRICING = [
  {
    id: "digital" as const,
    name: "Digital",
    priceInCents: 1500,
    price: formatPrice(1500),
    originalPrice: null,
    badge: null,
    badgeColor: "",
    features: ["Alta resolução", "Pronto em 5 min", "Download ilimitado"],
    sizes: null,
    cta: "Escolher",
    highlighted: false,
    externalId: "fable-digital",
    checkoutName: "Download Digital - Retrato Real",
    checkoutDescription: "Imagem em alta resolução sem marca d'água",
    freeShipping: false,
  },
  {
    id: "canvas" as const,
    name: "Quadro 15×10 cm",
    priceInCents: 6990,
    price: formatPrice(6990),
    originalPrice: null,
    badge: "Favorito",
    badgeColor: "bg-[var(--terracotta)]",
    features: ["Impressão em canvas", "Moldura em impressão 3D inclusa", "Frete grátis"],
    sizes: null,
    size: "15x10cm",
    cta: "Escolher",
    highlighted: true,
    externalId: "fable-canvas",
    checkoutName: "Quadro 15×10 cm - Retrato Real",
    checkoutDescription: "Impressão em canvas com moldura em impressão 3D inclusa",
    freeShipping: true,
  },
  {
    id: "print" as const,
    name: "Quadro 15×21 cm",
    priceInCents: 9500,
    price: formatPrice(9500),
    originalPrice: null,
    badge: null,
    badgeColor: "",
    features: ["Impressão em canvas", "Moldura em impressão 3D inclusa", "Frete grátis"],
    sizes: null,
    size: "15x21cm",
    cta: "Escolher",
    highlighted: false,
    externalId: "fable-print",
    checkoutName: "Quadro 15×21 cm - Retrato Real",
    checkoutDescription: "Impressão em canvas com moldura em impressão 3D inclusa",
    freeShipping: true,
  },
];

export type ProductType = "digital" | "print" | "canvas";

export const PRODUCTS: Record<ProductType, { externalId: string; name: string; description: string; price: number }> =
  Object.fromEntries(
    PRICING.map((p) => [p.id, { externalId: p.externalId, name: p.checkoutName, description: p.checkoutDescription, price: p.priceInCents }])
  ) as Record<ProductType, { externalId: string; name: string; description: string; price: number }>;
