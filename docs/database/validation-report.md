# TBKK Database Validation

สถานะของผลทดสอบ: **ต้องรันใหม่สำหรับ schema รุ่นปัจจุบัน**. ผลเดิม 40/40 เป็นการตรวจ schema รุ่นก่อนปรับเมนู ผู้ใช้ และรูปแบบชื่อ FK (`sys_user`, `sys_role`, `mst_department`) จึงไม่ใช่ผลรับรองของ schema 60 ตารางในปัจจุบัน.

DDL และ ER artifacts ปัจจุบันสร้างจาก `schema-definition.json`; generator ตรวจความครบถ้วนของตาราง/คอลัมน์ใน Dictionary และ draw.io รวมทั้งความถูกต้องเชิงโครงสร้างของ XML. Static checks ยืนยันชื่อคอลัมน์ใน DDL/Dictionary/draw.io ตรงกัน, ไม่มีชื่อซ้ำในตาราง, CHECK อ้างคอลัมน์ที่มีจริง และ FK ทั้ง 224 รายการอ้างคอลัมน์ที่มีจริง. ยังไม่ได้ import DDL รุ่นปัจจุบันเข้า MySQL หรือรัน fixture อีกครั้ง.

เครื่องมือตรวจ MySQL อยู่ใน `validate_schema.py`; ก่อนรันต้องสร้าง review schema แบบใช้แล้วทิ้งและ import `schema.sql` กับ `reference-seed.sql` รุ่นปัจจุบัน. สคริปต์ปฏิเสธชื่อฐานข้อมูลที่ไม่ขึ้นต้น `tbkk_schema_review` และ fixture ทำงานใน transaction แล้ว rollback.

ผลเดิม (ย้อนหลัง): MySQL 9.6.0, 18 October 2026, 40/40 checks ผ่านบน schema รุ่นก่อนหน้า. ข้อมูลนั้นเก็บไว้เพื่อประวัติเท่านั้น ไม่ควรใช้อ้างว่าโมเดลปัจจุบันผ่าน runtime validation.

```sh
python3 docs/database/validate_schema.py --socket /path/to/test.sock --database tbkk_schema_review_asset
```
