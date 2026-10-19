-- Reference data only. Run ONCE after schema.sql in a fresh selected database.
-- No users, passwords, workflow chains, business transactions or audit history.
SET NAMES utf8mb4;
SET time_zone = '+00:00';
START TRANSACTION;
INSERT INTO mst_asset_group (mag_code,mag_name) VALUES
('ME','Machine and Equipment'),('MD','Mold and Die'),('IE','Inspection Equipment'),
('IT','Information Technology'),('OF','Office Equipment'),('OTHER','Other');
INSERT INTO mst_uom (mu_code,mu_name) VALUES ('ASSET','Asset'),('EA','Each'),('SET','Set'),('JOB','Job');
INSERT INTO mst_cost_type (mct_code,mct_name) VALUES
('INSTALLATION','Installation'),('DELIVERY','Delivery'),('OTHER','Other');
INSERT INTO mst_verification_check (mvc_code,mvc_name) VALUES
('IDENTITY','Asset identity confirmed'),('CLASS','Asset class confirmed'),
('MODEL','Model confirmed'),('CUSTODIAN','Custodian confirmed'),
('LOCATION','Location confirmed'),('COMPLETENESS','Required Asset information complete');

-- Asset Types/useful life, departments, customers, permission groups and submenu grants
-- must be configured from approved master data. No default access grants are assumed.
COMMIT;
