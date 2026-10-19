# ฐานข้อมูล TBKK Asset

แบบฐานข้อมูลนี้ดูแลเฉพาะ Asset Management บน MySQL 8.4 ขึ้นไป ให้ MIS เป็นเจ้าของ RFQ, Proposal, PR, PO, Invoice, Vendor Delivery, GR, ใบเบิกอะไหล่และคลัง ฝั่ง Asset เก็บข้อมูลอ้างอิงและสถานะที่จำเป็นต่อการตรวจรับ การตรวจ Asset การเปิดใช้งาน และประวัติตลอดอายุ Asset โดยไม่มีหน้าที่สร้างหรืออนุมัติธุรกรรมจัดซื้อ

แบบปัจจุบันมี **60 ตาราง** โดยให้ MIS เป็นเจ้าของธุรกรรมจัดซื้อ/คลัง และปรับแบบผู้ใช้ เมนู กลุ่มสิทธิ์ และหน่วยงานให้ตรงกับ ER ที่ยืนยันล่าสุด การปรับนี้แก้เฉพาะเอกสารและ DDL ยังไม่ได้แก้ React, localStorage หรือฐานข้อมูลแอปเดิม

แบ่งเป็น `sys_` 12 ตาราง, `mst_` 15 ตาราง, `info_` 26 ตาราง และ `log_` 7 ตาราง รวม 787 คอลัมน์ 224 Foreign Keys และ 14 triggers ป้องกันแก้/ลบ log

## ไฟล์ส่งมอบ

| ไฟล์ | เนื้อหา |
|---|---|
| `schema.sql` | DDL สำหรับ schema ใหม่ มี PK/FK/Unique/Index/Check และ append-only log triggers |
| `data-dictionary.md` และ `data-dictionary.csv` | ทุกคอลัมน์ ชนิดข้อมูล ค่าเริ่มต้น NULL ความหมายและ FK |
| `table-catalog.csv` | รายชื่อตารางทั้งหมดและตัวย่อ |
| `er-diagrams.md`, `er-overview.mmd`, `er-full.mmd` | ER ภาพรวมและรายละเอียดทุกตาราง |
| `tbkk-asset-database.drawio` | ER ที่แก้ไขได้ใน draw.io/diagrams.net มี 8 หน้า ครบทุกตารางและ Attribute |
| `generate_drawio.py`, `drawio-validation.json` | สร้างไฟล์ drawio จาก schema และตรวจความครบถ้วนของ XML/ตาราง/คอลัมน์/เส้น |
| `workflow-contracts.md` | กฎข้ามตาราง ขอบเขต integration และ transaction ที่ต้องพัฒนา |
| `reference-seed.sql` | ข้อมูลอ้างอิงเริ่มต้น ไม่มี user/password หรือประวัติจำลอง |
| `example-queries.sql` | Acquisition, เอกสารอ้างอิง, timeline, spare usage, audit และ DP report |
| `scope-changes.json` | รายชื่อตารางที่นำออกและเพิ่มจากแบบก่อน |
| `schema-definition.json` | นิยามต้นทางของ schema ฉบับ Asset |
| `generate_schema.py` | สร้าง DDL/Dictionary/ER จากนิยามเดียวกัน |
| `validate_schema.py`, `validation-report.md` | เครื่องมือตรวจและผลตรวจบน MySQL ทดสอบ |

## ประเภทตารางและชื่อคอลัมน์

ไฟล์ drawio เปิดด้วย File → Open From → Device ใน diagrams.net หรือแอป draw.io แล้วเลือกแท็บหน้าด้านล่าง เปิดมาเป็นหน้า System ที่แสดงตารางเต็ม ส่วน Overview อยู่แท็บสุดท้าย ใช้ตารางขาวดำกรอบสี่เหลี่ยม หัวชื่อตัวหนาจัดกลาง ช่อง PK/FK ทางซ้าย และชื่อ Attribute ทางขวา Primary Key ตัวหนาขีดเส้นใต้และมีเส้นแบ่งใต้แถว โดยไม่มีเส้นคั่นทุก Attribute ตามตัวอย่างที่ผู้ใช้ให้มา

ชนิดข้อมูล, NULL, default, ENUM, Unique และคำอธิบายยังอยู่ใน tooltip ของแต่ละช่อง ตารางอ้างอิงข้ามหน้าแสดงเฉพาะ PK และ tooltip บอกหน้าที่มีตารางเต็ม เส้น created_by/updated_by ถูกละออกเพื่อลดความหนาแน่น แต่ FK ยังแสดงใน Attribute เหล่านั้น ชื่อ Attribute ในแผนภาพตรงกับ SQL และ Data Dictionary รุ่นปัจจุบัน

| ประเภท | หน้าที่ | ตัวอย่าง |
|---|---|---|
| `sys_` | ผู้ใช้ กลุ่มสิทธิ์ เมนู configuration workflow และตัวนับเลข | `sys_users.su_id`, `sys_users.su_username` |
| `mst_` | ทะเบียนหลักและ reference master | `mst_asset.ma_id`, `mst_asset.ma_name` |
| `info_` | ธุรกรรม Asset สถานะปัจจุบัน และสำเนาข้อมูล MIS ที่ integration อัปเดตได้ | `info_asset_transfer.iat_id` |
| `log_` | ประวัติ เหตุการณ์ และ snapshot เพิ่มอย่างเดียว | `log_audit.la_id` |

แผนสิทธิ์ยึดตาม ER ล่าสุด: `sys_menu` มี `sys_submenu`; `sys_permission_group` ใช้แทน Role; `sys_permission_detail` เชื่อม Permission Group กับ Submenu; `sys_users` ผูกกับหนึ่ง Permission Group และหนึ่ง `sys_department`. จึงไม่มีตารางแยก `sys_role`, `sys_permission` หรือ join table แบบเดิม และสิทธิ์ในแบบนี้กำหนดระดับเมนูย่อย ยังไม่ได้แยกสิทธิ์ View/Create/Edit/Delete. `su_password` เก็บเฉพาะ password hash ห้ามเก็บรหัสผ่านจริง. ตารางหน่วยงานใช้ `sys_department` ตามภาพ แทน `mst_department`.

ชื่อคอลัมน์ FK ใช้ชื่อ PK ของตารางที่อ้างอิงเหมือนเดิมทั้งระบบ เช่น `sys_responsibility.su_id` → `sys_users.su_id` และ `sys_responsibility.sd_id` → `sys_department.sd_id`. เมื่ออ้างตารางเดียวกันหลายหน้าที่หรืออ้างกลับตารางตัวเอง จะเติมหน้าที่ด้านหน้าเพื่อไม่ให้ชื่อซ้ำ เช่น `from_su_id` / `to_su_id`, `parent_ma_id` / `source_ma_id`. ช่องผู้สร้าง/ผู้แก้ไขคงชื่อ `<prefix>_created_by` / `<prefix>_updated_by` เพื่อแยกบทบาทจาก FK ผู้ใช้หลัก. คอลัมน์ข้อมูลอื่นใช้ prefix ของตาราง เช่น `su_username`. ใช้ BIGINT UNSIGNED เป็น PK/FK เลข Asset/เอกสารเป็น business key ไม่ใช้เป็น PK และไม่ใช้ชื่อคนเป็น FK.

ตารางที่แก้ไขได้มี created_at/by และ updated_at/by; ตารางธุรกรรมและ master ส่วนใหญ่เพิ่ม row_version สำหรับ optimistic locking ตาราง log มี recorded_at และเวลาธุรกิจเฉพาะเหตุการณ์ เก็บ timestamp เป็น UTC แสดง Asia/Bangkok ส่วนวันธุรกิจเป็น DATE เงินใช้ DECIMAL(19,2) และจำนวน DECIMAL(18,4) ไม่ใช้ FLOAT สำหรับยอดเงิน

`mst_` แก้ได้ตามสิทธิ์และ workflow ส่วน `log_` มี trigger ห้าม UPDATE/DELETE ต้องเพิ่ม revision หรือเหตุการณ์ใหม่แทน Runtime role ต้องไม่มี DROP/ALTER/TRIGGER และให้ log เพียง SELECT/INSERT เพราะผู้ถือสิทธิ์ DDL ยังถอด guard ได้

## ขอบเขต Asset และ MIS

| MIS รับผิดชอบ | Asset รับผิดชอบ |
|---|---|
| สร้าง/แก้/อนุมัติ Proposal, PR และ PO | สร้างและแก้ Draft Asset |
| ต้นทุนและการจัดสรรของรายการจัดซื้อ | รับ acquisition amount/cost ของ Asset จาก MIS |
| Vendor Delivery, Invoice, GR และการรับรองโดย PU/Owner | เก็บ references และผล receiving เพื่อเป็นเงื่อนไข verification |
| RFQ และข้อมูลผู้เสนอราคา | ใช้ RFQ reference ในฟอร์ม Asset |
| ใบเบิก คงคลัง รับคืน และการตีราคาอะไหล่ | แสดงประวัติใช้และต้นทุนอะไหล่สำเร็จจาก MIS |
| Approval ฝั่งจัดซื้อ | Verification, Asset Team Leader, Accounting และ Activation |
| ส่ง event ที่มี source key/version | Deduplicate, รักษาเลข Asset และเชื่อมประวัติ |

Asset ไม่เก็บ purchasing workflow instances และไม่สร้าง PO/Invoice/GR ภายใน `info_document` รองรับเฉพาะ VERIFICATION, TRANSFER, DISPOSAL, ASSET_ISSUE และเอกสารอ้างอิง SALE_PROPOSAL/TAX_INVOICE ของการขาย

MIS references อยู่ในอีกทะเบียนหนึ่งคือ `info_mis_document_reference` ไม่มี approval request ของ Asset ผูกกับทะเบียนนี้ ข้อมูลสถานะและไฟล์จาก MIS เป็น reference เท่านั้น ไม่มี endpoint ให้ผู้ใช้ Asset แก้สถานะ PO หรืออนุมัติ Proposal

## ตารางใหม่สำหรับข้อมูลจาก MIS

| ตาราง | หน้าที่ |
|---|---|
| `info_mis_document_reference` (`imdr`) | ชนิดเอกสาร source, external key, เลข สถานะ วันที่ PO scope และหลักฐานว่าเอกสารมีจริง |
| `info_rfq_reference` (`irfr`) | RFQ item สำหรับ selector และเติม Model/Part number |
| `info_asset_acquisition` (`iaa`) | รายการ acquisition ต่อ Proposal item ของ MIS เก็บ selected target, result Asset, treatment และมูลค่า |
| `info_asset_acquisition_cost` (`iaac`) | ต้นทุนเพิ่มเติมเฉพาะ acquisition ที่ MIS ส่งมา |
| `info_asset_acquisition_document` (`iaad`) | เชื่อม acquisition กับ Proposal/PR/PO/Invoice/GR หลายใบและ item keys |
| `info_asset_spare_usage` (`iasu`) | จำนวนและต้นทุนใช้สุทธิจากใบเบิก MIS ไม่มี stock ledger |

ตารางกลุ่มนี้เป็น projection จาก MIS ยกเว้นสถานะขั้น Asset เช่น verification/activation ที่ service Asset ดูแล ใช้ source/external key ไม่ใช้เลขแสดงผลทำ deduplication และต้องตรวจ external version เพื่อไม่ให้ event เก่าเขียนทับ event ใหม่ ช่อง synced_at หมายถึงเวลาที่ Asset รับข้อมูล ไม่ใช่เวลาธุรกิจต้นทาง

Invoice/GR/Delivery reference มี po_imdr_id กลับไป PO reference ส่วน source และ kind ของ PO ปลายทางต้องตรวจใน integration transaction ตาราง acquisition_document มี composite FK ของ imdr_id/po_imdr_id จึงป้องกัน link ที่ใส่ PO scope ไม่ตรงเอกสารได้ Proposal/PR/PO link ใช้ po_imdr_id NULL ส่วน Invoice/GR/Delivery ต้องมี PO scope ตาม service contract

ไฟล์สำเนาใน ifile_id เป็น optional เพราะเอกสารจริงอาจอยู่ MIS ถ้า MIS ยืนยัน document_exists และมีวิธีเปิดดูได้ ไม่จำเป็นต้องดาวน์โหลดไฟล์มาเก็บซ้ำ `info_file` เก็บ object metadata และห้ามเก็บ URL ที่มี credentials

## ความสัมพันธ์ acquisition และ Asset

หนึ่ง acquisition แทนหนึ่งรายการ Proposal ภายนอก Unique `(imdr_id, proposal_item_key)` และห้าม Asset เดิมซ้ำภายใน Proposal เดียว โดยไม่สร้างตาราง Proposal header/items ใน Asset

- NEW: selected_ma_id เป็น Draft และ ma_id เป็น Asset เดียวกัน
- EXISTING และ total > 50,000 THB: selected_ma_id เป็น Active work target ส่วน ma_id เป็น Sub Draft ใหม่
- EXISTING และ total <= 50,000 THB: selected_ma_id เป็น work target ส่วน ma_id เป็น NULL ไม่มี Asset ใหม่

`iaa_total_amount = iaa_base_amount + SUM(iaac_amount)` เป็นยอดราย item ที่ integration ตรวจ ห้ามใช้วงเงิน Proposal ทั้งใบเป็นมูลค่าของแต่ละ Asset และห้ามคูณต้นทุนที่เป็นยอดรวมไปกับ quantity ซ้ำ Proposal funding/budget approval ไม่อยู่ใน schema Asset นี้ แต่ Budget Type และ account ราย item ยังเก็บอ้างอิงได้

Capitalization ใช้กับ Addition Sub-Asset, Modification และ Maintenance เหมือนกัน โดยรักษา work_type ต้นฉบับไว้ใน acquisition และ `info_asset_work` Customer acquisition ใช้ NEW เท่านั้น

Asset เชื่อมเอกสารผ่าน acquisition_document โดยมี document_item_key และ po_item_key เพื่อรองรับหลาย PO item/Invoice/GR ต่อ acquisition และหลาย Asset ต่อ PO เดียว จำนวนสั่งใช้เฉพาะ PO links จำนวนรับใช้เฉพาะ GR links Invoice ไม่ใช้จำนวนหรือยอดเงินเป็นเงื่อนไขตรวจรับ allocated_amount เป็นข้อมูล PO scope เท่านั้น ห้าม SUM ยอดจากเอกสารทุกชนิดเข้าด้วยกัน

`mst_vendor`, `mst_account`, `mst_cost_type`, `mst_part` และ `mst_uom` คงอยู่เพื่อแสดง supplier/บัญชี/ต้นทุน/อะไหล่ในทะเบียนและประวัติ โดยไม่มี purchasing หรือ stock processing

## Draft Sub Asset และเลขจริง

Asset มีสองระดับ Main → Sub เท่านั้น parent_ma_id ชี้ Main ส่วน source_ma_id เก็บ work target ที่เลือก ถ้าเลือก Sub เดิม งาน capitalized จะสร้าง sibling ใต้ Main ไม่เกิดเลข -1-1

Create Draft และรับเหตุการณ์ Save Proposal ให้เฉพาะ ma_temporary_ref, ma_no NULL และสถานะ Draft เมื่อรับ Proposal Approved ที่ตรวจสอบแล้วจึงแจกเลขจริงและตั้ง Purchasing เก็บ temporary reference เดิมไว้ ID ไม่เปลี่ยน จึงไม่ต้องแก้ FK ทุกตาราง

ใช้ `sys_number_sequence` พร้อม row lock สำหรับเลข Main และ scope CHILD:<main_id> สำหรับ suffix ห้าม MAX+1 หรือใช้ suffix เดิมซ้ำ Main และ selected Active target คง Active ลูกมี acquisition/DP ของตนเอง ไม่ copy เอกสารซื้อ approval หรือวัน DP ของ Parent

กรณี MIS กับ Asset คนละฐานข้อมูล จะไม่มี transaction เดียวครอบทั้งสองระบบ สัญญา integration ต้องกำหนด acknowledgment/retry/compensation ถ้าต้องรับประกันว่า Save Proposal สำเร็จแล้ว Sub Draft ต้องมีทันที MIS ต้องรอ Asset ยืนยันด้วย idempotent command ก่อนรายงาน success; ถ้าเลือก asynchronous ต้องยอมรับช่วง Pending sync อย่างชัดเจน ไม่ถือว่าทั้งสองแบบเท่ากัน ประเด็นกลไกเชื่อมยัง OPEN

## Receiving Verification และ Approval

`info_receiving_validation` เก็บผลปัจจุบันต่อ acquisition + PO reference + PO item และ `log_receiving_validation` เก็บแต่ละผลประเมิน ประเมิน PO ใช้รับได้, Invoice document มีจริงและ PO ตรงกัน, GR มีจริงและ PO ตรงกัน รวมการยืนยัน Purchasing กับ Asset Owner

จำนวนรับสะสมคิดจาก accepted GR links ที่ valid และไม่ cancelled เท่านั้น Partial ยังคง PARTIAL/GR_RECEIVED เอกสารผิดหรือ acceptance failed เป็น HOLD ไม่ใช้ Invoice amount หรือ quantity ตรวจผ่าน/ไม่ผ่าน

Expense จะ Completed เมื่อ scope ที่ต้องซื้อและรับทั้งหมดครบแล้วตาม MIS ไม่ complete หลัง GR ใบแรกหากยังมี split PO ค้าง ไม่มี Asset ใหม่ ไม่มี activation และไม่เพิ่ม DP ของ source/Main ส่วน acquisition ของ Asset ต้อง COMPLETE ทุก receiving scope ที่จำเป็นก่อน Ready for Verification

Verification ยังคง `info_asset_verification`, `info_verification_check`, `mst_verification_check` และไฟล์รูป/plate/control sheet ในเอกสารภายใน แยกจาก receiving reference checks Submit ได้เมื่อ receiving ครบ, verification COMPLETE และข้อมูลที่แสดงตาม class ครบ

Approval ภายในใช้ sys_workflow ที่มี version พร้อม info_approval_request/step snapshot ณ ส่ง และ log_approval_action ไม่เปลี่ยนคำขอเดิมเมื่อแก้ config Return แล้วส่งใหม่เป็น attempt ใหม่ Customer ผ่านถึง Active แต่ไม่มี DP profile และไม่ติด requirement depreciation date

## ค่าเสื่อม lifecycle และประวัติ

`info_asset_depreciation` เก็บเฉพาะ Company Asset มูลค่าของ record นี้ และ useful life snapshot จาก Asset Type ณ activation ตามนโยบายออกแบบที่ต้องยืนยันเมื่อมีการเปลี่ยนอายุภายหลัง

```text
monthly raw = acquisition value / useful life months
periods = max(0, จำนวนเดือนตั้งแต่เริ่มถึงเดือนรายงานหรือ cutoff + 1)
accumulated = min(acquisition value, monthly raw × periods)
net book value = acquisition value − accumulated
```

เริ่มนับเดือนแรกเต็มงวด ไม่มี daily proration/residual/impairment ข้อเสนอปัดเศษคือคำนวณสะสมก่อนปัด 2 ตำแหน่งและใช้ผลต่างสะสมเป็น DP รายเดือน `log_depreciation_period` เป็น posted/report snapshot แก้ด้วย revision ใหม่ Query ต้องเลือก revision ล่าสุด ไม่รวม revision ซ้ำ

`info_asset_work` คงประวัติงานจาก MIS โดยอ้าง acquisition แทน Proposal item ภายใน ส่วน `info_asset_transfer` ยังเก็บ From/To FK และ label snapshot อัปเดต assignment หลังครบ approval เท่านั้น Customer ห้าม work, transfer, spare usage และ disposal

Sale Proposal/e-Tax เป็นเอกสารขายอ้างอิง จึงคง `info_sale_proposal`, `info_tax_invoice`, `info_sale_item`, `info_asset_disposal` การขายเลือก Asset ชัดเจน ไม่ขายลูกตาม Main อัตโนมัติ ต้องเลือก INCLUDE/EXCLUDE_SALE_MONTH ทุกครั้ง เก็บ financial snapshot และตั้ง Sold พร้อมหยุด DP แบบ atomic เดือนขาย closing carrying balance เป็นศูนย์ เดือนถัดไปไม่รวม Asset ส่วนเดือนเก่ายังตรวจได้

`log_asset_event` รวม business events ที่มาจาก MIS และใช้ main_ma_id ช่วยแสดงประวัติลูกใน Main ส่วน `log_audit`/change เก็บเฉพาะ user-driven non-MIS รวม master/verification/approval/transfer/disposal ไม่มี Audit สำหรับ MIS origin หรือ indirect child/number updates, seed/migration และ no-op ไม่เก็บ credential/password hash/token/attachment bodies

## Integration และกฎที่ต้องพัฒนา

`info_integration_inbox` Unique source/message key ป้องกัน event ซ้ำ, outbox เขียนพร้อม Asset transaction แล้วส่งหลัง commit และ `log_integration_message` บันทึก attempts แบบเพิ่มอย่างเดียว origin และ actor ต้องมาจาก trusted service ไม่เชื่อ origin จาก client

DDL บังคับ PK/FK/Unique, ownership/customer fields, threshold ใน acquisition/work, reference PO scope, quantity พื้นฐาน, สมการ DP และ append-only logs ส่วน service ต้องตรวจ kind/source ข้ามตาราง, hierarchy สองระดับ, ownership/project/eligibility, sum costs, version ordering, link scopes, receiving completion, authorization และ transitions รายละเอียดอยู่ใน workflow-contracts.md

## ประเด็นที่ยังต้องยืนยัน

| เรื่อง | การรองรับ |
|---|---|
| cardinality PO item/Asset และ partial GR | หลายต่อหลายผ่าน reference links; ไม่ล็อกหนึ่งต่อหนึ่ง |
| sync/API และ acknowledgment Save Proposal | inbox/outbox และ stable keys; ยังไม่เลือก synchronous/asynchronous แทนผู้ใช้ |
| Transfer chain | versioned workflow; AGENTS ระบุ Area Owner → Source Leader → Destination Leader → Asset Team แต่โค้ดปัจจุบันต่างกัน จึงไม่ seed chain |
| useful life changes และ correction ย้อนหลัง | snapshot และ report revision; ต้องกำหนดสิทธิ์/งวด |
| เดือนสุดท้าย DP ตอนขายและการขาย Main พร้อมลูก | explicit convention; selected Assets เท่านั้น |
| ยอดเปลี่ยนหลัง Proposal approval จนข้าม 50,000 | HOLD และ amendment ที่ต้องยืนยัน ไม่เปลี่ยน treatment เงียบ ๆ |
| MIS completeness ของ split PO/GR | ต้องมี authoritative scope/version/completion evidence ไม่เดาว่าครบจากข้อมูลที่รับมาเท่านั้น |
| foreign currency/VAT capitalization | ปัจจุบัน acquisition THB; ไม่สร้างกฎภาษีหรือ FX ใหม่ |
| custodian ไม่มีบัญชี login | ถ้าต้องใช้พนักงานที่ไม่มี login ควรแยก employee master ก่อน migrate |
| Disposal แบบไม่ใช่ Sale | ยังไม่สร้าง workflow |

## ติดตั้งและย้ายข้อมูล

รัน schema.sql ในฐานข้อมูลใหม่ที่เลือกชัดเจน ไฟล์ไม่มี DROP/CREATE DATABASE และไม่ใช่ in-place migration จากแบบเก่า จากนั้นรัน reference-seed.sql ครั้งเดียว ตั้ง master, permission groups, submenu grants และ workflow ตามข้อมูลที่อนุมัติ

```sh
mysql --login-path=tbkk -e 'CREATE DATABASE tbkk_asset CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci'
mysql --login-path=tbkk tbkk_asset < docs/database/schema.sql
mysql --login-path=tbkk tbkk_asset < docs/database/reference-seed.sql
python3 docs/database/generate_schema.py
```

หากมีข้อมูลแบบก่อนแล้ว ต้อง map purchasing IDs เป็น source/external keys, เปลี่ยน proposal item allocations เป็น acquisition/references, แยกต้นทุนและยอดรับตาม scope, ย้าย usage ที่ post แล้วเป็น usage projection และตรวจยอด/เลข Asset/ประวัติก่อนสลับระบบ ห้าม DROP ตารางเดิมก่อน reconcile/backup การออกแบบครั้งนี้ไม่ได้ลบข้อมูลจริง

อ้างอิง product: AGENTS.md ข้อ 1–35 และ stores/utilities ของ mockup ปัจจุบัน ใช้กฎล่าสุดเมื่อขัดกับ flow เก่า ส่วน FK/Check อิง [MySQL Foreign Keys](https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html) และ [MySQL Check Constraints](https://dev.mysql.com/doc/refman/8.4/en/create-table-check-constraints.html)
