# TBKK Asset Data Dictionary

รวม 60 ตาราง 787 คอลัมน์ สร้างจาก generate_schema.py ซึ่งเป็นแหล่งนิยามเดียวกับ schema.sql

PK ทุกตารางเป็น BIGINT UNSIGNED AUTO_INCREMENT; FK ใช้ชนิดเดียวกัน ไม่ทำ cascade delete. NULL คือยังไม่มีข้อมูล ไม่ใช้สตริงว่างแทนวันที่หรือ FK.

## sys_menu

เมนูหลักในแถบ navigation — prefix `sm` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| sm_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร |
| sm_name | VARCHAR(120) | NO |  |  | ชื่อเมนู |
| sm_icon | VARCHAR(80) | YES |  |  | ชื่อไอคอน |
| sm_order | INT UNSIGNED | NO | 0 |  | ลำดับเมนูหลัก |
| sm_status | BOOLEAN | NO | '1' |  | สถานะเมนู |
| sm_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| sm_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| sm_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| sm_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |

## sys_setting

ค่าตั้งระบบ ไม่ใช้เก็บ secrets — prefix `sst` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| sst_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| sst_key | VARCHAR(100) | NO |  |  | ชื่อค่า |
| sst_value | JSON | NO |  |  | ค่าที่ตั้ง |
| sst_description | VARCHAR(255) | YES |  |  | คำอธิบาย |
| sst_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| sst_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| sst_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| sst_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| sst_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (sst_key)

## sys_number_sequence

ตัวนับเลขเอกสารและเลข Asset โดยล็อกแถวใน transaction — prefix `sns` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| sns_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| sns_scope | VARCHAR(150) | NO |  |  | namespace เช่น ASSET:ME:2026 หรือ CHILD:<main_id> |
| sns_last_value | BIGINT UNSIGNED | NO | 0 |  | เลขที่ใช้ล่าสุด ห้ามลดหรือใช้ซ้ำ |
| sns_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| sns_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| sns_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| sns_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| sns_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (sns_scope)

## sys_workflow

นิยาม workflow แบบมี version หลังใช้งานให้สร้าง version ใหม่ — prefix `sw` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| sw_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| sw_code | VARCHAR(80) | NO |  |  | รหัส workflow |
| sw_version | INT UNSIGNED | NO | 1 |  | เวอร์ชัน |
| sw_name | VARCHAR(255) | NO |  |  | ชื่อ workflow |
| sw_process | VARCHAR(80) | NO |  |  | กระบวนการภายใน Asset เช่น TRANSFER / ACTIVATION |
| sw_is_active | BOOLEAN | NO | 1 |  | เปิดใช้ |
| sw_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| sw_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| sw_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| sw_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| sw_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (sw_code, sw_version)

## sys_workflow_step

ลำดับและผู้รับผิดชอบของนิยาม workflow — prefix `sws` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| sws_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| sw_id | BIGINT UNSIGNED | NO |  | sys_workflow.sw_id | workflow |
| sws_sequence | INT UNSIGNED | NO |  |  | ลำดับ |
| sws_code | VARCHAR(80) | NO |  |  | รหัสขั้น |
| sws_name | VARCHAR(255) | NO |  |  | ชื่อขั้น |
| sws_action | ENUM('APPROVE','REVIEW','ACKNOWLEDGE') | NO |  |  | ชนิดการตัดสินใจ |
| sws_assignee_type | ENUM('USER','ROLE','DYNAMIC') | NO |  |  | วิธีหาผู้อนุมัติ |
| su_id | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้อนุมัติระบุคน |
| spg_id | BIGINT UNSIGNED | YES |  | sys_permission_group.spg_id | กลุ่มสิทธิ์/Role ที่กำหนดผู้อนุมัติ |
| sws_resolver | VARCHAR(100) | YES |  |  | ตัวแก้แบบ dynamic เช่น SOURCE_AREA_OWNER |
| sws_is_required | BOOLEAN | NO | 1 |  | จำเป็น |
| sws_allow_return | BOOLEAN | NO | 1 |  | อนุญาตส่งกลับ |
| sws_allow_reject | BOOLEAN | NO | 1 |  | อนุญาตปฏิเสธ |
| sws_requires_dp_date | BOOLEAN | NO | 0 |  | ขั้นกำหนดวันเริ่มค่าเสื่อม |
| sws_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| sws_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| sws_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| sws_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| sws_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (sw_id, sws_sequence), (sw_id, sws_code)

Checks: `(`sws_assignee_type` = 'USER' AND `su_id` IS NOT NULL AND `spg_id` IS NULL AND `sws_resolver` IS NULL) OR (`sws_assignee_type` = 'ROLE' AND `spg_id` IS NOT NULL AND `su_id` IS NULL AND `sws_resolver` IS NULL) OR (`sws_assignee_type` = 'DYNAMIC' AND `sws_resolver` IS NOT NULL AND `su_id` IS NULL AND `spg_id` IS NULL)`

## sys_workflow_assignment

กำหนด workflow ปัจจุบันต่อประเภทงาน — prefix `swa` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| swa_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| swa_process | VARCHAR(80) | NO |  |  | กระบวนการ |
| sw_id | BIGINT UNSIGNED | NO |  | sys_workflow.sw_id | workflow ที่ใช้ |
| swa_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| swa_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| swa_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| swa_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| swa_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (swa_process)

## sys_responsibility

ผู้รับผิดชอบหน่วยงานตามหน้าที่ — prefix `sres` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| sres_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| sd_id | BIGINT UNSIGNED | NO |  | sys_department.sd_id | หน่วยงาน |
| sres_duty | VARCHAR(80) | NO |  |  | หน้าที่ เช่น AREA_OWNER / DEPARTMENT_LEADER |
| su_id | BIGINT UNSIGNED | NO |  | sys_users.su_id | ผู้รับผิดชอบ |
| sres_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| sres_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| sres_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| sres_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| sres_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (sd_id, sres_duty)

## mst_plant

โรงงาน — prefix `mp` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| mp_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| mp_code | VARCHAR(80) | NO |  |  | รหัสอ้างอิง |
| mp_name | VARCHAR(200) | NO |  |  | ชื่อ |
| mp_is_active | BOOLEAN | NO | 1 |  | เปิดใช้งาน |
| mp_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| mp_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| mp_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| mp_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| mp_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (mp_code)

## mst_location

สถานที่ — prefix `ml` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| ml_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| ml_code | VARCHAR(80) | NO |  |  | รหัสอ้างอิง |
| ml_name | VARCHAR(200) | NO |  |  | ชื่อ |
| mp_id | BIGINT UNSIGNED | NO |  | mst_plant.mp_id | โรงงาน |
| ml_is_active | BOOLEAN | NO | 1 |  | เปิดใช้งาน |
| ml_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| ml_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| ml_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| ml_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| ml_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (ml_code)

## mst_line

สายการผลิต — prefix `mli` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| mli_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| mli_code | VARCHAR(80) | NO |  |  | รหัสอ้างอิง |
| mli_name | VARCHAR(200) | NO |  |  | ชื่อ |
| ml_id | BIGINT UNSIGNED | NO |  | mst_location.ml_id | สถานที่ |
| mli_is_active | BOOLEAN | NO | 1 |  | เปิดใช้งาน |
| mli_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| mli_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| mli_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| mli_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| mli_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (mli_code)

## mst_cost_center

ศูนย์ต้นทุน — prefix `mcc` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| mcc_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| mcc_code | VARCHAR(80) | NO |  |  | รหัสอ้างอิง |
| mcc_name | VARCHAR(200) | NO |  |  | ชื่อ |
| sd_id | BIGINT UNSIGNED | YES |  | sys_department.sd_id | หน่วยงาน |
| mcc_is_active | BOOLEAN | NO | 1 |  | เปิดใช้งาน |
| mcc_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| mcc_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| mcc_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| mcc_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| mcc_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (mcc_code)

## mst_project

โครงการ — prefix `mprj` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| mprj_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| mprj_code | VARCHAR(80) | NO |  |  | รหัสอ้างอิง |
| mprj_name | VARCHAR(200) | NO |  |  | ชื่อ |
| mprj_detail | TEXT | YES |  |  | รายละเอียด |
| sd_id | BIGINT UNSIGNED | YES |  | sys_department.sd_id | หน่วยงาน |
| mprj_is_active | BOOLEAN | NO | 1 |  | เปิดใช้งาน |
| mprj_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| mprj_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| mprj_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| mprj_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| mprj_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (mprj_code)

## mst_customer

ลูกค้าเจ้าของ Customer Asset — prefix `mc` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| mc_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| mc_code | VARCHAR(80) | NO |  |  | รหัสอ้างอิง |
| mc_name | VARCHAR(200) | NO |  |  | ชื่อ |
| mc_tax_id | VARCHAR(40) | YES |  |  | เลขผู้เสียภาษี |
| mc_is_active | BOOLEAN | NO | 1 |  | เปิดใช้งาน |
| mc_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| mc_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| mc_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| mc_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| mc_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (mc_code)

## mst_vendor

ผู้ขาย — prefix `mv` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| mv_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| mv_code | VARCHAR(80) | NO |  |  | รหัสอ้างอิง |
| mv_name | VARCHAR(200) | NO |  |  | ชื่อ |
| mv_tax_id | VARCHAR(40) | YES |  |  | เลขภาษี |
| mv_contact | VARCHAR(255) | YES |  |  | ผู้ติดต่อ |
| mv_address | TEXT | YES |  |  | ที่อยู่ |
| mv_payment_terms | VARCHAR(255) | YES |  |  | เงื่อนไขชำระเงิน |
| mv_is_active | BOOLEAN | NO | 1 |  | เปิดใช้งาน |
| mv_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| mv_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| mv_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| mv_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| mv_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (mv_code)

## mst_asset_group

กลุ่ม Asset เช่น ME MD IT — prefix `mag` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| mag_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| mag_code | VARCHAR(80) | NO |  |  | รหัสอ้างอิง |
| mag_name | VARCHAR(200) | NO |  |  | ชื่อ |
| mag_is_active | BOOLEAN | NO | 1 |  | เปิดใช้งาน |
| mag_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| mag_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| mag_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| mag_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| mag_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (mag_code)

## mst_asset_type

ประเภท Asset และอายุใช้งาน — prefix `mat` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| mat_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| mat_code | VARCHAR(80) | NO |  |  | รหัสอ้างอิง |
| mat_name | VARCHAR(200) | NO |  |  | ชื่อ |
| mag_id | BIGINT UNSIGNED | NO |  | mst_asset_group.mag_id | กลุ่ม |
| mat_useful_life_years | DECIMAL(7,2) | NO |  |  | อายุใช้งานปัจจุบัน ต้องมากกว่า 0 |
| mat_show_technical_fields | BOOLEAN | NO | 0 |  | แสดง RFQ Model Part Area Power สำหรับ ME/MD |
| mat_is_active | BOOLEAN | NO | 1 |  | เปิดใช้งาน |
| mat_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| mat_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| mat_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| mat_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| mat_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (mat_code)

Checks: ``mat_useful_life_years` > 0`

## mst_account

รหัสบัญชี — prefix `mac` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| mac_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| mac_code | VARCHAR(80) | NO |  |  | รหัสอ้างอิง |
| mac_name | VARCHAR(200) | NO |  |  | ชื่อ |
| mac_is_active | BOOLEAN | NO | 1 |  | เปิดใช้งาน |
| mac_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| mac_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| mac_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| mac_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| mac_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (mac_code)

## mst_cost_type

ชนิดต้นทุนเพิ่มเติม เช่น Installation Delivery Other — prefix `mct` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| mct_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| mct_code | VARCHAR(80) | NO |  |  | รหัสอ้างอิง |
| mct_name | VARCHAR(200) | NO |  |  | ชื่อ |
| mct_is_active | BOOLEAN | NO | 1 |  | เปิดใช้งาน |
| mct_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| mct_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| mct_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| mct_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| mct_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (mct_code)

## mst_uom

หน่วยนับ — prefix `mu` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| mu_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| mu_code | VARCHAR(80) | NO |  |  | รหัสอ้างอิง |
| mu_name | VARCHAR(200) | NO |  |  | ชื่อ |
| mu_is_active | BOOLEAN | NO | 1 |  | เปิดใช้งาน |
| mu_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| mu_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| mu_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| mu_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| mu_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (mu_code)

## mst_part

อะไหล่และ part catalog — prefix `mpt` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| mpt_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| mpt_code | VARCHAR(80) | NO |  |  | รหัสอ้างอิง |
| mpt_name | VARCHAR(200) | NO |  |  | ชื่อ |
| mpt_model | VARCHAR(255) | YES |  |  | รุ่น |
| mpt_part_no | VARCHAR(255) | YES |  |  | เลขชิ้นส่วน |
| mu_id | BIGINT UNSIGNED | NO |  | mst_uom.mu_id | หน่วยนับ |
| mpt_is_active | BOOLEAN | NO | 1 |  | เปิดใช้งาน |
| mpt_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| mpt_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| mpt_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| mpt_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| mpt_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (mpt_code)

## info_document

ทะเบียนเอกสารภายใน Asset และ sale references ไม่เก็บธุรกรรมจัดซื้อ — prefix `idoc` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| idoc_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| idoc_no | VARCHAR(100) | NO |  |  | เลขเอกสาร |
| idoc_kind | ENUM('VERIFICATION','TRANSFER','DISPOSAL','ASSET_ISSUE','SALE_PROPOSAL','TAX_INVOICE') | NO |  |  | ประเภทเอกสาร |
| idoc_status | VARCHAR(80) | NO |  |  | สถานะเฉพาะประเภทเอกสาร |
| idoc_origin | ENUM('ASSET','MIS','ETAX','IMPORT') | NO |  |  | ต้นทางงาน ใช้ตัดสิน audit |
| idoc_document_date | DATE | NO |  |  | วันที่เอกสาร |
| idoc_external_key | VARCHAR(150) | YES |  |  | รหัสต้นทางสำหรับ deduplication |
| idoc_remark | TEXT | YES |  |  | หมายเหตุ |
| idoc_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| idoc_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| idoc_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| idoc_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| idoc_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (idoc_kind, idoc_no), (idoc_origin, idoc_kind, idoc_external_key)

Indexes: (idoc_kind, idoc_status, idoc_document_date)

## info_file

metadata ไฟล์ เก็บ body ใน object storage — prefix `ifile` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| ifile_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| ifile_storage_key | VARCHAR(500) | NO |  |  | object key ไม่เก็บ URL ที่มี token |
| ifile_original_name | VARCHAR(255) | NO |  |  | ชื่อไฟล์ |
| ifile_mime_type | VARCHAR(100) | NO |  |  | MIME type |
| ifile_size_bytes | BIGINT UNSIGNED | NO |  |  | ขนาด bytes |
| ifile_sha256 | CHAR(64) | YES |  |  | checksum |
| ifile_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| ifile_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| ifile_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| ifile_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| ifile_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (ifile_storage_key)

## info_document_file

ไฟล์แนบเอกสาร รวมภาพ verification และ control sheet — prefix `idf` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| idf_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| idoc_id | BIGINT UNSIGNED | NO |  | info_document.idoc_id | เอกสาร |
| ifile_id | BIGINT UNSIGNED | NO |  | info_file.ifile_id | ไฟล์ |
| idf_purpose | VARCHAR(80) | NO |  |  | INVOICE / MACHINE_PHOTO / ASSET_PLATE / CONTROL_SHEET เป็นต้น |
| idf_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| idf_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| idf_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| idf_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| idf_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (idoc_id, ifile_id, idf_purpose)

## mst_asset

ทะเบียน Main และ Sub Asset สองระดับ ID ไม่เปลี่ยนตามเลขเอกสาร — prefix `ma` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| ma_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| ma_temporary_ref | VARCHAR(100) | NO |  |  | เลข Draft ถาวร แม้ได้เลขจริงแล้ว |
| ma_no | VARCHAR(100) | YES |  |  | เลข Asset จริง NULL จน Proposal Approved |
| ma_name | VARCHAR(255) | NO |  |  | ชื่อ Asset |
| ma_ownership | ENUM('COMPANY','CUSTOMER') | NO | 'COMPANY' |  | ประเภทเจ้าของ |
| mc_id | BIGINT UNSIGNED | YES |  | mst_customer.mc_id | เจ้าของ Customer Asset |
| ma_customer_name_snapshot | VARCHAR(255) | YES |  |  | ชื่อลูกค้าที่บันทึกบน Asset |
| parent_ma_id | BIGINT UNSIGNED | YES |  | mst_asset.ma_id | Main Asset เท่านั้น NULL สำหรับ Main |
| source_ma_id | BIGINT UNSIGNED | YES |  | mst_asset.ma_id | Asset ที่ถูกเลือกเป็น work target แยกจาก parent |
| ma_child_suffix | INT UNSIGNED | YES |  |  | suffix ที่ได้รับเมื่ออนุมัติ Proposal |
| mat_id | BIGINT UNSIGNED | NO |  | mst_asset_type.mat_id | ประเภท Asset |
| mprj_id | BIGINT UNSIGNED | YES |  | mst_project.mprj_id | โครงการ |
| irfr_id | BIGINT UNSIGNED | YES |  | info_rfq_reference.irfr_id | RFQ item reference จาก MIS ที่เลือก |
| ma_model | VARCHAR(255) | YES |  |  | รุ่นสุดท้ายที่ผู้ใช้แก้ได้ |
| ma_part_no | VARCHAR(255) | YES |  |  | เลข part สุดท้าย |
| su_id | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้ดูแล |
| sd_id | BIGINT UNSIGNED | YES |  | sys_department.sd_id | หน่วยงาน |
| mp_id | BIGINT UNSIGNED | YES |  | mst_plant.mp_id | โรงงาน |
| ml_id | BIGINT UNSIGNED | YES |  | mst_location.ml_id | สถานที่ |
| mli_id | BIGINT UNSIGNED | YES |  | mst_line.mli_id | สายการผลิต |
| mcc_id | BIGINT UNSIGNED | YES |  | mst_cost_center.mcc_id | ศูนย์ต้นทุน |
| ma_area | VARCHAR(255) | YES |  |  | พื้นที่ รองรับข้อความเดิม |
| ma_area_m2 | DECIMAL(12,4) | YES |  |  | ขนาดพื้นที่ m2 ถ้ามี |
| ma_power | VARCHAR(255) | YES |  |  | ค่า Power เดิมหรือข้อความไฟฟ้า |
| ma_power_unit | VARCHAR(30) | YES |  |  | หน่วย Power |
| ma_target_sop | DATE | YES |  |  | Target SOP |
| ma_confirmed_sop | DATE | YES |  |  | SOP ที่ตรวจยืนยัน |
| ma_maker | VARCHAR(255) | YES |  |  | ผู้ผลิต |
| ma_serial_no | VARCHAR(150) | YES |  |  | serial number |
| ma_investment_no | VARCHAR(100) | YES |  |  | เลขลงทุน |
| ma_manufacturing_date | DATE | YES |  |  | วันที่ผลิต |
| ma_registration_date | DATE | YES |  |  | วันที่ขึ้นทะเบียน |
| ma_acquisition_date | DATE | YES |  |  | วันที่ได้มา |
| ma_warranty_until | DATE | YES |  |  | สิ้นสุดประกัน |
| ma_special_control | VARCHAR(80) | YES |  |  | BOI / EL / Other |
| ma_condition | VARCHAR(80) | YES |  |  | Purchase / Leasing / Rental / Other |
| ma_status | ENUM('Draft','Purchasing','Waiting Delivery','Waiting Invoice','Waiting GR','Receiving Validation','Ready for Verification','Verification In Progress','Pending Asset Team Leader Approval','Pending Accounting Review','Pending Accounting Approval','Pending Activation Approval','Active','Returned for Correction','On Hold','Cancelled','Sold') | NO | 'Draft' |  | สถานะ Asset |
| ma_activated_at | DATETIME(6) | YES |  |  | วันที่ Active |
| ma_notes | TEXT | YES |  |  | หมายเหตุ |
| ma_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| ma_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| ma_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| ma_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| ma_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (ma_temporary_ref), (ma_no), (parent_ma_id, ma_child_suffix)

Indexes: (ma_status, ma_ownership, mp_id), (mprj_id, ma_ownership, ma_status), (su_id), (source_ma_id)

Checks: `(`ma_ownership` = 'COMPANY' AND `mc_id` IS NULL AND `ma_customer_name_snapshot` IS NULL) OR (`ma_ownership` = 'CUSTOMER' AND `mc_id` IS NOT NULL AND `ma_customer_name_snapshot` IS NOT NULL AND CHAR_LENGTH(TRIM(`ma_customer_name_snapshot`)) > 0 AND `parent_ma_id` IS NULL AND `source_ma_id` IS NULL)`; `(`parent_ma_id` IS NULL AND `ma_child_suffix` IS NULL) OR (`parent_ma_id` IS NOT NULL AND (`ma_child_suffix` IS NULL OR `ma_child_suffix` > 0))`; `(`ma_no` IS NULL AND `ma_status` IN ('Draft','Cancelled')) OR `ma_no` IS NOT NULL`

## info_asset_file

ไฟล์แนบ Asset — prefix `iaf` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| iaf_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| ma_id | BIGINT UNSIGNED | NO |  | mst_asset.ma_id | Asset |
| ifile_id | BIGINT UNSIGNED | NO |  | info_file.ifile_id | ไฟล์ |
| iaf_purpose | VARCHAR(80) | NO |  |  | หน้าที่ไฟล์ |
| iaf_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| iaf_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| iaf_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| iaf_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| iaf_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (ma_id, ifile_id, iaf_purpose)

## info_receiving_validation

ผลตรวจรับปัจจุบันจาก MIS ต่อ acquisition และ PO item ไม่สร้าง GR ภายใน — prefix `irv` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| irv_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| imdr_id | BIGINT UNSIGNED | NO |  | info_mis_document_reference.imdr_id | PO reference ใน MIS |
| irv_po_item_key | VARCHAR(150) | NO |  |  | PO item key ต้นทาง |
| irv_ordered_quantity | DECIMAL(18,4) | NO | 0 |  | จำนวนสั่งในขอบเขตนี้ |
| irv_accepted_quantity | DECIMAL(18,4) | NO | 0 |  | จำนวนรับสะสมที่ผ่านตรวจจาก MIS |
| iaa_id | BIGINT UNSIGNED | NO |  | info_asset_acquisition.iaa_id | รายการ acquisition ที่ตรวจรับ |
| irv_po_valid | BOOLEAN | NO | 0 |  | PO ใช้รับได้ |
| irv_invoice_valid | BOOLEAN | NO | 0 |  | มีเอกสาร Invoice และ PO ตรงกัน |
| irv_gr_valid | BOOLEAN | NO | 0 |  | มี GR และ PO ตรงกัน |
| irv_purchasing_accepted | BOOLEAN | NO | 0 |  | Purchasing ยืนยัน |
| irv_owner_accepted | BOOLEAN | NO | 0 |  | Owner ยืนยัน |
| irv_result | ENUM('PENDING','PARTIAL','COMPLETE','HOLD') | NO |  |  | ผลรวมรับ; ไม่ใช้ Invoice amounts |
| irv_validated_at | DATETIME(6) | YES |  |  | เวลาประเมินผล |
| irv_reason | TEXT | YES |  |  | เหตุผล hold |
| irv_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| irv_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| irv_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| irv_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| irv_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (iaa_id, imdr_id, irv_po_item_key)

Checks: ``irv_result` <> 'COMPLETE' OR (`irv_po_valid` = 1 AND `irv_invoice_valid` = 1 AND `irv_gr_valid` = 1 AND `irv_purchasing_accepted` = 1 AND `irv_owner_accepted` = 1)`; ``irv_ordered_quantity` >= 0 AND `irv_accepted_quantity` >= 0`

## mst_verification_check

รายการตรวจตัว Asset เช่น identity class model custodian location completeness — prefix `mvc` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| mvc_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| mvc_code | VARCHAR(80) | NO |  |  | รหัสอ้างอิง |
| mvc_name | VARCHAR(200) | NO |  |  | ชื่อ |
| mvc_is_active | BOOLEAN | NO | 1 |  | เปิดใช้งาน |
| mvc_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| mvc_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| mvc_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| mvc_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| mvc_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (mvc_code)

## info_asset_verification

verification ของ Asset แต่ละรอบ แยกจาก receiving — prefix `iav` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| iav_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| idoc_id | BIGINT UNSIGNED | NO |  | info_document.idoc_id | Verification document |
| ma_id | BIGINT UNSIGNED | NO |  | mst_asset.ma_id | Asset |
| iav_revision | INT UNSIGNED | NO |  |  | รอบตรวจ |
| iav_result | ENUM('PENDING','COMPLETE','MISMATCH') | NO | 'PENDING' |  | ผลตรวจ |
| iav_confirmed_sop | DATE | YES |  |  | SOP ยืนยัน |
| iav_required_info_complete | BOOLEAN | NO | 0 |  | ข้อมูลจำเป็นครบ |
| iav_special_plate_na | BOOLEAN | NO | 0 |  | ไม่ใช้ special plate |
| iav_form_snapshot | JSON | YES |  |  | ข้อมูลฟอร์มและค่าทางเทคนิคที่ตรวจแล้ว |
| iav_remark | TEXT | YES |  |  | ข้อสังเกต |
| iav_submitted_at | DATETIME(6) | YES |  |  | เวลาส่งอนุมัติ |
| iav_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| iav_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| iav_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| iav_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| iav_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (idoc_id), (ma_id, iav_revision)

## info_verification_check

ผล checklist ต่อ revision — prefix `ivc` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| ivc_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| iav_id | BIGINT UNSIGNED | NO |  | info_asset_verification.iav_id | verification |
| mvc_id | BIGINT UNSIGNED | NO |  | mst_verification_check.mvc_id | หัวข้อตรวจ |
| ivc_label_snapshot | VARCHAR(255) | NO |  |  | ชื่อหัวข้อขณะตรวจ |
| ivc_is_passed | BOOLEAN | NO | 0 |  | ผ่านตรวจ |
| ivc_is_applicable | BOOLEAN | NO | 1 |  | เกี่ยวข้อง |
| ivc_remark | TEXT | YES |  |  | หมายเหตุ |
| ivc_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| ivc_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| ivc_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| ivc_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| ivc_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (iav_id, mvc_id)

## info_approval_request

คำขออนุมัติแบบ snapshot ทุก attempt — prefix `iar` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| iar_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| idoc_id | BIGINT UNSIGNED | NO |  | info_document.idoc_id | เอกสารเป้าหมาย |
| sw_id | BIGINT UNSIGNED | NO |  | sys_workflow.sw_id | นิยาม version ต้นทาง |
| iar_attempt | INT UNSIGNED | NO |  |  | รอบส่งอนุมัติ |
| iar_workflow_name_snapshot | VARCHAR(255) | NO |  |  | ชื่อ workflow ขณะส่ง |
| iar_status | ENUM('PENDING','RETURNED','REJECTED','APPROVED','CANCELLED') | NO | 'PENDING' |  | สถานะคำขอ |
| iar_current_sequence | INT UNSIGNED | NO | 1 |  | ขั้นปัจจุบัน |
| iar_submitted_at | DATETIME(6) | NO |  |  | เวลาส่ง |
| su_id | BIGINT UNSIGNED | NO |  | sys_users.su_id | ผู้ส่ง |
| iar_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| iar_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| iar_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| iar_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| iar_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (idoc_id, iar_attempt)

Indexes: (iar_status, iar_submitted_at)

## info_approval_step

ขั้นตอนจริงและ assignee ณ เวลาส่ง — prefix `ias` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| ias_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| iar_id | BIGINT UNSIGNED | NO |  | info_approval_request.iar_id | คำขอ |
| sws_id | BIGINT UNSIGNED | NO |  | sys_workflow_step.sws_id | นิยามขั้น |
| ias_sequence | INT UNSIGNED | NO |  |  | ลำดับ |
| ias_name_snapshot | VARCHAR(255) | NO |  |  | ชื่อขั้นขณะส่ง |
| ias_action | ENUM('APPROVE','REVIEW','ACKNOWLEDGE') | NO |  |  | action |
| su_id | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้อนุมัติที่ resolve แล้ว |
| spg_id | BIGINT UNSIGNED | YES |  | sys_permission_group.spg_id | กลุ่มสิทธิ์/Role ที่กำหนดผู้อนุมัติ |
| ias_assignee_snapshot | JSON | NO |  |  | ชื่อคน/บทบาท/dynamic resolver ที่ resolve แล้ว |
| ias_is_required | BOOLEAN | NO | 1 |  | จำเป็น |
| ias_allow_return | BOOLEAN | NO | 1 |  | ส่งกลับได้ |
| ias_allow_reject | BOOLEAN | NO | 1 |  | ปฏิเสธได้ |
| ias_requires_dp_date | BOOLEAN | NO | 0 |  | เก็บวันเริ่ม DP; ข้ามสำหรับ Customer |
| ias_status | ENUM('WAITING','PENDING','APPROVED','REVIEWED','ACKNOWLEDGED','RETURNED','REJECTED','SKIPPED') | NO | 'WAITING' |  | ผลปัจจุบัน |
| ias_decided_at | DATETIME(6) | YES |  |  | เวลาตัดสิน |
| ias_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| ias_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| ias_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| ias_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| ias_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (iar_id, ias_sequence)

Indexes: (su_id, ias_status), (spg_id, ias_status)

## info_asset_depreciation

profile ค่าเสื่อมเฉพาะ Company Asset; snapshot อายุ ณ activation — prefix `iad` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| iad_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| ma_id | BIGINT UNSIGNED | NO |  | mst_asset.ma_id | Asset |
| iad_acquisition_value | DECIMAL(19,2) | NO | 0.00 |  | มูลค่า acquisition ของ Asset นี้ |
| iad_useful_life_months | DECIMAL(9,2) | NO |  |  | อายุจาก Asset Type snapshot คูณ 12 ณ activation ตัวหารไม่ปัดเศษ |
| iad_start_date | DATE | NO |  |  | วันเริ่ม DP |
| iad_stop_date | DATE | YES |  |  | วันสิ้นสุด DP หลังขาย อาจก่อน start ถ้าขายเดือนแรกและไม่คิดเดือนขาย |
| iad_rounding | ENUM('ROUND_CUMULATIVE_2DP') | NO | 'ROUND_CUMULATIVE_2DP' |  | คำนวณสะสมก่อนปัด 2 ตำแหน่ง งวดปัจจุบันเป็นผลต่างสะสม |
| iad_value_source | VARCHAR(100) | NO |  |  | แหล่งที่มามูลค่า |
| iad_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| iad_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| iad_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| iad_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| iad_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (ma_id)

Checks: ``iad_acquisition_value` >= 0 AND `iad_useful_life_months` > 0`

## info_asset_transfer

ย้าย Asset ตาม approval workflow ไม่แก้ From ย้อนหลัง — prefix `iat` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| iat_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| idoc_id | BIGINT UNSIGNED | NO |  | info_document.idoc_id | Transfer document |
| ma_id | BIGINT UNSIGNED | NO |  | mst_asset.ma_id | Active Company Asset |
| iat_effective_on | DATE | NO |  |  | วันที่มีผล |
| from_su_id | BIGINT UNSIGNED | YES |  | sys_users.su_id | from ผู้ดูแล |
| from_sd_id | BIGINT UNSIGNED | YES |  | sys_department.sd_id | from หน่วยงาน |
| from_mp_id | BIGINT UNSIGNED | YES |  | mst_plant.mp_id | from โรงงาน |
| from_ml_id | BIGINT UNSIGNED | YES |  | mst_location.ml_id | from สถานที่ |
| from_mli_id | BIGINT UNSIGNED | YES |  | mst_line.mli_id | from สายการผลิต |
| from_mcc_id | BIGINT UNSIGNED | YES |  | mst_cost_center.mcc_id | from ศูนย์ต้นทุน |
| iat_from_area | VARCHAR(255) | YES |  |  | from พื้นที่ |
| iat_from_snapshot | JSON | NO |  |  | from รหัสและชื่อขณะส่ง ห้ามอ่านทับด้วย master ล่าสุด |
| to_su_id | BIGINT UNSIGNED | YES |  | sys_users.su_id | to ผู้ดูแล |
| to_sd_id | BIGINT UNSIGNED | YES |  | sys_department.sd_id | to หน่วยงาน |
| to_mp_id | BIGINT UNSIGNED | YES |  | mst_plant.mp_id | to โรงงาน |
| to_ml_id | BIGINT UNSIGNED | YES |  | mst_location.ml_id | to สถานที่ |
| to_mli_id | BIGINT UNSIGNED | YES |  | mst_line.mli_id | to สายการผลิต |
| to_mcc_id | BIGINT UNSIGNED | YES |  | mst_cost_center.mcc_id | to ศูนย์ต้นทุน |
| iat_to_area | VARCHAR(255) | YES |  |  | to พื้นที่ |
| iat_to_snapshot | JSON | NO |  |  | to รหัสและชื่อขณะส่ง ห้ามอ่านทับด้วย master ล่าสุด |
| iat_completed_at | DATETIME(6) | YES |  |  | เวลาย้ายสำเร็จ |
| iat_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| iat_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| iat_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| iat_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| iat_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (idoc_id)

Indexes: (ma_id, iat_effective_on)

## info_asset_work

ประวัติงาน Existing Asset ที่เกิดจาก Proposal ของ MIS ไม่สร้างคำขอซื้อภายใน — prefix `iaw` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| iaw_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| iaa_id | BIGINT UNSIGNED | NO |  | info_asset_acquisition.iaa_id | งาน acquisition จากรายการ Proposal ภายนอก |
| source_ma_id | BIGINT UNSIGNED | NO |  | mst_asset.ma_id | work target ที่เลือก |
| result_ma_id | BIGINT UNSIGNED | YES |  | mst_asset.ma_id | Sub Asset ใหม่ ถ้า capitalized |
| iaw_work_type | ENUM('ADDITION_SUB_ASSET','MODIFICATION','MAINTENANCE') | NO |  |  | work type ต้นฉบับ |
| iaw_treatment | ENUM('CAPITALIZED_SUB_ASSET','EXPENSE') | NO |  |  | ผล classification |
| iaw_status | ENUM('DRAFT','PROPOSAL','PURCHASING','GR_RECEIVED','HOLD','ACTIVATING','COMPLETED','CANCELLED') | NO | 'DRAFT' |  | สถานะงาน |
| iaw_maintenance_type | VARCHAR(255) | YES |  |  | ชนิดซ่อมถ้าเป็น Maintenance |
| mv_id | BIGINT UNSIGNED | YES |  | mst_vendor.mv_id | ผู้รับงาน |
| iaw_responsible_team | VARCHAR(255) | YES |  |  | ทีมรับผิดชอบ |
| iaw_result | TEXT | YES |  |  | ผลดำเนินงาน |
| iaw_total_cost | DECIMAL(19,2) | NO | 0.00 |  | ต้นทุนฐานรวมต้นทุน scoped |
| iaw_completed_on | DATE | YES |  |  | วันที่สำเร็จ |
| iaw_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| iaw_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| iaw_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| iaw_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| iaw_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (iaa_id)

Indexes: (source_ma_id, iaw_status)

Checks: `(`iaw_treatment` = 'EXPENSE' AND `result_ma_id` IS NULL AND `iaw_total_cost` <= 50000) OR (`iaw_treatment` = 'CAPITALIZED_SUB_ASSET' AND `result_ma_id` IS NOT NULL AND `iaw_total_cost` > 50000)`

## info_sale_proposal

Sale Proposal reference หลังอนุมัติ ไม่สร้าง sale workflow ใหม่ — prefix `isp` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| isp_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| idoc_id | BIGINT UNSIGNED | NO |  | info_document.idoc_id | Sale Proposal reference |
| isp_buyer_name | VARCHAR(255) | NO |  |  | ผู้ซื้อ |
| isp_buyer_detail | JSON | YES |  |  | ที่อยู่และเลขภาษีถ้ามี |
| isp_approved_at | DATETIME(6) | NO |  |  | เวลาอนุมัติอ้างอิง |
| isp_external_status | VARCHAR(80) | NO |  |  | สถานะจากระบบขาย |
| isp_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| isp_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| isp_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| isp_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| isp_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (idoc_id)

## info_tax_invoice

e-Tax reference แยกจาก purchasing Invoice — prefix `iti` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| iti_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| idoc_id | BIGINT UNSIGNED | NO |  | info_document.idoc_id | e-Tax document |
| isp_id | BIGINT UNSIGNED | NO |  | info_sale_proposal.isp_id | Sale Proposal |
| iti_issued_on | DATE | NO |  |  | วันที่ออก |
| iti_buyer_name_snapshot | VARCHAR(255) | NO |  |  | ชื่อผู้ซื้อขณะออก |
| iti_amount_before_vat | DECIMAL(19,2) | NO | 0.00 |  | ยอดก่อน VAT |
| iti_vat_amount | DECIMAL(19,2) | NO | 0.00 |  | VAT อ้างอิง |
| iti_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| iti_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| iti_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| iti_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| iti_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (idoc_id)

## info_sale_item

Asset ระบุในเอกสารขาย รองรับหลาย Asset ต่อ e-Tax — prefix `isi` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| isi_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| isp_id | BIGINT UNSIGNED | NO |  | info_sale_proposal.isp_id | Sale Proposal |
| iti_id | BIGINT UNSIGNED | YES |  | info_tax_invoice.iti_id | e-Tax |
| ma_id | BIGINT UNSIGNED | NO |  | mst_asset.ma_id | Asset ที่เลือกขาย |
| isi_allocated_sale_amount | DECIMAL(19,2) | YES |  |  | ยอดขายที่จัดสรรต่อ Asset |
| isi_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| isi_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| isi_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| isi_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| isi_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (isp_id, ma_id)

## info_asset_disposal

derecognition ต่อ Asset พร้อม financial snapshot ถาวร — prefix `iads` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| iads_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| idoc_id | BIGINT UNSIGNED | NO |  | info_document.idoc_id | Disposal document |
| ma_id | BIGINT UNSIGNED | NO |  | mst_asset.ma_id | Asset ที่ขาย |
| isi_id | BIGINT UNSIGNED | NO |  | info_sale_item.isi_id | เอกสารขายที่ระบุ Asset |
| iads_buyer_snapshot | VARCHAR(255) | NO |  |  | ผู้ซื้อ |
| iads_sale_proposal_no_snapshot | VARCHAR(100) | NO |  |  | เลข Sale Proposal |
| iads_tax_invoice_no_snapshot | VARCHAR(100) | NO |  |  | เลข e-Tax |
| su_id | BIGINT UNSIGNED | NO |  | sys_users.su_id | ผู้ Verify Sale |
| iads_verified_at | DATETIME(6) | NO |  |  | เวลา Verify Sale |
| iads_sold_on | DATE | NO |  |  | วัน sale/derecognition |
| iads_final_month_convention | ENUM('INCLUDE_SALE_MONTH','EXCLUDE_SALE_MONTH') | NO |  |  | ต้องเลือกทุกครั้ง ไม่มีค่า default |
| iads_depreciation_stop_date | DATE | NO |  |  | วันสิ้นสุด DP ที่คำนวณ |
| iads_sale_amount | DECIMAL(19,2) | YES |  |  | ราคาขายถ้ามี |
| iads_acquisition_value_snapshot | DECIMAL(19,2) | NO | 0.00 |  | มูลค่าก่อนขาย |
| iads_accumulated_dp_snapshot | DECIMAL(19,2) | NO | 0.00 |  | DP สะสมก่อนตัดจำหน่าย |
| iads_net_book_value_snapshot | DECIMAL(19,2) | NO | 0.00 |  | มูลค่าสุทธิก่อนตัดจำหน่าย |
| iads_useful_life_months_snapshot | DECIMAL(9,2) | NO |  |  | อายุ ณ ขาย |
| iads_financial_snapshot | JSON | NO |  |  | รายละเอียดสูตรงวด/ต้นทุน/DP เพิ่มเติม |
| iads_assignment_snapshot | JSON | NO |  |  | assignment และ hierarchy ณ ขาย |
| iads_completed_at | DATETIME(6) | NO |  |  | เวลาบันทึกขาย |
| iads_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| iads_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| iads_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| iads_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| iads_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (idoc_id), (ma_id)

Checks: ``iads_sale_amount` IS NULL OR `iads_sale_amount` >= 0`; ``iads_acquisition_value_snapshot` >= 0 AND `iads_accumulated_dp_snapshot` >= 0 AND `iads_accumulated_dp_snapshot` <= `iads_acquisition_value_snapshot``; ``iads_net_book_value_snapshot` = `iads_acquisition_value_snapshot` - `iads_accumulated_dp_snapshot``

## info_asset_issue

รายงานปัญหา Asset แยกจาก MIS spare part issue — prefix `iais` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| iais_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| idoc_id | BIGINT UNSIGNED | NO |  | info_document.idoc_id | Issue report document |
| ma_id | BIGINT UNSIGNED | NO |  | mst_asset.ma_id | Asset |
| su_id | BIGINT UNSIGNED | NO |  | sys_users.su_id | ผู้รายงาน |
| iais_title | VARCHAR(255) | NO |  |  | หัวข้อ |
| iais_description | TEXT | NO |  |  | รายละเอียด |
| iais_priority | VARCHAR(40) | NO |  |  | ความสำคัญ |
| iais_resolution | TEXT | YES |  |  | การแก้ไข |
| iais_resolved_at | DATETIME(6) | YES |  |  | เวลาแก้เสร็จ |
| iais_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| iais_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| iais_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| iais_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| iais_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (idoc_id)

## info_notification

แจ้งเตือนที่อ่านแล้วเปลี่ยนสถานะได้ — prefix `inot` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| inot_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| su_id | BIGINT UNSIGNED | NO |  | sys_users.su_id | ผู้รับ |
| idoc_id | BIGINT UNSIGNED | YES |  | info_document.idoc_id | เอกสารอ้างอิง |
| ma_id | BIGINT UNSIGNED | YES |  | mst_asset.ma_id | Asset อ้างอิง |
| inot_message | VARCHAR(255) | NO |  |  | ข้อความ |
| inot_read_at | DATETIME(6) | YES |  |  | เวลาอ่าน |
| inot_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| inot_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| inot_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| inot_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| inot_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Indexes: (su_id, inot_read_at)

## log_approval_action

การตัดสินใจ approval ภายใน Asset เท่านั้น ไม่สร้าง MIS approval instance — prefix `laa` — เพิ่มอย่างเดียว ห้าม UPDATE/DELETE

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| laa_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| ias_id | BIGINT UNSIGNED | NO |  | info_approval_step.ias_id | ขั้นจริง |
| su_id | BIGINT UNSIGNED | NO |  | sys_users.su_id | ผู้กระทำ |
| laa_actor_name_snapshot | VARCHAR(255) | NO |  |  | ชื่อผู้กระทำ |
| laa_action | ENUM('APPROVE','REVIEW','ACKNOWLEDGE','RETURN','REJECT','CANCEL','SUBMIT') | NO |  |  | action |
| laa_acted_at | DATETIME(6) | NO |  |  | เวลากระทำ UTC |
| laa_remark | TEXT | YES |  |  | ความเห็น |
| laa_context_snapshot | JSON | YES |  |  | assignee/version/ค่าที่อนุมัติ |
| laa_recorded_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาบันทึก UTC เพิ่มอย่างเดียว |

Indexes: (ias_id, laa_acted_at)

## log_asset_event

Timeline ธุรกิจ รวม MIS; แสดง Main รวม events ของลูกโดย query — prefix `lae` — เพิ่มอย่างเดียว ห้าม UPDATE/DELETE

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| lae_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| ma_id | BIGINT UNSIGNED | NO |  | mst_asset.ma_id | Asset เจ้าของ event |
| main_ma_id | BIGINT UNSIGNED | NO |  | mst_asset.ma_id | Main ณ เวลาเกิดเหตุ รวมตัวเองสำหรับ Main |
| idoc_id | BIGINT UNSIGNED | YES |  | info_document.idoc_id | เอกสารต้นทาง |
| iaa_id | BIGINT UNSIGNED | YES |  | info_asset_acquisition.iaa_id | acquisition ที่เกิดจาก MIS |
| lae_origin | ENUM('ASSET','MIS','ETAX','IMPORT') | NO |  |  | ต้นทาง |
| lae_event_type | VARCHAR(80) | NO |  |  | ชนิด event |
| lae_from_status | VARCHAR(80) | YES |  |  | สถานะก่อน |
| lae_to_status | VARCHAR(80) | YES |  |  | สถานะหลัง |
| su_id | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้กระทำ |
| lae_actor_name_snapshot | VARCHAR(255) | YES |  |  | ชื่อผู้กระทำ |
| lae_occurred_at | DATETIME(6) | NO |  |  | เวลาธุรกิจ UTC |
| lae_idempotency_key | VARCHAR(150) | NO |  |  | คีย์ป้องกัน event ซ้ำ |
| lae_snapshot | JSON | NO |  |  | ข้อมูลสำคัญของเหตุการณ์ |
| lae_recorded_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาบันทึก UTC เพิ่มอย่างเดียว |

Unique: (lae_idempotency_key)

Indexes: (ma_id, lae_occurred_at), (main_ma_id, lae_occurred_at)

## log_audit

Audit เฉพาะ user-driven non-MIS ห้าม credentials/attachment body — prefix `la` — เพิ่มอย่างเดียว ห้าม UPDATE/DELETE

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| la_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| su_id | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้กระทำ |
| la_actor_name_snapshot | VARCHAR(255) | NO |  |  | ชื่อผู้กระทำ |
| la_module | VARCHAR(80) | NO |  |  | module |
| la_action | VARCHAR(80) | NO |  |  | CREATE / UPDATE / APPROVE ฯลฯ |
| la_record_table | VARCHAR(100) | NO |  |  | ชื่อตารางต้นทาง |
| la_record_id | BIGINT UNSIGNED | NO |  |  | ID ต้นทาง ไม่ทำ FK เพื่อคง audit หลังข้อมูลเปลี่ยน |
| la_record_ref | VARCHAR(150) | NO |  |  | เลขอ้างอิง ณ เวลานั้น |
| la_correlation_id | VARCHAR(100) | NO |  |  | request ID |
| la_occurred_at | DATETIME(6) | NO |  |  | เวลากระทำ UTC |
| la_recorded_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาบันทึก UTC เพิ่มอย่างเดียว |

Indexes: (la_module, la_action, la_occurred_at), (su_id, la_occurred_at), (la_record_table, la_record_id), (la_occurred_at)

## log_audit_change

ฟิลด์ before/after ของ audit เพิ่มอย่างเดียว — prefix `lac` — เพิ่มอย่างเดียว ห้าม UPDATE/DELETE

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| lac_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| la_id | BIGINT UNSIGNED | NO |  | log_audit.la_id | audit event |
| lac_field_name | VARCHAR(100) | NO |  |  | ชื่อคอลัมน์ |
| lac_before_value | JSON | YES |  |  | ค่าก่อน NULL ได้ |
| lac_after_value | JSON | YES |  |  | ค่าหลัง NULL ได้ |
| lac_recorded_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาบันทึก UTC เพิ่มอย่างเดียว |

Unique: (la_id, lac_field_name)

## log_receiving_validation

ประวัติประเมิน receiving แต่ละครั้ง ไม่ใช่ Audit Log — prefix `lrv` — เพิ่มอย่างเดียว ห้าม UPDATE/DELETE

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| lrv_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| po_imdr_id | BIGINT UNSIGNED | NO |  | info_mis_document_reference.imdr_id | PO reference |
| lrv_po_item_key | VARCHAR(150) | NO |  |  | PO item key |
| iaa_id | BIGINT UNSIGNED | NO |  | info_asset_acquisition.iaa_id | acquisition ที่ตรวจรับ |
| gr_imdr_id | BIGINT UNSIGNED | YES |  | info_mis_document_reference.imdr_id | GR reference ที่กระตุ้นผล |
| lrv_result | VARCHAR(40) | NO |  |  | PENDING / PARTIAL / COMPLETE / HOLD |
| lrv_checks_snapshot | JSON | NO |  |  | PO/Invoice/GR/acceptance/quantity; ไม่มี amount equality |
| lrv_idempotency_key | VARCHAR(150) | NO |  |  | คีย์การตรวจต่อ version |
| lrv_recorded_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาบันทึก UTC เพิ่มอย่างเดียว |

Unique: (lrv_idempotency_key)

## log_depreciation_period

snapshot รายเดือนแบบ append-only รวม disposal removal และ correction version — prefix `ldp` — เพิ่มอย่างเดียว ห้าม UPDATE/DELETE

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| ldp_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| ma_id | BIGINT UNSIGNED | NO |  | mst_asset.ma_id | Company Asset |
| ldp_period_month | DATE | NO |  |  | วันแรกเดือนรายงาน |
| ldp_revision | INT UNSIGNED | NO | 1 |  | revision เพิ่มใหม่เมื่อปรับปรุง |
| supersedes_ldp_id | BIGINT UNSIGNED | YES |  | log_depreciation_period.ldp_id | snapshot เดิมที่แทนที่ |
| ldp_opening_cost | DECIMAL(19,2) | NO | 0.00 |  | ต้นทุนต้นงวด |
| ldp_opening_accumulated_dp | DECIMAL(19,2) | NO | 0.00 |  | DP สะสมต้นงวด |
| ldp_addition_cost | DECIMAL(19,2) | NO | 0.00 |  | ต้นทุนเพิ่มเฉพาะ record นี้ |
| ldp_period_dp | DECIMAL(19,2) | NO | 0.00 |  | DP เดือนนี้ |
| ldp_disposal_cost | DECIMAL(19,2) | NO | 0.00 |  | ต้นทุนที่ตัดออกในเดือนขาย |
| ldp_disposal_accumulated_dp | DECIMAL(19,2) | NO | 0.00 |  | DP สะสมที่ตัดออก |
| ldp_closing_cost | DECIMAL(19,2) | NO | 0.00 |  | ต้นทุนปลายงวด |
| ldp_closing_accumulated_dp | DECIMAL(19,2) | NO | 0.00 |  | DP สะสมปลายงวด |
| ldp_closing_net_book_value | DECIMAL(19,2) | NO | 0.00 |  | มูลค่าสุทธิปลายงวด |
| iads_id | BIGINT UNSIGNED | YES |  | info_asset_disposal.iads_id | disposal ถ้ามี |
| su_id | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สั่งรายงาน/ปิดงวด |
| ldp_recorded_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาบันทึก UTC เพิ่มอย่างเดียว |

Unique: (ma_id, ldp_period_month, ldp_revision)

Indexes: (ldp_period_month, ma_id)

Checks: `DAY(`ldp_period_month`) = 1`; ``ldp_closing_cost` = `ldp_opening_cost` + `ldp_addition_cost` - `ldp_disposal_cost``; ``ldp_closing_accumulated_dp` = `ldp_opening_accumulated_dp` + `ldp_period_dp` - `ldp_disposal_accumulated_dp``; ``ldp_closing_net_book_value` = `ldp_closing_cost` - `ldp_closing_accumulated_dp``; ``ldp_closing_cost` >= 0 AND `ldp_closing_accumulated_dp` >= 0 AND `ldp_closing_accumulated_dp` <= `ldp_closing_cost``

## log_integration_message

ผลรับส่ง integration แต่ละ attempt append-only ไม่ใช่ payload credentials — prefix `lim` — เพิ่มอย่างเดียว ห้าม UPDATE/DELETE

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| lim_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| lim_source | VARCHAR(80) | NO |  |  | ระบบต้นทาง |
| lim_message_key | VARCHAR(150) | NO |  |  | คีย์ต้นทาง |
| lim_attempt | INT UNSIGNED | NO |  |  | ลำดับพยายาม |
| lim_direction | VARCHAR(10) | NO |  |  | IN / OUT |
| lim_result | VARCHAR(40) | NO |  |  | RECEIVED / SUCCESS / FAILED / DUPLICATE |
| lim_payload_digest | CHAR(64) | NO |  |  | hash payload |
| lim_error_summary | TEXT | YES |  |  | สรุป error ที่ตัด secrets |
| idoc_id | BIGINT UNSIGNED | YES |  | info_document.idoc_id | เอกสารที่เกี่ยวข้อง |
| lim_recorded_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาบันทึก UTC เพิ่มอย่างเดียว |

Unique: (lim_source, lim_message_key, lim_attempt)

## info_integration_inbox

deduplication และสถานะ processing ของ event ต้นทาง — prefix `iii` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| iii_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| iii_source | VARCHAR(80) | NO |  |  | ระบบต้นทาง |
| iii_message_key | VARCHAR(150) | NO |  |  | คีย์ต้นทาง |
| iii_status | ENUM('PENDING','PROCESSING','SUCCEEDED','FAILED') | NO | 'PENDING' |  | สถานะ |
| iii_payload | JSON | NO |  |  | ข้อมูลธุรกิจผ่าน validation ห้าม credentials |
| iii_processed_at | DATETIME(6) | YES |  |  | เวลาสำเร็จ |
| iii_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| iii_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| iii_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| iii_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| iii_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (iii_source, iii_message_key)

## info_integration_outbox

outbox เขียนพร้อมธุรกรรม แล้วส่งภายหลัง — prefix `iio` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| iio_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| iio_event_key | VARCHAR(150) | NO |  |  | idempotency key |
| idoc_id | BIGINT UNSIGNED | YES |  | info_document.idoc_id | เอกสาร |
| iio_event_type | VARCHAR(100) | NO |  |  | ประเภท event |
| iio_payload | JSON | NO |  |  | ข้อมูลส่งไม่รวม credentials |
| iio_published_at | DATETIME(6) | YES |  |  | เวลาส่งสำเร็จ |
| iio_attempts | INT UNSIGNED | NO | 0 |  | จำนวนพยายาม |
| iio_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| iio_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| iio_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| iio_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| iio_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (iio_event_key)

Indexes: (iio_published_at, iio_created_at)

## info_mis_document_reference

สำเนาอ้างอิงเอกสาร MIS แบบอ่านอย่างเดียว อัปเดตโดย integration เท่านั้น — prefix `imdr` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| imdr_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| imdr_source | VARCHAR(80) | NO |  |  | ระบบต้นทาง |
| imdr_external_key | VARCHAR(150) | NO |  |  | รหัสเอกสารถาวรจากต้นทาง |
| imdr_kind | ENUM('PROPOSAL','PR','PO','INVOICE','GR','DELIVERY','SPARE_ISSUE') | NO |  |  | ชนิดเอกสารอ้างอิง |
| imdr_no | VARCHAR(100) | NO |  |  | เลขเอกสารแสดงผล ไม่ใช้เป็น FK |
| imdr_status | VARCHAR(80) | NO |  |  | สถานะที่ได้รับจากต้นทาง |
| po_imdr_id | BIGINT UNSIGNED | YES |  | info_mis_document_reference.imdr_id | PO ต้นทางสำหรับ Invoice/GR/Delivery |
| mv_id | BIGINT UNSIGNED | YES |  | mst_vendor.mv_id | ผู้ขายอ้างอิง |
| imdr_document_date | DATE | YES |  |  | วันที่ต้นทาง |
| imdr_document_exists | BOOLEAN | NO | 0 |  | MIS ยืนยันมีเอกสารจริง |
| ifile_id | BIGINT UNSIGNED | YES |  | info_file.ifile_id | ไฟล์สำเนาถ้ามี ไม่บังคับต้องดาวน์โหลด |
| imdr_external_url | VARCHAR(500) | YES |  |  | ลิงก์เอกสารที่ไม่ใส่ credentials |
| imdr_external_version | VARCHAR(100) | YES |  |  | version ต้นทาง |
| imdr_synced_at | DATETIME(6) | NO |  |  | เวลารับข้อมูลล่าสุด |
| imdr_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| imdr_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| imdr_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| imdr_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| imdr_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (imdr_source, imdr_kind, imdr_external_key), (imdr_id, po_imdr_id)

Indexes: (imdr_kind, imdr_no), (po_imdr_id)

Checks: ``imdr_kind` NOT IN ('INVOICE','GR','DELIVERY') OR `po_imdr_id` IS NOT NULL`; ``imdr_kind` <> 'PO' OR `po_imdr_id` IS NULL`

## info_rfq_reference

รายการ RFQ สำหรับ selector และเติม Model/Part โดยไม่สร้าง RFQ workflow — prefix `irfr` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| irfr_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| irfr_source | VARCHAR(80) | NO |  |  | ระบบต้นทาง |
| irfr_external_key | VARCHAR(150) | NO |  |  | รหัส RFQ ต้นทาง |
| irfr_item_key | VARCHAR(150) | NO |  |  | รหัสรายการ RFQ ต้นทาง |
| irfr_rfq_no | VARCHAR(100) | NO |  |  | เลข RFQ |
| irfr_name | VARCHAR(255) | NO |  |  | ชื่อรายการ |
| irfr_model | VARCHAR(255) | YES |  |  | รุ่นที่เติมตอนเลือก RFQ |
| irfr_part_no | VARCHAR(255) | YES |  |  | เลข part ที่เติมตอนเลือก RFQ |
| irfr_is_available | BOOLEAN | NO | 1 |  | เปิดให้เลือก |
| irfr_synced_at | DATETIME(6) | NO |  |  | เวลารับล่าสุด |
| irfr_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| irfr_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| irfr_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| irfr_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| irfr_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (irfr_source, irfr_external_key, irfr_item_key)

## info_asset_acquisition

ข้อมูล acquisition ต่อรายการ Proposal จาก MIS รวมกรณี Expense ที่ไม่มี Asset ใหม่ — prefix `iaa` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| iaa_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| imdr_id | BIGINT UNSIGNED | NO |  | info_mis_document_reference.imdr_id | Proposal reference |
| iaa_proposal_item_key | VARCHAR(150) | NO |  |  | รหัสรายการ Proposal ต้นทาง |
| selected_ma_id | BIGINT UNSIGNED | NO |  | mst_asset.ma_id | Draft หรือ Active work target ที่ MIS เลือก |
| ma_id | BIGINT UNSIGNED | YES |  | mst_asset.ma_id | Asset ผลลัพธ์ที่จะ activate; NULL สำหรับ Expense |
| mprj_id | BIGINT UNSIGNED | NO |  | mst_project.mprj_id | โครงการ |
| iaa_ownership | ENUM('COMPANY','CUSTOMER') | NO |  |  | ownership ที่ได้รับจาก Proposal |
| iaa_selection | ENUM('NEW','EXISTING') | NO |  |  | ชนิดรายการต้นทาง |
| iaa_work_type | ENUM('ADDITION_SUB_ASSET','MODIFICATION','MAINTENANCE') | YES |  |  | work type ต้นฉบับ |
| iaa_treatment | ENUM('NEW_ASSET','CAPITALIZED_SUB_ASSET','EXPENSE') | NO |  |  | การจัดประเภทของรายการ |
| iaa_title | VARCHAR(255) | NO |  |  | หัวข้อหรือ component name |
| iaa_detail | TEXT | YES |  |  | รายละเอียดงาน |
| mac_id | BIGINT UNSIGNED | YES |  | mst_account.mac_id | บัญชีอ้างอิง |
| iaa_budget_type | ENUM('CAPITAL_EXPENDITURE','EXPENSE') | NO |  |  | Budget Type ต้นทาง |
| iaa_base_amount | DECIMAL(19,2) | NO | 0.00 |  | ราคาฐานเฉพาะรายการ |
| iaa_total_amount | DECIMAL(19,2) | NO | 0.00 |  | ฐานรวมต้นทุน scoped; ตรวจยอดรวมที่ integration |
| iaa_currency | CHAR(3) | NO | 'THB' |  | สกุลเงินตามกฎปัจจุบัน |
| iaa_status | ENUM('DRAFT','PURCHASING','WAITING_DELIVERY','RECEIVING','GR_RECEIVED','READY_FOR_VERIFICATION','ACTIVATING','COMPLETED','HOLD','CANCELLED') | NO | 'DRAFT' |  | สถานะ acquisition ของ Asset |
| iaa_external_version | VARCHAR(100) | YES |  |  | version ของรายการต้นทาง |
| iaa_synced_at | DATETIME(6) | NO |  |  | เวลารับล่าสุด |
| iaa_completed_at | DATETIME(6) | YES |  |  | เวลางานสำเร็จ |
| iaa_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| iaa_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| iaa_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| iaa_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| iaa_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (imdr_id, iaa_proposal_item_key), (imdr_id, selected_ma_id)

Indexes: (ma_id), (selected_ma_id, iaa_status)

Checks: ``iaa_currency` = 'THB'`; ``iaa_base_amount` >= 0 AND `iaa_total_amount` >= `iaa_base_amount``; `(`iaa_selection` = 'NEW' AND `iaa_work_type` IS NULL AND `iaa_treatment` = 'NEW_ASSET' AND `ma_id` IS NOT NULL) OR (`iaa_selection` = 'EXISTING' AND `iaa_work_type` IS NOT NULL AND ((`iaa_treatment` = 'EXPENSE' AND `ma_id` IS NULL AND `iaa_total_amount` <= 50000) OR (`iaa_treatment` = 'CAPITALIZED_SUB_ASSET' AND `ma_id` IS NOT NULL AND `iaa_total_amount` > 50000)))`; ``iaa_ownership` <> 'CUSTOMER' OR `iaa_selection` = 'NEW'`

## info_asset_acquisition_cost

ต้นทุนเพิ่มเติมราย acquisition ที่รับจาก MIS ไม่ใช่ตารางสร้างต้นทุนจัดซื้อ — prefix `iaac` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| iaac_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| iaa_id | BIGINT UNSIGNED | NO |  | info_asset_acquisition.iaa_id | รายการ acquisition |
| iaac_external_cost_key | VARCHAR(150) | NO |  |  | รหัสแถวต้นทุนจาก MIS |
| mct_id | BIGINT UNSIGNED | NO |  | mst_cost_type.mct_id | ชนิดต้นทุน |
| mac_id | BIGINT UNSIGNED | YES |  | mst_account.mac_id | บัญชีอ้างอิง |
| iaac_description | VARCHAR(255) | YES |  |  | รายละเอียด |
| iaac_amount | DECIMAL(19,2) | NO | 0.00 |  | ยอดต้นทุนเพิ่มเติมของรายการ |
| iaac_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| iaac_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| iaac_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| iaac_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| iaac_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (iaa_id, iaac_external_cost_key)

Checks: ``iaac_amount` >= 0`

## info_asset_acquisition_document

เชื่อม acquisition กับเอกสาร MIS และ item scope รองรับหลาย PO/Invoice/GR — prefix `iaad` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| iaad_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| iaa_id | BIGINT UNSIGNED | NO |  | info_asset_acquisition.iaa_id | acquisition |
| imdr_id | BIGINT UNSIGNED | NO |  | info_mis_document_reference.imdr_id | เอกสารอ้างอิง |
| iaad_document_item_key | VARCHAR(150) | NO |  |  | รหัส item ต้นทาง ใช้ HEADER หากเป็นระดับเอกสาร |
| po_imdr_id | BIGINT UNSIGNED | YES |  | info_mis_document_reference.imdr_id | PO scope สำหรับ Invoice/GR/Delivery; NULL สำหรับ Proposal/PR/PO |
| iaad_po_item_key | VARCHAR(150) | NO |  |  | PO item ที่เกี่ยวข้อง ใช้ HEADER เมื่อยังไม่จัดสรร |
| iaad_ordered_quantity | DECIMAL(18,4) | YES |  |  | จำนวนสั่งเฉพาะ link ของ PO item |
| iaad_received_quantity | DECIMAL(18,4) | YES |  |  | จำนวนรับเฉพาะ link ของ GR item |
| iaad_accepted_quantity | DECIMAL(18,4) | YES |  |  | จำนวนรับผ่านตรวจเฉพาะ GR item |
| iaad_allocated_amount | DECIMAL(19,2) | YES |  |  | มูลค่าจัดสรรเฉพาะ PO scope ห้ามรวมยอดซ้ำจากเอกสารทุกชนิด |
| iaad_purchasing_accepted | BOOLEAN | NO | 0 |  | Purchasing ยืนยันรับเฉพาะ GR |
| iaad_owner_accepted | BOOLEAN | NO | 0 |  | Owner ยืนยันรับเฉพาะ GR |
| iaad_accepted_at | DATETIME(6) | YES |  |  | เวลายืนยันรับ |
| iaad_acceptance | ENUM('PENDING','ACCEPTED','FAILED') | NO | 'PENDING' |  | ผล physical acceptance ที่ MIS ส่ง |
| iaad_synced_at | DATETIME(6) | NO |  |  | เวลารับล่าสุด |
| iaad_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| iaad_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| iaad_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| iaad_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| iaad_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (iaa_id, imdr_id, iaad_document_item_key, iaad_po_item_key)

Checks: ``iaad_ordered_quantity` IS NULL OR `iaad_ordered_quantity` >= 0`; ``iaad_received_quantity` IS NULL OR `iaad_received_quantity` >= 0`; ``iaad_accepted_quantity` IS NULL OR (`iaad_received_quantity` IS NOT NULL AND `iaad_accepted_quantity` >= 0 AND `iaad_accepted_quantity` <= `iaad_received_quantity`)`; ``iaad_allocated_amount` IS NULL OR `iaad_allocated_amount` >= 0`

Composite FK: ``imdr_id`, `po_imdr_id`` → `info_mis_document_reference(`imdr_id`, `po_imdr_id`)` บังคับ PO scope ของเอกสารตรงกับ link

## info_asset_spare_usage

ประวัติใช้อะไหล่สำเร็จจาก MIS ไม่เก็บใบเบิก workflow หรือ stock balance — prefix `iasu` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| iasu_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK |
| iasu_source | VARCHAR(80) | NO |  |  | ระบบต้นทาง |
| iasu_issue_key | VARCHAR(150) | NO |  |  | รหัสใบเบิกต้นทาง |
| iasu_issue_item_key | VARCHAR(150) | NO |  |  | รหัสรายการเบิกต้นทาง |
| imdr_id | BIGINT UNSIGNED | NO |  | info_mis_document_reference.imdr_id | เอกสารใบเบิกอ้างอิง |
| ma_id | BIGINT UNSIGNED | NO |  | mst_asset.ma_id | Asset ที่ใช้อะไหล่ |
| mpt_id | BIGINT UNSIGNED | YES |  | mst_part.mpt_id | part อ้างอิงถ้ามี |
| iasu_part_no_snapshot | VARCHAR(150) | NO |  |  | เลข part ขณะเบิก |
| iasu_part_name_snapshot | VARCHAR(255) | NO |  |  | ชื่อ part ขณะเบิก |
| mu_id | BIGINT UNSIGNED | NO |  | mst_uom.mu_id | หน่วย |
| iasu_quantity | DECIMAL(18,4) | NO |  |  | จำนวนใช้สุทธิหลังคืนตาม MIS |
| iasu_total_cost | DECIMAL(19,2) | NO | 0.00 |  | ต้นทุนใช้สุทธิจาก MIS ไม่ตีราคา stock เอง |
| iasu_issued_on | DATE | NO |  |  | วันที่เบิก |
| iasu_status | ENUM('COMPLETED','REVERSED') | NO | 'COMPLETED' |  | สถานะต้นทาง |
| iasu_external_version | VARCHAR(100) | YES |  |  | version ต้นทาง |
| iasu_synced_at | DATETIME(6) | NO |  |  | เวลารับล่าสุด |
| iasu_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| iasu_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้สร้าง |
| iasu_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไขล่าสุด UTC |
| iasu_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้แก้ไขล่าสุด |
| iasu_row_version | INT UNSIGNED | NO | 1 |  | เลขเวอร์ชันสำหรับ optimistic locking |

Unique: (iasu_source, iasu_issue_key, iasu_issue_item_key)

Indexes: (ma_id, iasu_issued_on)

Checks: ``iasu_quantity` >= 0 AND `iasu_total_cost` >= 0`

## sys_users

ผู้ใช้งาน แต่ละคนสังกัดหนึ่ง permission group และหนึ่ง department — prefix `su` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| su_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร |
| spg_id | BIGINT UNSIGNED | NO |  | sys_permission_group.spg_id | กลุ่มสิทธิ์/Role |
| su_username | VARCHAR(100) | NO |  |  | ชื่อเข้าสู่ระบบ |
| su_employee_code | VARCHAR(80) | NO |  |  | รหัสพนักงาน |
| su_password | VARCHAR(255) | NO |  |  | รหัสผ่านที่จัดเก็บเป็น password hash เท่านั้น ห้ามเก็บ plaintext |
| su_firstname | VARCHAR(120) | NO |  |  | ชื่อ |
| su_lastname | VARCHAR(120) | NO |  |  | นามสกุล |
| su_email | VARCHAR(255) | NO |  |  | อีเมล |
| sd_id | BIGINT UNSIGNED | NO |  | sys_department.sd_id | หน่วยงาน |
| su_sign_path | VARCHAR(500) | YES |  |  | object key ของไฟล์ลายเซ็น |
| su_status | BOOLEAN | NO | '1' |  | สถานะผู้ใช้ |
| su_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| su_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้บันทึก |
| su_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไข UTC |
| su_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้บันทึก |

Unique: (su_username), (su_employee_code)

Indexes: (spg_id, su_status), (sd_id, su_status), (su_email)

## sys_submenu

เมนูย่อยและ route ใต้เมนูหลัก — prefix `ss` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| ss_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร |
| sm_id | BIGINT UNSIGNED | NO |  | sys_menu.sm_id | เมนูหลัก |
| ss_name | VARCHAR(160) | NO |  |  | ชื่อเมนูย่อย |
| ss_link | VARCHAR(255) | NO |  |  | route หรือ path |
| ss_order | INT UNSIGNED | NO | 0 |  | ลำดับเมนูย่อย |
| ss_status | BOOLEAN | NO | '1' |  | สถานะเมนูย่อย |
| ss_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| ss_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้บันทึก |
| ss_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไข UTC |
| ss_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้บันทึก |

Indexes: (sm_id, ss_status)

## sys_permission_group

กลุ่มสิทธิ์ที่ทำหน้าที่เป็น Role สำหรับกำหนดสิทธิ์เข้าถึงเมนู — prefix `spg` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| spg_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร |
| spg_name | VARCHAR(120) | NO |  |  | ชื่อกลุ่มสิทธิ์/Role |
| spg_status | BOOLEAN | NO | '1' |  | สถานะกลุ่มสิทธิ์ |
| spg_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| spg_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้บันทึก |
| spg_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไข UTC |
| spg_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้บันทึก |

Unique: (spg_name)

## sys_permission_detail

รายละเอียดสิทธิ์เข้าถึง submenu ที่กำหนดให้แต่ละ permission group — prefix `spd` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| spd_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร |
| spg_id | BIGINT UNSIGNED | NO |  | sys_permission_group.spg_id | กลุ่มสิทธิ์/Role |
| ss_id | BIGINT UNSIGNED | NO |  | sys_submenu.ss_id | เมนูย่อยที่อนุญาต |
| spd_order | INT UNSIGNED | NO | 0 |  | ลำดับสิทธิ์ |
| spd_status | BOOLEAN | NO | '1' |  | อนุญาตเมนูย่อยนี้ |
| spd_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| spd_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้บันทึก |
| spd_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไข UTC |
| spd_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้บันทึก |

Unique: (spg_id, ss_id)

Indexes: (ss_id, spd_status)

## sys_department

หน่วยงานตามรหัส plant และ department — prefix `sd` — แก้ไขได้โดย workflow

| Column | Type | Null | Default | FK | ความหมาย |
|---|---|---|---|---|---|
| sd_id | BIGINT UNSIGNED | NO | AUTO_INCREMENT |  | รหัสภายในถาวร |
| sd_plant_cd | VARCHAR(40) | NO |  |  | รหัส Plant ตาม master ภายนอก |
| sd_code | VARCHAR(80) | NO |  |  | รหัสหน่วยงาน |
| sd_name | VARCHAR(160) | NO |  |  | ชื่อหน่วยงาน |
| sd_aname | VARCHAR(160) | YES |  |  | ชื่อหน่วยงานอีกภาษาหรือชื่อย่อ |
| sd_email | VARCHAR(255) | YES |  |  | อีเมลหน่วยงาน |
| sd_status | BOOLEAN | NO | '1' |  | สถานะหน่วยงาน |
| sd_created_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) |  | วันเวลาสร้าง UTC |
| sd_created_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้บันทึก |
| sd_updated_at | DATETIME(6) | NO | CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) |  | วันเวลาแก้ไข UTC |
| sd_updated_by | BIGINT UNSIGNED | YES |  | sys_users.su_id | ผู้บันทึก |

Unique: (sd_plant_cd, sd_code)

Indexes: (sd_name, sd_status)
