-- =============================================
-- ROCHI ACCESORIOS - Supabase Update SQL
-- Ejecutar en: Supabase > SQL Editor > New Query
-- =============================================

-- 1. AGREGAR COLUMNA METODO DE PAGO A ORDERS
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- 2. TABLA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS categories (
  id        BIGSERIAL PRIMARY KEY,
  name      TEXT NOT NULL,
  slug      TEXT UNIQUE NOT NULL,
  emoji     TEXT,
  sort_order INT DEFAULT 99,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories"   ON categories FOR SELECT USING (true);
CREATE POLICY "Public insert categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update categories" ON categories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete categories" ON categories FOR DELETE USING (true);

-- 3. TABLA DE PRODUCTOS
CREATE TABLE IF NOT EXISTS products (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  category_slug TEXT,
  price        NUMERIC NOT NULL,
  old_price    NUMERIC,
  emoji        TEXT,
  badge        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read products"   ON products FOR SELECT USING (true);
CREATE POLICY "Public insert products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update products" ON products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete products" ON products FOR DELETE USING (true);

-- 4. (OPCIONAL) CARGAR CATEGORIAS POR DEFECTO
-- Descomenta estas líneas si querés cargar las categorías base en la DB:
/*
INSERT INTO categories (name, slug, emoji, sort_order) VALUES
  ('Maquillaje',      'makeup',   '💄', 1),
  ('Uñas & Cejas',    'nails',    '💅', 2),
  ('Estética Facial', 'skincare', '🧴', 3),
  ('Ropa Mujer',      'clothes',  '👗', 4),
  ('Regalería',       'gifts',    '🎁', 5)
ON CONFLICT (slug) DO NOTHING;
*/
