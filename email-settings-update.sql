-- Insertar campos de configuración de email en site_settings si no existen
INSERT INTO site_settings (key, value) VALUES 
('admin_email', 'rochiregaleria@gmail.com'),
('email_subject', 'Confirmación de Pedido - Rochi Accesorios'),
('email_template', 'Hola {{nombre}},\n\nHemos recibido tu pedido {{id}} correctamente.\n\nDetalle:\n{{detalle}}\n\nTotal: {{total}}\n\nNos contactaremos por WhatsApp para coordinar el pago y envío.\n\n¡Gracias por elegir Rochi Accesorios!'),
('emailjs_public_key', ''),
('emailjs_service_id', ''),
('emailjs_template_id', '')
ON CONFLICT (key) DO NOTHING;
