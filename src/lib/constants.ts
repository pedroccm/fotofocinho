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
    priceInCents: 2900,
    price: formatPrice(2900),
    originalPrice: null,
    badge: null,
    badgeColor: "",
    features: ["Alta resolução", "Pronto em 5 min", "Download ilimitado", "3 estilos"],
    sizes: null,
    cta: "Escolher",
    highlighted: false,
    externalId: "fable-digital",
    checkoutName: "Download Digital - Retrato Real",
    checkoutDescription: "Imagem em alta resolução sem marca d'água",
  },
  {
    id: "canvas" as const,
    name: "Canvas",
    priceInCents: 19900,
    price: formatPrice(19900),
    originalPrice: null,
    badge: "Favorito",
    badgeColor: "bg-[var(--terracotta)]",
    features: ["Impressão em canvas", "Moldura inclusa", "Frete grátis", "Garantia vitalícia"],
    sizes: null,
    size: "30x40cm",
    cta: "Escolher",
    highlighted: true,
    externalId: "fable-canvas",
    checkoutName: "Quadro Canvas - Retrato Real",
    checkoutDescription: "Canvas premium em tela, pronto para pendurar, com montagem inclusa",
  },
  {
    id: "print" as const,
    name: "Fine Art",
    priceInCents: 8900,
    price: formatPrice(8900),
    originalPrice: null,
    badge: null,
    badgeColor: "",
    features: ["Papel fine art", "Cores vibrantes", "20x30cm", "Envio seguro"],
    sizes: null,
    size: "20x30cm",
    cta: "Escolher",
    highlighted: false,
    externalId: "fable-print",
    checkoutName: "Fine Art Print - Retrato Real",
    checkoutDescription: "Impressão em papel museum-quality archival com tintas resistentes ao tempo",
  },
];

export type ProductType = "digital" | "print" | "canvas";

export const PRODUCTS: Record<ProductType, { externalId: string; name: string; description: string; price: number }> =
  Object.fromEntries(
    PRICING.map((p) => [p.id, { externalId: p.externalId, name: p.checkoutName, description: p.checkoutDescription, price: p.priceInCents }])
  ) as Record<ProductType, { externalId: string; name: string; description: string; price: number }>;
