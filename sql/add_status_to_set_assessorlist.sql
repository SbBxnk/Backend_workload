-- เพิ่มฟิลด์ status ในตาราง tb_set_assessorlist
ALTER TABLE tb_set_assessorlist 
ADD COLUMN status INT DEFAULT 0 COMMENT 'สถานะการส่งฟอร์ม: 0=ยังไม่ส่ง, 1=ส่งแล้ว';
