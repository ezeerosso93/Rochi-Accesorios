-- ROCHI ACCESORIOS - Habilitar eliminación de pedidos en Supabase
-- Ejecutar en: Supabase > SQL Editor > New Query (solo si al intentar borrar un pedido arroja error de políticas RLS)

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public delete orders" 
ON orders 
FOR DELETE 
USING (true);
