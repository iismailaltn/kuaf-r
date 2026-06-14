-- WhatsApp bot: konusma state ve isletme eslemesi (Locofabric / Kuaför DB)

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_user_id INT NOT NULL,
  wa_phone VARCHAR(32) NOT NULL,
  conversation_key VARCHAR(128) NOT NULL,
  step VARCHAR(32) NOT NULL DEFAULT 'idle',
  locale VARCHAR(8) NOT NULL DEFAULT 'tr',
  draft_json TEXT,
  created_at DATETIME,
  updated_at DATETIME,
  UNIQUE KEY uq_wa_conv (business_user_id, wa_phone)
);

CREATE TABLE IF NOT EXISTS whatsapp_business_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_user_id INT NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  phone_number_id VARCHAR(64) NOT NULL,
  default_locale VARCHAR(8) NOT NULL DEFAULT 'tr',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME,
  updated_at DATETIME,
  UNIQUE KEY uq_wa_phone_number (phone_number_id)
);
