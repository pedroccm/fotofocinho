const ABACATEPAY_BASE_URL = "https://api.abacatepay.com/v1";

interface Product {
  externalId: string;
  name: string;
  description: string;
  quantity: number;
  price: number; // in cents
}

interface Customer {
  name: string;
  cellphone: string;
  email: string;
  taxId: string;
}

interface CreateBillingParams {
  products: Product[];
  customer?: Customer;
  customerId?: string;
  returnUrl: string;
  completionUrl: string;
}

interface BillingResponse {
  data: {
    id: string;
    url: string;
    amount: number;
    status: string;
    methods: string[];
    customer: {
      id: string;
      metadata: Customer;
    };
    createdAt: string;
  };
  error: string | null;
}

async function abacateRequest(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: Record<string, unknown>
) {
  const res = await fetch(`${ABACATEPAY_BASE_URL}${endpoint}`, {
    method,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`AbacatePay error (${res.status}): ${error}`);
  }

  return res.json();
}

export async function createBilling(
  params: CreateBillingParams
): Promise<BillingResponse> {
  return abacateRequest("/billing/create", "POST", {
    frequency: "ONE_TIME",
    methods: ["PIX"],
    products: params.products,
    returnUrl: params.returnUrl,
    completionUrl: params.completionUrl,
    ...(params.customerId
      ? { customerId: params.customerId }
      : params.customer
      ? { customer: params.customer }
      : {}),
  });
}

export async function getBilling(billingId: string) {
  return abacateRequest(`/billing/get?id=${billingId}`);
}

export async function listBillings() {
  return abacateRequest("/billing/list");
}

// PIX QR Code API

interface CreatePixQrCodeParams {
  amount: number; // in cents
  description?: string;
  expiresIn?: number; // seconds
  customer?: Customer;
}

interface PixQrCodeResponse {
  data: {
    id: string;
    brCode: string;
    brCodeBase64: string;
    amount: number;
    status: string;
    expiresAt: string;
    createdAt: string;
  };
  error: string | null;
}

interface PixStatusResponse {
  data: {
    status: "PENDING" | "EXPIRED" | "CANCELLED" | "PAID" | "REFUNDED";
    expiresAt: string;
  };
  error: string | null;
}

export async function createPixQrCode(
  params: CreatePixQrCodeParams
): Promise<PixQrCodeResponse> {
  return abacateRequest("/pixQrCode/create", "POST", {
    amount: params.amount,
    ...(params.description ? { description: params.description } : {}),
    ...(params.expiresIn ? { expiresIn: params.expiresIn } : {}),
    ...(params.customer ? { customer: params.customer } : {}),
  });
}

export async function checkPixStatus(
  pixId: string
): Promise<PixStatusResponse> {
  return abacateRequest(`/pixQrCode/check?id=${pixId}`);
}

// Product definitions with prices in cents
export const PRODUCTS = {
  digital: {
    externalId: "fable-digital",
    name: "Download Digital - Retrato Real",
    description: "Imagem em alta resolução sem marca d'água",
    price: 2900, // R$ 29.00
  },
  print: {
    externalId: "fable-print",
    name: "Fine Art Print - Retrato Real",
    description:
      "Impressão em papel museum-quality archival com tintas resistentes ao tempo",
    price: 8900, // R$ 89.00
  },
  canvas: {
    externalId: "fable-canvas",
    name: "Quadro Canvas - Retrato Real",
    description:
      "Canvas premium em tela, pronto para pendurar, com montagem inclusa",
    price: 19900, // R$ 199.00
  },
} as const;

export type ProductType = keyof typeof PRODUCTS;
