-- salon_reservations: JSON kolonlari VARCHAR(255) ise TEXT yapin (kesilme onlenir).
-- Desteklenen tipler: VARCHAR, TEXT, INT, DATETIME, TIMESTAMP
-- Locofabric SQL Editor'de bir kez calistirin.

ALTER TABLE salon_reservations ALTER COLUMN service_ids_json TEXT NULL;
ALTER TABLE salon_reservations ALTER COLUMN service_names_json TEXT NULL;
ALTER TABLE salon_reservations ALTER COLUMN stages_json TEXT NULL;
ALTER TABLE salon_reservations ALTER COLUMN staff_busy_blocks_json TEXT NULL;
GO
