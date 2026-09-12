-- =============================================
-- ROCHI ACCESORIOS - Contact Settings Update SQL
-- Ejecutar en: Supabase > SQL Editor > New Query
-- (Opcional: Si querés cargar valores por defecto directamente en la base de datos)
-- =============================================

INSERT INTO site_settings (key, value) VALUES 
('contact_email', 'info@rochiaccesorios.com.ar'),
('contact_phone', '+54 9 11 2345-6789'),
('contact_address', 'Río Grande, Tierra del Fuego'),
('contact_schedule', 'Lun–Sáb: 9 a 20 hs.'),
('contact_instagram', ''),
('contact_facebook', '')
ON CONFLICT (key) DO NOTHING;
