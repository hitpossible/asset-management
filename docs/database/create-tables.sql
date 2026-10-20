-- MySQL 8.0 DDL generated from tbkk-asset-database.drawio
-- Columns and primary keys only; no secondary indexes, UNIQUE constraints, or foreign keys.

CREATE TABLE `sys_menu` (
  `sm_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sm_name` VARCHAR(120) NOT NULL,
  `sm_icon` VARCHAR(80) NULL,
  `sm_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `sm_status` BOOLEAN NOT NULL DEFAULT '1',
  `sm_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `sm_created_by` BIGINT UNSIGNED NULL,
  `sm_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `sm_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`sm_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `sys_setting` (
  `sst_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sst_key` VARCHAR(100) NOT NULL,
  `sst_value` JSON NOT NULL,
  `sst_description` VARCHAR(255) NULL,
  `sst_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `sst_created_by` BIGINT UNSIGNED NULL,
  `sst_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `sst_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`sst_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `sys_number_sequence` (
  `sns_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sns_scope` VARCHAR(150) NOT NULL,
  `sns_last_value` BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `sns_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `sns_created_by` BIGINT UNSIGNED NULL,
  `sns_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `sns_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`sns_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `sys_workflow` (
  `sw_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sw_code` VARCHAR(80) NOT NULL,
  `sw_version` INT UNSIGNED NOT NULL DEFAULT 1,
  `sw_name` VARCHAR(255) NOT NULL,
  `sw_process` VARCHAR(80) NOT NULL,
  `sw_is_active` BOOLEAN NOT NULL DEFAULT 1,
  `sw_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `sw_created_by` BIGINT UNSIGNED NULL,
  `sw_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `sw_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`sw_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `sys_workflow_step` (
  `sws_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sw_id` BIGINT UNSIGNED NOT NULL,
  `sws_sequence` INT UNSIGNED NOT NULL,
  `sws_code` VARCHAR(80) NOT NULL,
  `sws_name` VARCHAR(255) NOT NULL,
  `sws_action` ENUM('APPROVE','REVIEW','ACKNOWLEDGE') NOT NULL,
  `sws_assignee_type` ENUM('USER','ROLE','DYNAMIC') NOT NULL,
  `su_id` BIGINT UNSIGNED NULL,
  `spg_id` BIGINT UNSIGNED NULL,
  `sws_resolver` VARCHAR(100) NULL,
  `sws_is_required` BOOLEAN NOT NULL DEFAULT 1,
  `sws_allow_return` BOOLEAN NOT NULL DEFAULT 1,
  `sws_allow_reject` BOOLEAN NOT NULL DEFAULT 1,
  `sws_requires_dp_date` BOOLEAN NOT NULL DEFAULT 0,
  `sws_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `sws_created_by` BIGINT UNSIGNED NULL,
  `sws_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `sws_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`sws_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `sys_workflow_assignment` (
  `swa_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `swa_process` VARCHAR(80) NOT NULL,
  `sw_id` BIGINT UNSIGNED NOT NULL,
  `swa_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `swa_created_by` BIGINT UNSIGNED NULL,
  `swa_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `swa_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`swa_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `sys_responsibility` (
  `sres_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sd_id` BIGINT UNSIGNED NOT NULL,
  `sres_duty` VARCHAR(80) NOT NULL,
  `su_id` BIGINT UNSIGNED NOT NULL,
  `sres_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `sres_created_by` BIGINT UNSIGNED NULL,
  `sres_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `sres_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`sres_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `sys_users` (
  `su_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `spg_id` BIGINT UNSIGNED NOT NULL,
  `su_username` VARCHAR(100) NOT NULL,
  `su_employee_code` VARCHAR(80) NOT NULL,
  `su_password` VARCHAR(255) NOT NULL,
  `su_firstname` VARCHAR(120) NOT NULL,
  `su_lastname` VARCHAR(120) NOT NULL,
  `su_email` VARCHAR(255) NOT NULL,
  `sd_id` BIGINT UNSIGNED NOT NULL,
  `su_sign_path` VARCHAR(500) NULL,
  `su_status` BOOLEAN NOT NULL DEFAULT '1',
  `su_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `su_created_by` BIGINT UNSIGNED NULL,
  `su_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `su_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`su_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `sys_submenu` (
  `ss_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sm_id` BIGINT UNSIGNED NOT NULL,
  `ss_name` VARCHAR(160) NOT NULL,
  `ss_link` VARCHAR(255) NOT NULL,
  `ss_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `ss_status` BOOLEAN NOT NULL DEFAULT '1',
  `ss_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ss_created_by` BIGINT UNSIGNED NULL,
  `ss_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `ss_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`ss_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `sys_permission_group` (
  `spg_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `spg_name` VARCHAR(120) NOT NULL,
  `spg_status` BOOLEAN NOT NULL DEFAULT '1',
  `spg_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `spg_created_by` BIGINT UNSIGNED NULL,
  `spg_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `spg_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`spg_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `sys_permission_detail` (
  `spd_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `spg_id` BIGINT UNSIGNED NOT NULL,
  `ss_id` BIGINT UNSIGNED NOT NULL,
  `spd_order` INT UNSIGNED NOT NULL DEFAULT 0,
  `spd_status` BOOLEAN NOT NULL DEFAULT '1',
  `spd_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `spd_created_by` BIGINT UNSIGNED NULL,
  `spd_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `spd_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`spd_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `sys_department` (
  `sd_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sd_plant_cd` VARCHAR(40) NOT NULL,
  `sd_code` VARCHAR(80) NOT NULL,
  `sd_name` VARCHAR(160) NOT NULL,
  `sd_aname` VARCHAR(160) NULL,
  `sd_email` VARCHAR(255) NULL,
  `sd_status` BOOLEAN NOT NULL DEFAULT '1',
  `sd_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `sd_created_by` BIGINT UNSIGNED NULL,
  `sd_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `sd_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`sd_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `mst_plant` (
  `mp_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `mp_code` VARCHAR(80) NOT NULL,
  `mp_name` VARCHAR(200) NOT NULL,
  `mp_is_active` BOOLEAN NOT NULL DEFAULT 1,
  `mp_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `mp_created_by` BIGINT UNSIGNED NULL,
  `mp_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `mp_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`mp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `mst_location` (
  `ml_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ml_code` VARCHAR(80) NOT NULL,
  `ml_name` VARCHAR(200) NOT NULL,
  `mp_id` BIGINT UNSIGNED NOT NULL,
  `ml_is_active` BOOLEAN NOT NULL DEFAULT 1,
  `ml_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ml_created_by` BIGINT UNSIGNED NULL,
  `ml_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `ml_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`ml_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `mst_line` (
  `mli_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `mli_code` VARCHAR(80) NOT NULL,
  `mli_name` VARCHAR(200) NOT NULL,
  `ml_id` BIGINT UNSIGNED NOT NULL,
  `mli_is_active` BOOLEAN NOT NULL DEFAULT 1,
  `mli_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `mli_created_by` BIGINT UNSIGNED NULL,
  `mli_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `mli_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`mli_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `mst_cost_center` (
  `mcc_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `mcc_code` VARCHAR(80) NOT NULL,
  `mcc_name` VARCHAR(200) NOT NULL,
  `sd_id` BIGINT UNSIGNED NULL,
  `mcc_is_active` BOOLEAN NOT NULL DEFAULT 1,
  `mcc_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `mcc_created_by` BIGINT UNSIGNED NULL,
  `mcc_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `mcc_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`mcc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `mst_project` (
  `mprj_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `mprj_code` VARCHAR(80) NOT NULL,
  `mprj_name` VARCHAR(200) NOT NULL,
  `mprj_detail` TEXT NULL,
  `sd_id` BIGINT UNSIGNED NULL,
  `mprj_is_active` BOOLEAN NOT NULL DEFAULT 1,
  `mprj_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `mprj_created_by` BIGINT UNSIGNED NULL,
  `mprj_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `mprj_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`mprj_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `mst_customer` (
  `mc_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `mc_code` VARCHAR(80) NOT NULL,
  `mc_name` VARCHAR(200) NOT NULL,
  `mc_tax_id` VARCHAR(40) NULL,
  `mc_is_active` BOOLEAN NOT NULL DEFAULT 1,
  `mc_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `mc_created_by` BIGINT UNSIGNED NULL,
  `mc_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `mc_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`mc_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `mst_vendor` (
  `mv_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `mv_code` VARCHAR(80) NOT NULL,
  `mv_name` VARCHAR(200) NOT NULL,
  `mv_tax_id` VARCHAR(40) NULL,
  `mv_contact` VARCHAR(255) NULL,
  `mv_address` TEXT NULL,
  `mv_payment_terms` VARCHAR(255) NULL,
  `mv_is_active` BOOLEAN NOT NULL DEFAULT 1,
  `mv_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `mv_created_by` BIGINT UNSIGNED NULL,
  `mv_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `mv_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`mv_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `mst_asset_type` (
  `mat_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `mat_code` VARCHAR(80) NOT NULL,
  `mat_name` VARCHAR(200) NOT NULL,
  `mat_useful_life_years` DECIMAL(7,2) NOT NULL,
  `mat_show_technical_fields` BOOLEAN NOT NULL DEFAULT 0,
  `mat_is_active` BOOLEAN NOT NULL DEFAULT 1,
  `mat_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `mat_created_by` BIGINT UNSIGNED NULL,
  `mat_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `mat_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`mat_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `mst_account` (
  `mac_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `mac_code` VARCHAR(80) NOT NULL,
  `mac_name` VARCHAR(200) NOT NULL,
  `mac_is_active` BOOLEAN NOT NULL DEFAULT 1,
  `mac_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `mac_created_by` BIGINT UNSIGNED NULL,
  `mac_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `mac_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`mac_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `mst_cost_type` (
  `mct_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `mct_code` VARCHAR(80) NOT NULL,
  `mct_name` VARCHAR(200) NOT NULL,
  `mct_is_active` BOOLEAN NOT NULL DEFAULT 1,
  `mct_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `mct_created_by` BIGINT UNSIGNED NULL,
  `mct_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `mct_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`mct_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `mst_uom` (
  `mu_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `mu_code` VARCHAR(80) NOT NULL,
  `mu_name` VARCHAR(200) NOT NULL,
  `mu_is_active` BOOLEAN NOT NULL DEFAULT 1,
  `mu_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `mu_created_by` BIGINT UNSIGNED NULL,
  `mu_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `mu_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`mu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `mst_part` (
  `mpt_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `mpt_code` VARCHAR(80) NOT NULL,
  `mpt_name` VARCHAR(200) NOT NULL,
  `mpt_model` VARCHAR(255) NULL,
  `mpt_part_no` VARCHAR(255) NULL,
  `mu_id` BIGINT UNSIGNED NOT NULL,
  `mpt_is_active` BOOLEAN NOT NULL DEFAULT 1,
  `mpt_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `mpt_created_by` BIGINT UNSIGNED NULL,
  `mpt_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `mpt_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`mpt_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `mst_asset` (
  `ma_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ma_temporary_ref` VARCHAR(100) NOT NULL,
  `ma_no` VARCHAR(100) NULL,
  `ma_name` VARCHAR(255) NOT NULL,
  `ma_ownership` ENUM('COMPANY','CUSTOMER') NOT NULL DEFAULT 'COMPANY',
  `mc_id` BIGINT UNSIGNED NULL,
  `ma_customer_name_snapshot` VARCHAR(255) NULL,
  `parent_ma_id` BIGINT UNSIGNED NULL,
  `source_ma_id` BIGINT UNSIGNED NULL,
  `ma_child_suffix` INT UNSIGNED NULL,
  `mat_id` BIGINT UNSIGNED NOT NULL,
  `mprj_id` BIGINT UNSIGNED NULL,
  `irfr_id` BIGINT UNSIGNED NULL,
  `ma_model` VARCHAR(255) NULL,
  `ma_part_no` VARCHAR(255) NULL,
  `su_id` BIGINT UNSIGNED NULL,
  `sd_id` BIGINT UNSIGNED NULL,
  `mp_id` BIGINT UNSIGNED NULL,
  `ml_id` BIGINT UNSIGNED NULL,
  `mli_id` BIGINT UNSIGNED NULL,
  `mcc_id` BIGINT UNSIGNED NULL,
  `ma_area` VARCHAR(255) NULL,
  `ma_power` VARCHAR(255) NULL,
  `ma_power_unit` VARCHAR(30) NULL,
  `ma_target_sop` DATE NULL,
  `ma_confirmed_sop` DATE NULL,
  `ma_maker` VARCHAR(255) NULL,
  `ma_serial_no` VARCHAR(150) NULL,
  `ma_investment_no` VARCHAR(100) NULL,
  `ma_manufacturing_date` DATE NULL,
  `ma_registration_date` DATE NULL,
  `ma_acquisition_date` DATE NULL,
  `ma_warranty_until` DATE NULL,
  `ma_special_control` VARCHAR(80) NULL,
  `ma_condition` VARCHAR(80) NULL,
  `ma_status` ENUM('Draft','Purchasing','Waiting Delivery','Waiting Invoice','Waiting GR','Receiving Validation','Ready for Verification','Verification In Progress','Pending Asset Team Leader Approval','Pending Accounting Review','Pending Accounting Approval','Pending Activation Approval','Active','Returned for Correction','On Hold','Cancelled','Sold') NOT NULL DEFAULT 'Draft',
  `ma_activated_at` DATETIME(6) NULL,
  `ma_notes` TEXT NULL,
  `ma_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ma_created_by` BIGINT UNSIGNED NULL,
  `ma_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `ma_updated_by` BIGINT UNSIGNED NULL,
  `ma_area` VARCHAR(255) NULL,
  PRIMARY KEY (`ma_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `info_file` (
  `ifile_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ifile_storage_key` VARCHAR(500) NOT NULL,
  `ifile_original_name` VARCHAR(255) NOT NULL,
  `ifile_mime_type` VARCHAR(100) NOT NULL,
  `ifile_size_bytes` BIGINT UNSIGNED NOT NULL,
  `ifile_sha256` CHAR(64) NULL,
  `ifile_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ifile_created_by` BIGINT UNSIGNED NULL,
  `ifile_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `ifile_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`ifile_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `info_asset_file` (
  `iaf_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ma_id` BIGINT UNSIGNED NOT NULL,
  `ifile_id` BIGINT UNSIGNED NOT NULL,
  `iaf_purpose` VARCHAR(80) NOT NULL,
  `iaf_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `iaf_created_by` BIGINT UNSIGNED NULL,
  `iaf_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `iaf_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`iaf_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `info_asset_verification` (
  `iav_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ma_id` BIGINT UNSIGNED NOT NULL,
  `iav_revision` INT UNSIGNED NOT NULL,
  `iav_result` ENUM('PENDING','COMPLETE','MISMATCH') NOT NULL DEFAULT 'PENDING',
  `iav_confirmed_sop` DATE NULL,
  `iav_required_info_complete` BOOLEAN NOT NULL DEFAULT 0,
  `iav_special_plate_na` BOOLEAN NOT NULL DEFAULT 0,
  `iav_form_snapshot` JSON NULL,
  `iav_remark` TEXT NULL,
  `iav_submitted_at` DATETIME(6) NULL,
  `iav_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `iav_created_by` BIGINT UNSIGNED NULL,
  `iav_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `iav_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`iav_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `info_approval_request` (
  `iar_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sw_id` BIGINT UNSIGNED NOT NULL,
  `iar_attempt` INT UNSIGNED NOT NULL,
  `iar_workflow_name_snapshot` VARCHAR(255) NOT NULL,
  `iar_status` ENUM('PENDING','RETURNED','REJECTED','APPROVED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `iar_current_sequence` INT UNSIGNED NOT NULL DEFAULT 1,
  `iar_submitted_at` DATETIME(6) NOT NULL,
  `su_id` BIGINT UNSIGNED NOT NULL,
  `iar_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `iar_created_by` BIGINT UNSIGNED NULL,
  `iar_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `iar_updated_by` BIGINT UNSIGNED NULL,
  `sw_id` BIGINT UNSIGNED NOT NULL,
  `sw_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`iar_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `info_approval_step` (
  `ias_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `iar_id` BIGINT UNSIGNED NOT NULL,
  `sws_id` BIGINT UNSIGNED NOT NULL,
  `ias_sequence` INT UNSIGNED NOT NULL,
  `ias_name_snapshot` VARCHAR(255) NOT NULL,
  `ias_action` ENUM('APPROVE','REVIEW','ACKNOWLEDGE') NOT NULL,
  `su_id` BIGINT UNSIGNED NULL,
  `spg_id` BIGINT UNSIGNED NULL,
  `ias_assignee_snapshot` JSON NOT NULL,
  `ias_is_required` BOOLEAN NOT NULL DEFAULT 1,
  `ias_allow_return` BOOLEAN NOT NULL DEFAULT 1,
  `ias_allow_reject` BOOLEAN NOT NULL DEFAULT 1,
  `ias_requires_dp_date` BOOLEAN NOT NULL DEFAULT 0,
  `ias_status` ENUM('WAITING','PENDING','APPROVED','REVIEWED','ACKNOWLEDGED','RETURNED','REJECTED','SKIPPED') NOT NULL DEFAULT 'WAITING',
  `ias_decided_at` DATETIME(6) NULL,
  `ias_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ias_created_by` BIGINT UNSIGNED NULL,
  `ias_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `ias_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`ias_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `info_asset_depreciation` (
  `iad_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ma_id` BIGINT UNSIGNED NOT NULL,
  `iad_acquisition_value` DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  `iad_useful_life_months` DECIMAL(9,2) NOT NULL,
  `iad_start_date` DATE NOT NULL,
  `iad_stop_date` DATE NULL,
  `iad_rounding` ENUM('ROUND_CUMULATIVE_2DP') NOT NULL DEFAULT 'ROUND_CUMULATIVE_2DP',
  `iad_value_source` VARCHAR(100) NOT NULL,
  `iad_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `iad_created_by` BIGINT UNSIGNED NULL,
  `iad_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `iad_updated_by` BIGINT UNSIGNED NULL,
  `iad_row_version` INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`iad_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `info_asset_transfer` (
  `iat_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ma_id` BIGINT UNSIGNED NOT NULL,
  `iat_effective_on` DATE NOT NULL,
  `from_su_id` BIGINT UNSIGNED NULL,
  `from_sd_id` BIGINT UNSIGNED NULL,
  `from_mp_id` BIGINT UNSIGNED NULL,
  `from_ml_id` BIGINT UNSIGNED NULL,
  `from_mli_id` BIGINT UNSIGNED NULL,
  `from_mcc_id` BIGINT UNSIGNED NULL,
  `iat_from_area` VARCHAR(255) NULL,
  `iat_from_snapshot` JSON NOT NULL,
  `to_su_id` BIGINT UNSIGNED NULL,
  `to_sd_id` BIGINT UNSIGNED NULL,
  `to_mp_id` BIGINT UNSIGNED NULL,
  `to_ml_id` BIGINT UNSIGNED NULL,
  `to_mli_id` BIGINT UNSIGNED NULL,
  `to_mcc_id` BIGINT UNSIGNED NULL,
  `iat_to_area` VARCHAR(255) NULL,
  `iat_to_snapshot` JSON NOT NULL,
  `iat_completed_at` DATETIME(6) NULL,
  `iat_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `iat_created_by` BIGINT UNSIGNED NULL,
  `iat_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `iat_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`iat_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `info_asset_disposal` (
  `iads_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ma_id` BIGINT UNSIGNED NOT NULL,
  `isi_id` BIGINT UNSIGNED NOT NULL,
  `iads_buyer_snapshot` VARCHAR(255) NOT NULL,
  `iads_sale_proposal_no_snapshot` VARCHAR(100) NOT NULL,
  `iads_tax_invoice_no_snapshot` VARCHAR(100) NOT NULL,
  `su_id` BIGINT UNSIGNED NOT NULL,
  `iads_verified_at` DATETIME(6) NOT NULL,
  `iads_sold_on` DATE NOT NULL,
  `iads_final_month_convention` ENUM('INCLUDE_SALE_MONTH','EXCLUDE_SALE_MONTH') NOT NULL,
  `iads_depreciation_stop_date` DATE NOT NULL,
  `iads_sale_amount` DECIMAL(19,2) NULL,
  `iads_acquisition_value_snapshot` DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  `iads_accumulated_dp_snapshot` DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  `iads_net_book_value_snapshot` DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  `iads_useful_life_months_snapshot` DECIMAL(9,2) NOT NULL,
  `iads_financial_snapshot` JSON NOT NULL,
  `iads_assignment_snapshot` JSON NOT NULL,
  `iads_completed_at` DATETIME(6) NOT NULL,
  `iads_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `iads_created_by` BIGINT UNSIGNED NULL,
  `iads_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `iads_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`iads_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `info_sale_proposal` (
  `isp_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `isp_buyer_name` VARCHAR(255) NOT NULL,
  `isp_buyer_detail` JSON NULL,
  `isp_approved_at` DATETIME(6) NOT NULL,
  `isp_external_status` VARCHAR(80) NOT NULL,
  `isp_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `isp_created_by` BIGINT UNSIGNED NULL,
  `isp_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `isp_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`isp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `info_tax_invoice` (
  `iti_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `isp_id` BIGINT UNSIGNED NOT NULL,
  `iti_issued_on` DATE NOT NULL,
  `iti_buyer_name_snapshot` VARCHAR(255) NOT NULL,
  `iti_amount_before_vat` DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  `iti_vat_amount` DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  `iti_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `iti_created_by` BIGINT UNSIGNED NULL,
  `iti_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `iti_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`iti_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `info_sale_item` (
  `isi_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `isp_id` BIGINT UNSIGNED NOT NULL,
  `iti_id` BIGINT UNSIGNED NULL,
  `ma_id` BIGINT UNSIGNED NOT NULL,
  `isi_allocated_sale_amount` DECIMAL(19,2) NULL,
  `isi_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `isi_created_by` BIGINT UNSIGNED NULL,
  `isi_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `isi_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`isi_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `info_notification` (
  `inot_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `su_id` BIGINT UNSIGNED NOT NULL,
  `ma_id` BIGINT UNSIGNED NULL,
  `inot_message` VARCHAR(255) NOT NULL,
  `inot_read_at` DATETIME(6) NULL,
  `inot_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `inot_created_by` BIGINT UNSIGNED NULL,
  `inot_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `inot_updated_by` BIGINT UNSIGNED NULL,
  PRIMARY KEY (`inot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `log_approval_action` (
  `laa_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ias_id` BIGINT UNSIGNED NOT NULL,
  `su_id` BIGINT UNSIGNED NOT NULL,
  `laa_actor_name_snapshot` VARCHAR(255) NOT NULL,
  `laa_action` ENUM('APPROVE','REVIEW','ACKNOWLEDGE','RETURN','REJECT','CANCEL','SUBMIT') NOT NULL,
  `laa_acted_at` DATETIME(6) NOT NULL,
  `laa_remark` TEXT NULL,
  `laa_context_snapshot` JSON NULL,
  `laa_recorded_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`laa_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `log_asset_event` (
  `lae_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ma_id` BIGINT UNSIGNED NOT NULL,
  `main_ma_id` BIGINT UNSIGNED NOT NULL,
  `lae_origin` ENUM('ASSET','MIS','ETAX','IMPORT') NOT NULL,
  `lae_event_type` VARCHAR(80) NOT NULL,
  `lae_from_status` VARCHAR(80) NULL,
  `lae_to_status` VARCHAR(80) NULL,
  `su_id` BIGINT UNSIGNED NULL,
  `lae_actor_name_snapshot` VARCHAR(255) NULL,
  `lae_occurred_at` DATETIME(6) NOT NULL,
  `lae_snapshot` JSON NOT NULL,
  `lae_recorded_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`lae_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `log_audit` (
  `la_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `su_id` BIGINT UNSIGNED NULL,
  `la_actor_name_snapshot` VARCHAR(255) NOT NULL,
  `la_module` VARCHAR(80) NOT NULL,
  `la_action` VARCHAR(80) NOT NULL,
  `la_record_table` VARCHAR(100) NOT NULL,
  `la_record_id` BIGINT UNSIGNED NOT NULL,
  `la_record_ref` VARCHAR(150) NOT NULL,
  `la_correlation_id` VARCHAR(100) NOT NULL,
  `la_occurred_at` DATETIME(6) NOT NULL,
  `la_recorded_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`la_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `log_audit_change` (
  `lac_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `la_id` BIGINT UNSIGNED NOT NULL,
  `lac_field_name` VARCHAR(100) NOT NULL,
  `lac_before_value` JSON NULL,
  `lac_after_value` JSON NULL,
  `lac_recorded_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`lac_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `log_receiving_validation` (
  `lrv_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `po_imdr_id` BIGINT UNSIGNED NOT NULL,
  `lrv_po_item_key` VARCHAR(150) NOT NULL,
  `iaa_id` BIGINT UNSIGNED NOT NULL,
  `gr_imdr_id` BIGINT UNSIGNED NULL,
  `lrv_result` VARCHAR(40) NOT NULL,
  `lrv_checks_snapshot` JSON NOT NULL,
  `lrv_idempotency_key` VARCHAR(150) NOT NULL,
  `lrv_recorded_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`lrv_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `log_depreciation_period` (
  `ldp_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ma_id` BIGINT UNSIGNED NOT NULL,
  `ldp_period_month` DATE NOT NULL,
  `ldp_revision` INT UNSIGNED NOT NULL DEFAULT 1,
  `supersedes_ldp_id` BIGINT UNSIGNED NULL,
  `ldp_opening_cost` DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  `ldp_opening_accumulated_dp` DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  `ldp_addition_cost` DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  `ldp_period_dp` DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  `ldp_disposal_cost` DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  `ldp_disposal_accumulated_dp` DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  `ldp_closing_cost` DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  `ldp_closing_accumulated_dp` DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  `ldp_closing_net_book_value` DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  `iads_id` BIGINT UNSIGNED NULL,
  `su_id` BIGINT UNSIGNED NULL,
  `ldp_recorded_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`ldp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `info_mis_document_reference` (
  `imdr_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `imdr_source` VARCHAR(80) NOT NULL,
  `imdr_external_key` VARCHAR(150) NOT NULL,
  `imdr_kind` ENUM('PROPOSAL','PR','PO','INVOICE','GR','DELIVERY','SPARE_ISSUE') NOT NULL,
  `imdr_no` VARCHAR(100) NOT NULL,
  `imdr_status` VARCHAR(80) NOT NULL,
  `po_imdr_id` BIGINT UNSIGNED NULL,
  `mv_id` BIGINT UNSIGNED NULL,
  `imdr_document_date` DATE NULL,
  `imdr_document_exists` BOOLEAN NOT NULL DEFAULT 0,
  `ifile_id` BIGINT UNSIGNED NULL,
  `imdr_external_url` VARCHAR(500) NULL,
  `imdr_external_version` VARCHAR(100) NULL,
  `imdr_synced_at` DATETIME(6) NOT NULL,
  `imdr_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `imdr_created_by` BIGINT UNSIGNED NULL,
  `imdr_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `imdr_updated_by` BIGINT UNSIGNED NULL,
  `imdr_row_version` INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`imdr_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `info_rfq_reference` (
  `irfr_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `irfr_source` VARCHAR(80) NOT NULL,
  `irfr_external_key` VARCHAR(150) NOT NULL,
  `irfr_item_key` VARCHAR(150) NOT NULL,
  `irfr_rfq_no` VARCHAR(100) NOT NULL,
  `irfr_name` VARCHAR(255) NOT NULL,
  `irfr_model` VARCHAR(255) NULL,
  `irfr_part_no` VARCHAR(255) NULL,
  `irfr_is_available` BOOLEAN NOT NULL DEFAULT 1,
  `irfr_synced_at` DATETIME(6) NOT NULL,
  `irfr_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `irfr_created_by` BIGINT UNSIGNED NULL,
  `irfr_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `irfr_updated_by` BIGINT UNSIGNED NULL,
  `irfr_row_version` INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`irfr_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `info_asset_acquisition` (
  `iaa_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `imdr_id` BIGINT UNSIGNED NOT NULL,
  `iaa_proposal_item_key` VARCHAR(150) NOT NULL,
  `selected_ma_id` BIGINT UNSIGNED NOT NULL,
  `ma_id` BIGINT UNSIGNED NULL,
  `mprj_id` BIGINT UNSIGNED NOT NULL,
  `iaa_ownership` ENUM('COMPANY','CUSTOMER') NOT NULL,
  `iaa_selection` ENUM('NEW','EXISTING') NOT NULL,
  `iaa_work_type` ENUM('ADDITION_SUB_ASSET','MODIFICATION','MAINTENANCE') NULL,
  `iaa_treatment` ENUM('NEW_ASSET','CAPITALIZED_SUB_ASSET','EXPENSE') NOT NULL,
  `iaa_title` VARCHAR(255) NOT NULL,
  `iaa_detail` TEXT NULL,
  `mac_id` BIGINT UNSIGNED NULL,
  `iaa_budget_type` ENUM('CAPITAL_EXPENDITURE','EXPENSE') NOT NULL,
  `iaa_base_amount` DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  `iaa_total_amount` DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  `iaa_currency` CHAR(3) NOT NULL DEFAULT 'THB',
  `iaa_status` ENUM('DRAFT','PURCHASING','WAITING_DELIVERY','RECEIVING','GR_RECEIVED','READY_FOR_VERIFICATION','ACTIVATING','COMPLETED','HOLD','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `iaa_external_version` VARCHAR(100) NULL,
  `iaa_synced_at` DATETIME(6) NOT NULL,
  `iaa_completed_at` DATETIME(6) NULL,
  `iaa_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `iaa_created_by` BIGINT UNSIGNED NULL,
  `iaa_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `iaa_updated_by` BIGINT UNSIGNED NULL,
  `iaa_row_version` INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`iaa_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `info_asset_acquisition_cost` (
  `iaac_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `iaa_id` BIGINT UNSIGNED NOT NULL,
  `iaac_external_cost_key` VARCHAR(150) NOT NULL,
  `mct_id` BIGINT UNSIGNED NOT NULL,
  `mac_id` BIGINT UNSIGNED NULL,
  `iaac_description` VARCHAR(255) NULL,
  `iaac_amount` DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  `iaac_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `iaac_created_by` BIGINT UNSIGNED NULL,
  `iaac_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `iaac_updated_by` BIGINT UNSIGNED NULL,
  `iaac_row_version` INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`iaac_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `info_asset_acquisition_document` (
  `iaad_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `iaa_id` BIGINT UNSIGNED NOT NULL,
  `imdr_id` BIGINT UNSIGNED NOT NULL,
  `iaad_document_item_key` VARCHAR(150) NOT NULL,
  `po_imdr_id` BIGINT UNSIGNED NULL,
  `iaad_po_item_key` VARCHAR(150) NOT NULL,
  `iaad_ordered_quantity` DECIMAL(18,4) NULL,
  `iaad_received_quantity` DECIMAL(18,4) NULL,
  `iaad_accepted_quantity` DECIMAL(18,4) NULL,
  `iaad_allocated_amount` DECIMAL(19,2) NULL,
  `iaad_purchasing_accepted` BOOLEAN NOT NULL DEFAULT 0,
  `iaad_owner_accepted` BOOLEAN NOT NULL DEFAULT 0,
  `iaad_accepted_at` DATETIME(6) NULL,
  `iaad_acceptance` ENUM('PENDING','ACCEPTED','FAILED') NOT NULL DEFAULT 'PENDING',
  `iaad_synced_at` DATETIME(6) NOT NULL,
  `iaad_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `iaad_created_by` BIGINT UNSIGNED NULL,
  `iaad_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `iaad_updated_by` BIGINT UNSIGNED NULL,
  `iaad_row_version` INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`iaad_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `info_receiving_validation` (
  `irv_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `imdr_id` BIGINT UNSIGNED NOT NULL,
  `irv_po_item_key` VARCHAR(150) NOT NULL,
  `irv_ordered_quantity` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `irv_accepted_quantity` DECIMAL(18,4) NOT NULL DEFAULT 0,
  `iaa_id` BIGINT UNSIGNED NOT NULL,
  `irv_po_valid` BOOLEAN NOT NULL DEFAULT 0,
  `irv_invoice_valid` BOOLEAN NOT NULL DEFAULT 0,
  `irv_gr_valid` BOOLEAN NOT NULL DEFAULT 0,
  `irv_purchasing_accepted` BOOLEAN NOT NULL DEFAULT 0,
  `irv_owner_accepted` BOOLEAN NOT NULL DEFAULT 0,
  `irv_result` ENUM('PENDING','PARTIAL','COMPLETE','HOLD') NOT NULL,
  `irv_validated_at` DATETIME(6) NULL,
  `irv_reason` TEXT NULL,
  `irv_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `irv_created_by` BIGINT UNSIGNED NULL,
  `irv_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `irv_updated_by` BIGINT UNSIGNED NULL,
  `irv_row_version` INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`irv_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `info_asset_work` (
  `iaw_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `iaa_id` BIGINT UNSIGNED NOT NULL,
  `source_ma_id` BIGINT UNSIGNED NOT NULL,
  `result_ma_id` BIGINT UNSIGNED NULL,
  `iaw_work_type` ENUM('ADDITION_SUB_ASSET','MODIFICATION','MAINTENANCE') NOT NULL,
  `iaw_treatment` ENUM('CAPITALIZED_SUB_ASSET','EXPENSE') NOT NULL,
  `iaw_status` ENUM('DRAFT','PROPOSAL','PURCHASING','GR_RECEIVED','HOLD','ACTIVATING','COMPLETED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `iaw_maintenance_type` VARCHAR(255) NULL,
  `mv_id` BIGINT UNSIGNED NULL,
  `iaw_responsible_team` VARCHAR(255) NULL,
  `iaw_result` TEXT NULL,
  `iaw_total_cost` DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  `iaw_completed_on` DATE NULL,
  `iaw_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `iaw_created_by` BIGINT UNSIGNED NULL,
  `iaw_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `iaw_updated_by` BIGINT UNSIGNED NULL,
  `iaw_row_version` INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`iaw_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `info_asset_spare_usage` (
  `iasu_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `iasu_source` VARCHAR(80) NOT NULL,
  `iasu_issue_key` VARCHAR(150) NOT NULL,
  `iasu_issue_item_key` VARCHAR(150) NOT NULL,
  `imdr_id` BIGINT UNSIGNED NOT NULL,
  `ma_id` BIGINT UNSIGNED NOT NULL,
  `mpt_id` BIGINT UNSIGNED NULL,
  `iasu_part_no_snapshot` VARCHAR(150) NOT NULL,
  `iasu_part_name_snapshot` VARCHAR(255) NOT NULL,
  `mu_id` BIGINT UNSIGNED NOT NULL,
  `iasu_quantity` DECIMAL(18,4) NOT NULL,
  `iasu_total_cost` DECIMAL(19,2) NOT NULL DEFAULT 0.00,
  `iasu_issued_on` DATE NOT NULL,
  `iasu_status` ENUM('COMPLETED','REVERSED') NOT NULL DEFAULT 'COMPLETED',
  `iasu_external_version` VARCHAR(100) NULL,
  `iasu_synced_at` DATETIME(6) NOT NULL,
  `iasu_created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `iasu_created_by` BIGINT UNSIGNED NULL,
  `iasu_updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `iasu_updated_by` BIGINT UNSIGNED NULL,
  `iasu_row_version` INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`iasu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
