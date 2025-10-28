-- เพิ่มฟิลด์สำหรับ reset password
ALTER TABLE tb_users 
ADD COLUMN resetToken VARCHAR(255) NULL,
ADD COLUMN resetTokenExpiry BIGINT NULL;



