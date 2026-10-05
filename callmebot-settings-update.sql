-- ROCHI ACCESORIOS - CallMeBot Settings Update SQL
-- Ejecutar en: Supabase > SQL Editor > New Query

INSERT INTO site_settings (key, value)
VALUES 
  ('callmebot_phone', '+5492964495799'),
  ('callmebot_apikey', ''),
  ('callmebot_enabled', 'true')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value;
