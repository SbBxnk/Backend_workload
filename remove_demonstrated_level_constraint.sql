-- ตรวจสอบและลบ CHECK constraint ของ demonstrated_level ใน tb_performance_evaluation

-- ตรวจสอบ constraints ที่มีอยู่
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE,
    CHECK_CLAUSE
FROM 
    INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
LEFT JOIN 
    INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc ON tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
WHERE 
    tc.TABLE_SCHEMA = DATABASE()
    AND tc.TABLE_NAME = 'tb_performance_evaluation'
    AND tc.CONSTRAINT_TYPE = 'CHECK';

-- ลบ CHECK constraint (ถ้ามี - แก้ไขชื่อ constraint ให้ตรงกับที่พบใน database)
-- ALTER TABLE tb_performance_evaluation DROP CHECK constraint_name_here;

