# Transaction ของ TBKK Asset และข้อมูลอ้างอิง MIS

เอกสารนี้เป็น contract ของ service ที่จะพัฒนา ไม่ใช่ backend หรือ stored procedures ที่มีใน DDL Asset รับข้อมูลจัดซื้อ/คลังจาก MIS และไม่ดำเนิน workflow เหล่านั้นเอง

## การล็อกและสิทธิ์

ทุก write ใช้ transaction และ trusted actor/origin ล็อก Asset เรียง ma_id ก่อน acquisition/references ตาม ID → counter ตาม scope → verification/approval request/step รักษาลำดับเดียวกันทุก endpoint Retry deadlock ด้วย idempotency key เดิม กรณี source keys ที่ยังไม่มีแถว ใช้ unique constraint/atomic upsert ร่วมกับล็อก inbox

UPDATE ต้องเทียบ row_version ที่อ่านมา เพิ่มเวอร์ชัน และตรวจ affected rows = 1; ถ้า stale ให้ refresh/return ไม่ overwrite ข้อมูลใหม่ ตาราง projection จาก MIS ไม่มี API ให้ผู้ใช้ Asset แก้ source status, received quantity หรือเอกสารซื้อ

## Create และ Edit Draft

ตรวจ ownership/customer name, class, project และ assignment Allocate unique temporary reference ด้วย counter lock ตั้ง Draft และ no NULL ใช้ stable ma_id ตลอดอายุ Asset ฟิลด์ RFQ/Model/Part/Area/Power แสดงเฉพาะ ME/MD ฟิลด์ซ่อนไม่ถูกลบและไม่นับ completeness

เลือก RFQ ใหม่เติม Model/Part ใน form payload การ clear RFQ เก็บค่าที่กรอก การ reopen อ่านค่าที่ save ไม่เติมทับ manual edits ถ้า Draft มี acquisition ที่ยังไม่ cancelled ต้องตรวจไม่ให้เปลี่ยน ownership/project จนขัดกับ Proposal ต้นทาง ก่อนแก้ให้ล็อก Asset และ acquisition ที่เกี่ยวข้อง

Append non-MIS audit เฉพาะ diff จริงและ timeline ใน transaction เดียวกัน No-op ไม่เพิ่ม Audit

## รับข้อมูล Save Proposal จาก MIS

1. ตรวจ authentication ของ integration และ schema payload ก่อนบันทึก source/message key ลง inbox แบบ Unique
2. Reject stale version และ deduplicate key เดิม ถ้า version ขาดช่วงที่มีผลต่อ eligibility ให้ Pending sync/HOLD และขอ authoritative snapshot ไม่เดาสถานะ
3. ล็อก selected Assets ทั้งรายการ ตรวจ distinct target ภายใน Proposal เดียว ownership/project ตรงกัน NEW เป็น available Draft, EXISTING เป็น Active Company; Customer รับเฉพาะ NEW
4. ตรวจไม่มี acquisition ของ Draft เดียวกันอยู่ใน Proposal อื่นที่ยังไม่ cancelled ภายใต้ Asset row lock MIS ยังเป็นเจ้าของการเลือก/จองในหน้าจอของตัวเอง
5. ตรวจ base + scoped costs = item total ด้วย DECIMAL รวมเฉพาะ item ไม่ใช้ funding ของ Proposal เป็นมูลค่าแต่ละ Asset
6. Upsert Proposal reference และ acquisition ตาม stable external keys ถ้า EXISTING total > 50,000 ให้สร้าง Sub Draft พร้อม temporary reference ใน local transaction นี้ ถ้า <= 50,000 ไม่สร้าง Asset ใหม่
7. Child ใช้ parent = Main ของ work target และ source = selected work target Copy classification/assignment เท่านั้น รับ component name/model/power/Target SOP จาก MIS ไม่ copy approvals, documents หรือ DP ของ parent
8. Upsert acquisition costs และ info_asset_work ให้ work type/treatment/value/source/result ตรงกัน Main/source Active คงเดิม Child ยัง Draft และ no NULL
9. Append MIS-origin business event และ integration result; ไม่เขียน log_audit สำหรับ side effects ใดของ event แล้ว commit

Save Proposal ของ MIS และ transaction Asset ไม่ได้ atomic ข้ามระบบโดยอัตโนมัติ หากข้อกำหนดต้องให้ Save สำเร็จแล้วมี Sub Draft ทันที ให้ MIS รอ acknowledgment จาก Asset ที่ idempotent ก่อนรายงาน success และกำหนด compensation เมื่อปลายทางล้มเหลว หากเลือก async ต้องแสดง Pending sync ที่ทั้งสองระบบเข้าใจตรงกัน กลไกจริงยังต้องยืนยัน

Cancelled ก่อน approval เก็บ Draft/temporary reference เดิมด้วย Cancelled และ history ไม่ลบทิ้งเงียบ ๆ การเปลี่ยน treatment หลัง approval ต้องใช้ amendment/reapproval ที่ยืนยันแล้ว ไม่เปลี่ยน Asset/DP อัตโนมัติ

## รับ Proposal Approved และแจกเลขจริง

ตรวจต้นทางและ version ว่า Approved จริงก่อนส่งผล ห้ามสร้าง approval instance ของ Proposal ใน Asset ล็อก Assets และ counter ตามลำดับมาตรฐาน Increment ASSET:<group>:<year> สำหรับ Main หรือ CHILD:<main_id> สำหรับ Sub ห้าม MAX+1 และห้าม reuse suffix ที่เคยใช้

เปลี่ยน ma_no/child_suffix และสถานะ Purchasing ใน transaction เดียวกับ acquisition state และ idempotency record เก็บ temporary_ref เดิม ใช้ ma_id เป็น FK ไม่แก้ references ด้วย string replacement Expense ไม่มี result Asset และไม่แจกเลข Main/source คง Active ส่ง mapping ออก outbox หาก MIS ต้องใช้เลขจริง

ตรวจซ้ำด้วย event key, external version และ Asset state การรับ Approved event ซ้ำต้องไม่ออกเลขใหม่ ไม่ข้ามการสร้าง Draft ที่จำเป็นจากเหตุการณ์ก่อนหน้า

## รับ PR PO Invoice และ GR references

1. Upsert info_mis_document_reference ตาม source/kind/external_key; เลขแสดงผลแก้ได้แต่ key ไม่เปลี่ยน Invoice/GR/Delivery ต้องอ้าง reference kind PO ใน source เดียวกัน
2. ผูก acquisition_document กับ acquisition และ document/item/PO item keys จาก lineage ของ MIS ตรวจ Proposal ของ acquisition ตรงต้นทาง ห้าม link งานหรือ Asset ของรายการอื่นเพราะอยู่ PO เดียวกัน
3. PO link ใช้ po_imdr_id NULL และ imdr_id เป็น PO นั้น Invoice/GR/Delivery link ต้องใส่ po_imdr_id ที่ตรงกับเอกสาร Composite FK ช่วยบังคับ แต่ service ยังต้องตรวจชนิดและ source
4. จำนวนสั่ง/allocated amount ใช้เฉพาะ PO links; received/accepted quantities และ physical confirmation ใช้เฉพาะ GR links Invoice ไม่มี amount/quantity validation criteria
5. ต้องมี authoritative required scopes และ version จาก MIS การมี PO แรกที่รับครบยังไม่แปลว่า split purchase ทั้งงานครบ
6. เมื่อแก้ projection ให้ append timeline และ log_receiving_validation แต่ไม่สร้าง Audit ของ MIS-origin

## ประเมิน receiving และ Expense completion

คำนวณต่อ acquisition + PO reference + PO item โดย PO ต้องใช้รับได้ มี Invoice document จริงที่อ้าง PO เดียวกัน มี valid GR scope เดียวกัน และ Purchasing + Asset Owner ยืนยันสินค้าหรือ completed work Invoice อาจเก็บไฟล์ที่ MIS และส่ง document_exists/evidence มาได้ ไม่บังคับคัดลอก body เข้า Asset

รวม accepted_quantity เฉพาะ GR item keys ที่ไม่ซ้ำ valid และไม่ cancelled แยกจากจำนวน Invoice หากมี FAILED acceptance หรือ reference ผิดเป็น HOLD ถ้ายังขาดเอกสาร/การยืนยันเป็น PENDING ถ้าผ่านแต่จำนวนไม่ครบเป็น PARTIAL และงานยัง GR_RECEIVED ครบทุกเงื่อนไขจึง COMPLETE

Update info_receiving_validation และ append log_receiving_validation ด้วย idempotency key ที่รวม scope/version Expense ต้อง COMPLETE ทุก scope ที่จำเป็นพร้อม authoritative allocation completeness จึง set acquisition/work Completed และ completion date/cost/references ไม่มี Asset, verification, activation หรือ DP เพิ่ม

Acquisition แบบมี Asset จะ Ready for Verification เมื่อทุก scope จำเป็น complete ไม่ปลดล็อกจาก GR ของ Asset อื่นใน PO เดียวกัน Late correction/cancel หลัง completed/active ต้อง HOLD และ correction policy ที่ยืนยันแล้ว ไม่ลด Asset value หรือย้อนสถานะอัตโนมัติ

## Verification และ Approval ภายใน Asset

Save verification drafts มี audit ตาม diff และแยก revision ต่อ Asset Submit ต้องตรวจ receiving scopes ครบ, result COMPLETE, confirmed SOP, checklist, ข้อมูลที่แสดงตาม class และรูป/plate/control sheet ที่ flow บังคับ

Snapshot form/เอกสารและ workflow version ที่ assigned ให้ ACTIVATION Resolve required approvers ตรวจผู้รับมีสถานะใช้งานได้ สร้าง info_approval_request attempt ใหม่พร้อม info_approval_step copies ของ action, assigned user/permission group, labels, return/reject และ requires_dp_date แล้วตั้ง Asset pending ของขั้นแรก

ทุก decision ล็อก Asset/request/step ตามลำดับ ตรวจ request ID/current step/row_version และสิทธิ์ actor ปัจจุบัน Append log_approval_action พร้อม actor/name/date/remark Return ปิด attempt เดิมและสร้าง attempt ใหม่เมื่อส่งซ้ำ ไม่ลบ decisions

Final approve ตรวจ receiving และ approved snapshot ยังตรง Company ต้องมี DP profile/start date/value ของ Asset นี้เท่านั้น; Customer ไม่สร้าง DP profile และไม่ต้อง DP date เมื่อผ่านตั้ง Active/activated_at พร้อม audit/event ใน transaction เดียวกัน

Workflow config ใช้ version ใหม่หลังใช้งาน การแก้ settings ไม่เปลี่ยน instance ที่ส่งแล้ว นโยบาย self-approval/substitution ยังต้องยืนยันก่อนเปิดใช้

## Depreciation และ Disposal

Company profile snapshot useful life จาก Asset Type เป็นเดือน เก็บ acquisition value ของตัวเอง ไม่รวม Expense หรือมูลค่าของลูกซ้ำบน Main คำนวณ SLM โดยเดือนแรกเป็นงวดเต็ม คิดสะสมด้วยความละเอียดสูงแล้วปัด 2 ตำแหน่ง รายเดือนเป็นผลต่างยอดสะสม Snapshot/report ใช้ log_depreciation_period revision ใหม่และ supersedes_id เมื่อ correction ไม่ UPDATE log เก่า

Disposal ใช้ Active Company Assets ที่ระบุใน sale items Sale Proposal Approved, e-Tax อ้าง proposal เดียวกัน และ Verify Sale แล้ว ไม่สร้างระบบขายหรือออก e-Tax ใหม่ ต้องเลือก convention INCLUDE/EXCLUDE_SALE_MONTH ทุกครั้ง วันขายไม่อยู่อนาคตและไม่ก่อน DP start ตาม mockup

ล็อก Asset/profile และบันทึก financial/assignment/reference snapshots ตั้ง Sold และ stop_date พร้อม audit/event/outbox ใน transaction เดียว ไม่ขายลูกตาม Main อัตโนมัติ หากขายเดือนแรกและ EXCLUDE cutoff ก่อน start ได้และ DP เป็นศูนย์ เดือนขายลง cost/DP removal closing = 0 เดือนถัดไปไม่รวมในรายงาน ปิด DP editing หลัง Sold

## Transfer

เฉพาะ Active Company Asset เก็บ From/To FK และ label snapshots ตอนส่ง Resolve workflow version ตาม source/destination department และ responsibility matrix ก่อนส่ง Final approval ต้องเทียบ assignment ปัจจุบันกับ From ถ้าเปลี่ยนระหว่างทางให้ return stale request ไม่ทับข้อมูลใหม่ Update assignment/Completed/audit/event แบบ atomic หลังครบทุก required step

Chain ของ AGENTS กับโค้ดเดิมต่างกัน จึงไม่ seed chain ตายตัว ต้องเลือก config ที่ยืนยันก่อนใช้งานจริง

## Spare usage จาก MIS

รับเฉพาะ posted/completed issue items ที่ระบุ Asset และ source/issue_key/item_key ชัดเจน ไม่รับ draft ใบเบิกเป็น usage ที่เกิดแล้ว Validate eligibility ณ วันที่ issue: Company และ Active ในขณะนั้น หาก sync ล่าช้าหลัง Asset Sold ให้รักษาประวัติที่เกิดก่อนขาย ไม่ปฏิเสธเพียงเพราะสถานะปัจจุบันเปลี่ยน

Store net quantity/cost จาก MIS พร้อม part number/name snapshot หน่วย วันที่ และ status COMPLETED/REVERSED ใช้ external_version ป้องกันการคืนของเวอร์ชันเก่าเขียนทับใหม่ คืนทั้งหมดให้ REVERSED และ net = 0; คืนบางส่วนให้ COMPLETED ด้วยยอดสุทธิที่ MIS ยืนยัน Append business event เพื่อรักษาผลก่อน/หลัง ไม่มี stock balance, stock valuation หรือ approval ของใบเบิกใน Asset

## Audit และ Integration

Non-MIS user-driven writes ใช้ allowlist field diff ที่ normalize แล้ว เก็บ before/after เฉพาะที่เปลี่ยน ไม่ใส่ password/hash/token/credential/attachment body No-op, seed/migration และ MIS-origin รวม indirect changes ไม่สร้าง Audit origin ต้อง resolve จาก trusted integration/service ไม่รับจาก client เพื่อปิด audit

Inbox key มี Unique; payload ธุรกิจต้องผ่าน validation และไม่มี secrets เขียนธุรกิจกับ inbox success/outbox ใน local transaction เดียว Retry ด้วย key เดิม Outbox delivery เป็น at-least-once และ consumer deduplicate ด้วย event_key Log integration แต่ละ attempt เป็น append-only ไม่ใช้ log เป็น processing queue

## Acceptance criteria เมื่อพัฒนา backend

| กรณี | ผลที่ต้องได้ |
|---|---|
| Save Draft / Save Proposal event | Draft, temporary ref คงเดิม, no NULL |
| Proposal Approved event ซ้ำ/พร้อมกัน | แจกเลขจริงครั้งเดียว suffix ไม่ซ้ำ |
| Existing total 49,999.99 / 50,000 / 50,000.01 | Expense / Expense / Sub Draft |
| Base 45,000 + scoped cost 6,000 | Sub Draft จาก total 51,000 รวม Maintenance |
| เลือก Sub ทำงาน | สร้าง sibling ภายใต้ Main ไม่ใช่ -1-1 |
| ownership/project ไม่ตรง Proposal หรือ Draft ซ้ำข้ามใบ | ปฏิเสธก่อน apply event |
| Customer EXISTING/Transfer/Spare/Disposal | ปฏิเสธ lifecycle ทุกแบบ |
| Invoice/GR scope คนละ PO | ปฏิเสธ link หรือ HOLD |
| Invoice amount ต่าง PO | ไม่ fail receiving เพราะ amount |
| Partial GR หรือ split PO ยังไม่ครบ | ไม่ Completed และไม่ Ready for Verification |
| Expense รับครบทุก scope | Completed ไม่มี Asset/DP เพิ่ม |
| Source version เก่าหรือ message ซ้ำ | ไม่เขียนทับ version ใหม่ ไม่เพิ่ม event ซ้ำ |
| แก้ workflow หลัง Submit | instance เดิมไม่เปลี่ยน |
| Customer final approve ไม่มี DP date | Active และไม่มี profile |
| Late spare sync ก่อนขาย แต่ Asset ปัจจุบัน Sold | เก็บประวัติตามวันที่เกิดจริงได้ |
| ขาย Main / เดือนแรก EXCLUDE | ไม่ขายลูกอัตโนมัติ / DP 0 |
| Audit no-op/MIS/seed และ non-MIS edit | ไม่มี / มีตาม scope ที่กำหนด |
| UPDATE/DELETE log | trigger ปฏิเสธ |

รายการนี้เป็น contract สำหรับ backend ในอนาคต ผลทดสอบ DDL จริงอยู่ใน validation-report.md
