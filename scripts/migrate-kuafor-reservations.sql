-- Kuaför veritabani: Locofabric SQL Editor'de calistirin.
-- Kullanilan tipler: VARCHAR, TEXT, INT, DATETIME, TIMESTAMP

-- 1) Hizmet asamalari
IF COL_LENGTH('business_service_settings', 'stages_json') IS NULL
BEGIN
  ALTER TABLE business_service_settings
  ADD stages_json TEXT NULL;
END
GO

-- 2) Randevular tablosu (yoksa olustur)
IF OBJECT_ID('salon_reservations', 'U') IS NULL
BEGIN
  CREATE TABLE salon_reservations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    business_user_id INT NOT NULL,
    reservation_date DATETIME NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_surname VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NULL,
    staff_id VARCHAR(255) NOT NULL,
    staff_name VARCHAR(255) NOT NULL,
    service_ids_json TEXT NULL,
    service_names_json TEXT NULL,
    notes VARCHAR(255) NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
    total_minutes INT NOT NULL DEFAULT 0,
    stages_json TEXT NULL,
    staff_busy_blocks_json TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IX_salon_reservations_business_date
    ON salon_reservations (business_user_id, reservation_date);
END
GO
