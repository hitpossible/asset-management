-- TBKK Asset-only database design. External MIS references only. Target MySQL 8.4+, InnoDB, UTF8MB4.
-- Run in an EMPTY, explicitly selected database. No DROP/CREATE DATABASE statements.
SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET time_zone = '+00:00';
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

CREATE TABLE `sys_menu` (
  `sm_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร',
  `sm_name` VARCHAR(120) NOT NULL COMMENT 'ชื่อเมนู',
  `sm_icon` VARCHAR(80) NULL COMMENT 'ชื่อไอคอน',
  `sm_order` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ลำดับเมนูหลัก',
  `sm_status` BOOLEAN NOT NULL DEFAULT '1' COMMENT 'สถานะเมนู',
  `sm_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `sm_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `sm_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `sm_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  PRIMARY KEY (`sm_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='เมนูหลักในแถบ navigation';

CREATE TABLE `sys_setting` (
  `sst_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `sst_key` VARCHAR(100) NOT NULL COMMENT 'ชื่อค่า',
  `sst_value` JSON NOT NULL COMMENT 'ค่าที่ตั้ง',
  `sst_description` VARCHAR(255) NULL COMMENT 'คำอธิบาย',
  `sst_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `sst_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `sst_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `sst_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `sst_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`sst_id`),
  UNIQUE KEY `uq_sst_1` (`sst_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ค่าตั้งระบบ ไม่ใช้เก็บ secrets';

CREATE TABLE `sys_number_sequence` (
  `sns_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `sns_scope` VARCHAR(150) NOT NULL COMMENT 'namespace เช่น ASSET:ME:2026 หรือ CHILD:<main_id>',
  `sns_last_value` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'เลขที่ใช้ล่าสุด ห้ามลดหรือใช้ซ้ำ',
  `sns_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `sns_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `sns_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `sns_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `sns_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`sns_id`),
  UNIQUE KEY `uq_sns_1` (`sns_scope`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ตัวนับเลขเอกสารและเลข Asset โดยล็อกแถวใน transaction';

CREATE TABLE `sys_workflow` (
  `sw_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `sw_code` VARCHAR(80) NOT NULL COMMENT 'รหัส workflow',
  `sw_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เวอร์ชัน',
  `sw_name` VARCHAR(255) NOT NULL COMMENT 'ชื่อ workflow',
  `sw_process` VARCHAR(80) NOT NULL COMMENT 'กระบวนการภายใน Asset เช่น TRANSFER / ACTIVATION',
  `sw_is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'เปิดใช้',
  `sw_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `sw_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `sw_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `sw_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `sw_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`sw_id`),
  UNIQUE KEY `uq_sw_1` (`sw_code`, `sw_version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='นิยาม workflow แบบมี version หลังใช้งานให้สร้าง version ใหม่';

CREATE TABLE `sys_workflow_step` (
  `sws_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `sw_id` BIGINT UNSIGNED NOT NULL COMMENT 'workflow',
  `sws_sequence` INT UNSIGNED NOT NULL COMMENT 'ลำดับ',
  `sws_code` VARCHAR(80) NOT NULL COMMENT 'รหัสขั้น',
  `sws_name` VARCHAR(255) NOT NULL COMMENT 'ชื่อขั้น',
  `sws_action` ENUM('APPROVE','REVIEW','ACKNOWLEDGE') NOT NULL COMMENT 'ชนิดการตัดสินใจ',
  `sws_assignee_type` ENUM('USER','ROLE','DYNAMIC') NOT NULL COMMENT 'วิธีหาผู้อนุมัติ',
  `su_id` BIGINT UNSIGNED NULL COMMENT 'ผู้อนุมัติระบุคน',
  `spg_id` BIGINT UNSIGNED NULL COMMENT 'กลุ่มสิทธิ์/Role ที่กำหนดผู้อนุมัติ',
  `sws_resolver` VARCHAR(100) NULL COMMENT 'ตัวแก้แบบ dynamic เช่น SOURCE_AREA_OWNER',
  `sws_is_required` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'จำเป็น',
  `sws_allow_return` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'อนุญาตส่งกลับ',
  `sws_allow_reject` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'อนุญาตปฏิเสธ',
  `sws_requires_dp_date` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'ขั้นกำหนดวันเริ่มค่าเสื่อม',
  `sws_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `sws_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `sws_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `sws_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `sws_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`sws_id`),
  UNIQUE KEY `uq_sws_1` (`sw_id`, `sws_sequence`),
  UNIQUE KEY `uq_sws_2` (`sw_id`, `sws_code`),
  CONSTRAINT `ck_sws_1` CHECK ((`sws_assignee_type` = 'USER' AND `su_id` IS NOT NULL AND `spg_id` IS NULL AND `sws_resolver` IS NULL) OR (`sws_assignee_type` = 'ROLE' AND `spg_id` IS NOT NULL AND `su_id` IS NULL AND `sws_resolver` IS NULL) OR (`sws_assignee_type` = 'DYNAMIC' AND `sws_resolver` IS NOT NULL AND `su_id` IS NULL AND `spg_id` IS NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ลำดับและผู้รับผิดชอบของนิยาม workflow';

CREATE TABLE `sys_workflow_assignment` (
  `swa_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `swa_process` VARCHAR(80) NOT NULL COMMENT 'กระบวนการ',
  `sw_id` BIGINT UNSIGNED NOT NULL COMMENT 'workflow ที่ใช้',
  `swa_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `swa_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `swa_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `swa_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `swa_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`swa_id`),
  UNIQUE KEY `uq_swa_1` (`swa_process`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='กำหนด workflow ปัจจุบันต่อประเภทงาน';

CREATE TABLE `sys_responsibility` (
  `sres_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `sd_id` BIGINT UNSIGNED NOT NULL COMMENT 'หน่วยงาน',
  `sres_duty` VARCHAR(80) NOT NULL COMMENT 'หน้าที่ เช่น AREA_OWNER / DEPARTMENT_LEADER',
  `su_id` BIGINT UNSIGNED NOT NULL COMMENT 'ผู้รับผิดชอบ',
  `sres_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `sres_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `sres_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `sres_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `sres_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`sres_id`),
  UNIQUE KEY `uq_sres_1` (`sd_id`, `sres_duty`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ผู้รับผิดชอบหน่วยงานตามหน้าที่';

CREATE TABLE `mst_plant` (
  `mp_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `mp_code` VARCHAR(80) NOT NULL COMMENT 'รหัสอ้างอิง',
  `mp_name` VARCHAR(200) NOT NULL COMMENT 'ชื่อ',
  `mp_is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'เปิดใช้งาน',
  `mp_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `mp_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `mp_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `mp_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `mp_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`mp_id`),
  UNIQUE KEY `uq_mp_1` (`mp_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='โรงงาน';

CREATE TABLE `mst_location` (
  `ml_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `ml_code` VARCHAR(80) NOT NULL COMMENT 'รหัสอ้างอิง',
  `ml_name` VARCHAR(200) NOT NULL COMMENT 'ชื่อ',
  `mp_id` BIGINT UNSIGNED NOT NULL COMMENT 'โรงงาน',
  `ml_is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'เปิดใช้งาน',
  `ml_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `ml_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `ml_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `ml_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `ml_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`ml_id`),
  UNIQUE KEY `uq_ml_1` (`ml_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='สถานที่';

CREATE TABLE `mst_line` (
  `mli_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `mli_code` VARCHAR(80) NOT NULL COMMENT 'รหัสอ้างอิง',
  `mli_name` VARCHAR(200) NOT NULL COMMENT 'ชื่อ',
  `ml_id` BIGINT UNSIGNED NOT NULL COMMENT 'สถานที่',
  `mli_is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'เปิดใช้งาน',
  `mli_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `mli_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `mli_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `mli_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `mli_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`mli_id`),
  UNIQUE KEY `uq_mli_1` (`mli_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='สายการผลิต';

CREATE TABLE `mst_cost_center` (
  `mcc_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `mcc_code` VARCHAR(80) NOT NULL COMMENT 'รหัสอ้างอิง',
  `mcc_name` VARCHAR(200) NOT NULL COMMENT 'ชื่อ',
  `sd_id` BIGINT UNSIGNED NULL COMMENT 'หน่วยงาน',
  `mcc_is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'เปิดใช้งาน',
  `mcc_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `mcc_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `mcc_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `mcc_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `mcc_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`mcc_id`),
  UNIQUE KEY `uq_mcc_1` (`mcc_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ศูนย์ต้นทุน';

CREATE TABLE `mst_project` (
  `mprj_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `mprj_code` VARCHAR(80) NOT NULL COMMENT 'รหัสอ้างอิง',
  `mprj_name` VARCHAR(200) NOT NULL COMMENT 'ชื่อ',
  `mprj_detail` TEXT NULL COMMENT 'รายละเอียด',
  `sd_id` BIGINT UNSIGNED NULL COMMENT 'หน่วยงาน',
  `mprj_is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'เปิดใช้งาน',
  `mprj_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `mprj_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `mprj_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `mprj_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `mprj_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`mprj_id`),
  UNIQUE KEY `uq_mprj_1` (`mprj_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='โครงการ';

CREATE TABLE `mst_customer` (
  `mc_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `mc_code` VARCHAR(80) NOT NULL COMMENT 'รหัสอ้างอิง',
  `mc_name` VARCHAR(200) NOT NULL COMMENT 'ชื่อ',
  `mc_tax_id` VARCHAR(40) NULL COMMENT 'เลขผู้เสียภาษี',
  `mc_is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'เปิดใช้งาน',
  `mc_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `mc_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `mc_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `mc_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `mc_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`mc_id`),
  UNIQUE KEY `uq_mc_1` (`mc_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ลูกค้าเจ้าของ Customer Asset';

CREATE TABLE `mst_vendor` (
  `mv_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `mv_code` VARCHAR(80) NOT NULL COMMENT 'รหัสอ้างอิง',
  `mv_name` VARCHAR(200) NOT NULL COMMENT 'ชื่อ',
  `mv_tax_id` VARCHAR(40) NULL COMMENT 'เลขภาษี',
  `mv_contact` VARCHAR(255) NULL COMMENT 'ผู้ติดต่อ',
  `mv_address` TEXT NULL COMMENT 'ที่อยู่',
  `mv_payment_terms` VARCHAR(255) NULL COMMENT 'เงื่อนไขชำระเงิน',
  `mv_is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'เปิดใช้งาน',
  `mv_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `mv_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `mv_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `mv_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `mv_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`mv_id`),
  UNIQUE KEY `uq_mv_1` (`mv_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ผู้ขาย';

CREATE TABLE `mst_asset_group` (
  `mag_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `mag_code` VARCHAR(80) NOT NULL COMMENT 'รหัสอ้างอิง',
  `mag_name` VARCHAR(200) NOT NULL COMMENT 'ชื่อ',
  `mag_is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'เปิดใช้งาน',
  `mag_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `mag_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `mag_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `mag_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `mag_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`mag_id`),
  UNIQUE KEY `uq_mag_1` (`mag_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='กลุ่ม Asset เช่น ME MD IT';

CREATE TABLE `mst_asset_type` (
  `mat_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `mat_code` VARCHAR(80) NOT NULL COMMENT 'รหัสอ้างอิง',
  `mat_name` VARCHAR(200) NOT NULL COMMENT 'ชื่อ',
  `mag_id` BIGINT UNSIGNED NOT NULL COMMENT 'กลุ่ม',
  `mat_useful_life_years` DECIMAL(7,2) NOT NULL COMMENT 'อายุใช้งานปัจจุบัน ต้องมากกว่า 0',
  `mat_show_technical_fields` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'แสดง RFQ Model Part Area Power สำหรับ ME/MD',
  `mat_is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'เปิดใช้งาน',
  `mat_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `mat_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `mat_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `mat_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `mat_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`mat_id`),
  UNIQUE KEY `uq_mat_1` (`mat_code`),
  CONSTRAINT `ck_mat_1` CHECK (`mat_useful_life_years` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ประเภท Asset และอายุใช้งาน';

CREATE TABLE `mst_account` (
  `mac_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `mac_code` VARCHAR(80) NOT NULL COMMENT 'รหัสอ้างอิง',
  `mac_name` VARCHAR(200) NOT NULL COMMENT 'ชื่อ',
  `mac_is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'เปิดใช้งาน',
  `mac_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `mac_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `mac_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `mac_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `mac_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`mac_id`),
  UNIQUE KEY `uq_mac_1` (`mac_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='รหัสบัญชี';

CREATE TABLE `mst_cost_type` (
  `mct_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `mct_code` VARCHAR(80) NOT NULL COMMENT 'รหัสอ้างอิง',
  `mct_name` VARCHAR(200) NOT NULL COMMENT 'ชื่อ',
  `mct_is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'เปิดใช้งาน',
  `mct_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `mct_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `mct_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `mct_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `mct_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`mct_id`),
  UNIQUE KEY `uq_mct_1` (`mct_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ชนิดต้นทุนเพิ่มเติม เช่น Installation Delivery Other';

CREATE TABLE `mst_uom` (
  `mu_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `mu_code` VARCHAR(80) NOT NULL COMMENT 'รหัสอ้างอิง',
  `mu_name` VARCHAR(200) NOT NULL COMMENT 'ชื่อ',
  `mu_is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'เปิดใช้งาน',
  `mu_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `mu_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `mu_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `mu_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `mu_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`mu_id`),
  UNIQUE KEY `uq_mu_1` (`mu_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='หน่วยนับ';

CREATE TABLE `mst_part` (
  `mpt_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `mpt_code` VARCHAR(80) NOT NULL COMMENT 'รหัสอ้างอิง',
  `mpt_name` VARCHAR(200) NOT NULL COMMENT 'ชื่อ',
  `mpt_model` VARCHAR(255) NULL COMMENT 'รุ่น',
  `mpt_part_no` VARCHAR(255) NULL COMMENT 'เลขชิ้นส่วน',
  `mu_id` BIGINT UNSIGNED NOT NULL COMMENT 'หน่วยนับ',
  `mpt_is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'เปิดใช้งาน',
  `mpt_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `mpt_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `mpt_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `mpt_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `mpt_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`mpt_id`),
  UNIQUE KEY `uq_mpt_1` (`mpt_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='อะไหล่และ part catalog';

CREATE TABLE `info_document` (
  `idoc_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `idoc_no` VARCHAR(100) NOT NULL COMMENT 'เลขเอกสาร',
  `idoc_kind` ENUM('VERIFICATION','TRANSFER','DISPOSAL','ASSET_ISSUE','SALE_PROPOSAL','TAX_INVOICE') NOT NULL COMMENT 'ประเภทเอกสาร',
  `idoc_status` VARCHAR(80) NOT NULL COMMENT 'สถานะเฉพาะประเภทเอกสาร',
  `idoc_origin` ENUM('ASSET','MIS','ETAX','IMPORT') NOT NULL COMMENT 'ต้นทางงาน ใช้ตัดสิน audit',
  `idoc_document_date` DATE NOT NULL COMMENT 'วันที่เอกสาร',
  `idoc_external_key` VARCHAR(150) NULL COMMENT 'รหัสต้นทางสำหรับ deduplication',
  `idoc_remark` TEXT NULL COMMENT 'หมายเหตุ',
  `idoc_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `idoc_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `idoc_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `idoc_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `idoc_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`idoc_id`),
  UNIQUE KEY `uq_idoc_1` (`idoc_kind`, `idoc_no`),
  UNIQUE KEY `uq_idoc_2` (`idoc_origin`, `idoc_kind`, `idoc_external_key`),
  KEY `ix_idoc_1` (`idoc_kind`, `idoc_status`, `idoc_document_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ทะเบียนเอกสารภายใน Asset และ sale references ไม่เก็บธุรกรรมจัดซื้อ';

CREATE TABLE `info_file` (
  `ifile_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `ifile_storage_key` VARCHAR(500) NOT NULL COMMENT 'object key ไม่เก็บ URL ที่มี token',
  `ifile_original_name` VARCHAR(255) NOT NULL COMMENT 'ชื่อไฟล์',
  `ifile_mime_type` VARCHAR(100) NOT NULL COMMENT 'MIME type',
  `ifile_size_bytes` BIGINT UNSIGNED NOT NULL COMMENT 'ขนาด bytes',
  `ifile_sha256` CHAR(64) NULL COMMENT 'checksum',
  `ifile_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `ifile_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `ifile_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `ifile_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `ifile_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`ifile_id`),
  UNIQUE KEY `uq_ifile_1` (`ifile_storage_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='metadata ไฟล์ เก็บ body ใน object storage';

CREATE TABLE `info_document_file` (
  `idf_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `idoc_id` BIGINT UNSIGNED NOT NULL COMMENT 'เอกสาร',
  `ifile_id` BIGINT UNSIGNED NOT NULL COMMENT 'ไฟล์',
  `idf_purpose` VARCHAR(80) NOT NULL COMMENT 'INVOICE / MACHINE_PHOTO / ASSET_PLATE / CONTROL_SHEET เป็นต้น',
  `idf_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `idf_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `idf_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `idf_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `idf_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`idf_id`),
  UNIQUE KEY `uq_idf_1` (`idoc_id`, `ifile_id`, `idf_purpose`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ไฟล์แนบเอกสาร รวมภาพ verification และ control sheet';

CREATE TABLE `mst_asset` (
  `ma_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `ma_temporary_ref` VARCHAR(100) NOT NULL COMMENT 'เลข Draft ถาวร แม้ได้เลขจริงแล้ว',
  `ma_no` VARCHAR(100) NULL COMMENT 'เลข Asset จริง NULL จน Proposal Approved',
  `ma_name` VARCHAR(255) NOT NULL COMMENT 'ชื่อ Asset',
  `ma_ownership` ENUM('COMPANY','CUSTOMER') NOT NULL DEFAULT 'COMPANY' COMMENT 'ประเภทเจ้าของ',
  `mc_id` BIGINT UNSIGNED NULL COMMENT 'เจ้าของ Customer Asset',
  `ma_customer_name_snapshot` VARCHAR(255) NULL COMMENT 'ชื่อลูกค้าที่บันทึกบน Asset',
  `parent_ma_id` BIGINT UNSIGNED NULL COMMENT 'Main Asset เท่านั้น NULL สำหรับ Main',
  `source_ma_id` BIGINT UNSIGNED NULL COMMENT 'Asset ที่ถูกเลือกเป็น work target แยกจาก parent',
  `ma_child_suffix` INT UNSIGNED NULL COMMENT 'suffix ที่ได้รับเมื่ออนุมัติ Proposal',
  `mat_id` BIGINT UNSIGNED NOT NULL COMMENT 'ประเภท Asset',
  `mprj_id` BIGINT UNSIGNED NULL COMMENT 'โครงการ',
  `irfr_id` BIGINT UNSIGNED NULL COMMENT 'RFQ item reference จาก MIS ที่เลือก',
  `ma_model` VARCHAR(255) NULL COMMENT 'รุ่นสุดท้ายที่ผู้ใช้แก้ได้',
  `ma_part_no` VARCHAR(255) NULL COMMENT 'เลข part สุดท้าย',
  `su_id` BIGINT UNSIGNED NULL COMMENT 'ผู้ดูแล',
  `sd_id` BIGINT UNSIGNED NULL COMMENT 'หน่วยงาน',
  `mp_id` BIGINT UNSIGNED NULL COMMENT 'โรงงาน',
  `ml_id` BIGINT UNSIGNED NULL COMMENT 'สถานที่',
  `mli_id` BIGINT UNSIGNED NULL COMMENT 'สายการผลิต',
  `mcc_id` BIGINT UNSIGNED NULL COMMENT 'ศูนย์ต้นทุน',
  `ma_area` VARCHAR(255) NULL COMMENT 'พื้นที่ รองรับข้อความเดิม',
  `ma_area_m2` DECIMAL(12,4) NULL COMMENT 'ขนาดพื้นที่ m2 ถ้ามี',
  `ma_power` VARCHAR(255) NULL COMMENT 'ค่า Power เดิมหรือข้อความไฟฟ้า',
  `ma_power_unit` VARCHAR(30) NULL COMMENT 'หน่วย Power',
  `ma_target_sop` DATE NULL COMMENT 'Target SOP',
  `ma_confirmed_sop` DATE NULL COMMENT 'SOP ที่ตรวจยืนยัน',
  `ma_maker` VARCHAR(255) NULL COMMENT 'ผู้ผลิต',
  `ma_serial_no` VARCHAR(150) NULL COMMENT 'serial number',
  `ma_investment_no` VARCHAR(100) NULL COMMENT 'เลขลงทุน',
  `ma_manufacturing_date` DATE NULL COMMENT 'วันที่ผลิต',
  `ma_registration_date` DATE NULL COMMENT 'วันที่ขึ้นทะเบียน',
  `ma_acquisition_date` DATE NULL COMMENT 'วันที่ได้มา',
  `ma_warranty_until` DATE NULL COMMENT 'สิ้นสุดประกัน',
  `ma_special_control` VARCHAR(80) NULL COMMENT 'BOI / EL / Other',
  `ma_condition` VARCHAR(80) NULL COMMENT 'Purchase / Leasing / Rental / Other',
  `ma_status` ENUM('Draft','Purchasing','Waiting Delivery','Waiting Invoice','Waiting GR','Receiving Validation','Ready for Verification','Verification In Progress','Pending Asset Team Leader Approval','Pending Accounting Review','Pending Accounting Approval','Pending Activation Approval','Active','Returned for Correction','On Hold','Cancelled','Sold') NOT NULL DEFAULT 'Draft' COMMENT 'สถานะ Asset',
  `ma_activated_at` DATETIME(6) NULL COMMENT 'วันที่ Active',
  `ma_notes` TEXT NULL COMMENT 'หมายเหตุ',
  `ma_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `ma_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `ma_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `ma_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `ma_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`ma_id`),
  UNIQUE KEY `uq_ma_1` (`ma_temporary_ref`),
  UNIQUE KEY `uq_ma_2` (`ma_no`),
  UNIQUE KEY `uq_ma_3` (`parent_ma_id`, `ma_child_suffix`),
  KEY `ix_ma_1` (`ma_status`, `ma_ownership`, `mp_id`),
  KEY `ix_ma_2` (`mprj_id`, `ma_ownership`, `ma_status`),
  KEY `ix_ma_3` (`su_id`),
  KEY `ix_ma_4` (`source_ma_id`),
  CONSTRAINT `ck_ma_1` CHECK ((`ma_ownership` = 'COMPANY' AND `mc_id` IS NULL AND `ma_customer_name_snapshot` IS NULL) OR (`ma_ownership` = 'CUSTOMER' AND `mc_id` IS NOT NULL AND `ma_customer_name_snapshot` IS NOT NULL AND CHAR_LENGTH(TRIM(`ma_customer_name_snapshot`)) > 0 AND `parent_ma_id` IS NULL AND `source_ma_id` IS NULL)),
  CONSTRAINT `ck_ma_2` CHECK ((`parent_ma_id` IS NULL AND `ma_child_suffix` IS NULL) OR (`parent_ma_id` IS NOT NULL AND (`ma_child_suffix` IS NULL OR `ma_child_suffix` > 0))),
  CONSTRAINT `ck_ma_3` CHECK ((`ma_no` IS NULL AND `ma_status` IN ('Draft','Cancelled')) OR `ma_no` IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ทะเบียน Main และ Sub Asset สองระดับ ID ไม่เปลี่ยนตามเลขเอกสาร';

CREATE TABLE `info_asset_file` (
  `iaf_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `ma_id` BIGINT UNSIGNED NOT NULL COMMENT 'Asset',
  `ifile_id` BIGINT UNSIGNED NOT NULL COMMENT 'ไฟล์',
  `iaf_purpose` VARCHAR(80) NOT NULL COMMENT 'หน้าที่ไฟล์',
  `iaf_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `iaf_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `iaf_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `iaf_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `iaf_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`iaf_id`),
  UNIQUE KEY `uq_iaf_1` (`ma_id`, `ifile_id`, `iaf_purpose`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ไฟล์แนบ Asset';

CREATE TABLE `info_receiving_validation` (
  `irv_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `imdr_id` BIGINT UNSIGNED NOT NULL COMMENT 'PO reference ใน MIS',
  `irv_po_item_key` VARCHAR(150) NOT NULL COMMENT 'PO item key ต้นทาง',
  `irv_ordered_quantity` DECIMAL(18,4) NOT NULL DEFAULT 0 COMMENT 'จำนวนสั่งในขอบเขตนี้',
  `irv_accepted_quantity` DECIMAL(18,4) NOT NULL DEFAULT 0 COMMENT 'จำนวนรับสะสมที่ผ่านตรวจจาก MIS',
  `iaa_id` BIGINT UNSIGNED NOT NULL COMMENT 'รายการ acquisition ที่ตรวจรับ',
  `irv_po_valid` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'PO ใช้รับได้',
  `irv_invoice_valid` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'มีเอกสาร Invoice และ PO ตรงกัน',
  `irv_gr_valid` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'มี GR และ PO ตรงกัน',
  `irv_purchasing_accepted` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'Purchasing ยืนยัน',
  `irv_owner_accepted` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'Owner ยืนยัน',
  `irv_result` ENUM('PENDING','PARTIAL','COMPLETE','HOLD') NOT NULL COMMENT 'ผลรวมรับ; ไม่ใช้ Invoice amounts',
  `irv_validated_at` DATETIME(6) NULL COMMENT 'เวลาประเมินผล',
  `irv_reason` TEXT NULL COMMENT 'เหตุผล hold',
  `irv_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `irv_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `irv_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `irv_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `irv_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`irv_id`),
  UNIQUE KEY `uq_irv_1` (`iaa_id`, `imdr_id`, `irv_po_item_key`),
  CONSTRAINT `ck_irv_1` CHECK (`irv_result` <> 'COMPLETE' OR (`irv_po_valid` = 1 AND `irv_invoice_valid` = 1 AND `irv_gr_valid` = 1 AND `irv_purchasing_accepted` = 1 AND `irv_owner_accepted` = 1)),
  CONSTRAINT `ck_irv_2` CHECK (`irv_ordered_quantity` >= 0 AND `irv_accepted_quantity` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ผลตรวจรับปัจจุบันจาก MIS ต่อ acquisition และ PO item ไม่สร้าง GR ภายใน';

CREATE TABLE `mst_verification_check` (
  `mvc_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `mvc_code` VARCHAR(80) NOT NULL COMMENT 'รหัสอ้างอิง',
  `mvc_name` VARCHAR(200) NOT NULL COMMENT 'ชื่อ',
  `mvc_is_active` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'เปิดใช้งาน',
  `mvc_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `mvc_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `mvc_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `mvc_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `mvc_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`mvc_id`),
  UNIQUE KEY `uq_mvc_1` (`mvc_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='รายการตรวจตัว Asset เช่น identity class model custodian location completeness';

CREATE TABLE `info_asset_verification` (
  `iav_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `idoc_id` BIGINT UNSIGNED NOT NULL COMMENT 'Verification document',
  `ma_id` BIGINT UNSIGNED NOT NULL COMMENT 'Asset',
  `iav_revision` INT UNSIGNED NOT NULL COMMENT 'รอบตรวจ',
  `iav_result` ENUM('PENDING','COMPLETE','MISMATCH') NOT NULL DEFAULT 'PENDING' COMMENT 'ผลตรวจ',
  `iav_confirmed_sop` DATE NULL COMMENT 'SOP ยืนยัน',
  `iav_required_info_complete` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'ข้อมูลจำเป็นครบ',
  `iav_special_plate_na` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'ไม่ใช้ special plate',
  `iav_form_snapshot` JSON NULL COMMENT 'ข้อมูลฟอร์มและค่าทางเทคนิคที่ตรวจแล้ว',
  `iav_remark` TEXT NULL COMMENT 'ข้อสังเกต',
  `iav_submitted_at` DATETIME(6) NULL COMMENT 'เวลาส่งอนุมัติ',
  `iav_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `iav_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `iav_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `iav_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `iav_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`iav_id`),
  UNIQUE KEY `uq_iav_1` (`idoc_id`),
  UNIQUE KEY `uq_iav_2` (`ma_id`, `iav_revision`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='verification ของ Asset แต่ละรอบ แยกจาก receiving';

CREATE TABLE `info_verification_check` (
  `ivc_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `iav_id` BIGINT UNSIGNED NOT NULL COMMENT 'verification',
  `mvc_id` BIGINT UNSIGNED NOT NULL COMMENT 'หัวข้อตรวจ',
  `ivc_label_snapshot` VARCHAR(255) NOT NULL COMMENT 'ชื่อหัวข้อขณะตรวจ',
  `ivc_is_passed` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'ผ่านตรวจ',
  `ivc_is_applicable` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'เกี่ยวข้อง',
  `ivc_remark` TEXT NULL COMMENT 'หมายเหตุ',
  `ivc_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `ivc_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `ivc_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `ivc_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `ivc_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`ivc_id`),
  UNIQUE KEY `uq_ivc_1` (`iav_id`, `mvc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ผล checklist ต่อ revision';

CREATE TABLE `info_approval_request` (
  `iar_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `idoc_id` BIGINT UNSIGNED NOT NULL COMMENT 'เอกสารเป้าหมาย',
  `sw_id` BIGINT UNSIGNED NOT NULL COMMENT 'นิยาม version ต้นทาง',
  `iar_attempt` INT UNSIGNED NOT NULL COMMENT 'รอบส่งอนุมัติ',
  `iar_workflow_name_snapshot` VARCHAR(255) NOT NULL COMMENT 'ชื่อ workflow ขณะส่ง',
  `iar_status` ENUM('PENDING','RETURNED','REJECTED','APPROVED','CANCELLED') NOT NULL DEFAULT 'PENDING' COMMENT 'สถานะคำขอ',
  `iar_current_sequence` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'ขั้นปัจจุบัน',
  `iar_submitted_at` DATETIME(6) NOT NULL COMMENT 'เวลาส่ง',
  `su_id` BIGINT UNSIGNED NOT NULL COMMENT 'ผู้ส่ง',
  `iar_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `iar_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `iar_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `iar_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `iar_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`iar_id`),
  UNIQUE KEY `uq_iar_1` (`idoc_id`, `iar_attempt`),
  KEY `ix_iar_1` (`iar_status`, `iar_submitted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='คำขออนุมัติแบบ snapshot ทุก attempt';

CREATE TABLE `info_approval_step` (
  `ias_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `iar_id` BIGINT UNSIGNED NOT NULL COMMENT 'คำขอ',
  `sws_id` BIGINT UNSIGNED NOT NULL COMMENT 'นิยามขั้น',
  `ias_sequence` INT UNSIGNED NOT NULL COMMENT 'ลำดับ',
  `ias_name_snapshot` VARCHAR(255) NOT NULL COMMENT 'ชื่อขั้นขณะส่ง',
  `ias_action` ENUM('APPROVE','REVIEW','ACKNOWLEDGE') NOT NULL COMMENT 'action',
  `su_id` BIGINT UNSIGNED NULL COMMENT 'ผู้อนุมัติที่ resolve แล้ว',
  `spg_id` BIGINT UNSIGNED NULL COMMENT 'กลุ่มสิทธิ์/Role ที่กำหนดผู้อนุมัติ',
  `ias_assignee_snapshot` JSON NOT NULL COMMENT 'ชื่อคน/บทบาท/dynamic resolver ที่ resolve แล้ว',
  `ias_is_required` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'จำเป็น',
  `ias_allow_return` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'ส่งกลับได้',
  `ias_allow_reject` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'ปฏิเสธได้',
  `ias_requires_dp_date` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'เก็บวันเริ่ม DP; ข้ามสำหรับ Customer',
  `ias_status` ENUM('WAITING','PENDING','APPROVED','REVIEWED','ACKNOWLEDGED','RETURNED','REJECTED','SKIPPED') NOT NULL DEFAULT 'WAITING' COMMENT 'ผลปัจจุบัน',
  `ias_decided_at` DATETIME(6) NULL COMMENT 'เวลาตัดสิน',
  `ias_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `ias_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `ias_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `ias_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `ias_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`ias_id`),
  UNIQUE KEY `uq_ias_1` (`iar_id`, `ias_sequence`),
  KEY `ix_ias_1` (`su_id`, `ias_status`),
  KEY `ix_ias_2` (`spg_id`, `ias_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ขั้นตอนจริงและ assignee ณ เวลาส่ง';

CREATE TABLE `info_asset_depreciation` (
  `iad_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `ma_id` BIGINT UNSIGNED NOT NULL COMMENT 'Asset',
  `iad_acquisition_value` DECIMAL(19,2) NOT NULL DEFAULT 0.00 COMMENT 'มูลค่า acquisition ของ Asset นี้',
  `iad_useful_life_months` DECIMAL(9,2) NOT NULL COMMENT 'อายุจาก Asset Type snapshot คูณ 12 ณ activation ตัวหารไม่ปัดเศษ',
  `iad_start_date` DATE NOT NULL COMMENT 'วันเริ่ม DP',
  `iad_stop_date` DATE NULL COMMENT 'วันสิ้นสุด DP หลังขาย อาจก่อน start ถ้าขายเดือนแรกและไม่คิดเดือนขาย',
  `iad_rounding` ENUM('ROUND_CUMULATIVE_2DP') NOT NULL DEFAULT 'ROUND_CUMULATIVE_2DP' COMMENT 'คำนวณสะสมก่อนปัด 2 ตำแหน่ง งวดปัจจุบันเป็นผลต่างสะสม',
  `iad_value_source` VARCHAR(100) NOT NULL COMMENT 'แหล่งที่มามูลค่า',
  `iad_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `iad_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `iad_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `iad_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `iad_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`iad_id`),
  UNIQUE KEY `uq_iad_1` (`ma_id`),
  CONSTRAINT `ck_iad_1` CHECK (`iad_acquisition_value` >= 0 AND `iad_useful_life_months` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='profile ค่าเสื่อมเฉพาะ Company Asset; snapshot อายุ ณ activation';

CREATE TABLE `info_asset_transfer` (
  `iat_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `idoc_id` BIGINT UNSIGNED NOT NULL COMMENT 'Transfer document',
  `ma_id` BIGINT UNSIGNED NOT NULL COMMENT 'Active Company Asset',
  `iat_effective_on` DATE NOT NULL COMMENT 'วันที่มีผล',
  `from_su_id` BIGINT UNSIGNED NULL COMMENT 'from ผู้ดูแล',
  `from_sd_id` BIGINT UNSIGNED NULL COMMENT 'from หน่วยงาน',
  `from_mp_id` BIGINT UNSIGNED NULL COMMENT 'from โรงงาน',
  `from_ml_id` BIGINT UNSIGNED NULL COMMENT 'from สถานที่',
  `from_mli_id` BIGINT UNSIGNED NULL COMMENT 'from สายการผลิต',
  `from_mcc_id` BIGINT UNSIGNED NULL COMMENT 'from ศูนย์ต้นทุน',
  `iat_from_area` VARCHAR(255) NULL COMMENT 'from พื้นที่',
  `iat_from_snapshot` JSON NOT NULL COMMENT 'from รหัสและชื่อขณะส่ง ห้ามอ่านทับด้วย master ล่าสุด',
  `to_su_id` BIGINT UNSIGNED NULL COMMENT 'to ผู้ดูแล',
  `to_sd_id` BIGINT UNSIGNED NULL COMMENT 'to หน่วยงาน',
  `to_mp_id` BIGINT UNSIGNED NULL COMMENT 'to โรงงาน',
  `to_ml_id` BIGINT UNSIGNED NULL COMMENT 'to สถานที่',
  `to_mli_id` BIGINT UNSIGNED NULL COMMENT 'to สายการผลิต',
  `to_mcc_id` BIGINT UNSIGNED NULL COMMENT 'to ศูนย์ต้นทุน',
  `iat_to_area` VARCHAR(255) NULL COMMENT 'to พื้นที่',
  `iat_to_snapshot` JSON NOT NULL COMMENT 'to รหัสและชื่อขณะส่ง ห้ามอ่านทับด้วย master ล่าสุด',
  `iat_completed_at` DATETIME(6) NULL COMMENT 'เวลาย้ายสำเร็จ',
  `iat_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `iat_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `iat_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `iat_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `iat_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`iat_id`),
  UNIQUE KEY `uq_iat_1` (`idoc_id`),
  KEY `ix_iat_1` (`ma_id`, `iat_effective_on`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ย้าย Asset ตาม approval workflow ไม่แก้ From ย้อนหลัง';

CREATE TABLE `info_asset_work` (
  `iaw_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `iaa_id` BIGINT UNSIGNED NOT NULL COMMENT 'งาน acquisition จากรายการ Proposal ภายนอก',
  `source_ma_id` BIGINT UNSIGNED NOT NULL COMMENT 'work target ที่เลือก',
  `result_ma_id` BIGINT UNSIGNED NULL COMMENT 'Sub Asset ใหม่ ถ้า capitalized',
  `iaw_work_type` ENUM('ADDITION_SUB_ASSET','MODIFICATION','MAINTENANCE') NOT NULL COMMENT 'work type ต้นฉบับ',
  `iaw_treatment` ENUM('CAPITALIZED_SUB_ASSET','EXPENSE') NOT NULL COMMENT 'ผล classification',
  `iaw_status` ENUM('DRAFT','PROPOSAL','PURCHASING','GR_RECEIVED','HOLD','ACTIVATING','COMPLETED','CANCELLED') NOT NULL DEFAULT 'DRAFT' COMMENT 'สถานะงาน',
  `iaw_maintenance_type` VARCHAR(255) NULL COMMENT 'ชนิดซ่อมถ้าเป็น Maintenance',
  `mv_id` BIGINT UNSIGNED NULL COMMENT 'ผู้รับงาน',
  `iaw_responsible_team` VARCHAR(255) NULL COMMENT 'ทีมรับผิดชอบ',
  `iaw_result` TEXT NULL COMMENT 'ผลดำเนินงาน',
  `iaw_total_cost` DECIMAL(19,2) NOT NULL DEFAULT 0.00 COMMENT 'ต้นทุนฐานรวมต้นทุน scoped',
  `iaw_completed_on` DATE NULL COMMENT 'วันที่สำเร็จ',
  `iaw_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `iaw_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `iaw_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `iaw_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `iaw_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`iaw_id`),
  UNIQUE KEY `uq_iaw_1` (`iaa_id`),
  KEY `ix_iaw_1` (`source_ma_id`, `iaw_status`),
  CONSTRAINT `ck_iaw_1` CHECK ((`iaw_treatment` = 'EXPENSE' AND `result_ma_id` IS NULL AND `iaw_total_cost` <= 50000) OR (`iaw_treatment` = 'CAPITALIZED_SUB_ASSET' AND `result_ma_id` IS NOT NULL AND `iaw_total_cost` > 50000))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ประวัติงาน Existing Asset ที่เกิดจาก Proposal ของ MIS ไม่สร้างคำขอซื้อภายใน';

CREATE TABLE `info_sale_proposal` (
  `isp_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `idoc_id` BIGINT UNSIGNED NOT NULL COMMENT 'Sale Proposal reference',
  `isp_buyer_name` VARCHAR(255) NOT NULL COMMENT 'ผู้ซื้อ',
  `isp_buyer_detail` JSON NULL COMMENT 'ที่อยู่และเลขภาษีถ้ามี',
  `isp_approved_at` DATETIME(6) NOT NULL COMMENT 'เวลาอนุมัติอ้างอิง',
  `isp_external_status` VARCHAR(80) NOT NULL COMMENT 'สถานะจากระบบขาย',
  `isp_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `isp_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `isp_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `isp_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `isp_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`isp_id`),
  UNIQUE KEY `uq_isp_1` (`idoc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Sale Proposal reference หลังอนุมัติ ไม่สร้าง sale workflow ใหม่';

CREATE TABLE `info_tax_invoice` (
  `iti_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `idoc_id` BIGINT UNSIGNED NOT NULL COMMENT 'e-Tax document',
  `isp_id` BIGINT UNSIGNED NOT NULL COMMENT 'Sale Proposal',
  `iti_issued_on` DATE NOT NULL COMMENT 'วันที่ออก',
  `iti_buyer_name_snapshot` VARCHAR(255) NOT NULL COMMENT 'ชื่อผู้ซื้อขณะออก',
  `iti_amount_before_vat` DECIMAL(19,2) NOT NULL DEFAULT 0.00 COMMENT 'ยอดก่อน VAT',
  `iti_vat_amount` DECIMAL(19,2) NOT NULL DEFAULT 0.00 COMMENT 'VAT อ้างอิง',
  `iti_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `iti_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `iti_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `iti_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `iti_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`iti_id`),
  UNIQUE KEY `uq_iti_1` (`idoc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='e-Tax reference แยกจาก purchasing Invoice';

CREATE TABLE `info_sale_item` (
  `isi_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `isp_id` BIGINT UNSIGNED NOT NULL COMMENT 'Sale Proposal',
  `iti_id` BIGINT UNSIGNED NULL COMMENT 'e-Tax',
  `ma_id` BIGINT UNSIGNED NOT NULL COMMENT 'Asset ที่เลือกขาย',
  `isi_allocated_sale_amount` DECIMAL(19,2) NULL COMMENT 'ยอดขายที่จัดสรรต่อ Asset',
  `isi_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `isi_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `isi_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `isi_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `isi_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`isi_id`),
  UNIQUE KEY `uq_isi_1` (`isp_id`, `ma_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Asset ระบุในเอกสารขาย รองรับหลาย Asset ต่อ e-Tax';

CREATE TABLE `info_asset_disposal` (
  `iads_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `idoc_id` BIGINT UNSIGNED NOT NULL COMMENT 'Disposal document',
  `ma_id` BIGINT UNSIGNED NOT NULL COMMENT 'Asset ที่ขาย',
  `isi_id` BIGINT UNSIGNED NOT NULL COMMENT 'เอกสารขายที่ระบุ Asset',
  `iads_buyer_snapshot` VARCHAR(255) NOT NULL COMMENT 'ผู้ซื้อ',
  `iads_sale_proposal_no_snapshot` VARCHAR(100) NOT NULL COMMENT 'เลข Sale Proposal',
  `iads_tax_invoice_no_snapshot` VARCHAR(100) NOT NULL COMMENT 'เลข e-Tax',
  `su_id` BIGINT UNSIGNED NOT NULL COMMENT 'ผู้ Verify Sale',
  `iads_verified_at` DATETIME(6) NOT NULL COMMENT 'เวลา Verify Sale',
  `iads_sold_on` DATE NOT NULL COMMENT 'วัน sale/derecognition',
  `iads_final_month_convention` ENUM('INCLUDE_SALE_MONTH','EXCLUDE_SALE_MONTH') NOT NULL COMMENT 'ต้องเลือกทุกครั้ง ไม่มีค่า default',
  `iads_depreciation_stop_date` DATE NOT NULL COMMENT 'วันสิ้นสุด DP ที่คำนวณ',
  `iads_sale_amount` DECIMAL(19,2) NULL COMMENT 'ราคาขายถ้ามี',
  `iads_acquisition_value_snapshot` DECIMAL(19,2) NOT NULL DEFAULT 0.00 COMMENT 'มูลค่าก่อนขาย',
  `iads_accumulated_dp_snapshot` DECIMAL(19,2) NOT NULL DEFAULT 0.00 COMMENT 'DP สะสมก่อนตัดจำหน่าย',
  `iads_net_book_value_snapshot` DECIMAL(19,2) NOT NULL DEFAULT 0.00 COMMENT 'มูลค่าสุทธิก่อนตัดจำหน่าย',
  `iads_useful_life_months_snapshot` DECIMAL(9,2) NOT NULL COMMENT 'อายุ ณ ขาย',
  `iads_financial_snapshot` JSON NOT NULL COMMENT 'รายละเอียดสูตรงวด/ต้นทุน/DP เพิ่มเติม',
  `iads_assignment_snapshot` JSON NOT NULL COMMENT 'assignment และ hierarchy ณ ขาย',
  `iads_completed_at` DATETIME(6) NOT NULL COMMENT 'เวลาบันทึกขาย',
  `iads_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `iads_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `iads_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `iads_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `iads_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`iads_id`),
  UNIQUE KEY `uq_iads_1` (`idoc_id`),
  UNIQUE KEY `uq_iads_2` (`ma_id`),
  CONSTRAINT `ck_iads_1` CHECK (`iads_sale_amount` IS NULL OR `iads_sale_amount` >= 0),
  CONSTRAINT `ck_iads_2` CHECK (`iads_acquisition_value_snapshot` >= 0 AND `iads_accumulated_dp_snapshot` >= 0 AND `iads_accumulated_dp_snapshot` <= `iads_acquisition_value_snapshot`),
  CONSTRAINT `ck_iads_3` CHECK (`iads_net_book_value_snapshot` = `iads_acquisition_value_snapshot` - `iads_accumulated_dp_snapshot`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='derecognition ต่อ Asset พร้อม financial snapshot ถาวร';

CREATE TABLE `info_asset_issue` (
  `iais_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `idoc_id` BIGINT UNSIGNED NOT NULL COMMENT 'Issue report document',
  `ma_id` BIGINT UNSIGNED NOT NULL COMMENT 'Asset',
  `su_id` BIGINT UNSIGNED NOT NULL COMMENT 'ผู้รายงาน',
  `iais_title` VARCHAR(255) NOT NULL COMMENT 'หัวข้อ',
  `iais_description` TEXT NOT NULL COMMENT 'รายละเอียด',
  `iais_priority` VARCHAR(40) NOT NULL COMMENT 'ความสำคัญ',
  `iais_resolution` TEXT NULL COMMENT 'การแก้ไข',
  `iais_resolved_at` DATETIME(6) NULL COMMENT 'เวลาแก้เสร็จ',
  `iais_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `iais_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `iais_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `iais_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `iais_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`iais_id`),
  UNIQUE KEY `uq_iais_1` (`idoc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='รายงานปัญหา Asset แยกจาก MIS spare part issue';

CREATE TABLE `info_notification` (
  `inot_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `su_id` BIGINT UNSIGNED NOT NULL COMMENT 'ผู้รับ',
  `idoc_id` BIGINT UNSIGNED NULL COMMENT 'เอกสารอ้างอิง',
  `ma_id` BIGINT UNSIGNED NULL COMMENT 'Asset อ้างอิง',
  `inot_message` VARCHAR(255) NOT NULL COMMENT 'ข้อความ',
  `inot_read_at` DATETIME(6) NULL COMMENT 'เวลาอ่าน',
  `inot_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `inot_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `inot_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `inot_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `inot_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`inot_id`),
  KEY `ix_inot_1` (`su_id`, `inot_read_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='แจ้งเตือนที่อ่านแล้วเปลี่ยนสถานะได้';

CREATE TABLE `log_approval_action` (
  `laa_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `ias_id` BIGINT UNSIGNED NOT NULL COMMENT 'ขั้นจริง',
  `su_id` BIGINT UNSIGNED NOT NULL COMMENT 'ผู้กระทำ',
  `laa_actor_name_snapshot` VARCHAR(255) NOT NULL COMMENT 'ชื่อผู้กระทำ',
  `laa_action` ENUM('APPROVE','REVIEW','ACKNOWLEDGE','RETURN','REJECT','CANCEL','SUBMIT') NOT NULL COMMENT 'action',
  `laa_acted_at` DATETIME(6) NOT NULL COMMENT 'เวลากระทำ UTC',
  `laa_remark` TEXT NULL COMMENT 'ความเห็น',
  `laa_context_snapshot` JSON NULL COMMENT 'assignee/version/ค่าที่อนุมัติ',
  `laa_recorded_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาบันทึก UTC เพิ่มอย่างเดียว',
  PRIMARY KEY (`laa_id`),
  KEY `ix_laa_1` (`ias_id`, `laa_acted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='การตัดสินใจ approval ภายใน Asset เท่านั้น ไม่สร้าง MIS approval instance';

CREATE TABLE `log_asset_event` (
  `lae_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `ma_id` BIGINT UNSIGNED NOT NULL COMMENT 'Asset เจ้าของ event',
  `main_ma_id` BIGINT UNSIGNED NOT NULL COMMENT 'Main ณ เวลาเกิดเหตุ รวมตัวเองสำหรับ Main',
  `idoc_id` BIGINT UNSIGNED NULL COMMENT 'เอกสารต้นทาง',
  `iaa_id` BIGINT UNSIGNED NULL COMMENT 'acquisition ที่เกิดจาก MIS',
  `lae_origin` ENUM('ASSET','MIS','ETAX','IMPORT') NOT NULL COMMENT 'ต้นทาง',
  `lae_event_type` VARCHAR(80) NOT NULL COMMENT 'ชนิด event',
  `lae_from_status` VARCHAR(80) NULL COMMENT 'สถานะก่อน',
  `lae_to_status` VARCHAR(80) NULL COMMENT 'สถานะหลัง',
  `su_id` BIGINT UNSIGNED NULL COMMENT 'ผู้กระทำ',
  `lae_actor_name_snapshot` VARCHAR(255) NULL COMMENT 'ชื่อผู้กระทำ',
  `lae_occurred_at` DATETIME(6) NOT NULL COMMENT 'เวลาธุรกิจ UTC',
  `lae_idempotency_key` VARCHAR(150) NOT NULL COMMENT 'คีย์ป้องกัน event ซ้ำ',
  `lae_snapshot` JSON NOT NULL COMMENT 'ข้อมูลสำคัญของเหตุการณ์',
  `lae_recorded_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาบันทึก UTC เพิ่มอย่างเดียว',
  PRIMARY KEY (`lae_id`),
  UNIQUE KEY `uq_lae_1` (`lae_idempotency_key`),
  KEY `ix_lae_1` (`ma_id`, `lae_occurred_at`),
  KEY `ix_lae_2` (`main_ma_id`, `lae_occurred_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Timeline ธุรกิจ รวม MIS; แสดง Main รวม events ของลูกโดย query';

CREATE TABLE `log_audit` (
  `la_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `su_id` BIGINT UNSIGNED NULL COMMENT 'ผู้กระทำ',
  `la_actor_name_snapshot` VARCHAR(255) NOT NULL COMMENT 'ชื่อผู้กระทำ',
  `la_module` VARCHAR(80) NOT NULL COMMENT 'module',
  `la_action` VARCHAR(80) NOT NULL COMMENT 'CREATE / UPDATE / APPROVE ฯลฯ',
  `la_record_table` VARCHAR(100) NOT NULL COMMENT 'ชื่อตารางต้นทาง',
  `la_record_id` BIGINT UNSIGNED NOT NULL COMMENT 'ID ต้นทาง ไม่ทำ FK เพื่อคง audit หลังข้อมูลเปลี่ยน',
  `la_record_ref` VARCHAR(150) NOT NULL COMMENT 'เลขอ้างอิง ณ เวลานั้น',
  `la_correlation_id` VARCHAR(100) NOT NULL COMMENT 'request ID',
  `la_occurred_at` DATETIME(6) NOT NULL COMMENT 'เวลากระทำ UTC',
  `la_recorded_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาบันทึก UTC เพิ่มอย่างเดียว',
  PRIMARY KEY (`la_id`),
  KEY `ix_la_1` (`la_module`, `la_action`, `la_occurred_at`),
  KEY `ix_la_2` (`su_id`, `la_occurred_at`),
  KEY `ix_la_3` (`la_record_table`, `la_record_id`),
  KEY `ix_la_4` (`la_occurred_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Audit เฉพาะ user-driven non-MIS ห้าม credentials/attachment body';

CREATE TABLE `log_audit_change` (
  `lac_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `la_id` BIGINT UNSIGNED NOT NULL COMMENT 'audit event',
  `lac_field_name` VARCHAR(100) NOT NULL COMMENT 'ชื่อคอลัมน์',
  `lac_before_value` JSON NULL COMMENT 'ค่าก่อน NULL ได้',
  `lac_after_value` JSON NULL COMMENT 'ค่าหลัง NULL ได้',
  `lac_recorded_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาบันทึก UTC เพิ่มอย่างเดียว',
  PRIMARY KEY (`lac_id`),
  UNIQUE KEY `uq_lac_1` (`la_id`, `lac_field_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ฟิลด์ before/after ของ audit เพิ่มอย่างเดียว';

CREATE TABLE `log_receiving_validation` (
  `lrv_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `po_imdr_id` BIGINT UNSIGNED NOT NULL COMMENT 'PO reference',
  `lrv_po_item_key` VARCHAR(150) NOT NULL COMMENT 'PO item key',
  `iaa_id` BIGINT UNSIGNED NOT NULL COMMENT 'acquisition ที่ตรวจรับ',
  `gr_imdr_id` BIGINT UNSIGNED NULL COMMENT 'GR reference ที่กระตุ้นผล',
  `lrv_result` VARCHAR(40) NOT NULL COMMENT 'PENDING / PARTIAL / COMPLETE / HOLD',
  `lrv_checks_snapshot` JSON NOT NULL COMMENT 'PO/Invoice/GR/acceptance/quantity; ไม่มี amount equality',
  `lrv_idempotency_key` VARCHAR(150) NOT NULL COMMENT 'คีย์การตรวจต่อ version',
  `lrv_recorded_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาบันทึก UTC เพิ่มอย่างเดียว',
  PRIMARY KEY (`lrv_id`),
  UNIQUE KEY `uq_lrv_1` (`lrv_idempotency_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ประวัติประเมิน receiving แต่ละครั้ง ไม่ใช่ Audit Log';

CREATE TABLE `log_depreciation_period` (
  `ldp_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `ma_id` BIGINT UNSIGNED NOT NULL COMMENT 'Company Asset',
  `ldp_period_month` DATE NOT NULL COMMENT 'วันแรกเดือนรายงาน',
  `ldp_revision` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'revision เพิ่มใหม่เมื่อปรับปรุง',
  `supersedes_ldp_id` BIGINT UNSIGNED NULL COMMENT 'snapshot เดิมที่แทนที่',
  `ldp_opening_cost` DECIMAL(19,2) NOT NULL DEFAULT 0.00 COMMENT 'ต้นทุนต้นงวด',
  `ldp_opening_accumulated_dp` DECIMAL(19,2) NOT NULL DEFAULT 0.00 COMMENT 'DP สะสมต้นงวด',
  `ldp_addition_cost` DECIMAL(19,2) NOT NULL DEFAULT 0.00 COMMENT 'ต้นทุนเพิ่มเฉพาะ record นี้',
  `ldp_period_dp` DECIMAL(19,2) NOT NULL DEFAULT 0.00 COMMENT 'DP เดือนนี้',
  `ldp_disposal_cost` DECIMAL(19,2) NOT NULL DEFAULT 0.00 COMMENT 'ต้นทุนที่ตัดออกในเดือนขาย',
  `ldp_disposal_accumulated_dp` DECIMAL(19,2) NOT NULL DEFAULT 0.00 COMMENT 'DP สะสมที่ตัดออก',
  `ldp_closing_cost` DECIMAL(19,2) NOT NULL DEFAULT 0.00 COMMENT 'ต้นทุนปลายงวด',
  `ldp_closing_accumulated_dp` DECIMAL(19,2) NOT NULL DEFAULT 0.00 COMMENT 'DP สะสมปลายงวด',
  `ldp_closing_net_book_value` DECIMAL(19,2) NOT NULL DEFAULT 0.00 COMMENT 'มูลค่าสุทธิปลายงวด',
  `iads_id` BIGINT UNSIGNED NULL COMMENT 'disposal ถ้ามี',
  `su_id` BIGINT UNSIGNED NULL COMMENT 'ผู้สั่งรายงาน/ปิดงวด',
  `ldp_recorded_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาบันทึก UTC เพิ่มอย่างเดียว',
  PRIMARY KEY (`ldp_id`),
  UNIQUE KEY `uq_ldp_1` (`ma_id`, `ldp_period_month`, `ldp_revision`),
  KEY `ix_ldp_1` (`ldp_period_month`, `ma_id`),
  CONSTRAINT `ck_ldp_1` CHECK (DAY(`ldp_period_month`) = 1),
  CONSTRAINT `ck_ldp_2` CHECK (`ldp_closing_cost` = `ldp_opening_cost` + `ldp_addition_cost` - `ldp_disposal_cost`),
  CONSTRAINT `ck_ldp_3` CHECK (`ldp_closing_accumulated_dp` = `ldp_opening_accumulated_dp` + `ldp_period_dp` - `ldp_disposal_accumulated_dp`),
  CONSTRAINT `ck_ldp_4` CHECK (`ldp_closing_net_book_value` = `ldp_closing_cost` - `ldp_closing_accumulated_dp`),
  CONSTRAINT `ck_ldp_5` CHECK (`ldp_closing_cost` >= 0 AND `ldp_closing_accumulated_dp` >= 0 AND `ldp_closing_accumulated_dp` <= `ldp_closing_cost`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='snapshot รายเดือนแบบ append-only รวม disposal removal และ correction version';

CREATE TABLE `log_integration_message` (
  `lim_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `lim_source` VARCHAR(80) NOT NULL COMMENT 'ระบบต้นทาง',
  `lim_message_key` VARCHAR(150) NOT NULL COMMENT 'คีย์ต้นทาง',
  `lim_attempt` INT UNSIGNED NOT NULL COMMENT 'ลำดับพยายาม',
  `lim_direction` VARCHAR(10) NOT NULL COMMENT 'IN / OUT',
  `lim_result` VARCHAR(40) NOT NULL COMMENT 'RECEIVED / SUCCESS / FAILED / DUPLICATE',
  `lim_payload_digest` CHAR(64) NOT NULL COMMENT 'hash payload',
  `lim_error_summary` TEXT NULL COMMENT 'สรุป error ที่ตัด secrets',
  `idoc_id` BIGINT UNSIGNED NULL COMMENT 'เอกสารที่เกี่ยวข้อง',
  `lim_recorded_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาบันทึก UTC เพิ่มอย่างเดียว',
  PRIMARY KEY (`lim_id`),
  UNIQUE KEY `uq_lim_1` (`lim_source`, `lim_message_key`, `lim_attempt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ผลรับส่ง integration แต่ละ attempt append-only ไม่ใช่ payload credentials';

CREATE TABLE `info_integration_inbox` (
  `iii_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `iii_source` VARCHAR(80) NOT NULL COMMENT 'ระบบต้นทาง',
  `iii_message_key` VARCHAR(150) NOT NULL COMMENT 'คีย์ต้นทาง',
  `iii_status` ENUM('PENDING','PROCESSING','SUCCEEDED','FAILED') NOT NULL DEFAULT 'PENDING' COMMENT 'สถานะ',
  `iii_payload` JSON NOT NULL COMMENT 'ข้อมูลธุรกิจผ่าน validation ห้าม credentials',
  `iii_processed_at` DATETIME(6) NULL COMMENT 'เวลาสำเร็จ',
  `iii_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `iii_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `iii_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `iii_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `iii_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`iii_id`),
  UNIQUE KEY `uq_iii_1` (`iii_source`, `iii_message_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='deduplication และสถานะ processing ของ event ต้นทาง';

CREATE TABLE `info_integration_outbox` (
  `iio_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `iio_event_key` VARCHAR(150) NOT NULL COMMENT 'idempotency key',
  `idoc_id` BIGINT UNSIGNED NULL COMMENT 'เอกสาร',
  `iio_event_type` VARCHAR(100) NOT NULL COMMENT 'ประเภท event',
  `iio_payload` JSON NOT NULL COMMENT 'ข้อมูลส่งไม่รวม credentials',
  `iio_published_at` DATETIME(6) NULL COMMENT 'เวลาส่งสำเร็จ',
  `iio_attempts` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'จำนวนพยายาม',
  `iio_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `iio_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `iio_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `iio_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `iio_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`iio_id`),
  UNIQUE KEY `uq_iio_1` (`iio_event_key`),
  KEY `ix_iio_1` (`iio_published_at`, `iio_created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='outbox เขียนพร้อมธุรกรรม แล้วส่งภายหลัง';

CREATE TABLE `info_mis_document_reference` (
  `imdr_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `imdr_source` VARCHAR(80) NOT NULL COMMENT 'ระบบต้นทาง',
  `imdr_external_key` VARCHAR(150) NOT NULL COMMENT 'รหัสเอกสารถาวรจากต้นทาง',
  `imdr_kind` ENUM('PROPOSAL','PR','PO','INVOICE','GR','DELIVERY','SPARE_ISSUE') NOT NULL COMMENT 'ชนิดเอกสารอ้างอิง',
  `imdr_no` VARCHAR(100) NOT NULL COMMENT 'เลขเอกสารแสดงผล ไม่ใช้เป็น FK',
  `imdr_status` VARCHAR(80) NOT NULL COMMENT 'สถานะที่ได้รับจากต้นทาง',
  `po_imdr_id` BIGINT UNSIGNED NULL COMMENT 'PO ต้นทางสำหรับ Invoice/GR/Delivery',
  `mv_id` BIGINT UNSIGNED NULL COMMENT 'ผู้ขายอ้างอิง',
  `imdr_document_date` DATE NULL COMMENT 'วันที่ต้นทาง',
  `imdr_document_exists` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'MIS ยืนยันมีเอกสารจริง',
  `ifile_id` BIGINT UNSIGNED NULL COMMENT 'ไฟล์สำเนาถ้ามี ไม่บังคับต้องดาวน์โหลด',
  `imdr_external_url` VARCHAR(500) NULL COMMENT 'ลิงก์เอกสารที่ไม่ใส่ credentials',
  `imdr_external_version` VARCHAR(100) NULL COMMENT 'version ต้นทาง',
  `imdr_synced_at` DATETIME(6) NOT NULL COMMENT 'เวลารับข้อมูลล่าสุด',
  `imdr_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `imdr_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `imdr_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `imdr_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `imdr_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`imdr_id`),
  UNIQUE KEY `uq_imdr_1` (`imdr_source`, `imdr_kind`, `imdr_external_key`),
  UNIQUE KEY `uq_imdr_2` (`imdr_id`, `po_imdr_id`),
  KEY `ix_imdr_1` (`imdr_kind`, `imdr_no`),
  KEY `ix_imdr_2` (`po_imdr_id`),
  CONSTRAINT `ck_imdr_1` CHECK (`imdr_kind` NOT IN ('INVOICE','GR','DELIVERY') OR `po_imdr_id` IS NOT NULL),
  CONSTRAINT `ck_imdr_2` CHECK (`imdr_kind` <> 'PO' OR `po_imdr_id` IS NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='สำเนาอ้างอิงเอกสาร MIS แบบอ่านอย่างเดียว อัปเดตโดย integration เท่านั้น';

CREATE TABLE `info_rfq_reference` (
  `irfr_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `irfr_source` VARCHAR(80) NOT NULL COMMENT 'ระบบต้นทาง',
  `irfr_external_key` VARCHAR(150) NOT NULL COMMENT 'รหัส RFQ ต้นทาง',
  `irfr_item_key` VARCHAR(150) NOT NULL COMMENT 'รหัสรายการ RFQ ต้นทาง',
  `irfr_rfq_no` VARCHAR(100) NOT NULL COMMENT 'เลข RFQ',
  `irfr_name` VARCHAR(255) NOT NULL COMMENT 'ชื่อรายการ',
  `irfr_model` VARCHAR(255) NULL COMMENT 'รุ่นที่เติมตอนเลือก RFQ',
  `irfr_part_no` VARCHAR(255) NULL COMMENT 'เลข part ที่เติมตอนเลือก RFQ',
  `irfr_is_available` BOOLEAN NOT NULL DEFAULT 1 COMMENT 'เปิดให้เลือก',
  `irfr_synced_at` DATETIME(6) NOT NULL COMMENT 'เวลารับล่าสุด',
  `irfr_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `irfr_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `irfr_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `irfr_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `irfr_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`irfr_id`),
  UNIQUE KEY `uq_irfr_1` (`irfr_source`, `irfr_external_key`, `irfr_item_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='รายการ RFQ สำหรับ selector และเติม Model/Part โดยไม่สร้าง RFQ workflow';

CREATE TABLE `info_asset_acquisition` (
  `iaa_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `imdr_id` BIGINT UNSIGNED NOT NULL COMMENT 'Proposal reference',
  `iaa_proposal_item_key` VARCHAR(150) NOT NULL COMMENT 'รหัสรายการ Proposal ต้นทาง',
  `selected_ma_id` BIGINT UNSIGNED NOT NULL COMMENT 'Draft หรือ Active work target ที่ MIS เลือก',
  `ma_id` BIGINT UNSIGNED NULL COMMENT 'Asset ผลลัพธ์ที่จะ activate; NULL สำหรับ Expense',
  `mprj_id` BIGINT UNSIGNED NOT NULL COMMENT 'โครงการ',
  `iaa_ownership` ENUM('COMPANY','CUSTOMER') NOT NULL COMMENT 'ownership ที่ได้รับจาก Proposal',
  `iaa_selection` ENUM('NEW','EXISTING') NOT NULL COMMENT 'ชนิดรายการต้นทาง',
  `iaa_work_type` ENUM('ADDITION_SUB_ASSET','MODIFICATION','MAINTENANCE') NULL COMMENT 'work type ต้นฉบับ',
  `iaa_treatment` ENUM('NEW_ASSET','CAPITALIZED_SUB_ASSET','EXPENSE') NOT NULL COMMENT 'การจัดประเภทของรายการ',
  `iaa_title` VARCHAR(255) NOT NULL COMMENT 'หัวข้อหรือ component name',
  `iaa_detail` TEXT NULL COMMENT 'รายละเอียดงาน',
  `mac_id` BIGINT UNSIGNED NULL COMMENT 'บัญชีอ้างอิง',
  `iaa_budget_type` ENUM('CAPITAL_EXPENDITURE','EXPENSE') NOT NULL COMMENT 'Budget Type ต้นทาง',
  `iaa_base_amount` DECIMAL(19,2) NOT NULL DEFAULT 0.00 COMMENT 'ราคาฐานเฉพาะรายการ',
  `iaa_total_amount` DECIMAL(19,2) NOT NULL DEFAULT 0.00 COMMENT 'ฐานรวมต้นทุน scoped; ตรวจยอดรวมที่ integration',
  `iaa_currency` CHAR(3) NOT NULL DEFAULT 'THB' COMMENT 'สกุลเงินตามกฎปัจจุบัน',
  `iaa_status` ENUM('DRAFT','PURCHASING','WAITING_DELIVERY','RECEIVING','GR_RECEIVED','READY_FOR_VERIFICATION','ACTIVATING','COMPLETED','HOLD','CANCELLED') NOT NULL DEFAULT 'DRAFT' COMMENT 'สถานะ acquisition ของ Asset',
  `iaa_external_version` VARCHAR(100) NULL COMMENT 'version ของรายการต้นทาง',
  `iaa_synced_at` DATETIME(6) NOT NULL COMMENT 'เวลารับล่าสุด',
  `iaa_completed_at` DATETIME(6) NULL COMMENT 'เวลางานสำเร็จ',
  `iaa_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `iaa_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `iaa_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `iaa_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `iaa_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`iaa_id`),
  UNIQUE KEY `uq_iaa_1` (`imdr_id`, `iaa_proposal_item_key`),
  UNIQUE KEY `uq_iaa_2` (`imdr_id`, `selected_ma_id`),
  KEY `ix_iaa_1` (`ma_id`),
  KEY `ix_iaa_2` (`selected_ma_id`, `iaa_status`),
  CONSTRAINT `ck_iaa_1` CHECK (`iaa_currency` = 'THB'),
  CONSTRAINT `ck_iaa_2` CHECK (`iaa_base_amount` >= 0 AND `iaa_total_amount` >= `iaa_base_amount`),
  CONSTRAINT `ck_iaa_3` CHECK ((`iaa_selection` = 'NEW' AND `iaa_work_type` IS NULL AND `iaa_treatment` = 'NEW_ASSET' AND `ma_id` IS NOT NULL) OR (`iaa_selection` = 'EXISTING' AND `iaa_work_type` IS NOT NULL AND ((`iaa_treatment` = 'EXPENSE' AND `ma_id` IS NULL AND `iaa_total_amount` <= 50000) OR (`iaa_treatment` = 'CAPITALIZED_SUB_ASSET' AND `ma_id` IS NOT NULL AND `iaa_total_amount` > 50000)))),
  CONSTRAINT `ck_iaa_4` CHECK (`iaa_ownership` <> 'CUSTOMER' OR `iaa_selection` = 'NEW')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ข้อมูล acquisition ต่อรายการ Proposal จาก MIS รวมกรณี Expense ที่ไม่มี Asset ใหม่';

CREATE TABLE `info_asset_acquisition_cost` (
  `iaac_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `iaa_id` BIGINT UNSIGNED NOT NULL COMMENT 'รายการ acquisition',
  `iaac_external_cost_key` VARCHAR(150) NOT NULL COMMENT 'รหัสแถวต้นทุนจาก MIS',
  `mct_id` BIGINT UNSIGNED NOT NULL COMMENT 'ชนิดต้นทุน',
  `mac_id` BIGINT UNSIGNED NULL COMMENT 'บัญชีอ้างอิง',
  `iaac_description` VARCHAR(255) NULL COMMENT 'รายละเอียด',
  `iaac_amount` DECIMAL(19,2) NOT NULL DEFAULT 0.00 COMMENT 'ยอดต้นทุนเพิ่มเติมของรายการ',
  `iaac_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `iaac_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `iaac_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `iaac_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `iaac_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`iaac_id`),
  UNIQUE KEY `uq_iaac_1` (`iaa_id`, `iaac_external_cost_key`),
  CONSTRAINT `ck_iaac_1` CHECK (`iaac_amount` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ต้นทุนเพิ่มเติมราย acquisition ที่รับจาก MIS ไม่ใช่ตารางสร้างต้นทุนจัดซื้อ';

CREATE TABLE `info_asset_acquisition_document` (
  `iaad_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `iaa_id` BIGINT UNSIGNED NOT NULL COMMENT 'acquisition',
  `imdr_id` BIGINT UNSIGNED NOT NULL COMMENT 'เอกสารอ้างอิง',
  `iaad_document_item_key` VARCHAR(150) NOT NULL COMMENT 'รหัส item ต้นทาง ใช้ HEADER หากเป็นระดับเอกสาร',
  `po_imdr_id` BIGINT UNSIGNED NULL COMMENT 'PO scope สำหรับ Invoice/GR/Delivery; NULL สำหรับ Proposal/PR/PO',
  `iaad_po_item_key` VARCHAR(150) NOT NULL COMMENT 'PO item ที่เกี่ยวข้อง ใช้ HEADER เมื่อยังไม่จัดสรร',
  `iaad_ordered_quantity` DECIMAL(18,4) NULL COMMENT 'จำนวนสั่งเฉพาะ link ของ PO item',
  `iaad_received_quantity` DECIMAL(18,4) NULL COMMENT 'จำนวนรับเฉพาะ link ของ GR item',
  `iaad_accepted_quantity` DECIMAL(18,4) NULL COMMENT 'จำนวนรับผ่านตรวจเฉพาะ GR item',
  `iaad_allocated_amount` DECIMAL(19,2) NULL COMMENT 'มูลค่าจัดสรรเฉพาะ PO scope ห้ามรวมยอดซ้ำจากเอกสารทุกชนิด',
  `iaad_purchasing_accepted` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'Purchasing ยืนยันรับเฉพาะ GR',
  `iaad_owner_accepted` BOOLEAN NOT NULL DEFAULT 0 COMMENT 'Owner ยืนยันรับเฉพาะ GR',
  `iaad_accepted_at` DATETIME(6) NULL COMMENT 'เวลายืนยันรับ',
  `iaad_acceptance` ENUM('PENDING','ACCEPTED','FAILED') NOT NULL DEFAULT 'PENDING' COMMENT 'ผล physical acceptance ที่ MIS ส่ง',
  `iaad_synced_at` DATETIME(6) NOT NULL COMMENT 'เวลารับล่าสุด',
  `iaad_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `iaad_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `iaad_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `iaad_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `iaad_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`iaad_id`),
  UNIQUE KEY `uq_iaad_1` (`iaa_id`, `imdr_id`, `iaad_document_item_key`, `iaad_po_item_key`),
  CONSTRAINT `ck_iaad_1` CHECK (`iaad_ordered_quantity` IS NULL OR `iaad_ordered_quantity` >= 0),
  CONSTRAINT `ck_iaad_2` CHECK (`iaad_received_quantity` IS NULL OR `iaad_received_quantity` >= 0),
  CONSTRAINT `ck_iaad_3` CHECK (`iaad_accepted_quantity` IS NULL OR (`iaad_received_quantity` IS NOT NULL AND `iaad_accepted_quantity` >= 0 AND `iaad_accepted_quantity` <= `iaad_received_quantity`)),
  CONSTRAINT `ck_iaad_4` CHECK (`iaad_allocated_amount` IS NULL OR `iaad_allocated_amount` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='เชื่อม acquisition กับเอกสาร MIS และ item scope รองรับหลาย PO/Invoice/GR';

CREATE TABLE `info_asset_spare_usage` (
  `iasu_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร ไม่ใช้เลขเอกสารเป็น PK',
  `iasu_source` VARCHAR(80) NOT NULL COMMENT 'ระบบต้นทาง',
  `iasu_issue_key` VARCHAR(150) NOT NULL COMMENT 'รหัสใบเบิกต้นทาง',
  `iasu_issue_item_key` VARCHAR(150) NOT NULL COMMENT 'รหัสรายการเบิกต้นทาง',
  `imdr_id` BIGINT UNSIGNED NOT NULL COMMENT 'เอกสารใบเบิกอ้างอิง',
  `ma_id` BIGINT UNSIGNED NOT NULL COMMENT 'Asset ที่ใช้อะไหล่',
  `mpt_id` BIGINT UNSIGNED NULL COMMENT 'part อ้างอิงถ้ามี',
  `iasu_part_no_snapshot` VARCHAR(150) NOT NULL COMMENT 'เลข part ขณะเบิก',
  `iasu_part_name_snapshot` VARCHAR(255) NOT NULL COMMENT 'ชื่อ part ขณะเบิก',
  `mu_id` BIGINT UNSIGNED NOT NULL COMMENT 'หน่วย',
  `iasu_quantity` DECIMAL(18,4) NOT NULL COMMENT 'จำนวนใช้สุทธิหลังคืนตาม MIS',
  `iasu_total_cost` DECIMAL(19,2) NOT NULL DEFAULT 0.00 COMMENT 'ต้นทุนใช้สุทธิจาก MIS ไม่ตีราคา stock เอง',
  `iasu_issued_on` DATE NOT NULL COMMENT 'วันที่เบิก',
  `iasu_status` ENUM('COMPLETED','REVERSED') NOT NULL DEFAULT 'COMPLETED' COMMENT 'สถานะต้นทาง',
  `iasu_external_version` VARCHAR(100) NULL COMMENT 'version ต้นทาง',
  `iasu_synced_at` DATETIME(6) NOT NULL COMMENT 'เวลารับล่าสุด',
  `iasu_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `iasu_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้สร้าง',
  `iasu_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไขล่าสุด UTC',
  `iasu_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้แก้ไขล่าสุด',
  `iasu_row_version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'เลขเวอร์ชันสำหรับ optimistic locking',
  PRIMARY KEY (`iasu_id`),
  UNIQUE KEY `uq_iasu_1` (`iasu_source`, `iasu_issue_key`, `iasu_issue_item_key`),
  KEY `ix_iasu_1` (`ma_id`, `iasu_issued_on`),
  CONSTRAINT `ck_iasu_1` CHECK (`iasu_quantity` >= 0 AND `iasu_total_cost` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ประวัติใช้อะไหล่สำเร็จจาก MIS ไม่เก็บใบเบิก workflow หรือ stock balance';

CREATE TABLE `sys_users` (
  `su_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร',
  `spg_id` BIGINT UNSIGNED NOT NULL COMMENT 'กลุ่มสิทธิ์/Role',
  `su_username` VARCHAR(100) NOT NULL COMMENT 'ชื่อเข้าสู่ระบบ',
  `su_employee_code` VARCHAR(80) NOT NULL COMMENT 'รหัสพนักงาน',
  `su_password` VARCHAR(255) NOT NULL COMMENT 'รหัสผ่านที่จัดเก็บเป็น password hash เท่านั้น ห้ามเก็บ plaintext',
  `su_firstname` VARCHAR(120) NOT NULL COMMENT 'ชื่อ',
  `su_lastname` VARCHAR(120) NOT NULL COMMENT 'นามสกุล',
  `su_email` VARCHAR(255) NOT NULL COMMENT 'อีเมล',
  `sd_id` BIGINT UNSIGNED NOT NULL COMMENT 'หน่วยงาน',
  `su_sign_path` VARCHAR(500) NULL COMMENT 'object key ของไฟล์ลายเซ็น',
  `su_status` BOOLEAN NOT NULL DEFAULT '1' COMMENT 'สถานะผู้ใช้',
  `su_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `su_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้บันทึก',
  `su_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไข UTC',
  `su_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้บันทึก',
  PRIMARY KEY (`su_id`),
  UNIQUE KEY `uq_su_1` (`su_username`),
  UNIQUE KEY `uq_su_2` (`su_employee_code`),
  KEY `ix_su_1` (`spg_id`, `su_status`),
  KEY `ix_su_2` (`sd_id`, `su_status`),
  KEY `ix_su_3` (`su_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='ผู้ใช้งาน แต่ละคนสังกัดหนึ่ง permission group และหนึ่ง department';

CREATE TABLE `sys_submenu` (
  `ss_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร',
  `sm_id` BIGINT UNSIGNED NOT NULL COMMENT 'เมนูหลัก',
  `ss_name` VARCHAR(160) NOT NULL COMMENT 'ชื่อเมนูย่อย',
  `ss_link` VARCHAR(255) NOT NULL COMMENT 'route หรือ path',
  `ss_order` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ลำดับเมนูย่อย',
  `ss_status` BOOLEAN NOT NULL DEFAULT '1' COMMENT 'สถานะเมนูย่อย',
  `ss_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `ss_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้บันทึก',
  `ss_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไข UTC',
  `ss_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้บันทึก',
  PRIMARY KEY (`ss_id`),
  KEY `ix_ss_1` (`sm_id`, `ss_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='เมนูย่อยและ route ใต้เมนูหลัก';

CREATE TABLE `sys_permission_group` (
  `spg_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร',
  `spg_name` VARCHAR(120) NOT NULL COMMENT 'ชื่อกลุ่มสิทธิ์/Role',
  `spg_status` BOOLEAN NOT NULL DEFAULT '1' COMMENT 'สถานะกลุ่มสิทธิ์',
  `spg_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `spg_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้บันทึก',
  `spg_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไข UTC',
  `spg_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้บันทึก',
  PRIMARY KEY (`spg_id`),
  UNIQUE KEY `uq_spg_1` (`spg_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='กลุ่มสิทธิ์ที่ทำหน้าที่เป็น Role สำหรับกำหนดสิทธิ์เข้าถึงเมนู';

CREATE TABLE `sys_permission_detail` (
  `spd_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร',
  `spg_id` BIGINT UNSIGNED NOT NULL COMMENT 'กลุ่มสิทธิ์/Role',
  `ss_id` BIGINT UNSIGNED NOT NULL COMMENT 'เมนูย่อยที่อนุญาต',
  `spd_order` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'ลำดับสิทธิ์',
  `spd_status` BOOLEAN NOT NULL DEFAULT '1' COMMENT 'อนุญาตเมนูย่อยนี้',
  `spd_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `spd_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้บันทึก',
  `spd_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไข UTC',
  `spd_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้บันทึก',
  PRIMARY KEY (`spd_id`),
  UNIQUE KEY `uq_spd_1` (`spg_id`, `ss_id`),
  KEY `ix_spd_1` (`ss_id`, `spd_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='รายละเอียดสิทธิ์เข้าถึง submenu ที่กำหนดให้แต่ละ permission group';

CREATE TABLE `sys_department` (
  `sd_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'รหัสภายในถาวร',
  `sd_plant_cd` VARCHAR(40) NOT NULL COMMENT 'รหัส Plant ตาม master ภายนอก',
  `sd_code` VARCHAR(80) NOT NULL COMMENT 'รหัสหน่วยงาน',
  `sd_name` VARCHAR(160) NOT NULL COMMENT 'ชื่อหน่วยงาน',
  `sd_aname` VARCHAR(160) NULL COMMENT 'ชื่อหน่วยงานอีกภาษาหรือชื่อย่อ',
  `sd_email` VARCHAR(255) NULL COMMENT 'อีเมลหน่วยงาน',
  `sd_status` BOOLEAN NOT NULL DEFAULT '1' COMMENT 'สถานะหน่วยงาน',
  `sd_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาสร้าง UTC',
  `sd_created_by` BIGINT UNSIGNED NULL COMMENT 'ผู้บันทึก',
  `sd_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'วันเวลาแก้ไข UTC',
  `sd_updated_by` BIGINT UNSIGNED NULL COMMENT 'ผู้บันทึก',
  PRIMARY KEY (`sd_id`),
  UNIQUE KEY `uq_sd_1` (`sd_plant_cd`, `sd_code`),
  KEY `ix_sd_1` (`sd_name`, `sd_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='หน่วยงานตามรหัส plant และ department';

ALTER TABLE `sys_menu` ADD CONSTRAINT `fk_sm_created_by` FOREIGN KEY (`sm_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_menu` ADD CONSTRAINT `fk_sm_updated_by` FOREIGN KEY (`sm_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_setting` ADD CONSTRAINT `fk_sst_created_by` FOREIGN KEY (`sst_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_setting` ADD CONSTRAINT `fk_sst_updated_by` FOREIGN KEY (`sst_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_number_sequence` ADD CONSTRAINT `fk_sns_created_by` FOREIGN KEY (`sns_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_number_sequence` ADD CONSTRAINT `fk_sns_updated_by` FOREIGN KEY (`sns_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_workflow` ADD CONSTRAINT `fk_sw_created_by` FOREIGN KEY (`sw_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_workflow` ADD CONSTRAINT `fk_sw_updated_by` FOREIGN KEY (`sw_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_workflow_step` ADD CONSTRAINT `fk_sws_workflow_id` FOREIGN KEY (`sw_id`) REFERENCES `sys_workflow` (`sw_id`);
ALTER TABLE `sys_workflow_step` ADD CONSTRAINT `fk_sws_user_id` FOREIGN KEY (`su_id`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_workflow_step` ADD CONSTRAINT `fk_sws_permission_group_id` FOREIGN KEY (`spg_id`) REFERENCES `sys_permission_group` (`spg_id`);
ALTER TABLE `sys_workflow_step` ADD CONSTRAINT `fk_sws_created_by` FOREIGN KEY (`sws_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_workflow_step` ADD CONSTRAINT `fk_sws_updated_by` FOREIGN KEY (`sws_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_workflow_assignment` ADD CONSTRAINT `fk_swa_workflow_id` FOREIGN KEY (`sw_id`) REFERENCES `sys_workflow` (`sw_id`);
ALTER TABLE `sys_workflow_assignment` ADD CONSTRAINT `fk_swa_created_by` FOREIGN KEY (`swa_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_workflow_assignment` ADD CONSTRAINT `fk_swa_updated_by` FOREIGN KEY (`swa_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_responsibility` ADD CONSTRAINT `fk_sres_department_id` FOREIGN KEY (`sd_id`) REFERENCES `sys_department` (`sd_id`);
ALTER TABLE `sys_responsibility` ADD CONSTRAINT `fk_sres_user_id` FOREIGN KEY (`su_id`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_responsibility` ADD CONSTRAINT `fk_sres_created_by` FOREIGN KEY (`sres_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_responsibility` ADD CONSTRAINT `fk_sres_updated_by` FOREIGN KEY (`sres_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_plant` ADD CONSTRAINT `fk_mp_created_by` FOREIGN KEY (`mp_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_plant` ADD CONSTRAINT `fk_mp_updated_by` FOREIGN KEY (`mp_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_location` ADD CONSTRAINT `fk_ml_plant_id` FOREIGN KEY (`mp_id`) REFERENCES `mst_plant` (`mp_id`);
ALTER TABLE `mst_location` ADD CONSTRAINT `fk_ml_created_by` FOREIGN KEY (`ml_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_location` ADD CONSTRAINT `fk_ml_updated_by` FOREIGN KEY (`ml_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_line` ADD CONSTRAINT `fk_mli_location_id` FOREIGN KEY (`ml_id`) REFERENCES `mst_location` (`ml_id`);
ALTER TABLE `mst_line` ADD CONSTRAINT `fk_mli_created_by` FOREIGN KEY (`mli_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_line` ADD CONSTRAINT `fk_mli_updated_by` FOREIGN KEY (`mli_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_cost_center` ADD CONSTRAINT `fk_mcc_department_id` FOREIGN KEY (`sd_id`) REFERENCES `sys_department` (`sd_id`);
ALTER TABLE `mst_cost_center` ADD CONSTRAINT `fk_mcc_created_by` FOREIGN KEY (`mcc_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_cost_center` ADD CONSTRAINT `fk_mcc_updated_by` FOREIGN KEY (`mcc_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_project` ADD CONSTRAINT `fk_mprj_department_id` FOREIGN KEY (`sd_id`) REFERENCES `sys_department` (`sd_id`);
ALTER TABLE `mst_project` ADD CONSTRAINT `fk_mprj_created_by` FOREIGN KEY (`mprj_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_project` ADD CONSTRAINT `fk_mprj_updated_by` FOREIGN KEY (`mprj_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_customer` ADD CONSTRAINT `fk_mc_created_by` FOREIGN KEY (`mc_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_customer` ADD CONSTRAINT `fk_mc_updated_by` FOREIGN KEY (`mc_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_vendor` ADD CONSTRAINT `fk_mv_created_by` FOREIGN KEY (`mv_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_vendor` ADD CONSTRAINT `fk_mv_updated_by` FOREIGN KEY (`mv_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_asset_group` ADD CONSTRAINT `fk_mag_created_by` FOREIGN KEY (`mag_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_asset_group` ADD CONSTRAINT `fk_mag_updated_by` FOREIGN KEY (`mag_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_asset_type` ADD CONSTRAINT `fk_mat_group_id` FOREIGN KEY (`mag_id`) REFERENCES `mst_asset_group` (`mag_id`);
ALTER TABLE `mst_asset_type` ADD CONSTRAINT `fk_mat_created_by` FOREIGN KEY (`mat_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_asset_type` ADD CONSTRAINT `fk_mat_updated_by` FOREIGN KEY (`mat_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_account` ADD CONSTRAINT `fk_mac_created_by` FOREIGN KEY (`mac_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_account` ADD CONSTRAINT `fk_mac_updated_by` FOREIGN KEY (`mac_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_cost_type` ADD CONSTRAINT `fk_mct_created_by` FOREIGN KEY (`mct_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_cost_type` ADD CONSTRAINT `fk_mct_updated_by` FOREIGN KEY (`mct_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_uom` ADD CONSTRAINT `fk_mu_created_by` FOREIGN KEY (`mu_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_uom` ADD CONSTRAINT `fk_mu_updated_by` FOREIGN KEY (`mu_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_part` ADD CONSTRAINT `fk_mpt_uom_id` FOREIGN KEY (`mu_id`) REFERENCES `mst_uom` (`mu_id`);
ALTER TABLE `mst_part` ADD CONSTRAINT `fk_mpt_created_by` FOREIGN KEY (`mpt_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_part` ADD CONSTRAINT `fk_mpt_updated_by` FOREIGN KEY (`mpt_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_document` ADD CONSTRAINT `fk_idoc_created_by` FOREIGN KEY (`idoc_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_document` ADD CONSTRAINT `fk_idoc_updated_by` FOREIGN KEY (`idoc_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_file` ADD CONSTRAINT `fk_ifile_created_by` FOREIGN KEY (`ifile_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_file` ADD CONSTRAINT `fk_ifile_updated_by` FOREIGN KEY (`ifile_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_document_file` ADD CONSTRAINT `fk_idf_document_id` FOREIGN KEY (`idoc_id`) REFERENCES `info_document` (`idoc_id`);
ALTER TABLE `info_document_file` ADD CONSTRAINT `fk_idf_file_id` FOREIGN KEY (`ifile_id`) REFERENCES `info_file` (`ifile_id`);
ALTER TABLE `info_document_file` ADD CONSTRAINT `fk_idf_created_by` FOREIGN KEY (`idf_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_document_file` ADD CONSTRAINT `fk_idf_updated_by` FOREIGN KEY (`idf_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_asset` ADD CONSTRAINT `fk_ma_customer_id` FOREIGN KEY (`mc_id`) REFERENCES `mst_customer` (`mc_id`);
ALTER TABLE `mst_asset` ADD CONSTRAINT `fk_ma_parent_asset_id` FOREIGN KEY (`parent_ma_id`) REFERENCES `mst_asset` (`ma_id`);
ALTER TABLE `mst_asset` ADD CONSTRAINT `fk_ma_source_asset_id` FOREIGN KEY (`source_ma_id`) REFERENCES `mst_asset` (`ma_id`);
ALTER TABLE `mst_asset` ADD CONSTRAINT `fk_ma_asset_type_id` FOREIGN KEY (`mat_id`) REFERENCES `mst_asset_type` (`mat_id`);
ALTER TABLE `mst_asset` ADD CONSTRAINT `fk_ma_project_id` FOREIGN KEY (`mprj_id`) REFERENCES `mst_project` (`mprj_id`);
ALTER TABLE `mst_asset` ADD CONSTRAINT `fk_ma_rfq_reference_id` FOREIGN KEY (`irfr_id`) REFERENCES `info_rfq_reference` (`irfr_id`);
ALTER TABLE `mst_asset` ADD CONSTRAINT `fk_ma_custodian_id` FOREIGN KEY (`su_id`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_asset` ADD CONSTRAINT `fk_ma_department_id` FOREIGN KEY (`sd_id`) REFERENCES `sys_department` (`sd_id`);
ALTER TABLE `mst_asset` ADD CONSTRAINT `fk_ma_plant_id` FOREIGN KEY (`mp_id`) REFERENCES `mst_plant` (`mp_id`);
ALTER TABLE `mst_asset` ADD CONSTRAINT `fk_ma_location_id` FOREIGN KEY (`ml_id`) REFERENCES `mst_location` (`ml_id`);
ALTER TABLE `mst_asset` ADD CONSTRAINT `fk_ma_line_id` FOREIGN KEY (`mli_id`) REFERENCES `mst_line` (`mli_id`);
ALTER TABLE `mst_asset` ADD CONSTRAINT `fk_ma_cost_center_id` FOREIGN KEY (`mcc_id`) REFERENCES `mst_cost_center` (`mcc_id`);
ALTER TABLE `mst_asset` ADD CONSTRAINT `fk_ma_created_by` FOREIGN KEY (`ma_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_asset` ADD CONSTRAINT `fk_ma_updated_by` FOREIGN KEY (`ma_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_file` ADD CONSTRAINT `fk_iaf_asset_id` FOREIGN KEY (`ma_id`) REFERENCES `mst_asset` (`ma_id`);
ALTER TABLE `info_asset_file` ADD CONSTRAINT `fk_iaf_file_id` FOREIGN KEY (`ifile_id`) REFERENCES `info_file` (`ifile_id`);
ALTER TABLE `info_asset_file` ADD CONSTRAINT `fk_iaf_created_by` FOREIGN KEY (`iaf_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_file` ADD CONSTRAINT `fk_iaf_updated_by` FOREIGN KEY (`iaf_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_receiving_validation` ADD CONSTRAINT `fk_irv_po_reference_id` FOREIGN KEY (`imdr_id`) REFERENCES `info_mis_document_reference` (`imdr_id`);
ALTER TABLE `info_receiving_validation` ADD CONSTRAINT `fk_irv_acquisition_id` FOREIGN KEY (`iaa_id`) REFERENCES `info_asset_acquisition` (`iaa_id`);
ALTER TABLE `info_receiving_validation` ADD CONSTRAINT `fk_irv_created_by` FOREIGN KEY (`irv_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_receiving_validation` ADD CONSTRAINT `fk_irv_updated_by` FOREIGN KEY (`irv_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_verification_check` ADD CONSTRAINT `fk_mvc_created_by` FOREIGN KEY (`mvc_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `mst_verification_check` ADD CONSTRAINT `fk_mvc_updated_by` FOREIGN KEY (`mvc_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_verification` ADD CONSTRAINT `fk_iav_document_id` FOREIGN KEY (`idoc_id`) REFERENCES `info_document` (`idoc_id`);
ALTER TABLE `info_asset_verification` ADD CONSTRAINT `fk_iav_asset_id` FOREIGN KEY (`ma_id`) REFERENCES `mst_asset` (`ma_id`);
ALTER TABLE `info_asset_verification` ADD CONSTRAINT `fk_iav_created_by` FOREIGN KEY (`iav_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_verification` ADD CONSTRAINT `fk_iav_updated_by` FOREIGN KEY (`iav_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_verification_check` ADD CONSTRAINT `fk_ivc_verification_id` FOREIGN KEY (`iav_id`) REFERENCES `info_asset_verification` (`iav_id`);
ALTER TABLE `info_verification_check` ADD CONSTRAINT `fk_ivc_check_id` FOREIGN KEY (`mvc_id`) REFERENCES `mst_verification_check` (`mvc_id`);
ALTER TABLE `info_verification_check` ADD CONSTRAINT `fk_ivc_created_by` FOREIGN KEY (`ivc_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_verification_check` ADD CONSTRAINT `fk_ivc_updated_by` FOREIGN KEY (`ivc_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_approval_request` ADD CONSTRAINT `fk_iar_document_id` FOREIGN KEY (`idoc_id`) REFERENCES `info_document` (`idoc_id`);
ALTER TABLE `info_approval_request` ADD CONSTRAINT `fk_iar_workflow_id` FOREIGN KEY (`sw_id`) REFERENCES `sys_workflow` (`sw_id`);
ALTER TABLE `info_approval_request` ADD CONSTRAINT `fk_iar_submitted_by` FOREIGN KEY (`su_id`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_approval_request` ADD CONSTRAINT `fk_iar_created_by` FOREIGN KEY (`iar_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_approval_request` ADD CONSTRAINT `fk_iar_updated_by` FOREIGN KEY (`iar_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_approval_step` ADD CONSTRAINT `fk_ias_request_id` FOREIGN KEY (`iar_id`) REFERENCES `info_approval_request` (`iar_id`);
ALTER TABLE `info_approval_step` ADD CONSTRAINT `fk_ias_workflow_step_id` FOREIGN KEY (`sws_id`) REFERENCES `sys_workflow_step` (`sws_id`);
ALTER TABLE `info_approval_step` ADD CONSTRAINT `fk_ias_assigned_user_id` FOREIGN KEY (`su_id`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_approval_step` ADD CONSTRAINT `fk_ias_assigned_permission_group_id` FOREIGN KEY (`spg_id`) REFERENCES `sys_permission_group` (`spg_id`);
ALTER TABLE `info_approval_step` ADD CONSTRAINT `fk_ias_created_by` FOREIGN KEY (`ias_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_approval_step` ADD CONSTRAINT `fk_ias_updated_by` FOREIGN KEY (`ias_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_depreciation` ADD CONSTRAINT `fk_iad_asset_id` FOREIGN KEY (`ma_id`) REFERENCES `mst_asset` (`ma_id`);
ALTER TABLE `info_asset_depreciation` ADD CONSTRAINT `fk_iad_created_by` FOREIGN KEY (`iad_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_depreciation` ADD CONSTRAINT `fk_iad_updated_by` FOREIGN KEY (`iad_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_transfer` ADD CONSTRAINT `fk_iat_document_id` FOREIGN KEY (`idoc_id`) REFERENCES `info_document` (`idoc_id`);
ALTER TABLE `info_asset_transfer` ADD CONSTRAINT `fk_iat_asset_id` FOREIGN KEY (`ma_id`) REFERENCES `mst_asset` (`ma_id`);
ALTER TABLE `info_asset_transfer` ADD CONSTRAINT `fk_iat_from_custodian_id` FOREIGN KEY (`from_su_id`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_transfer` ADD CONSTRAINT `fk_iat_from_department_id` FOREIGN KEY (`from_sd_id`) REFERENCES `sys_department` (`sd_id`);
ALTER TABLE `info_asset_transfer` ADD CONSTRAINT `fk_iat_from_plant_id` FOREIGN KEY (`from_mp_id`) REFERENCES `mst_plant` (`mp_id`);
ALTER TABLE `info_asset_transfer` ADD CONSTRAINT `fk_iat_from_location_id` FOREIGN KEY (`from_ml_id`) REFERENCES `mst_location` (`ml_id`);
ALTER TABLE `info_asset_transfer` ADD CONSTRAINT `fk_iat_from_line_id` FOREIGN KEY (`from_mli_id`) REFERENCES `mst_line` (`mli_id`);
ALTER TABLE `info_asset_transfer` ADD CONSTRAINT `fk_iat_from_cost_center_id` FOREIGN KEY (`from_mcc_id`) REFERENCES `mst_cost_center` (`mcc_id`);
ALTER TABLE `info_asset_transfer` ADD CONSTRAINT `fk_iat_to_custodian_id` FOREIGN KEY (`to_su_id`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_transfer` ADD CONSTRAINT `fk_iat_to_department_id` FOREIGN KEY (`to_sd_id`) REFERENCES `sys_department` (`sd_id`);
ALTER TABLE `info_asset_transfer` ADD CONSTRAINT `fk_iat_to_plant_id` FOREIGN KEY (`to_mp_id`) REFERENCES `mst_plant` (`mp_id`);
ALTER TABLE `info_asset_transfer` ADD CONSTRAINT `fk_iat_to_location_id` FOREIGN KEY (`to_ml_id`) REFERENCES `mst_location` (`ml_id`);
ALTER TABLE `info_asset_transfer` ADD CONSTRAINT `fk_iat_to_line_id` FOREIGN KEY (`to_mli_id`) REFERENCES `mst_line` (`mli_id`);
ALTER TABLE `info_asset_transfer` ADD CONSTRAINT `fk_iat_to_cost_center_id` FOREIGN KEY (`to_mcc_id`) REFERENCES `mst_cost_center` (`mcc_id`);
ALTER TABLE `info_asset_transfer` ADD CONSTRAINT `fk_iat_created_by` FOREIGN KEY (`iat_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_transfer` ADD CONSTRAINT `fk_iat_updated_by` FOREIGN KEY (`iat_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_work` ADD CONSTRAINT `fk_iaw_acquisition_id` FOREIGN KEY (`iaa_id`) REFERENCES `info_asset_acquisition` (`iaa_id`);
ALTER TABLE `info_asset_work` ADD CONSTRAINT `fk_iaw_source_asset_id` FOREIGN KEY (`source_ma_id`) REFERENCES `mst_asset` (`ma_id`);
ALTER TABLE `info_asset_work` ADD CONSTRAINT `fk_iaw_result_asset_id` FOREIGN KEY (`result_ma_id`) REFERENCES `mst_asset` (`ma_id`);
ALTER TABLE `info_asset_work` ADD CONSTRAINT `fk_iaw_vendor_id` FOREIGN KEY (`mv_id`) REFERENCES `mst_vendor` (`mv_id`);
ALTER TABLE `info_asset_work` ADD CONSTRAINT `fk_iaw_created_by` FOREIGN KEY (`iaw_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_work` ADD CONSTRAINT `fk_iaw_updated_by` FOREIGN KEY (`iaw_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_sale_proposal` ADD CONSTRAINT `fk_isp_document_id` FOREIGN KEY (`idoc_id`) REFERENCES `info_document` (`idoc_id`);
ALTER TABLE `info_sale_proposal` ADD CONSTRAINT `fk_isp_created_by` FOREIGN KEY (`isp_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_sale_proposal` ADD CONSTRAINT `fk_isp_updated_by` FOREIGN KEY (`isp_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_tax_invoice` ADD CONSTRAINT `fk_iti_document_id` FOREIGN KEY (`idoc_id`) REFERENCES `info_document` (`idoc_id`);
ALTER TABLE `info_tax_invoice` ADD CONSTRAINT `fk_iti_sale_proposal_id` FOREIGN KEY (`isp_id`) REFERENCES `info_sale_proposal` (`isp_id`);
ALTER TABLE `info_tax_invoice` ADD CONSTRAINT `fk_iti_created_by` FOREIGN KEY (`iti_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_tax_invoice` ADD CONSTRAINT `fk_iti_updated_by` FOREIGN KEY (`iti_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_sale_item` ADD CONSTRAINT `fk_isi_sale_proposal_id` FOREIGN KEY (`isp_id`) REFERENCES `info_sale_proposal` (`isp_id`);
ALTER TABLE `info_sale_item` ADD CONSTRAINT `fk_isi_tax_invoice_id` FOREIGN KEY (`iti_id`) REFERENCES `info_tax_invoice` (`iti_id`);
ALTER TABLE `info_sale_item` ADD CONSTRAINT `fk_isi_asset_id` FOREIGN KEY (`ma_id`) REFERENCES `mst_asset` (`ma_id`);
ALTER TABLE `info_sale_item` ADD CONSTRAINT `fk_isi_created_by` FOREIGN KEY (`isi_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_sale_item` ADD CONSTRAINT `fk_isi_updated_by` FOREIGN KEY (`isi_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_disposal` ADD CONSTRAINT `fk_iads_document_id` FOREIGN KEY (`idoc_id`) REFERENCES `info_document` (`idoc_id`);
ALTER TABLE `info_asset_disposal` ADD CONSTRAINT `fk_iads_asset_id` FOREIGN KEY (`ma_id`) REFERENCES `mst_asset` (`ma_id`);
ALTER TABLE `info_asset_disposal` ADD CONSTRAINT `fk_iads_sale_item_id` FOREIGN KEY (`isi_id`) REFERENCES `info_sale_item` (`isi_id`);
ALTER TABLE `info_asset_disposal` ADD CONSTRAINT `fk_iads_verified_by` FOREIGN KEY (`su_id`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_disposal` ADD CONSTRAINT `fk_iads_created_by` FOREIGN KEY (`iads_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_disposal` ADD CONSTRAINT `fk_iads_updated_by` FOREIGN KEY (`iads_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_issue` ADD CONSTRAINT `fk_iais_document_id` FOREIGN KEY (`idoc_id`) REFERENCES `info_document` (`idoc_id`);
ALTER TABLE `info_asset_issue` ADD CONSTRAINT `fk_iais_asset_id` FOREIGN KEY (`ma_id`) REFERENCES `mst_asset` (`ma_id`);
ALTER TABLE `info_asset_issue` ADD CONSTRAINT `fk_iais_reporter_id` FOREIGN KEY (`su_id`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_issue` ADD CONSTRAINT `fk_iais_created_by` FOREIGN KEY (`iais_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_issue` ADD CONSTRAINT `fk_iais_updated_by` FOREIGN KEY (`iais_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_notification` ADD CONSTRAINT `fk_inot_user_id` FOREIGN KEY (`su_id`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_notification` ADD CONSTRAINT `fk_inot_document_id` FOREIGN KEY (`idoc_id`) REFERENCES `info_document` (`idoc_id`);
ALTER TABLE `info_notification` ADD CONSTRAINT `fk_inot_asset_id` FOREIGN KEY (`ma_id`) REFERENCES `mst_asset` (`ma_id`);
ALTER TABLE `info_notification` ADD CONSTRAINT `fk_inot_created_by` FOREIGN KEY (`inot_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_notification` ADD CONSTRAINT `fk_inot_updated_by` FOREIGN KEY (`inot_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `log_approval_action` ADD CONSTRAINT `fk_laa_step_id` FOREIGN KEY (`ias_id`) REFERENCES `info_approval_step` (`ias_id`);
ALTER TABLE `log_approval_action` ADD CONSTRAINT `fk_laa_actor_id` FOREIGN KEY (`su_id`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `log_asset_event` ADD CONSTRAINT `fk_lae_asset_id` FOREIGN KEY (`ma_id`) REFERENCES `mst_asset` (`ma_id`);
ALTER TABLE `log_asset_event` ADD CONSTRAINT `fk_lae_main_asset_id` FOREIGN KEY (`main_ma_id`) REFERENCES `mst_asset` (`ma_id`);
ALTER TABLE `log_asset_event` ADD CONSTRAINT `fk_lae_document_id` FOREIGN KEY (`idoc_id`) REFERENCES `info_document` (`idoc_id`);
ALTER TABLE `log_asset_event` ADD CONSTRAINT `fk_lae_acquisition_id` FOREIGN KEY (`iaa_id`) REFERENCES `info_asset_acquisition` (`iaa_id`);
ALTER TABLE `log_asset_event` ADD CONSTRAINT `fk_lae_actor_id` FOREIGN KEY (`su_id`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `log_audit` ADD CONSTRAINT `fk_la_actor_id` FOREIGN KEY (`su_id`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `log_audit_change` ADD CONSTRAINT `fk_lac_audit_id` FOREIGN KEY (`la_id`) REFERENCES `log_audit` (`la_id`);
ALTER TABLE `log_receiving_validation` ADD CONSTRAINT `fk_lrv_po_reference_id` FOREIGN KEY (`po_imdr_id`) REFERENCES `info_mis_document_reference` (`imdr_id`);
ALTER TABLE `log_receiving_validation` ADD CONSTRAINT `fk_lrv_acquisition_id` FOREIGN KEY (`iaa_id`) REFERENCES `info_asset_acquisition` (`iaa_id`);
ALTER TABLE `log_receiving_validation` ADD CONSTRAINT `fk_lrv_gr_reference_id` FOREIGN KEY (`gr_imdr_id`) REFERENCES `info_mis_document_reference` (`imdr_id`);
ALTER TABLE `log_depreciation_period` ADD CONSTRAINT `fk_ldp_asset_id` FOREIGN KEY (`ma_id`) REFERENCES `mst_asset` (`ma_id`);
ALTER TABLE `log_depreciation_period` ADD CONSTRAINT `fk_ldp_supersedes_id` FOREIGN KEY (`supersedes_ldp_id`) REFERENCES `log_depreciation_period` (`ldp_id`);
ALTER TABLE `log_depreciation_period` ADD CONSTRAINT `fk_ldp_disposal_id` FOREIGN KEY (`iads_id`) REFERENCES `info_asset_disposal` (`iads_id`);
ALTER TABLE `log_depreciation_period` ADD CONSTRAINT `fk_ldp_actor_id` FOREIGN KEY (`su_id`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `log_integration_message` ADD CONSTRAINT `fk_lim_document_id` FOREIGN KEY (`idoc_id`) REFERENCES `info_document` (`idoc_id`);
ALTER TABLE `info_integration_inbox` ADD CONSTRAINT `fk_iii_created_by` FOREIGN KEY (`iii_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_integration_inbox` ADD CONSTRAINT `fk_iii_updated_by` FOREIGN KEY (`iii_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_integration_outbox` ADD CONSTRAINT `fk_iio_document_id` FOREIGN KEY (`idoc_id`) REFERENCES `info_document` (`idoc_id`);
ALTER TABLE `info_integration_outbox` ADD CONSTRAINT `fk_iio_created_by` FOREIGN KEY (`iio_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_integration_outbox` ADD CONSTRAINT `fk_iio_updated_by` FOREIGN KEY (`iio_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_mis_document_reference` ADD CONSTRAINT `fk_imdr_po_reference_id` FOREIGN KEY (`po_imdr_id`) REFERENCES `info_mis_document_reference` (`imdr_id`);
ALTER TABLE `info_mis_document_reference` ADD CONSTRAINT `fk_imdr_vendor_id` FOREIGN KEY (`mv_id`) REFERENCES `mst_vendor` (`mv_id`);
ALTER TABLE `info_mis_document_reference` ADD CONSTRAINT `fk_imdr_file_id` FOREIGN KEY (`ifile_id`) REFERENCES `info_file` (`ifile_id`);
ALTER TABLE `info_mis_document_reference` ADD CONSTRAINT `fk_imdr_created_by` FOREIGN KEY (`imdr_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_mis_document_reference` ADD CONSTRAINT `fk_imdr_updated_by` FOREIGN KEY (`imdr_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_rfq_reference` ADD CONSTRAINT `fk_irfr_created_by` FOREIGN KEY (`irfr_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_rfq_reference` ADD CONSTRAINT `fk_irfr_updated_by` FOREIGN KEY (`irfr_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_acquisition` ADD CONSTRAINT `fk_iaa_proposal_reference_id` FOREIGN KEY (`imdr_id`) REFERENCES `info_mis_document_reference` (`imdr_id`);
ALTER TABLE `info_asset_acquisition` ADD CONSTRAINT `fk_iaa_selected_asset_id` FOREIGN KEY (`selected_ma_id`) REFERENCES `mst_asset` (`ma_id`);
ALTER TABLE `info_asset_acquisition` ADD CONSTRAINT `fk_iaa_asset_id` FOREIGN KEY (`ma_id`) REFERENCES `mst_asset` (`ma_id`);
ALTER TABLE `info_asset_acquisition` ADD CONSTRAINT `fk_iaa_project_id` FOREIGN KEY (`mprj_id`) REFERENCES `mst_project` (`mprj_id`);
ALTER TABLE `info_asset_acquisition` ADD CONSTRAINT `fk_iaa_account_id` FOREIGN KEY (`mac_id`) REFERENCES `mst_account` (`mac_id`);
ALTER TABLE `info_asset_acquisition` ADD CONSTRAINT `fk_iaa_created_by` FOREIGN KEY (`iaa_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_acquisition` ADD CONSTRAINT `fk_iaa_updated_by` FOREIGN KEY (`iaa_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_acquisition_cost` ADD CONSTRAINT `fk_iaac_acquisition_id` FOREIGN KEY (`iaa_id`) REFERENCES `info_asset_acquisition` (`iaa_id`);
ALTER TABLE `info_asset_acquisition_cost` ADD CONSTRAINT `fk_iaac_cost_type_id` FOREIGN KEY (`mct_id`) REFERENCES `mst_cost_type` (`mct_id`);
ALTER TABLE `info_asset_acquisition_cost` ADD CONSTRAINT `fk_iaac_account_id` FOREIGN KEY (`mac_id`) REFERENCES `mst_account` (`mac_id`);
ALTER TABLE `info_asset_acquisition_cost` ADD CONSTRAINT `fk_iaac_created_by` FOREIGN KEY (`iaac_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_acquisition_cost` ADD CONSTRAINT `fk_iaac_updated_by` FOREIGN KEY (`iaac_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_acquisition_document` ADD CONSTRAINT `fk_iaad_acquisition_id` FOREIGN KEY (`iaa_id`) REFERENCES `info_asset_acquisition` (`iaa_id`);
ALTER TABLE `info_asset_acquisition_document` ADD CONSTRAINT `fk_iaad_reference_id` FOREIGN KEY (`imdr_id`) REFERENCES `info_mis_document_reference` (`imdr_id`);
ALTER TABLE `info_asset_acquisition_document` ADD CONSTRAINT `fk_iaad_po_reference_id` FOREIGN KEY (`po_imdr_id`) REFERENCES `info_mis_document_reference` (`imdr_id`);
ALTER TABLE `info_asset_acquisition_document` ADD CONSTRAINT `fk_iaad_created_by` FOREIGN KEY (`iaad_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_acquisition_document` ADD CONSTRAINT `fk_iaad_updated_by` FOREIGN KEY (`iaad_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_spare_usage` ADD CONSTRAINT `fk_iasu_issue_reference_id` FOREIGN KEY (`imdr_id`) REFERENCES `info_mis_document_reference` (`imdr_id`);
ALTER TABLE `info_asset_spare_usage` ADD CONSTRAINT `fk_iasu_asset_id` FOREIGN KEY (`ma_id`) REFERENCES `mst_asset` (`ma_id`);
ALTER TABLE `info_asset_spare_usage` ADD CONSTRAINT `fk_iasu_part_id` FOREIGN KEY (`mpt_id`) REFERENCES `mst_part` (`mpt_id`);
ALTER TABLE `info_asset_spare_usage` ADD CONSTRAINT `fk_iasu_uom_id` FOREIGN KEY (`mu_id`) REFERENCES `mst_uom` (`mu_id`);
ALTER TABLE `info_asset_spare_usage` ADD CONSTRAINT `fk_iasu_created_by` FOREIGN KEY (`iasu_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_spare_usage` ADD CONSTRAINT `fk_iasu_updated_by` FOREIGN KEY (`iasu_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_users` ADD CONSTRAINT `fk_su_permission_group_id` FOREIGN KEY (`spg_id`) REFERENCES `sys_permission_group` (`spg_id`);
ALTER TABLE `sys_users` ADD CONSTRAINT `fk_su_department_id` FOREIGN KEY (`sd_id`) REFERENCES `sys_department` (`sd_id`);
ALTER TABLE `sys_users` ADD CONSTRAINT `fk_su_created_by` FOREIGN KEY (`su_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_users` ADD CONSTRAINT `fk_su_updated_by` FOREIGN KEY (`su_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_submenu` ADD CONSTRAINT `fk_ss_menu_id` FOREIGN KEY (`sm_id`) REFERENCES `sys_menu` (`sm_id`);
ALTER TABLE `sys_submenu` ADD CONSTRAINT `fk_ss_created_by` FOREIGN KEY (`ss_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_submenu` ADD CONSTRAINT `fk_ss_updated_by` FOREIGN KEY (`ss_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_permission_group` ADD CONSTRAINT `fk_spg_created_by` FOREIGN KEY (`spg_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_permission_group` ADD CONSTRAINT `fk_spg_updated_by` FOREIGN KEY (`spg_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_permission_detail` ADD CONSTRAINT `fk_spd_permission_group_id` FOREIGN KEY (`spg_id`) REFERENCES `sys_permission_group` (`spg_id`);
ALTER TABLE `sys_permission_detail` ADD CONSTRAINT `fk_spd_submenu_id` FOREIGN KEY (`ss_id`) REFERENCES `sys_submenu` (`ss_id`);
ALTER TABLE `sys_permission_detail` ADD CONSTRAINT `fk_spd_created_by` FOREIGN KEY (`spd_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_permission_detail` ADD CONSTRAINT `fk_spd_updated_by` FOREIGN KEY (`spd_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_department` ADD CONSTRAINT `fk_sd_created_by` FOREIGN KEY (`sd_created_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `sys_department` ADD CONSTRAINT `fk_sd_updated_by` FOREIGN KEY (`sd_updated_by`) REFERENCES `sys_users` (`su_id`);
ALTER TABLE `info_asset_acquisition_document` ADD CONSTRAINT `fk_same_po_1` FOREIGN KEY (`imdr_id`, `po_imdr_id`) REFERENCES `info_mis_document_reference` (`imdr_id`, `po_imdr_id`);

-- Append-only guards: application role must also have INSERT/SELECT only on log_*.
DELIMITER $$
CREATE TRIGGER `tr_laa_update` BEFORE UPDATE ON `log_approval_action` FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Append-only log: append a new or reversing entry';
END$$
CREATE TRIGGER `tr_laa_delete` BEFORE DELETE ON `log_approval_action` FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Append-only log: append a new or reversing entry';
END$$
CREATE TRIGGER `tr_lae_update` BEFORE UPDATE ON `log_asset_event` FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Append-only log: append a new or reversing entry';
END$$
CREATE TRIGGER `tr_lae_delete` BEFORE DELETE ON `log_asset_event` FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Append-only log: append a new or reversing entry';
END$$
CREATE TRIGGER `tr_la_update` BEFORE UPDATE ON `log_audit` FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Append-only log: append a new or reversing entry';
END$$
CREATE TRIGGER `tr_la_delete` BEFORE DELETE ON `log_audit` FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Append-only log: append a new or reversing entry';
END$$
CREATE TRIGGER `tr_lac_update` BEFORE UPDATE ON `log_audit_change` FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Append-only log: append a new or reversing entry';
END$$
CREATE TRIGGER `tr_lac_delete` BEFORE DELETE ON `log_audit_change` FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Append-only log: append a new or reversing entry';
END$$
CREATE TRIGGER `tr_lrv_update` BEFORE UPDATE ON `log_receiving_validation` FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Append-only log: append a new or reversing entry';
END$$
CREATE TRIGGER `tr_lrv_delete` BEFORE DELETE ON `log_receiving_validation` FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Append-only log: append a new or reversing entry';
END$$
CREATE TRIGGER `tr_ldp_update` BEFORE UPDATE ON `log_depreciation_period` FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Append-only log: append a new or reversing entry';
END$$
CREATE TRIGGER `tr_ldp_delete` BEFORE DELETE ON `log_depreciation_period` FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Append-only log: append a new or reversing entry';
END$$
CREATE TRIGGER `tr_lim_update` BEFORE UPDATE ON `log_integration_message` FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Append-only log: append a new or reversing entry';
END$$
CREATE TRIGGER `tr_lim_delete` BEFORE DELETE ON `log_integration_message` FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Append-only log: append a new or reversing entry';
END$$
DELIMITER ;
