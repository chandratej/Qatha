-- Migration 013: Configurable phone / WhatsApp settings (no hardcoded numbers in app code)
INSERT INTO public.platform_config (key, value) VALUES
  ('phone', '{
    "country_code": "91",
    "national_length": 10,
    "mobile_leading_pattern": "[6-9]",
    "example_e164": "+919876543210",
    "whatsapp_business_number": "919876543210",
    "region_label": "Indian"
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;