-- ============================================
-- FABLE - Pet Portrait E-commerce
-- Supabase Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CUSTOMERS TABLE
-- ============================================
CREATE TABLE pets_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  abacatepay_id TEXT UNIQUE, -- cust_xxx from AbacatePay
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  cellphone TEXT NOT NULL,
  tax_id TEXT NOT NULL, -- CPF/CNPJ
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pets_customers_email ON pets_customers(email);
CREATE INDEX idx_pets_customers_abacatepay_id ON pets_customers(abacatepay_id);

-- ============================================
-- 2. GENERATIONS TABLE (AI generated images)
-- ============================================
CREATE TABLE pets_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  style TEXT NOT NULL DEFAULT 'renaissance',
  original_image_path TEXT NOT NULL,  -- path in Supabase Storage
  generated_image_path TEXT,          -- clean version (no watermark)
  watermarked_image_path TEXT,        -- preview version (with watermark)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pets_generations_status ON pets_generations(status);

-- ============================================
-- 3. ORDERS TABLE
-- ============================================
CREATE TABLE pets_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id UUID NOT NULL REFERENCES pets_generations(id),
  customer_id UUID NOT NULL REFERENCES pets_customers(id),
  product_type TEXT NOT NULL CHECK (product_type IN ('digital', 'print', 'canvas')),
  size TEXT, -- e.g., '30x40cm'
  price_cents INTEGER NOT NULL, -- price in cents
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
  )),
  billing_id TEXT, -- bill_xxx from AbacatePay
  payment_url TEXT, -- AbacatePay checkout URL
  tracking_code TEXT, -- Correios tracking
  shipping_address JSONB, -- { street, number, complement, neighborhood, city, state, zip }
  notes TEXT, -- admin notes
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pets_orders_status ON pets_orders(status);
CREATE INDEX idx_pets_orders_billing_id ON pets_orders(billing_id);
CREATE INDEX idx_pets_orders_customer_id ON pets_orders(customer_id);
CREATE INDEX idx_pets_orders_generation_id ON pets_orders(generation_id);

-- ============================================
-- 4. UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION pets_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_pets_generations_updated_at
  BEFORE UPDATE ON pets_generations
  FOR EACH ROW EXECUTE FUNCTION pets_update_updated_at();

CREATE TRIGGER tr_pets_orders_updated_at
  BEFORE UPDATE ON pets_orders
  FOR EACH ROW EXECUTE FUNCTION pets_update_updated_at();

-- ============================================
-- 5. STORAGE BUCKETS (run in Supabase Dashboard or via API)
-- ============================================
-- Bucket: 'originals' (private) - uploaded pet photos
-- Bucket: 'generated' (private) - clean generated images (no watermark)
-- Bucket: 'watermarked' (public) - preview images with watermark

INSERT INTO storage.buckets (id, name, public) VALUES ('originals', 'originals', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('generated', 'generated', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('watermarked', 'watermarked', true);

-- Storage policies: watermarked bucket is publicly readable
CREATE POLICY "Public read watermarked" ON storage.objects
  FOR SELECT USING (bucket_id = 'watermarked');

-- Storage policies: service role can do everything (used by API routes)
CREATE POLICY "Service role full access originals" ON storage.objects
  FOR ALL USING (bucket_id = 'originals') WITH CHECK (bucket_id = 'originals');

CREATE POLICY "Service role full access generated" ON storage.objects
  FOR ALL USING (bucket_id = 'generated') WITH CHECK (bucket_id = 'generated');

CREATE POLICY "Service role full access watermarked" ON storage.objects
  FOR ALL USING (bucket_id = 'watermarked') WITH CHECK (bucket_id = 'watermarked');

-- ============================================
-- 6. RLS POLICIES
-- ============================================
ALTER TABLE pets_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets_orders ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, so API routes work fine
-- For the admin panel, we'll use the service role key

-- ============================================
-- 7. VIEWS FOR ADMIN
-- ============================================
CREATE OR REPLACE VIEW pets_admin_orders AS
SELECT
  o.id AS order_id,
  o.product_type,
  o.size,
  o.price_cents,
  o.status,
  o.billing_id,
  o.tracking_code,
  o.shipping_address,
  o.notes,
  o.paid_at,
  o.shipped_at,
  o.created_at,
  c.name AS customer_name,
  c.email AS customer_email,
  c.cellphone AS customer_cellphone,
  c.tax_id AS customer_tax_id,
  g.style,
  g.generated_image_path,
  g.watermarked_image_path
FROM pets_orders o
JOIN pets_customers c ON o.customer_id = c.id
JOIN pets_generations g ON o.generation_id = g.id
ORDER BY o.created_at DESC;
