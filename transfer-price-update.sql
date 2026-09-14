-- =============================================
-- ROCHI ACCESORIOS - Transfer Price Update SQL
-- Ejecutar en: Supabase > SQL Editor > New Query
-- =============================================

-- Agregar columna transfer_price a la tabla de productos (opcional para precio por transferencia)
ALTER TABLE products ADD COLUMN IF NOT EXISTS transfer_price NUMERIC;
