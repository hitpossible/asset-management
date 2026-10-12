# TBKK Asset Management — Data Dictionary

จัดทำเมื่อ 9 ตุลาคม 2026 · ครอบคลุม **36 ตาราง / 278 attributes** ตาม [ER diagram](./asset-management-er.mmd) และ [ER notes](./asset-management-er-notes.md) พร้อมอ้างอิงโค้ด mockup และ AGENTS.md ข้อ 28–29

## วิธีอ่านและสถานะของเอกสาร

ปัจจุบันระบบเป็น React mockup ที่เก็บ JavaScript objects ใน localStorage **ยังไม่มีฐานข้อมูล/DDL จริง** ชื่อตารางในเอกสารคือ logical entities ไม่ใช่ตารางที่ติดตั้งแล้ว ดังนั้น **Data type, Size, NULL/NOT NULL, UNIQUE, CHECK และ defaults ในเอกสารนี้เป็นข้อเสนอสำหรับทำ Data Dictionary/physical schema** ยกเว้นกฎธุรกิจที่ยืนยันใน AGENTS.md และค่าเริ่มต้นฟอร์มที่ระบุว่าเป็นพฤติกรรมปัจจุบัน ต้องเลือก DB และตรวจ migration ก่อนทำ DDL

ทุก field ใช้ชื่อให้ตรง ER; ไม่ได้เพิ่ม field audit ทั่วไปที่ไม่มีใน ER. แต่ละตารางระบุแหล่งข้อมูลว่ามีอยู่ใน nested object หรือเป็น proposed entity และข้อกำหนดที่ยังเปิดไว้ การอ้าง MIS เป็นการเก็บข้อมูล/เอกสารอ้างอิงจากระบบภายนอก ไม่ย้ายความรับผิดชอบ purchasing หรือ inventory มาที่ Asset System

| คำในเอกสาร | ความหมาย |
| --- | --- |
| PK | Primary Key: ระบุแถวไม่ซ้ำ; PK ร่วมหมายถึงต้องรวมหลาย field เป็น key เดียว |
| FK → TABLE.field | Foreign Key/ความสัมพันธ์ไปตารางอื่น; เป็น proposed constraint ไม่ได้บังคับอยู่ใน localStorage |
| UK / UNIQUE | ห้ามข้อมูลซ้ำ; UNIQUE (a, b) ตรวจคู่ค่ารวมกัน ไม่ได้ห้าม a หรือ b ซ้ำเดี่ยว ๆ |
| NOT NULL | ห้ามไม่มีค่า; ข้อความว่างยังต้องตรวจเพิ่มเติมว่าไม่ว่างเมื่อเป็น required field |
| NULL ได้ | ยังไม่มี/ไม่เกี่ยวข้อง; แตกต่างจากยอดเงิน 0, FALSE, empty string และ empty JSON |
| CHECK | เงื่อนไขตรวจค่าหรือชุดค่าที่รับได้; cross-table/workflow rules ต้องใช้ validation เพิ่ม |
| Snapshot | สำเนาค่า ณ เวลาทำเอกสาร/ตัดสินใจ เพื่อไม่ให้ประวัติเปลี่ยนตาม master ล่าสุด |
| Bridge / allocation | ตารางเชื่อม/จัดสรรข้อมูล ไม่ได้ยืนยัน cardinality ที่ยัง OPEN |
| ไม่มี | ไม่มี SQL default; caller/workflow ต้องส่งค่าจริง ไม่ได้หมายความว่า field เป็น NULL ได้ |
| เสนอ: ... | ค่า default ที่เสนอสำหรับ schema ยังไม่มี SQL default นี้ในระบบจริง |
| ค่าในฟอร์ม / ระบบกำหนด | การ prefill หรือคำนวณใน application; ไม่ใช่ SQL DEFAULT อัตโนมัติ |

## แนวทางชนิดข้อมูลและขนาด

- `VARCHAR(n)` ในตารางแยก Data type เป็น VARCHAR และ Size เป็น n ตัวอักษร; รองรับภาษาไทย/Unicode โดยเลือก Unicode charset/collation ที่เหมาะกับ DB. ขนาดเหล่านี้เป็นข้อเสนอ ไม่ใช่ทุก input maxLength ใน UI และไม่ใช่จำนวน bytes
- `DECIMAL(18,2)` สำหรับยอดเงิน THB เพื่อเก็บสตางค์; `DECIMAL(18,4)` สำหรับจำนวนที่อาจเป็นเศษ; Useful Life ใช้ `DECIMAL(6,2)` และอัตราเปอร์เซ็นต์ใช้ `DECIMAL(9,4)`. จำนวนทศนิยมของจำนวน/Useful Life ยังเป็น design choice ไม่ใช่ business rule ยืนยันแล้ว
- `DATE` เก็บวันธุรกิจที่ไม่มีเวลา; `TIMESTAMP WITH TIME ZONE` เป็นชนิดเชิงแนวคิดสำหรับ event instant เก็บ UTC แล้วแสดง Asia/Bangkok (DB ที่เลือกอาจใช้ชื่อ/วิธีจัดเก็บต่างกัน). ms เป็นข้อเสนอความละเอียด; ไม่ default ทุกเวลาเป็น NOW เพราะ completedAt/activatedAt ต้องรอ event จริง
- `TEXT` ใช้กับรายละเอียด/หมายเหตุหรือ data URL รูปที่ยาว; `JSON` ใช้กับ snapshot/arrays. Size ไม่ตายตัว ไม่ได้หมายถึงไม่มี limit ต้องกำหนดตาม DB/attachment policy ก่อน production
- Key ที่เป็นเลขเอกสาร/Asset/internal IDs ใช้ VARCHAR(128) เป็นข้อเสนอ; projectCode ใช้ 80, itemNo ใช้ 40. FK ต้องมีชนิด/ความยาว/collation เท่ากับ key ที่อ้างเสมอ ไม่มีสมมติว่าทุก ID เป็น UUID
- วันที่/ข้อความว่างใน mockup เช่น `''` หรือ field ที่ไม่ได้ใส่ ควร normalize เป็น NULL สำหรับ optional field เมื่อ migrate; ห้ามเปลี่ยนข้อมูลไม่ทราบต้นทุนเป็น 0 โดยอัตโนมัติ
- Default ไม่อนุมัติ/ยืนยันผ่านเอง: verification result เริ่ม NULL, acceptance/checklist เริ่ม FALSE ในข้อเสนอ และ status ใช้แยกยังไม่ตรวจออกจากตรวจแล้วไม่ผ่าน

## สารบัญตาราง

| Table | ใช้เก็บอะไร | Attributes |
| --- | --- | --- |
| [ASSET_TYPE](#asset-type) | ทะเบียนประเภท/หมวดทรัพย์สินและอายุการใช้งานที่ใช้คำนวณค่าเสื่อม | 5 |
| [ASSET](#asset) | ทะเบียนทรัพย์สินหลักของระบบ | 25 |
| [MIS_PROPOSAL](#mis-proposal) | ข้อมูลอ้างอิงหัวเอกสาร Proposal ของ MIS | 26 |
| [PROPOSAL_ITEM](#proposal-item) | รายการ Asset/งานภายใน Proposal | 17 |
| [ITEM_COST](#item-cost) | ต้นทุนเพิ่มเติมของแต่ละ Proposal item | 6 |
| [MIS_PR](#mis-pr) | หัวเอกสารใบขอซื้อ (Purchase Requisition) จาก MIS | 7 |
| [PR_ITEM](#pr-item) | รายการภายใน PR | 5 |
| [MIS_PO](#mis-po) | หัวเอกสารใบสั่งซื้อ (Purchase Order) จาก MIS | 9 |
| [PO_ITEM](#po-item) | รายการสินค้า/งานในใบสั่งซื้อ | 9 |
| [PO_ITEM_ALLOCATION](#po-item-allocation) | ตารางเชื่อมแบบเสนอระหว่าง PO item กับ Proposal item เพื่อรองรับการจัดสรรหลายรายการอย่างยืดหยุ่น | 5 |
| [MIS_INVOICE](#mis-invoice) | ข้อมูลอ้างอิง Invoice ที่ Vendor ส่งมาสำหรับ PO | 8 |
| [MIS_GR](#mis-gr) | ข้อมูลอ้างอิงใบรับของ (Goods Receipt) จาก MIS | 8 |
| [GR_ITEM](#gr-item) | รายการที่รับของจริงใน GR | 5 |
| [RECEIVING_VALIDATION](#receiving-validation) | ผลตรวจเอกสารอ้างอิงและการรับของตามหนึ่ง allocation | 10 |
| [VALIDATION_GR](#validation-gr) | ตารางเชื่อมผล Receiving Validation กับ GR ที่นำมาใช้ตรวจ | 2 |
| [VALIDATION_INVOICE](#validation-invoice) | ตารางเชื่อมผล Receiving Validation กับ Invoice documents ที่ใช้ตรวจ | 2 |
| [ASSET_VERIFICATION](#asset-verification) | ข้อมูลการตรวจยืนยันตัว Asset โดย Asset Team | 23 |
| [ASSET_APPROVAL](#asset-approval) | ประวัติการตัดสินใจในการอนุมัติ/activation ของ Asset | 8 |
| [LIFECYCLE_EVENT](#lifecycle-event) | ประวัติเหตุการณ์ของ Active Company Asset | 16 |
| [TRANSFER_DETAIL](#transfer-detail) | ข้อมูลเฉพาะการโอนย้าย | 4 |
| [TRANSFER_ASSIGNMENT](#transfer-assignment) | snapshot แหล่งต้นทางและปลายทางของ Transfer หนึ่ง Transfer มีสองแถว FROM/TO เพื่อเก็บข้อมูลเดิมไว้หลัง master assignment เปลี่ยน | 8 |
| [LIFECYCLE_APPROVAL](#lifecycle-approval) | ประวัติการตัดสินใจของ lifecycle transaction | 8 |
| [SPARE_PART_USAGE](#spare-part-usage) | รายละเอียดค่าเบิกอะไหล่ที่ใช้กับ Asset | 7 |
| [PROJECT](#project) | ทะเบียนโครงการที่ใช้เลือกอ้างอิงใน Asset/Proposal | 4 |
| [MIS_PART](#mis-part) | รายการ Part อ้างอิงจาก MIS browser | 3 |
| [ASSET_NUMBER_RESERVATION](#asset-number-reservation) | ทะเบียนเลข Sub Asset ที่เคยจอง/ใช้ | 5 |
| [INVOICE_ITEM](#invoice-item) | รายการจำนวนส่งที่ Vendor รายงานใน Invoice | 4 |
| [VERIFICATION_PHOTO](#verification-photo) | รูปหลักฐานของรอบ verification | 6 |
| [ASSET_CONTROL_SHEET](#asset-control-sheet) | snapshot เอกสารตรวจ Asset ที่ผู้ใช้ review แล้ว | 6 |
| [DEPRECIATION_PROFILE](#depreciation-profile) | metadata ค่าเสื่อมที่ DP editor บันทึกให้ Company Asset | 4 |
| [ADMIN_USER](#admin-user) | ทะเบียนผู้ใช้ในหน้าจอ Administrator | 5 |
| [ADMIN_ROLE](#admin-role) | ทะเบียนบทบาทผู้ใช้ | 4 |
| [USER_ROLE](#user-role) | ตารางเชื่อมผู้ใช้กับบทบาท | 2 |
| [APP_MENU](#app-menu) | ทะเบียนเมนู/กลุ่มเมนู | 5 |
| [ROLE_MENU_PERMISSION](#role-menu-permission) | ตารางเชื่อมสิทธิ์ Role ต่อ Menu | 2 |
| [ASSET_ISSUE](#asset-issue) | คำแจ้งปัญหาจากหน้า QR/Asset Info | 5 |

<a id="asset-type"></a>

## 1. ASSET_TYPE

**คำอธิบายตาราง:** ทะเบียนประเภท/หมวดทรัพย์สินและอายุการใช้งานที่ใช้คำนวณค่าเสื่อม หนึ่งแถวคือหนึ่ง Asset Type เช่น ME - Machine

**แหล่งข้อมูล/สถานะ:** `src/data/assetTypes.js`, `src/hooks/useAssetTypeStore.js`; key ในโค้ดคือ `id` แทน `assetTypeId`

**กติกา/ข้อควรเข้าใจ:** Useful Life ตัวอย่างใน mock data ไม่ใช่ค่าบัญชีที่ยืนยันแล้ว; การปิด active ไม่ลบ Asset ที่ใช้ประเภทนี้

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `assetTypeId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — ระบบออก ID | รหัสภายในของประเภททรัพย์สิน เช่น ATM-001 ใช้ให้ Asset อ้างประเภทอย่างคงที่แม้เปลี่ยนชื่อ |
| `code` | VARCHAR | 20 ตัวอักษร | UK; NOT NULL; ห้ามข้อความว่าง | ไม่มี | รหัสย่อประเภท เช่น ME-MCH ใช้ค้นหาและแสดงประเภท |
| `name` | VARCHAR | 60 ตัวอักษร | NOT NULL; ห้ามข้อความว่าง | ไม่มี | ชื่อประเภทที่แสดงในหน้าจอ เช่น ME - Machine; ปัจจุบัน assetClass มักเก็บชื่อนี้ |
| `usefulLifeYears` | DECIMAL | 6,2 (จำนวนเต็ม 4 / ทศนิยม 2) | NULL ได้ก่อนกำหนด; CHECK > 0 เมื่อมีค่า | NULL — ต้องกำหนดโดย Accounting | อายุใช้งานหน่วยปี เช่น 5 หรือ 10; เป็นตัวหารในการคำนวณค่าเสื่อม ไม่ใช่วันหมดอายุ |
| `active` | BOOLEAN | TRUE / FALSE | NOT NULL | เสนอ: TRUE | เปิดให้เลือกประเภทนี้ในรายการ master หรือปิดการใช้งาน โดยยังคงข้อมูลเก่า |

<a id="asset"></a>

## 2. ASSET

**คำอธิบายตาราง:** ทะเบียนทรัพย์สินหลักของระบบ หนึ่งแถวคือ Main Asset หรือ Sub Asset หนึ่งรายการ ใช้ติดตามตั้งแต่ Draft ถึง Active และเชื่อมประวัติทั้งหมด

**แหล่งข้อมูล/สถานะ:** `src/data/mockAssets.js`, `src/hooks/useAssetStore.js`, `src/utils/subAssetDraftUtils.js`, `src/App.jsx`

**กติกา/ข้อควรเข้าใจ:** Hierarchy มีสองระดับและห้าม cycle/self-parent; sourceAssetId ไม่ใช่ parentAssetId. Customer ต้องมีชื่อ, ไม่มี child/lifecycle/DP. มูลค่าใช้ acquisitionValue ก่อน แล้วจึง fallback จาก linked non-Expense PO items ตาม utility ปัจจุบัน; ส่วนฐานคำนวณยอด PO ที่แชร์หลาย Asset ยังต้องกำหนด allocation. `draftOrigin` และ standalone Draft flow เป็น implementation gap ตาม ER notes

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `assetId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL; ห้ามเปลี่ยน/นำเลขเดิมกลับมาใช้ | ไม่มี — ระบบออกเลข | เลขทรัพย์สินที่ไม่ซ้ำและแสดงต่อผู้ใช้ เช่น ME-2026-0005 หรือ ME-2026-0005-1; mockup ใช้เลขนี้เป็น identity ด้วย |
| `parentAssetId` | VARCHAR | 128 ตัวอักษร | FK → ASSET.assetId; NULL ได้; ต้องชี้ Main Asset เท่านั้น | NULL | Main Asset ที่ Sub Asset สังกัด เช่น child -1 ชี้ ME-2026-0005; Main Asset เองไม่มี parent |
| `sourceAssetId` | VARCHAR | 128 ตัวอักษร | FK → ASSET.assetId; NULL ได้ | NULL | Asset ที่เลือกทำงานต้นทาง อาจเป็น Main หรือ Sub; ต่างจาก parentAssetId ที่ชี้ Main เสมอ |
| `assetTypeId` | VARCHAR | 128 ตัวอักษร | FK → ASSET_TYPE.assetTypeId; NULL ได้ระหว่าง migration/Draft; ต้องมีเมื่อข้อมูลพร้อมอนุมัติ | NULL | รหัสประเภททรัพย์สินสำหรับเชื่อม Useful Life; เสนอแทนการผูกผ่านข้อความ assetClass |
| `ownershipType` | VARCHAR | 16 ตัวอักษร | NOT NULL; CHECK IN (company, customer) | company — legacy ที่ไม่มีค่าเป็น company | เจ้าของทรัพย์สิน: company = TBKK, customer = ลูกค้า; ใช้ควบคุม Proposal, DP และ lifecycle |
| `customerName` | VARCHAR | 200 ตัวอักษร | NULL ได้สำหรับ company; ต้องไม่ว่างเมื่อ ownershipType=customer | NULL สำหรับ company | ชื่อลูกค้าเจ้าของทรัพย์สิน เช่น Customer A; ไม่ใช่ vendor ที่ขายทรัพย์สิน |
| `projectCode` | VARCHAR | 80 ตัวอักษร | Logical FK → PROJECT.projectCode; NULL ได้; free-text code ยังมีใน mockup | NULL | รหัสโครงการที่ Asset เกี่ยวข้อง ใช้ค้นหา/เลือก Asset ภายใต้ Project ใน Proposal |
| `projectName` | VARCHAR | 200 ตัวอักษร | NULL ได้; ไม่ใช่ FK | NULL | ชื่อโครงการ ณ เวลาที่บันทึก Asset เป็น snapshot สำหรับอ่านย้อนหลัง |
| `draftOrigin` | VARCHAR | 80 ตัวอักษร | NULL ได้; compatibility field ของ implemented flow ไม่ใช่กฎใหม่ | NULL | ช่องทางที่ Draft ถูกสร้าง เช่น Create Sub Asset; โค้ดใช้แยก Draft ที่มีเลข child อยู่แล้วเพื่อใช้ record เดิมเมื่อ Save Proposal |
| `workType` | VARCHAR | 32 ตัวอักษร | NULL ได้สำหรับ Asset ใหม่ทั่วไป; CHECK IN (subAsset, modification, maintenance) เมื่อมีค่า | NULL | ประเภทงานที่ทำให้เกิด Asset นี้: subAsset, modification หรือ maintenance; เก็บ origin แม้ Active แล้ว |
| `proposalItemId` | VARCHAR | 128 ตัวอักษร | FK → PROPOSAL_ITEM.itemId; NULL ได้ก่อนมี Proposal | NULL | รายการ Proposal ต้นทางของ child ใช้ตามกลับไปยังเหตุผล/ต้นทุนที่สร้าง Asset |
| `activatedAt` | TIMESTAMP WITH TIME ZONE | ความละเอียด 3 ตำแหน่ง (ms) | NULL ได้ก่อน Active; ระบบกำหนดเมื่อ final approve | NULL | วันเวลาที่ Accounting final approval ทำให้ Asset Active; ไม่ใช่วันที่เริ่มค่าเสื่อม |
| `name` | VARCHAR | 200 ตัวอักษร | NOT NULL; ห้ามข้อความว่าง | ไม่มี | ชื่อทรัพย์สิน เช่น Transfer Conveyor ใช้แสดงในทะเบียนและเอกสาร |
| `model` | VARCHAR | 120 ตัวอักษร | NULL ได้ระหว่าง Draft; ต้องครบก่อน submit verification | NULL | รุ่นของเครื่อง/อุปกรณ์ เช่น TC-8800; child ใช้รุ่น component ของตัวเอง |
| `custodian` | VARCHAR | 200 ตัวอักษร | NULL ได้ระหว่าง Draft; ต้องครบก่อน submit verification | NULL | ชื่อผู้ดูแล/ผู้รับผิดชอบ Asset ปัจจุบัน; ยังเป็นข้อความ ไม่ได้ผูก ADMIN_USER |
| `department` | VARCHAR | 120 ตัวอักษร | NULL ได้; ยังไม่เป็น Organization FK | NULL | แผนกที่ Asset อยู่ปัจจุบัน เปลี่ยนได้หลัง Transfer complete |
| `plant` | VARCHAR | 120 ตัวอักษร | NULL ได้ระหว่าง Draft; ต้องครบก่อน submit verification | NULL | โรงงานปัจจุบัน เช่น Plant 1; ใช้จัดกลุ่มและโอนย้าย |
| `location` | VARCHAR | 200 ตัวอักษร | NULL ได้ระหว่าง Draft; ต้องครบก่อน submit verification | NULL | สถานที่ติดตั้ง/เก็บ Asset ปัจจุบัน |
| `line` | VARCHAR | 120 ตัวอักษร | NULL ได้ระหว่าง Draft; ต้องครบก่อน submit verification | NULL | สายการผลิตปัจจุบัน เช่น Line C |
| `power` | VARCHAR | 120 ตัวอักษร | NULL ได้ระหว่าง Draft; ต้องครบก่อน submit verification | NULL | รายละเอียดกำลัง/ไฟฟ้า เช่น 380 VAC, 50 Hz; เก็บข้อความพร้อมหน่วย ไม่ใช่ยอดเงิน |
| `area` | VARCHAR | 120 ตัวอักษร | NULL ได้ระหว่าง Draft; ต้องครบก่อน submit verification | NULL | พื้นที่ใช้งาน เช่น Assembly; ไม่ใช่จำนวนพื้นที่ตารางเมตร |
| `targetSop` | DATE | YYYY-MM-DD | NULL ได้ระหว่าง Draft; ต้องครบก่อน submit verification | NULL | วันที่ตั้งเป้าเริ่มผลิต/ใช้งาน (Start of Production) ตามที่ขอ; ต่างจาก confirmedSop และ depreciationStartDate |
| `status` | VARCHAR | 80 ตัวอักษร | NOT NULL; controlled values ตาม workflow/ER notes | Draft สำหรับการสร้างใหม่; child จาก Proposal = Proposal Processing | สถานะ Asset master เช่น Draft, Proposal Processing, Ready for Verification, Active; ไม่ใช้แทนสถานะ Transfer/Expense |
| `acquisitionValue` | DECIMAL | 18,2 (จำนวนเต็ม 16 / ทศนิยม 2) | NULL ได้ก่อนทราบต้นทุน; CHECK >= 0; Expense ไม่เพิ่มค่า Parent | NULL — ห้ามใช้ 0 แทนยังไม่ทราบ | มูลค่าต้นทุนของ Asset หน่วย THB ใช้เป็นฐานค่าเสื่อม เช่น ราคา 500000 + ติดตั้ง 30000 + ขนส่ง 10000 = 540000; child มีมูลค่าของตัวเอง |
| `depreciationStartDate` | DATE | YYYY-MM-DD | NULL ได้ก่อน Accounting review; ต้อง NULL สำหรับ customer; company ต้องมีเมื่อ final approve | NULL | วันที่ Accounting กำหนดให้เริ่มนับค่าเสื่อม; ไม่จำเป็นต้องตรง Target SOP หรือ activatedAt |

<a id="mis-proposal"></a>

## 3. MIS_PROPOSAL

**คำอธิบายตาราง:** ข้อมูลอ้างอิงหัวเอกสาร Proposal ของ MIS หนึ่งแถวคือหนึ่ง Proposal; รายการ Asset และค่าใช้จ่ายแยกอยู่ PROPOSAL_ITEM/ITEM_COST

**แหล่งข้อมูล/สถานะ:** `src/hooks/useMISProposalStore.js`, `src/pages/MISCreateProposalPage.jsx`

**กติกา/ข้อควรเข้าใจ:** Proposal อาจมีหลาย Asset และหลาย PO; Customer Proposal เลือกเฉพาะ available Customer Draft. Header budget ใน UI ที่รองรับ item เดียวยังต้องปรับเมื่อรองรับหลาย item อย่านำ budget เดียวไปนับซ้ำทุก item

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `proposalId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — MIS/ตัวจำลองออกเลข | เลข Proposal เช่น PROP-2026-0012 สำหรับตามเอกสารจัดซื้อ |
| `ownershipType` | VARCHAR | 16 ตัวอักษร | NOT NULL; CHECK IN (company, customer); ตรวจทุก item ให้ตรง header | company ในฟอร์มปัจจุบัน | ชนิดเจ้าของที่เลือกตั้งแต่เริ่ม Proposal; ทุก Asset ในเอกสารต้องเป็นชนิดเดียวกัน |
| `proposalName` | VARCHAR | 200 ตัวอักษร | NOT NULL; ห้ามข้อความว่าง | ไม่มี | ชื่อเรื่อง/ชื่องาน Proposal; ปัจจุบันนำไปเป็นชื่อ Modification/Maintenance ด้วย |
| `proposalType` | VARCHAR | 16 ตัวอักษร | NOT NULL; CHECK IN (Buy, Sales); semantics ฝั่ง Sales ยังต้องยืนยัน | Buy ในฟอร์มปัจจุบัน | ประเภทเอกสารที่ฟอร์มแสดง Buy หรือ Sales; ไม่ใช่ New/Existing Asset |
| `projectCode` | VARCHAR | 80 ตัวอักษร | Logical FK → PROJECT.projectCode; ต้องมีเมื่อ Save; mockup ยังให้พิมพ์เอง | ไม่มี — ผู้ใช้เลือก/กรอก | รหัสโครงการของ Proposal; UI ปัจจุบันกรอง Asset ตามรหัสนี้ |
| `projectName` | VARCHAR | 200 ตัวอักษร | NOT NULL เมื่อ Save | ไม่มี | ชื่อโครงการที่เก็บในเอกสารเป็น snapshot; ไม่ควรเปลี่ยนย้อนหลังเมื่อ master เปลี่ยนชื่อ |
| `department` | VARCHAR | 120 ตัวอักษร | NOT NULL เมื่อ Save; ข้อความอ้างอิง MIS | ไม่มี — รับจาก MIS/ฟอร์ม | แผนกผู้ขอ Proposal/ใช้ budget |
| `section` | VARCHAR | 120 ตัวอักษร | NOT NULL เมื่อ Save; ข้อความอ้างอิง MIS | ไม่มี — รับจาก MIS/ฟอร์ม | หน่วยงานย่อยของแผนกตามข้อมูล MIS |
| `accountCode` | VARCHAR | 40 ตัวอักษร | NOT NULL เมื่อ Save | ไม่มี — รับจาก MIS/ฟอร์ม | รหัสบัญชีในหัวเอกสาร ใช้เป็นค่าเริ่มต้นให้ item; ไม่ใช่ treatment จาก threshold |
| `factory` | VARCHAR | 120 ตัวอักษร | NOT NULL เมื่อ Save | ไม่มี — รับจาก MIS/ฟอร์ม | โรงงาน/บริษัทตามเอกสาร MIS; เป็นบริบทเอกสารไม่ใช่ Asset assignment ที่อัปเดตล่าสุด |
| `location` | VARCHAR | 200 ตัวอักษร | NOT NULL เมื่อ Save | ไม่มี — รับจาก MIS/ฟอร์ม | สถานที่ของหัว Proposal; เก็บ snapshot ของคำขอ |
| `budgetType` | VARCHAR | 80 ตัวอักษร | NOT NULL เมื่อ Save; values อ้าง MIS | ไม่มี — รับจาก MIS/ฟอร์ม | ป้ายชนิดงบของ header เช่น Capital expenditure หรือ Expense; ไม่ใช้แทนการจำแนกแต่ละ item |
| `inBudget` | DECIMAL | 18,2 (จำนวนเต็ม 16 / ทศนิยม 2) | NOT NULL; CHECK >= 0 | ไม่มี — ผู้ใช้กำหนด | ยอดงบในแผน หน่วย THB ของหัวเอกสาร |
| `outOfBudget` | DECIMAL | 18,2 (จำนวนเต็ม 16 / ทศนิยม 2) | NOT NULL; CHECK >= 0 | 0 ในฟอร์มปัจจุบัน | ยอดงบนอกแผน หน่วย THB ของหัวเอกสาร |
| `productionLine` | VARCHAR | 120 ตัวอักษร | NULL ได้ | NULL | สายการผลิตของหัว Proposal; เป็นบริบทงาน/งบ |
| `relatedDepartment` | VARCHAR | 120 ตัวอักษร | NULL ได้ | NULL | แผนกอื่นที่เกี่ยวข้องกับคำขอ |
| `investmentPlanNo` | VARCHAR | 128 ตัวอักษร | NULL ได้ | NULL | เลขแผนลงทุนไว้ตามเอกสารอ้างอิง |
| `partNo` | VARCHAR | 128 ตัวอักษร | FK → MIS_PART.partNo; NULL ได้ | NULL | รหัส Part ที่เลือกจาก MIS Part browser; ไม่ใช่รายการเบิก spare part |
| `partModel` | VARCHAR | 120 ตัวอักษร | NULL ได้ | NULL | รุ่นของ Part ณ เวลาสร้าง Proposal; snapshot จาก Part browser |
| `budget` | DECIMAL | 18,2 (จำนวนเต็ม 16 / ทศนิยม 2) | NOT NULL; CHECK >= 0; snapshot/derived จากฟอร์ม | ไม่มี — คำนวณตอน Save | ยอดงบรวมในหัวเอกสาร; ปัจจุบันคำนวณ inBudget + outOfBudget และใช้เป็น base amount ของ item เดียว |
| `periodStart` | DATE | YYYY-MM-DD | NOT NULL เมื่อ Save | วันปัจจุบันในฟอร์ม — ไม่ใช่ SQL default | วันเริ่มช่วงโครงการ/งบของเอกสาร |
| `periodEnd` | DATE | YYYY-MM-DD | NOT NULL เมื่อ Save; CHECK >= periodStart | periodStart + 1 ปีในฟอร์ม — ไม่ใช่ SQL default | วันสิ้นสุดช่วงโครงการ/งบ |
| `comment` | TEXT | ไม่กำหนดความยาวตายตัว | NULL ได้ | NULL | หมายเหตุเพิ่มเติมใน Proposal |
| `attachmentName` | VARCHAR | 255 ตัวอักษร | NULL ได้; ไม่ใช่ file FK | NULL | ชื่อไฟล์แนบ legacy ของ Proposal; ชื่อไฟล์ไม่เท่ากับมีไฟล์จริงที่จัดเก็บ |
| `status` | VARCHAR | 80 ตัวอักษร | NOT NULL; values จาก MIS workflow | Pending Approval เมื่อ Save ใน mockup | สถานะเอกสาร Proposal ใน MIS เช่น Pending Approval หรือ Approved |
| `savedAt` | TIMESTAMP WITH TIME ZONE | ความละเอียด 3 ตำแหน่ง (ms) | NOT NULL เมื่อ Save | ไม่มี — ระบบกำหนดเวลาตอน Save | วันเวลาที่ Save Proposal สำเร็จในตัวจำลอง; ใช้ผูกเวลาสร้างงาน/child |

<a id="proposal-item"></a>

## 4. PROPOSAL_ITEM

**คำอธิบายตาราง:** รายการ Asset/งานภายใน Proposal หนึ่งแถวคือหนึ่งขอบเขตต้นทุนของ Asset ที่เลือก แยกงานต้นทางจาก Asset ที่เกิดขึ้นจริง

**แหล่งข้อมูล/สถานะ:** `src/utils/proposalAssetUtils.js`, `src/pages/MISCreateProposalPage.jsx`; แยกจาก proposal.assetItems

**กติกา/ข้อควรเข้าใจ:** existing ทั้งสามชนิด > 50000 THB ต้องสร้าง child; <= 50000 เป็น Expense. Capitalized บน Sub สร้าง sibling under Main. current item.assetId ถูกสลับไป child จึงเสนอ sourceAssetId/resultingAssetId แยกกัน; อ่าน implementation gap ใน ER notes

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `itemId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — ระบบสร้าง logical ID | ID ของรายการ Proposal ใช้เชื่อม PR/PO/lifecycle; ต้อง unique ข้ามเอกสารเมื่อใช้เป็น PK |
| `proposalId` | VARCHAR | 128 ตัวอักษร | FK → MIS_PROPOSAL.proposalId; NOT NULL | ไม่มี | Proposal ที่รายการนี้สังกัด |
| `sourceAssetId` | VARCHAR | 128 ตัวอักษร | FK → ASSET.assetId; NOT NULL | ไม่มี | Asset ที่เลือกเดิม: Draft สำหรับ New หรือ Active Main/Sub สำหรับ existing work; ต้องรักษาแม้สร้าง child แล้ว |
| `resultingAssetId` | VARCHAR | 128 ตัวอักษร | FK → ASSET.assetId; NULL ได้; Expense ต้อง NULL | NULL — ระบบกำหนดตาม treatment | Asset ที่เข้าสู่ acquisition: Draft เดิมสำหรับ New หรือ child สำหรับ Capitalized; Expense ไม่มีผลลัพธ์เป็น Asset |
| `assetMode` | VARCHAR | 16 ตัวอักษร | NOT NULL; CHECK IN (new, existing) | ไม่มี — กำหนดตาม Asset ที่เลือก | บอกเป็นการซื้อ Asset ใหม่หรือทำงานกับ Asset เดิม |
| `workType` | VARCHAR | 32 ตัวอักษร | NULL ได้สำหรับ new; ต้องมีสำหรับ existing | NULL สำหรับ new | ชนิดงาน existing: subAsset / modification / maintenance; ใช้แสดง origin ในประวัติ |
| `workName` | VARCHAR | 200 ตัวอักษร | ต้องมีสำหรับ existing; NULL ได้สำหรับ new | NULL | ชื่อ component/งานที่ขอ เช่น Safety guard upgrade; ใช้ตั้งชื่อ child หรือชื่อ event |
| `description` | TEXT | ไม่กำหนดความยาวตายตัว | NULL ได้ | NULL | รายละเอียดงาน/เหตุผลหรือขอบเขตที่ต้องดำเนินการ |
| `model` | VARCHAR | 120 ตัวอักษร | NULL ได้; ต้องครบตาม child verification ก่อน submit | NULL | รุ่น component ใหม่ที่จะใส่ child; ไม่คัดลอก purchasing history จาก Parent |
| `power` | VARCHAR | 120 ตัวอักษร | NULL ได้; ต้องครบตาม child verification ก่อน submit | NULL | กำลัง/ไฟฟ้าของ component ใหม่ |
| `targetSop` | DATE | YYYY-MM-DD | NULL ได้ก่อนข้อมูลครบ; DATE ที่ถูกต้อง | NULL | วันที่เป้าหมายใช้งาน component ใหม่ |
| `assetAmount` | DECIMAL | 18,2 (จำนวนเต็ม 16 / ทศนิยม 2) | NOT NULL; CHECK >= 0 | ไม่มี — ผู้ใช้กำหนด | ยอด base amount หน่วย THB ก่อนรวม ITEM_COST; ใช้รวมเพื่อเทียบ threshold 50000 |
| `accountCode` | VARCHAR | 40 ตัวอักษร | NULL ได้; รับจาก item หรือ header | ไม่มี SQL default — ฟอร์มรับจาก header | รหัสบัญชีของรายการ Asset/งาน |
| `ownershipType` | VARCHAR | 16 ตัวอักษร | NOT NULL; CHECK IN (company, customer); ต้องตรง Proposal/source | ไม่มี — copy จาก source | snapshot ownership ของ Asset ที่เลือกตอน Save; ใช้ตรวจว่าไม่ผสมเจ้าของต่างชนิดใน Proposal |
| `customerName` | VARCHAR | 200 ตัวอักษร | NULL ได้สำหรับ company; ต้องไม่ว่างสำหรับ customer | NULL สำหรับ company | snapshot ชื่อลูกค้าของรายการ Customer Asset; company ไม่ต้องมี |
| `workOnExistingAsset` | BOOLEAN | TRUE / FALSE | NOT NULL หากเก็บ compatibility flag; ห้ามใช้ข้ามกฎข้อ 28 | เสนอ: FALSE | flag โค้ดปัจจุบันที่ทำ Modification/Maintenance บน Active โดยไม่สร้าง child แม้ Capitalized; ใช้อธิบายข้อมูลเก่า ไม่ใช่ confirmed business rule |
| `costTreatment` | VARCHAR | 32 ตัวอักษร | NOT NULL; CHECK IN (New Asset, Capitalized, Expense); คำนวณตามกฎ | ไม่มี — ระบบคำนวณตอน Save | ผลจำแนกต้นทุน: New Asset, Capitalized หรือ Expense; existing ใช้ยอด base + scoped costs |

<a id="item-cost"></a>

## 5. ITEM_COST

**คำอธิบายตาราง:** ต้นทุนเพิ่มเติมของแต่ละ Proposal item หนึ่งแถวคือหนึ่งค่าใช้จ่าย เช่น ติดตั้งหรือขนส่ง ไม่ใช่ค่าใช้จ่ายรวมที่ไม่มี Asset เจ้าของ

**แหล่งข้อมูล/สถานะ:** proposal.assetItems[].costs ใน `MISCreateProposalPage.jsx`

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `costId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — ระบบสร้าง ID | ID ของแถวต้นทุนที่เสนอเพิ่มเมื่อแยก nested costs เป็นตาราง |
| `itemId` | VARCHAR | 128 ตัวอักษร | FK → PROPOSAL_ITEM.itemId; NOT NULL | ไม่มี | รายการ Proposal ที่รับต้นทุนนี้; ใช้รวม base + costs |
| `type` | VARCHAR | 80 ตัวอักษร | NOT NULL; ห้ามข้อความว่าง | ไม่มี | ชื่อชนิดค่าใช้จ่าย เช่น Installation, Delivery, Other cost; ปัจจุบันอาจใช้ description เป็น type |
| `accountCode` | VARCHAR | 40 ตัวอักษร | NULL ได้; อ้างข้อมูล MIS | ไม่มี SQL default — ฟอร์มปัจจุบันใช้ A | รหัสบัญชีของค่าใช้จ่ายเพิ่มเติมแต่ละแถว |
| `description` | TEXT | ไม่กำหนดความยาวตายตัว | NULL ได้ใน logical model; UI budget detail ต้องกรอก | NULL | รายละเอียดค่าใช้จ่าย เช่น ค่าติดตั้งระบบไฟฟ้า |
| `amount` | DECIMAL | 18,2 (จำนวนเต็ม 16 / ทศนิยม 2) | NOT NULL; CHECK >= 0 | ไม่มี — ผู้ใช้กำหนด | ยอดค่าใช้จ่ายเพิ่มเติม หน่วย THB ใช้รวมเป็นต้นทุน item |

<a id="mis-pr"></a>

## 6. MIS_PR

**คำอธิบายตาราง:** หัวเอกสารใบขอซื้อ (Purchase Requisition) จาก MIS หนึ่งแถวคือหนึ่ง PR ที่อ้าง Proposal

**แหล่งข้อมูล/สถานะ:** `useMISPurchasingStore.js`, `MISCreatePRPage.jsx`

**กติกา/ข้อควรเข้าใจ:** PR/Proposal header cardinality แสดงตาม implementation ไม่ใช่ข้อยืนยัน integration ของ MIS ในอนาคต

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `prNo` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — MIS/ตัวจำลองออกเลข | เลขใบขอซื้อ เช่น PR-2026-0013 |
| `proposalId` | VARCHAR | 128 ตัวอักษร | FK → MIS_PROPOSAL.proposalId; NOT NULL | ไม่มี | Proposal ที่อนุมัติแล้วและเป็นต้นทางของ PR |
| `requestTitle` | VARCHAR | 200 ตัวอักษร | NOT NULL; ห้ามข้อความว่าง | ไม่มี SQL default — ฟอร์มช่วยเติมจาก Proposal | หัวข้อใบขอซื้อ ใช้อธิบายสิ่งที่ขอจัดซื้อ |
| `requestedDate` | DATE | YYYY-MM-DD | NOT NULL | วันปัจจุบันในฟอร์ม — ไม่ใช่ SQL default | วันที่ขอซื้อบนเอกสาร PR |
| `reason` | TEXT | ไม่กำหนดความยาวตายตัว | NULL ได้ | NULL — ฟอร์มมีตัวอย่างข้อความ | เหตุผลการขอซื้อ/หมายเหตุเอกสาร |
| `status` | VARCHAR | 80 ตัวอักษร | NOT NULL; controlled values จาก MIS | Pending Approval เมื่อสร้างใน mockup | สถานะ PR ของ MIS เช่น Pending Approval / Approved |
| `createdAt` | TIMESTAMP WITH TIME ZONE | ความละเอียด 3 ตำแหน่ง (ms) | NOT NULL | ไม่มี — ระบบกำหนดเวลาเมื่อสร้าง | วันเวลาที่สร้าง/บันทึก PR ในตัวจำลอง |

<a id="pr-item"></a>

## 7. PR_ITEM

**คำอธิบายตาราง:** รายการภายใน PR หนึ่งแถวคือรายการขอซื้อที่คัดลอกขอบเขตจาก Proposal item พร้อมเก็บต้นทุน ณ เวลาขอซื้อ

**แหล่งข้อมูล/สถานะ:** purchaseRequisitions[].assetItems; `MISCreatePRPage.jsx`

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `prItemId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — ระบบสร้าง ID | ID ภายในของรายการ PR ที่เสนอเพิ่มเพื่อแยกจาก nested object |
| `prNo` | VARCHAR | 128 ตัวอักษร | FK → MIS_PR.prNo; NOT NULL | ไม่มี | ใบขอซื้อที่รายการนี้สังกัด |
| `proposalItemId` | VARCHAR | 128 ตัวอักษร | FK → PROPOSAL_ITEM.itemId; NOT NULL | ไม่มี | รายการ Proposal ต้นทาง ใช้ตามขอบเขต Asset/งานและค่าต้นทุน |
| `amountSnapshot` | DECIMAL | 18,2 (จำนวนเต็ม 16 / ทศนิยม 2) | NOT NULL; CHECK >= 0 | ไม่มี — copy จาก Proposal item | ยอด base amount หน่วย THB ณ เวลาสร้าง PR; snapshot ไม่เปลี่ยนตาม Proposal ที่แก้ภายหลัง |
| `costsSnapshot` | JSON | ตามโครงสร้างข้อมูล; DB-dependent | NOT NULL; JSON array | เสนอ: [] เมื่อไม่มีต้นทุนเพิ่มเติม | array ของต้นทุนเพิ่มเติม ณ เวลาสร้าง PR เช่น type/accountCode/description/amount |

<a id="mis-po"></a>

## 8. MIS_PO

**คำอธิบายตาราง:** หัวเอกสารใบสั่งซื้อ (Purchase Order) จาก MIS หนึ่งแถวคือหนึ่ง PO มีหลาย PO item และหลาย Invoice ได้

**แหล่งข้อมูล/สถานะ:** `useMISPurchasingStore.js`, `MISCreatePOPage.jsx`

**กติกา/ข้อควรเข้าใจ:** อย่าบังคับ 1 PO = 1 Asset; final PO/PO Item/Asset cardinality ยัง OPEN

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `poNo` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — MIS/ตัวจำลองออกเลข | เลขใบสั่งซื้อ เช่น PO-2026-0097 ใช้ให้ Invoice/GR อ้าง PO เดียวกัน |
| `prNo` | VARCHAR | 128 ตัวอักษร | FK → MIS_PR.prNo; NULL ได้สำหรับ imported/legacy | NULL | PR ต้นทางของ PO; demo/imported PO อาจยังไม่มี PR reference |
| `vendor` | VARCHAR | 200 ตัวอักษร | NOT NULL เมื่อสร้าง PO ใหม่; ห้ามข้อความว่าง | ไม่มี — รับจาก MIS/ผู้ใช้ | ชื่อผู้ขาย เช่น Daifuku (Thailand) Ltd.; ยังเป็นข้อความไม่ใช่ Vendor master FK |
| `orderDate` | DATE | YYYY-MM-DD | NOT NULL เมื่อสร้างใหม่; NULL ได้เมื่อ import ไม่ครบ | ไม่มี SQL default — ฟอร์มใช้วันปัจจุบัน | วันที่สั่งซื้อบนเอกสาร PO |
| `expectedDelivery` | DATE | YYYY-MM-DD | NULL ได้สำหรับ imported; เมื่อมีค่า CHECK >= orderDate | ไม่มี SQL default — ฟอร์มใช้ orderDate + 30 วัน | วันที่คาดว่าจะส่งของ ใช้ติดตามการส่งมอบ |
| `shipTo` | VARCHAR | 200 ตัวอักษร | NULL ได้ | NULL — ฟอร์มช่วยเติมจาก PR | สถานที่ให้ Vendor ส่งของ; snapshot ของเอกสาร ไม่ใช่ location ล่าสุดของ Asset |
| `comment` | TEXT | ไม่กำหนดความยาวตายตัว | NULL ได้ | NULL | หมายเหตุ/เงื่อนไขเพิ่มเติมใน PO |
| `status` | VARCHAR | 80 ตัวอักษร | NOT NULL; values จาก MIS | Pending Approval เมื่อสร้างใหม่ใน mockup | สถานะ PO เช่น Pending Approval หรือ Approved; ใช้ยืนยันว่า PO รับของได้ |
| `createdAt` | TIMESTAMP WITH TIME ZONE | ความละเอียด 3 ตำแหน่ง (ms) | NULL ได้สำหรับ legacy/imported | ไม่มี — ระบบกำหนดเมื่อสร้าง | วันเวลาสร้าง PO ในตัวจำลอง; demo/imported อาจไม่มี |

<a id="po-item"></a>

## 9. PO_ITEM

**คำอธิบายตาราง:** รายการสินค้า/งานในใบสั่งซื้อ หนึ่งแถวคือหนึ่งเลขรายการภายใต้ PO ใช้แยก ordered quantity, cost และ document-time treatment

**แหล่งข้อมูล/สถานะ:** purchaseOrders[].assetItems; `MISCreatePOPage.jsx`

**กติกา/ข้อควรเข้าใจ:** ต้องยืนยันยอดต่อหน่วย/ยอดรวมและการแบ่งต้นทุนเมื่อ PO item เชื่อมหลาย Asset ก่อนนำไปทำฐานข้อมูลจริง

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `poItemId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — ระบบสร้าง ID | ID ภายใน PO line ที่เสนอเพิ่ม; แยกจาก itemNo ที่อาจซ้ำข้าม PO |
| `poNo` | VARCHAR | 128 ตัวอักษร | FK → MIS_PO.poNo; NOT NULL | ไม่มี | ใบสั่งซื้อที่ line นี้สังกัด |
| `prItemId` | VARCHAR | 128 ตัวอักษร | FK → PR_ITEM.prItemId; NULL ได้ | NULL | รายการ PR ต้นทาง; demo/imported line อาจยังตามไม่ได้ |
| `itemNo` | VARCHAR | 40 ตัวอักษร | NOT NULL; UNIQUE (poNo, itemNo) | ไม่มี — รับจาก MIS/ตัวจำลอง | เลขรายการบน PO เช่น 10 หรือ 20; ไม่ unique ข้าม PO |
| `orderedQuantity` | DECIMAL | 18,4 (จำนวนเต็ม 14 / ทศนิยม 4) | NOT NULL; CHECK > 0 | เสนอ: 1 สำหรับ mockup ที่ไม่ส่งจำนวนมา | จำนวนที่สั่งซื้อของ line หน่วยตาม unitOfMeasure; ไม่ใช่จำนวน Asset records ที่ต้องสร้าง |
| `unitOfMeasure` | VARCHAR | 32 ตัวอักษร | NOT NULL; ห้ามข้อความว่าง | ไม่มี SQL default — mockup fallback เป็น asset | หน่วยสั่งซื้อ เช่น asset, piece หรือ set |
| `assetAmountSnapshot` | DECIMAL | 18,2 (จำนวนเต็ม 16 / ทศนิยม 2) | NULL ได้เมื่อ import ไม่ครบ; CHECK >= 0 | NULL | ยอด base amount ของ line หน่วย THB ณ เวลาออก PO; utility ปัจจุบันคูณ quantity เมื่อใช้ fallback มูลค่า |
| `costsSnapshot` | JSON | ตามโครงสร้างข้อมูล; DB-dependent | NOT NULL; JSON array | เสนอ: [] | array ค่าใช้จ่ายเพิ่มเติมจากเอกสารต้นทาง ณ เวลาออก PO |
| `costTreatmentSnapshot` | VARCHAR | 32 ตัวอักษร | NULL ได้สำหรับ legacy; CHECK controlled treatment เมื่อมีค่า | NULL — copy จากต้นทาง | New Asset / Capitalized / Expense ณ เวลาออก PO; Expense ต้องไม่รวมฐาน DP Parent |

<a id="po-item-allocation"></a>

## 10. PO_ITEM_ALLOCATION

**คำอธิบายตาราง:** ตารางเชื่อมแบบเสนอระหว่าง PO item กับ Proposal item เพื่อรองรับการจัดสรรหลายรายการอย่างยืดหยุ่น หนึ่งแถวคือหนึ่งคู่การจัดสรร

**แหล่งข้อมูล/สถานะ:** Proposed entity — ยังไม่มี allocation store ใน mockup

**กติกา/ข้อควรเข้าใจ:** ทั้งหมดเป็น proposed flexibility ไม่ยืนยัน many-to-many เป็น business rule. ต้องกำหนด conservation ของยอด/จำนวนและ receipt allocation ก่อน production

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `allocationId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — ระบบสร้าง ID | ID ของการจัดสรรหนึ่งคู่ PO item/Proposal item |
| `poItemId` | VARCHAR | 128 ตัวอักษร | FK → PO_ITEM.poItemId; NOT NULL; UNIQUE คู่กับ proposalItemId | ไม่มี | PO line ที่แบ่งขอบเขตให้รายการ Proposal |
| `proposalItemId` | VARCHAR | 128 ตัวอักษร | FK → PROPOSAL_ITEM.itemId; NOT NULL; UNIQUE คู่กับ poItemId | ไม่มี | รายการ Proposal/Asset scope ที่ได้รับการจัดสรร |
| `allocatedQuantity` | DECIMAL | 18,4 (จำนวนเต็ม 14 / ทศนิยม 4) | NULL ได้ระหว่างรอยืนยัน allocation; CHECK > 0 เมื่อมีค่า | NULL — ห้ามเดาเป็นจำนวน PO ทั้งหมด | จำนวนของ PO line ที่จัดสรรให้ Proposal item; วิธีแบ่งยังไม่ยืนยัน |
| `allocatedValue` | DECIMAL | 18,2 (จำนวนเต็ม 16 / ทศนิยม 2) | NULL ได้ระหว่างรอยืนยัน; CHECK >= 0 เมื่อมีค่า | NULL | มูลค่า THB ที่จัดสรรให้ Proposal item; ต้องไม่บวกยอดเต็มซ้ำทุก Asset |

<a id="mis-invoice"></a>

## 11. MIS_INVOICE

**คำอธิบายตาราง:** ข้อมูลอ้างอิง Invoice ที่ Vendor ส่งมาสำหรับ PO หนึ่งแถวคือหนึ่งเอกสาร Invoice แยกจาก GR และไม่ได้ใช้ทำ accounting 3-way matching

**แหล่งข้อมูล/สถานะ:** vendorInvoices ใน `useMISPurchasingStore.js`, Asset invoiceReferences และ GR invoiceReference

**กติกา/ข้อควรเข้าใจ:** Invoice item quantity เป็น delivery information แยกจากจำนวนรับจริงใน GR. UI Vendor ปัจจุบันมี amount matching ซึ่งเป็น documented gap; ไม่มี Invoice stock/reconciliation workflow ใน Asset system

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `invoiceId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — ระบบสร้าง ID | ID ภายในที่เสนอเพิ่ม เพราะ invoiceNo ไม่ยืนยันว่า unique ทั่วระบบ |
| `poNo` | VARCHAR | 128 ตัวอักษร | FK → MIS_PO.poNo; NOT NULL | ไม่มี | PO ที่ Invoice อ้างอิง; receiving ตรวจให้ตรงกับ PO ของ GR/Asset scope |
| `invoiceNo` | VARCHAR | 128 ตัวอักษร | NOT NULL; ห้ามว่าง; proposed UNIQUE (poNo, invoiceNo) แบบ case-insensitive ตาม UI | ไม่มี | เลข Invoice จาก Vendor; โค้ดปัจจุบันใช้ field reference |
| `invoiceDate` | DATE | YYYY-MM-DD | NULL ได้สำหรับ legacy; vendor submit ใหม่ต้องมี | NULL | วันที่บน Invoice; legacy reference อาจไม่มีวันที่ |
| `documentName` | VARCHAR | 255 ตัวอักษร | NULL ได้สำหรับ legacy; vendor submit ใหม่ต้องมี | NULL | ชื่อไฟล์ Invoice ที่แนบ/สแกน; เป็น metadata ไม่ใช่ไฟล์จริงหรือหลักฐานว่าจัดเก็บ bytes แล้ว |
| `roundId` | VARCHAR | 36 ตัวอักษร | NULL ได้สำหรับ legacy; UUID ใน vendor submit | NULL — Vendor UI สร้างตอน Submit | ID รอบที่ Vendor submit Invoice หลายใบพร้อมกัน ใช้รวมเป็น batch |
| `submittedAt` | TIMESTAMP WITH TIME ZONE | ความละเอียด 3 ตำแหน่ง (ms) | NULL ได้สำหรับ legacy | NULL — ระบบกำหนดตอน Submit | เวลาที่ Vendor ยืนยันส่ง Invoice ในตัวจำลอง |
| `amount` | DECIMAL | 18,2 (จำนวนเต็ม 16 / ทศนิยม 2) | NULL ได้; CHECK >= 0 เมื่อมีค่า; ห้าม amount matching เป็น receiving gate | NULL | ยอดเงิน Invoice หน่วย THB สำหรับอ่านอ้างอิง; ไม่ใช้เทียบ PO เพื่อผ่าน/ไม่ผ่าน receiving |

<a id="mis-gr"></a>

## 12. MIS_GR

**คำอธิบายตาราง:** ข้อมูลอ้างอิงใบรับของ (Goods Receipt) จาก MIS หนึ่งแถวคือหนึ่งครั้งบันทึก GR หลัง PU + Asset Owner ตรวจรับ

**แหล่งข้อมูล/สถานะ:** goodsReceipts ใน `useMISPurchasingStore.js`, `MISCreateGRPage.jsx`

**กติกา/ข้อควรเข้าใจ:** GR references และ Invoice ต้อง PO เดียวกัน. หลาย GR ต่อ PO รองรับในแบบจำลองแต่ final partial policy ยัง OPEN; Completed Expense เป็นสถานะ event ไม่ใช่ GR header

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `grNo` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — MIS/ตัวจำลองออกเลข | เลขใบรับของ เช่น GR-0002 สำหรับตามหลักฐานรับของ/รับงาน |
| `poNo` | VARCHAR | 128 ตัวอักษร | FK → MIS_PO.poNo; NOT NULL | ไม่มี | PO ของการรับของครั้งนี้ ต้องเป็น PO เดียวกับ Invoice ที่อ้าง |
| `invoiceId` | VARCHAR | 128 ตัวอักษร | FK → MIS_INVOICE.invoiceId; NULL ได้ระหว่าง legacy import; ต้อง resolve ก่อน Complete | NULL | Invoice ที่ GR อ้าง; โค้ดเก็บ invoiceReference เป็นข้อความ จึงเสนอ normalize เป็น FK |
| `receivedDate` | DATE | YYYY-MM-DD | NOT NULL | วันปัจจุบันในฟอร์ม — ไม่ใช่ SQL default | วันที่รับของ/งานจริงบน GR ไม่ใช่เวลาที่ระบบบันทึก |
| `goodsChecked` | BOOLEAN | TRUE / FALSE | NOT NULL; ต้อง TRUE ก่อน valid completion | เสนอ: FALSE ก่อนยืนยัน | PU + Asset Owner ยืนยันว่ารับของ/งานแล้ว; FALSE ยังไม่ใช่ยืนยันรับ |
| `comment` | TEXT | ไม่กำหนดความยาวตายตัว | NULL ได้ | NULL | หมายเหตุการรับของ/งาน |
| `status` | VARCHAR | 80 ตัวอักษร | NOT NULL; values จาก MIS | ไม่มี SQL default — mockup Save ใช้ Complete | สถานะเอกสาร GR; mockup Save ใส่ Complete แต่ไม่เท่ากับทุกงาน/ทุก Asset activation เสร็จ |
| `createdAt` | TIMESTAMP WITH TIME ZONE | ความละเอียด 3 ตำแหน่ง (ms) | NULL ได้สำหรับ demo/imported; ต้องมีสำหรับ record ใหม่ | ไม่มี — ระบบกำหนดตอน Save | เวลาบันทึก GR ในตัวจำลอง; ต่างจาก receivedDate |

<a id="gr-item"></a>

## 13. GR_ITEM

**คำอธิบายตาราง:** รายการที่รับของจริงใน GR หนึ่งแถวคือจำนวนรับของ PO line หนึ่งรายการในครั้งนั้น ใช้สะสมการรับบางส่วน

**แหล่งข้อมูล/สถานะ:** goodsReceipts[].assetItems; `MISCreateGRPage.jsx`, `grReceivingUtils.js`

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `grItemId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — ระบบสร้าง ID | ID ภายในรายการ GR ที่เสนอเพิ่มเมื่อแยก nested item |
| `grNo` | VARCHAR | 128 ตัวอักษร | FK → MIS_GR.grNo; NOT NULL | ไม่มี | GR ที่บันทึกการรับรายการนี้ |
| `poItemId` | VARCHAR | 128 ตัวอักษร | FK → PO_ITEM.poItemId; NOT NULL; ตรวจ PO consistency | ไม่มี | PO line ที่รับจริง ต้องอยู่ภายใต้ PO เดียวกับ GR |
| `receivedQuantity` | DECIMAL | 18,4 (จำนวนเต็ม 14 / ทศนิยม 4) | NOT NULL; CHECK > 0 | ไม่มี — กำหนดจากการรับจริง | จำนวนที่รับจริงครั้งนี้ ไม่ใช่จำนวนบน Invoice; ใช้รวมการรับหลายครั้ง |
| `unitOfMeasure` | VARCHAR | 32 ตัวอักษร | NOT NULL | ไม่มี — copy หน่วยจาก PO | หน่วยรับของของรายการ; ต้องสอดคล้องกับ PO หรือมี conversion ที่ยืนยันแล้ว |

<a id="receiving-validation"></a>

## 14. RECEIVING_VALIDATION

**คำอธิบายตาราง:** ผลตรวจเอกสารอ้างอิงและการรับของตามหนึ่ง allocation หนึ่งแถวคือหนึ่งผลตรวจในเวลาหนึ่ง แยกจากการยืนยันตัว Asset

**แหล่งข้อมูล/สถานะ:** เสนอแยก receivingValidations/receivingChecks จาก Asset และ lifecycle events

**กติกา/ข้อควรเข้าใจ:** booleans FALSE เริ่มต้นหมายถึงยังไม่ยืนยันผ่าน ให้ใช้ status แยก Pending/Failed. Complete ต้องผ่าน required references และ acceptance; Invoice amount/quantity ไม่เป็นเกณฑ์. Expense partial stays GR Received บน event

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `validationId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — ระบบสร้าง ID | ID ของผล Receiving Validation ที่เสนอเพิ่ม |
| `allocationId` | VARCHAR | 128 ตัวอักษร | FK → PO_ITEM_ALLOCATION.allocationId; NOT NULL | ไม่มี | ขอบเขต PO item/Proposal item ที่กำลังตรวจ ไม่เหมารวมทั้ง PO เป็น Asset เดียว |
| `poValid` | BOOLEAN | TRUE / FALSE | NOT NULL; TRUE เมื่อผ่านตรวจจริง | เสนอ: FALSE | PO มีอยู่และ valid สำหรับรับของหรือไม่ |
| `invoiceValid` | BOOLEAN | TRUE / FALSE | NOT NULL; TRUE เมื่อผ่านตรวจจริง | เสนอ: FALSE | มี Invoice document/reference ที่ถูกต้องและอ้าง PO เดียวกันหรือไม่; ไม่เทียบยอดเงิน |
| `grValid` | BOOLEAN | TRUE / FALSE | NOT NULL; TRUE เมื่อผ่านตรวจจริง | เสนอ: FALSE | มี GR ที่อ้าง PO เดียวกับขอบเขตรับของหรือไม่ |
| `accepted` | BOOLEAN | TRUE / FALSE | NOT NULL; TRUE เมื่อยืนยันรับจริง | เสนอ: FALSE | PU + Asset Owner ยอมรับของ/งานแล้วหรือไม่ |
| `receivedQuantity` | DECIMAL | 18,4 (จำนวนเต็ม 14 / ทศนิยม 4) | NULL ได้จนกว่าจะยืนยัน allocation semantics; CHECK >= 0 | NULL | จำนวนรับสะสมที่จัดสรรให้ scope นี้ ไม่ใช่เอา GR เต็มนับซ้ำทุก allocation |
| `status` | VARCHAR | 80 ตัวอักษร | NOT NULL; controlled validation state | เสนอ: Pending | ผลตรวจ เช่น Pending, Complete, Hold / Correction Required; ใช้แยกยังไม่ตรวจจากตรวจแล้วไม่ผ่าน |
| `remark` | TEXT | ไม่กำหนดความยาวตายตัว | NULL ได้; ควรมีเมื่อ Hold/Correction | NULL | เหตุผลที่รอ/ไม่ผ่านหรือคำอธิบายผลตรวจ |
| `validatedAt` | TIMESTAMP WITH TIME ZONE | ความละเอียด 3 ตำแหน่ง (ms) | NULL ได้ก่อนตรวจ | NULL — ระบบกำหนดเมื่อ validate | วันเวลาที่ทำการตรวจจริง ยังไม่มีเมื่ออยู่ Pending |

<a id="validation-gr"></a>

## 15. VALIDATION_GR

**คำอธิบายตาราง:** ตารางเชื่อมผล Receiving Validation กับ GR ที่นำมาใช้ตรวจ หนึ่งแถวคือหนึ่งคู่ validation/GR เพื่อรองรับหลายใบรับของ

**แหล่งข้อมูล/สถานะ:** Proposed bridge จาก goodsReceiptReferences

**กติกา/ข้อควรเข้าใจ:** Composite PK (validationId, grNo) ป้องกันใช้ GR เดิมซ้ำในผลตรวจเดียว

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `validationId` | VARCHAR | 128 ตัวอักษร | PK ร่วม; FK → RECEIVING_VALIDATION.validationId; NOT NULL | ไม่มี | ผลตรวจที่ใช้ GR นี้เป็นหลักฐาน |
| `grNo` | VARCHAR | 128 ตัวอักษร | PK ร่วม; FK → MIS_GR.grNo; NOT NULL | ไม่มี | GR ที่ใช้ตรวจ ต้อง PO เดียวกับ allocation ของ validation |

<a id="validation-invoice"></a>

## 16. VALIDATION_INVOICE

**คำอธิบายตาราง:** ตารางเชื่อมผล Receiving Validation กับ Invoice documents ที่ใช้ตรวจ หนึ่งแถวคือหนึ่งคู่ validation/Invoice

**แหล่งข้อมูล/สถานะ:** Proposed bridge จาก invoiceReferences

**กติกา/ข้อควรเข้าใจ:** Composite PK (validationId, invoiceId); ไม่ทำ Invoice line amount matching

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `validationId` | VARCHAR | 128 ตัวอักษร | PK ร่วม; FK → RECEIVING_VALIDATION.validationId; NOT NULL | ไม่มี | ผลตรวจที่ใช้ Invoice นี้ |
| `invoiceId` | VARCHAR | 128 ตัวอักษร | PK ร่วม; FK → MIS_INVOICE.invoiceId; NOT NULL | ไม่มี | Invoice ที่ใช้ตรวจ ต้องอ้าง PO เดียวกับ allocation ของ validation |

<a id="asset-verification"></a>

## 17. ASSET_VERIFICATION

**คำอธิบายตาราง:** ข้อมูลการตรวจยืนยันตัว Asset โดย Asset Team หนึ่งแถวคือหนึ่งรอบตรวจตาม logical model รวมผล/ข้อมูลเครื่องและ checklist ไม่ใช่การตรวจยอด Invoice

**แหล่งข้อมูล/สถานะ:** `AssetValidationWizard.jsx`; ปัจจุบันเก็บ form ใน validationDraft/assetControlSheet บน Asset; booleans checklist และ history table เป็นข้อเสนอ

**กติกา/ข้อควรเข้าใจ:** Submit ต้อง receiving complete + result Complete + required Asset info ครบ. ปัจจุบัน wizard เพิ่ม photos และ review sheet gate; checklist booleans เป็น proposed normalization ไม่ใช่ fields ที่ UI บันทึกครบแล้ว

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `verificationId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — ระบบสร้าง ID | ID ของรอบตรวจ Asset ที่เสนอเพิ่มเพื่อเก็บหลาย revision/history |
| `assetId` | VARCHAR | 128 ตัวอักษร | FK → ASSET.assetId; NOT NULL | ไม่มี | Asset ที่กำลังตรวจ identity/information; เป็น context หลัก |
| `poNo` | VARCHAR | 128 ตัวอักษร | FK → MIS_PO.poNo; NULL ได้ใน conceptual verification; ถ้ามีต้อง linked Asset | NULL | PO context ของ wizard ปัจจุบัน; ไม่ยืนยันว่าต้องหนึ่ง verification ต่อ PO ถาวร |
| `status` | VARCHAR | 80 ตัวอักษร | NOT NULL; เสนอ CHECK IN (Draft, Submitted) | เสนอ: Draft | สถานะรอบตรวจ: Draft หรือ Submitted เพื่อแยกการทำค้างจากส่งอนุมัติแล้ว |
| `confirmedSop` | DATE | YYYY-MM-DD | NULL ได้ใน Draft; ต้องมีเมื่อ Submit | ไม่มี SQL default — wizard ช่วยเติม targetSop | วันที่ Asset Team ยืนยัน/ประมาณว่าจะเริ่มใช้งานจริง; ต่างจาก targetSop ที่ผู้ขอตั้งไว้ |
| `maker` | VARCHAR | 200 ตัวอักษร | NULL ได้ | NULL | ชื่อผู้ผลิตเครื่อง/อุปกรณ์ เช่น Mazak ไม่ใช่ Vendor ที่ขายเสมอไป |
| `serialNo` | VARCHAR | 128 ตัวอักษร | NULL ได้; ไม่สมมติ globally unique | NULL | Serial number จากเครื่อง/plate ใช้ระบุตัวเครื่องจริง |
| `investmentNo` | VARCHAR | 128 ตัวอักษร | NULL ได้ | NULL | เลขอ้างอิงลงทุนที่ใช้บน Asset Control Sheet |
| `manufacturingDate` | DATE | YYYY-MM-DD | NULL ได้ | NULL | วันที่ผลิตเครื่อง/อุปกรณ์ตามหลักฐานที่มี |
| `registrationDate` | DATE | YYYY-MM-DD | NULL ได้ | NULL | วันที่ขึ้นทะเบียนที่ระบุบน Control Sheet; ไม่ใช่ depreciation date |
| `specialControl` | VARCHAR | 80 ตัวอักษร | NULL ได้; values ตาม wizard | None ใน wizard ปัจจุบัน | ชนิดควบคุมพิเศษ/ป้าย เช่น None, BOI, E/L, Customer Asset, Other; ไม่ใช้แทน ownershipType |
| `condition` | VARCHAR | 32 ตัวอักษร | NULL ได้; values ตาม wizard | Purchase ใน wizard ปัจจุบัน | ลักษณะการได้มาหรือการถือครองบน sheet เช่น Purchase, Leasing, Rental, Other |
| `specialPlateNotApplicable` | BOOLEAN | TRUE / FALSE | NOT NULL; TRUE จึงข้ามรูป specialPlate ได้ | เสนอ: FALSE | ระบุว่า Asset ไม่ต้องมี Special Control Plate; ปัจจุบัน field specialNA |
| `result` | VARCHAR | 80 ตัวอักษร | NULL ได้ใน Draft; CHECK IN (Complete, Mismatch); Submit ต้อง Complete | NULL — ห้าม default Complete | ผลตรวจตัว Asset: Complete หรือ Mismatch; ไม่ใช่ผล Receiving Validation |
| `remark` | TEXT | ไม่กำหนดความยาวตายตัว | NULL ได้; ควรมีเมื่อ Mismatch | NULL | ความเห็น/สิ่งที่ไม่ตรงหรือข้อมูลประกอบการตรวจ |
| `identityConfirmed` | BOOLEAN | TRUE / FALSE | NOT NULL; ต้องยืนยันก่อน Submit ตาม checklist | เสนอ: FALSE | ยืนยันว่าเป็น Asset ที่ขอจริง; checklist field เสนอใหม่ |
| `classConfirmed` | BOOLEAN | TRUE / FALSE | NOT NULL | เสนอ: FALSE | ยืนยัน Asset class ถูกต้อง; checklist field เสนอใหม่ |
| `modelConfirmed` | BOOLEAN | TRUE / FALSE | NOT NULL | เสนอ: FALSE | ยืนยันรุ่นถูกต้อง; checklist field เสนอใหม่ |
| `custodianConfirmed` | BOOLEAN | TRUE / FALSE | NOT NULL | เสนอ: FALSE | ยืนยันผู้ดูแลถูกต้อง; checklist field เสนอใหม่ |
| `locationConfirmed` | BOOLEAN | TRUE / FALSE | NOT NULL | เสนอ: FALSE | ยืนยันตำแหน่งติดตั้งถูกต้อง; checklist field เสนอใหม่ |
| `informationComplete` | BOOLEAN | TRUE / FALSE | NOT NULL; Submit ต้องข้อมูลครบ | เสนอ: FALSE | ยืนยันข้อมูล Asset ที่จำเป็นครบ; checklist field เสนอใหม่ |
| `actor` | VARCHAR | 200 ตัวอักษร | NULL ได้ใน Draft; ต้องมีเมื่อ Submit | NULL — เติมจากผู้ทำรายการ | ผู้/บทบาทที่ทำ verification; ปัจจุบันใช้ข้อความ Asset Team ไม่ใช่ authenticated user FK |
| `verifiedAt` | TIMESTAMP WITH TIME ZONE | ความละเอียด 3 ตำแหน่ง (ms) | NULL ได้ก่อน Submit | NULL — ระบบกำหนดเมื่อยืนยัน | เวลายืนยัน/ส่งรอบตรวจ; ไม่ควรเติมเมื่อเพิ่งสร้าง Draft |

<a id="asset-approval"></a>

## 18. ASSET_APPROVAL

**คำอธิบายตาราง:** ประวัติการตัดสินใจในการอนุมัติ/activation ของ Asset หนึ่งแถวคือหนึ่ง action เก็บต่อเนื่อง ไม่เขียนทับ decision เดิม

**แหล่งข้อมูล/สถานะ:** Asset.approvalHistory ใน `src/App.jsx`; normalized ID/result เป็นข้อเสนอ

**กติกา/ข้อควรเข้าใจ:** Accounting final approval ทำ Asset Active; Customer ไม่กำหนด DP. stage/result dictionaries ยังเป็นข้อเสนอและไม่ยืนยัน MIS approvals รวมอยู่ใน table นี้

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `approvalId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — ระบบสร้าง ID | ID ของ action ใน approval history ที่เสนอเพิ่ม |
| `assetId` | VARCHAR | 128 ตัวอักษร | FK → ASSET.assetId; NOT NULL | ไม่มี | Asset ที่ได้รับการตัดสินใจ |
| `stage` | VARCHAR | 120 ตัวอักษร | NOT NULL; controlled stage labels | ไม่มี — workflow กำหนด | ขั้นที่ทำ action เช่น Asset Team Verification, Asset Team Leader, Accounting Review, Accounting Final Approval |
| `action` | VARCHAR | 120 ตัวอักษร | NOT NULL; เก็บ action จาก workflow | ไม่มี | สิ่งที่ทำ เช่น Approved, Returned for Correction, Approved and activated |
| `actor` | VARCHAR | 200 ตัวอักษร | NOT NULL; ไม่ใช่ ADMIN_USER FK ในโค้ด | ไม่มี — บันทึกผู้ตัดสินใจ | ผู้/บทบาทที่ตัดสินใจ เช่น Accounting; ปัจจุบันเป็นข้อความ |
| `remark` | TEXT | ไม่กำหนดความยาวตายตัว | NULL ได้เมื่อ Approve; ต้องไม่ว่างเมื่อ Return | NULL | เหตุผล/ความเห็น; normalize จาก comment/remark ในโค้ด |
| `result` | VARCHAR | 80 ตัวอักษร | NOT NULL สำหรับ proposed history; controlled results ต้องออกแบบก่อน migration | ไม่มี — สกัดจาก decision จริง | ผลตัดสินใจที่เสนอ normalize แยกจาก action เช่น Approved หรือ Returned |
| `actedAt` | TIMESTAMP WITH TIME ZONE | ความละเอียด 3 ตำแหน่ง (ms) | NOT NULL | ไม่มี — ระบบกำหนดเมื่อทำ action | วันเวลาที่ทำ action; ปัจจุบัน history ใช้ date |

<a id="lifecycle-event"></a>

## 19. LIFECYCLE_EVENT

**คำอธิบายตาราง:** ประวัติเหตุการณ์ของ Active Company Asset หนึ่งแถวคือหนึ่งงานจาก Proposal หรือ Transfer/Spare Part Usage แยก status ของงานจาก Asset master

**แหล่งข้อมูล/สถานะ:** `useAssetLifecycleStore.js`, `proposalAssetUtils.js`, `expenseReceivingUtils.js`, `mockLifecycleEvents.js`

**กติกา/ข้อควรเข้าใจ:** Company เท่านั้น. Expense ไม่สร้าง child/activation/Parent DP value; Main history รวมงานบน Sub ผ่าน relationship. proposed event/Proposal unique ยังต้องตรวจข้อมูลจริงก่อน enforce

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `transactionNo` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — ระบบออกเลข | เลขธุรกรรมงาน เช่น TRF-2026-0001 หรือเลข event จาก Proposal; identity ของประวัติ |
| `assetId` | VARCHAR | 128 ตัวอักษร | FK → ASSET.assetId; NOT NULL; Company Asset เท่านั้น | ไม่มี | Asset ที่งานเกิดขึ้นจริง/ที่เลือกเป็น target; เท่ากับ sourceAssetId ของงานในโค้ด |
| `mainAssetId` | VARCHAR | 128 ตัวอักษร | FK → ASSET.assetId; NULL ได้สำหรับ legacy; ต้องชี้ Main | NULL — resolve จาก target | Main Asset สำหรับรวม history ของงานบน Sub; ชี้ root ไม่สร้าง event ซ้ำให้ Parent |
| `subAssetId` | VARCHAR | 128 ตัวอักษร | FK → ASSET.assetId; NULL ได้; Expense ต้อง NULL | NULL | child ที่งาน Capitalized สร้างขึ้น; ไม่ใช่ Sub ที่เลือกทำงานต้นทาง |
| `proposalItemId` | VARCHAR | 128 ตัวอักษร | FK → PROPOSAL_ITEM.itemId; NULL ได้; เสนอ UNIQUE เมื่อมีค่า ตาม ER 0..1 event ต่อ item | NULL | รายการ Proposal ที่ก่อให้เกิดงาน; Transfer/Spare Part Usage ไม่มี Proposal item |
| `type` | VARCHAR | 80 ตัวอักษร | NOT NULL; CHECK controlled type | ไม่มี | ชนิดเหตุการณ์ดั้งเดิม: subAsset, modification, maintenance, transfer, sparePartUsage; คงไว้แม้ทำงานเสร็จ |
| `title` | VARCHAR | 200 ตัวอักษร | NOT NULL; ห้ามข้อความว่าง | ไม่มี | ชื่อเรื่องงานสำหรับอ่านใน timeline |
| `description` | TEXT | ไม่กำหนดความยาวตายตัว | NULL ได้ | NULL | รายละเอียดงาน/เหตุผลจากคำขอ |
| `cost` | DECIMAL | 18,2 (จำนวนเต็ม 16 / ทศนิยม 2) | NULL ได้ก่อนทราบ; CHECK >= 0 | NULL | มูลค่ารวมของเหตุการณ์ หน่วย THB; งาน Proposal รวม base + scoped costs; spare part เป็นค่าเบิกทั้งหมด |
| `costTreatment` | VARCHAR | 32 ตัวอักษร | NULL ได้เมื่อไม่เกี่ยว; ค่าเป็นผลจำแนกจริง | NULL — ระบบคำนวณ/รับจากต้นทาง | Capitalized หรือ Expense สำหรับ existing work; Transfer อาจไม่มี; ห้ามตีความทุก event เป็นเพิ่ม Parent value |
| `workOnExistingAsset` | BOOLEAN | TRUE / FALSE | NOT NULL หากเก็บ flag; ไม่ใช้ override กฎข้อ 28 | เสนอ: FALSE | compatibility flag ของ current receiving-only branch สำหรับ Modification/Maintenance แม้ Capitalized |
| `status` | VARCHAR | 80 ตัวอักษร | NOT NULL; controlled workflow values | ไม่มี — กำหนดตาม type/stage; Proposal event เริ่ม Pending Approval | สถานะธุรกรรม เช่น Pending Approval, Purchasing, GR Received, Completed, Hold / Correction Required |
| `occurredOn` | DATE | YYYY-MM-DD | NULL ได้จนทราบวันที่ | NULL | วันที่ของเหตุการณ์ที่ใช้แสดง history; Expense completed ใช้ receivedDate ของ GR |
| `createdAt` | TIMESTAMP WITH TIME ZONE | ความละเอียด 3 ตำแหน่ง (ms) | NOT NULL สำหรับรายการใหม่; legacy import ต้องมีแผนเติม | ไม่มี — ระบบกำหนดเมื่อสร้าง | เวลาสร้าง lifecycle event ไม่ใช่วันทำงานเสร็จ |
| `completedAt` | TIMESTAMP WITH TIME ZONE | ความละเอียด 3 ตำแหน่ง (ms) | NULL ได้ก่อน Completed | NULL | เวลาที่งาน Completed; Expense valid/full receipt หรือ child activation/Transfer completion |
| `remark` | TEXT | ไม่กำหนดความยาวตายตัว | NULL ได้ | NULL | หมายเหตุงานหรือสาเหตุที่ Hold/Returned |

<a id="transfer-detail"></a>

## 20. TRANSFER_DETAIL

**คำอธิบายตาราง:** ข้อมูลเฉพาะการโอนย้าย หนึ่งแถวต่อ lifecycle event ชนิด transfer; ใช้ควบคุมลำดับ approvers แยกจาก Asset acquisition

**แหล่งข้อมูล/สถานะ:** transfer event ใน `AssetLifecycleDialog.jsx`, `App.jsx`

**กติกา/ข้อควรเข้าใจ:** โค้ดปัจจุบันสามขั้นต่างจาก requirement สี่ขั้น; JSON ช่วยเก็บ configuration ไม่ใช่การยืนยัน chain อื่น

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `transactionNo` | VARCHAR | 128 ตัวอักษร | PK; FK → LIFECYCLE_EVENT.transactionNo; NOT NULL; event.type=transfer | ไม่มี | เลข event Transfer ที่รายละเอียดนี้ขยายข้อมูล |
| `requestedTransferDate` | DATE | YYYY-MM-DD | NOT NULL | ไม่มี SQL default — ฟอร์มใช้วันปัจจุบัน | วันที่ต้องการโอน ไม่ใช่วันที่ approval ครบจริง |
| `currentApprovalStep` | INTEGER | จำนวนเต็ม signed 32-bit | NOT NULL; CHECK >= 0 และอยู่ในช่วง approvalSteps ขณะ Pending | 0 ใน mockup | index ของขั้นที่กำลังรออนุมัติ เริ่ม 0; ไม่ใช่จำนวน approval ที่กำหนดตายตัว |
| `approvalSteps` | JSON | ตามโครงสร้างข้อมูล; DB-dependent | NOT NULL; JSON array; validated ordered workflow | ไม่มี SQL default — ใส่ confirmed chain ตอนสร้าง | array ขั้นที่เรียงลำดับ: Area Owner → Source Department Leader → Destination Department Leader → Asset Team Acknowledgement ตาม requirement |

<a id="transfer-assignment"></a>

## 21. TRANSFER_ASSIGNMENT

**คำอธิบายตาราง:** snapshot แหล่งต้นทางและปลายทางของ Transfer หนึ่ง Transfer มีสองแถว FROM/TO เพื่อเก็บข้อมูลเดิมไว้หลัง master assignment เปลี่ยน

**แหล่งข้อมูล/สถานะ:** transfer event.from และ event.to; proposed normalized snapshots

**กติกา/ข้อควรเข้าใจ:** Composite PK (transactionNo, direction) และต้องมี exactly FROM/TO เมื่อ Submit; อัปเดต Asset หลังอนุมัติครบเท่านั้น ห้าม overwrite snapshots

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `transactionNo` | VARCHAR | 128 ตัวอักษร | PK ร่วม; FK → TRANSFER_DETAIL.transactionNo; NOT NULL | ไม่มี | Transfer ที่ snapshot นี้สังกัด |
| `direction` | VARCHAR | 4 ตัวอักษร | PK ร่วม; NOT NULL; CHECK IN (FROM, TO) | ไม่มี | แยกต้นทาง FROM กับปลายทาง TO |
| `department` | VARCHAR | 120 ตัวอักษร | NULL ได้สำหรับ legacy; TO ควรครบตาม workflow | NULL | แผนกต้นทาง/ปลายทาง ณ เวลายื่น Transfer |
| `custodian` | VARCHAR | 200 ตัวอักษร | NULL ได้สำหรับ legacy; TO ควรครบตาม workflow | NULL | ผู้ดูแลต้นทาง/ปลายทาง ณ เวลายื่น Transfer |
| `plant` | VARCHAR | 120 ตัวอักษร | NULL ได้สำหรับ legacy; TO ต้องครบตามฟอร์ม | NULL | โรงงานต้นทาง/ปลายทาง |
| `location` | VARCHAR | 200 ตัวอักษร | NULL ได้สำหรับ legacy; TO ต้องครบตามฟอร์ม | NULL | สถานที่ต้นทาง/ปลายทาง |
| `line` | VARCHAR | 120 ตัวอักษร | NULL ได้เมื่อไม่เกี่ยวข้อง | NULL | สายการผลิตต้นทาง/ปลายทาง |
| `area` | VARCHAR | 120 ตัวอักษร | NULL ได้เมื่อไม่เกี่ยวข้อง | NULL | พื้นที่ต้นทาง/ปลายทาง; รองรับ update ตาม requirement แต่ handler ปัจจุบันยังไม่ update area |

<a id="lifecycle-approval"></a>

## 22. LIFECYCLE_APPROVAL

**คำอธิบายตาราง:** ประวัติการตัดสินใจของ lifecycle transaction หนึ่งแถวคือหนึ่ง action เช่น Transfer stage approval; แยกจาก ASSET_APPROVAL

**แหล่งข้อมูล/สถานะ:** event.approvalHistory ใน `App.jsx`; ออกแบบให้เก็บ stage/actor/remark/time

**กติกา/ข้อควรเข้าใจ:** เก็บ append-only; ไม่ใช้ table นี้แทน Proposal/PR/PO approval audit ของ MIS

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `approvalId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — ระบบสร้าง ID | ID ของ action approval ภายในงานที่เสนอเพิ่ม |
| `transactionNo` | VARCHAR | 128 ตัวอักษร | FK → LIFECYCLE_EVENT.transactionNo; NOT NULL | ไม่มี | เลข lifecycle event ที่ action นี้เกี่ยวข้อง |
| `stage` | VARCHAR | 120 ตัวอักษร | NOT NULL; อ้าง workflow ของ event | ไม่มี | ชื่อขั้นที่ตัดสินใจ เช่น Area Owner Approval |
| `action` | VARCHAR | 120 ตัวอักษร | NOT NULL | ไม่มี — จาก action จริง | สิ่งที่ทำ เช่น Approved หรือ Acknowledged and completed |
| `actor` | VARCHAR | 200 ตัวอักษร | NOT NULL | ไม่มี — บันทึกผู้ทำรายการ | ชื่อผู้/บทบาทที่ทำ action; mockup เป็นข้อความ |
| `remark` | TEXT | ไม่กำหนดความยาวตายตัว | NULL ได้ | NULL | ความเห็น/เหตุผลประกอบ action; ยังไม่ยืนยัน return workflow ของ Transfer |
| `result` | VARCHAR | 80 ตัวอักษร | NOT NULL ใน proposed history; controlled results ต้องยืนยัน | ไม่มี — จาก decision จริง | ผลการตัดสินใจที่เสนอ normalize จาก action; ไม่สมมติ approval chain ของ work types ที่ยังไม่ยืนยัน |
| `actedAt` | TIMESTAMP WITH TIME ZONE | ความละเอียด 3 ตำแหน่ง (ms) | NOT NULL | ไม่มี — ระบบกำหนดเมื่อทำ action | เวลา action จริง; map จาก approvalHistory.date |

<a id="spare-part-usage"></a>

## 23. SPARE_PART_USAGE

**คำอธิบายตาราง:** รายละเอียดค่าเบิกอะไหล่ที่ใช้กับ Asset หนึ่งแถวขยาย lifecycle event ชนิด sparePartUsage; เป็นประวัติใช้งาน ไม่ใช่ inventory

**แหล่งข้อมูล/สถานะ:** `mockLifecycleEvents.js`, Asset lifecycle detail และ simulated MIS issue

**กติกา/ข้อควรเข้าใจ:** หนึ่ง event/หนึ่งรายละเอียดตาม ER ปัจจุบัน; หากหนึ่ง MIS issue มีหลาย lines ให้แยก events/กำหนด integration policy ภายหลัง. Customer ไม่เข้าร่วม และไม่มี stock balance/issue approval ใน Asset System

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `transactionNo` | VARCHAR | 128 ตัวอักษร | PK; FK → LIFECYCLE_EVENT.transactionNo; NOT NULL; event.type=sparePartUsage | ไม่มี | เลข event usage ที่ข้อมูลนี้สังกัด |
| `sparePart` | VARCHAR | 200 ตัวอักษร | NOT NULL | ไม่มี — รับจาก MIS | ชื่อ/คำอธิบายอะไหล่ที่ถูกใช้ เช่น Bearing; ไม่ใช่ FK ไป stock table |
| `quantity` | DECIMAL | 18,4 (จำนวนเต็ม 14 / ทศนิยม 4) | NOT NULL; CHECK > 0 | ไม่มี — รับจาก MIS | จำนวนอะไหล่ที่เบิกใช้ หน่วยตาม unit |
| `unit` | VARCHAR | 32 ตัวอักษร | NULL ได้สำหรับ legacy | NULL — รับจาก MIS | หน่วยอะไหล่ เช่น piece/set |
| `cost` | DECIMAL | 18,2 (จำนวนเต็ม 16 / ทศนิยม 2) | NOT NULL; CHECK >= 0; ต้องตรงค่า event เมื่อบันทึกทั้งสอง | ไม่มี — รับจาก MIS | ต้นทุนรวมการเบิก หน่วย THB; ไม่ใช่ราคาต่อหน่วยและไม่บวกซ้ำกับ LIFECYCLE_EVENT.cost |
| `issueDate` | DATE | YYYY-MM-DD | NOT NULL | ไม่มี — รับจาก MIS | วันที่เบิกใช้ตามเอกสาร MIS |
| `misReference` | VARCHAR | 200 ตัวอักษร | NOT NULL; ไม่สมมติ unique ต่อ usage ทั่วระบบ | ไม่มี — รับจาก MIS | เลขอ้างอิงธุรกรรมเบิกใน MIS ใช้ตามกลับระบบต้นทาง |

<a id="project"></a>

## 24. PROJECT

**คำอธิบายตาราง:** ทะเบียนโครงการที่ใช้เลือกอ้างอิงใน Asset/Proposal หนึ่งแถวคือหนึ่งโครงการ ไม่ใช่ purchasing document

**แหล่งข้อมูล/สถานะ:** `useProjectStore.js`, `CreateProjectPage.jsx`

**กติกา/ข้อควรเข้าใจ:** Asset/Proposal เก็บ code/name snapshots; code แบบพิมพ์เองยังต้อง resolve หรืออนุญาต external reference ก่อน enforce FK

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `projectCode` | VARCHAR | 80 ตัวอักษร | PK; NOT NULL; ห้ามว่าง; uniqueness แบบ case-insensitive | ไม่มี — ผู้ใช้กำหนด | รหัสโครงการ เช่น PRJ-2026-001; code เป็น key และ app ตรวจซ้ำแบบ case-insensitive |
| `projectName` | VARCHAR | 200 ตัวอักษร | NOT NULL; ห้ามว่าง | ไม่มี | ชื่อโครงการ เช่น Assembly Line Expansion |
| `detail` | TEXT | ไม่กำหนดความยาวตายตัว | NULL ได้ | NULL | รายละเอียด/วัตถุประสงค์โครงการ |
| `projectDate` | DATE | YYYY-MM-DD | NULL ได้ | NULL | วันที่ระบุในฟอร์มโครงการ; map จาก field date ไม่ถือเป็น createdAt โดยอัตโนมัติ |

<a id="mis-part"></a>

## 25. MIS_PART

**คำอธิบายตาราง:** รายการ Part อ้างอิงจาก MIS browser หนึ่งแถวคือหนึ่ง Part ที่เลือกบน Proposal; แยกจาก spare part issue/inventory

**แหล่งข้อมูล/สถานะ:** `src/data/mockParts.js`

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `partNo` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — รับจาก MIS | เลข Part เช่น PT-ME-001 สำหรับเลือกอ้างบน Proposal |
| `name` | VARCHAR | 200 ตัวอักษร | NOT NULL | ไม่มี — รับจาก MIS | ชื่อ Part/อุปกรณ์สำหรับค้นหา |
| `model` | VARCHAR | 120 ตัวอักษร | NULL ได้ | NULL — รับจาก MIS | รุ่นของ Part; Proposal เก็บ copy ใน partModel |

<a id="asset-number-reservation"></a>

## 26. ASSET_NUMBER_RESERVATION

**คำอธิบายตาราง:** ทะเบียนเลข Sub Asset ที่เคยจอง/ใช้ หนึ่งแถวคือหนึ่ง suffix ของ Main เพื่อห้ามเลขซ้ำหลังยกเลิกหรือลบ child

**แหล่งข้อมูล/สถานะ:** Proposed entity; ปัจจุบัน `getNextSubAssetId` ดู Asset IDs ที่ยังเก็บอยู่ รวม Cancelled

**กติกา/ข้อควรเข้าใจ:** ต้องออกเลขแบบ atomic เมื่อมี DB จริง; registry ต้องคงอยู่หลัง child ถูกยกเลิก/ลบ. ไม่ควร cascade delete registry ตาม child

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `assetNo` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL; ห้าม reuse | ไม่มี — ระบบสร้างจาก Main + suffix | เลข child ที่จอง เช่น ME-2026-0005-3; ไม่ผูก FK child เพราะอาจ Reserved/Cancelled โดยไม่มี live child |
| `mainAssetId` | VARCHAR | 128 ตัวอักษร | FK → ASSET.assetId; NOT NULL; ต้อง Main Company Asset | ไม่มี | Main Asset ที่ใช้ sequence suffix; ห้ามชี้ Sub Asset |
| `suffix` | INTEGER | จำนวนเต็ม signed 32-bit | NOT NULL; CHECK >= 1; UNIQUE (mainAssetId, suffix) | ไม่มี — allocate next unused suffix | เลขต่อท้าย 1, 2, 3 เพิ่มต่อจากเลขสูงสุดที่เคยใช้ ไม่สร้าง -1-1 |
| `reservedAt` | TIMESTAMP WITH TIME ZONE | ความละเอียด 3 ตำแหน่ง (ms) | NOT NULL | ไม่มี — ระบบกำหนดตอนจอง | เวลาที่จองเลข ใช้ audit การใช้เลข |
| `state` | VARCHAR | 16 ตัวอักษร | NOT NULL; เสนอ CHECK IN (Reserved, Used, Cancelled) | เสนอ: Reserved | สถานะเลข Reserved / Used / Cancelled; Cancelled ก็ห้ามใช้ซ้ำ |

<a id="invoice-item"></a>

## 27. INVOICE_ITEM

**คำอธิบายตาราง:** รายการจำนวนส่งที่ Vendor รายงานใน Invoice หนึ่งแถวคือหนึ่ง PO line บน Invoice แยกจากจำนวนรับจริงที่ PU ยืนยันใน GR

**แหล่งข้อมูล/สถานะ:** vendorInvoices[].items; key/quantity ใน `VendorDeliveryPage.jsx`

**กติกา/ข้อควรเข้าใจ:** ห้ามสรุปว่า delivered = received; receiving ใช้ GR/acceptance และตรวจ Invoice existence + same PO

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `invoiceItemId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — ระบบสร้าง ID | ID ของ Invoice line ที่เสนอเพิ่ม |
| `invoiceId` | VARCHAR | 128 ตัวอักษร | FK → MIS_INVOICE.invoiceId; NOT NULL | ไม่มี | Invoice ที่รายการส่งนี้สังกัด |
| `poItemId` | VARCHAR | 128 ตัวอักษร | FK → PO_ITEM.poItemId; NOT NULL; เสนอ UNIQUE (invoiceId, poItemId) | ไม่มี | PO line ที่ Vendor รายงานส่ง; resolve items.key ภายใต้ PO ของ Invoice |
| `reportedQuantity` | DECIMAL | 18,4 (จำนวนเต็ม 14 / ทศนิยม 4) | NOT NULL; CHECK >= 0 | ไม่มี — รับจาก Vendor/MIS | จำนวนที่ Vendor รายงานว่าจัดส่ง; ข้อมูลติดตาม delivery ไม่ใช่เกณฑ์ Invoice validation |

<a id="verification-photo"></a>

## 28. VERIFICATION_PHOTO

**คำอธิบายตาราง:** รูปหลักฐานของรอบ verification หนึ่งแถวคือหนึ่งภาพ เช่น รูปเครื่องหรือป้ายทะเบียน Asset

**แหล่งข้อมูล/สถานะ:** assetControlSheet.photos / validationDraft.photos ใน `AssetValidationWizard.jsx`

**กติกา/ข้อควรเข้าใจ:** machine สูงสุด 3 ภาพ; plate category อย่างละ 1; Special Plate ข้ามได้เมื่อ N/A. ปัจจุบันรับ JPG/PNG/WebP ไม่เกิน 10 MB ต่อรูป และ resize ก่อนเก็บ data URL

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `photoId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — ระบบสร้าง ID | ID ของภาพที่เสนอเพิ่มเมื่อแยก nested photo |
| `verificationId` | VARCHAR | 128 ตัวอักษร | FK → ASSET_VERIFICATION.verificationId; NOT NULL | ไม่มี | รอบตรวจที่เป็นเจ้าของภาพ |
| `category` | VARCHAR | 32 ตัวอักษร | NOT NULL; CHECK controlled category | ไม่มี | ชนิดรูป machine, assetPlate, machinePlate หรือ specialPlate |
| `name` | VARCHAR | 200 ตัวอักษร | NOT NULL | ไม่มี — จากไฟล์ที่เลือก | ชื่อไฟล์ต้นฉบับเพื่อให้ผู้ใช้รู้ว่าอัปโหลดรูปไหน |
| `imageReference` | TEXT | ไม่กำหนดความยาวตายตัว | NOT NULL; ไม่ใช่ documentName ของ Invoice | ไม่มี — ระบบสร้างจากรูป | ที่อยู่/ตัวอ้างอิงรูป; mockup photo.url เป็น JPEG data URL; production ควรออกแบบ file reference ภายหลัง |
| `displayOrder` | INTEGER | จำนวนเต็ม signed 32-bit | NOT NULL; CHECK >= 1; เสนอ UNIQUE (verificationId, category, displayOrder) | ไม่มี — ระบบจัดลำดับ | ลำดับแสดงภาพภายใน category เช่น machine views ลำดับ 1–3 |

<a id="asset-control-sheet"></a>

## 29. ASSET_CONTROL_SHEET

**คำอธิบายตาราง:** snapshot เอกสารตรวจ Asset ที่ผู้ใช้ review แล้ว หนึ่งแถวต่อ verification ที่ส่ง; ใช้พิมพ์/อ่านหลักฐานโดยไม่เปลี่ยนตาม master ล่าสุด

**แหล่งข้อมูล/สถานะ:** Asset.assetControlSheet ใน `AssetValidationWizard.jsx`, `AssetControlSheet.jsx`, `App.jsx`

**กติกา/ข้อควรเข้าใจ:** Draft verification ยังไม่มี sheet ได้; ไม่ duplicate photo bytes ใน JSON โดยไม่จำเป็น. ปัจจุบันเก็บ latest sheet บน Asset ไม่ได้มี revision history แยกจริง

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `controlSheetId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — ระบบสร้าง ID | ID ของ reviewed sheet ที่เสนอเพิ่ม |
| `verificationId` | VARCHAR | 128 ตัวอักษร | FK → ASSET_VERIFICATION.verificationId; NOT NULL; UNIQUE verificationId | ไม่มี | รอบตรวจที่สร้าง sheet นี้ |
| `documentAssetSnapshot` | JSON | ตามโครงสร้างข้อมูล; DB-dependent | NOT NULL; JSON object | ไม่มี — copy ตอน review | JSON สำเนา Asset fields/ownership/customerName และ document reference arrays ณ review |
| `purchaseOrderSnapshot` | JSON | ตามโครงสร้างข้อมูล; DB-dependent | NOT NULL; JSON object | ไม่มี — copy ตอน review | JSON ของ PO context/vendor ณ review ใช้อ่านเอกสารย้อนหลัง |
| `formSnapshot` | JSON | ตามโครงสร้างข้อมูล; DB-dependent | NOT NULL; JSON object | ไม่มี — copy ตอน review | JSON สำเนาข้อมูล verification form เช่น result/confirmedSop/remark/maker/serialNo ณ review |
| `reviewedAt` | TIMESTAMP WITH TIME ZONE | ความละเอียด 3 ตำแหน่ง (ms) | NOT NULL | ไม่มี — ระบบกำหนดเมื่อ review/Submit | วันเวลาที่ผู้ใช้ยืนยันอ่าน sheet/รูปและส่งข้อมูล |

<a id="depreciation-profile"></a>

## 30. DEPRECIATION_PROFILE

**คำอธิบายตาราง:** metadata ค่าเสื่อมที่ DP editor บันทึกให้ Company Asset หนึ่งแถวต่อ Asset หากมี profile; ไม่ใช่รายการบันทึกค่าเสื่อมรายเดือน

**แหล่งข้อมูล/สถานะ:** Asset.depreciationProfile ใน `AssetDepreciationDialog.jsx`, `depreciationUtils.js`

**กติกา/ข้อควรเข้าใจ:** Monthly = acquisitionValue / Useful Life / 12; accumulated = min(value, monthly × periods); NBV = value − accumulated. นับ start month เป็นงวดเต็มถึงเดือนปัจจุบัน; ไม่ prorate/residual/impairment และไม่สร้าง depreciation profile สำหรับ Customer

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `assetId` | VARCHAR | 128 ตัวอักษร | PK; FK → ASSET.assetId; NOT NULL; ห้าม Customer Asset | ไม่มี | Company Asset ที่ profile นี้สังกัด |
| `method` | VARCHAR | 40 ตัวอักษร | NULL ได้ก่อนกำหนด; ถ้ามีควรเป็นวิธีที่ utility รองรับ | ไม่มี SQL default — editor ใส่ Straight-line เมื่อมี Useful Life | วิธีค่าเสื่อม เช่น Straight-line; current mockup คำนวณวิธีเส้นตรงเท่านั้น |
| `usefulLifeYearsSnapshot` | DECIMAL | 6,2 (จำนวนเต็ม 4 / ทศนิยม 2) | NULL ได้; CHECK > 0 เมื่อมีค่า | NULL — copy master ตอน Save | อายุปีที่ editor เคยบันทึกไว้เป็น metadata; การคำนวณปัจจุบันยังอ่าน ASSET_TYPE |
| `annualRatePercentSnapshot` | DECIMAL | 9,4 (จำนวนเต็ม 5 / ทศนิยม 4) | NULL ได้; CHECK > 0 เมื่อมีค่า | NULL — ระบบคำนวณตอน Save | อัตรารายปี metadata = 100 / Useful Life; ไม่ใช่จำนวนเงินค่าเสื่อม |

<a id="admin-user"></a>

## 31. ADMIN_USER

**คำอธิบายตาราง:** ทะเบียนผู้ใช้ในหน้าจอ Administrator หนึ่งแถวต่อผู้ใช้ตัวอย่าง; ไม่ใช่ credentials/authentication backend

**แหล่งข้อมูล/สถานะ:** `adminData.js`, `useAdminStore.js`, `AdministratorPage.jsx`

**กติกา/ข้อควรเข้าใจ:** custodian/actor ปัจจุบันยังเป็นข้อความไม่ใช่ FK user; ไม่มี password/token table ใน ER นี้

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `userId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — admin UI สร้าง ID | ID ผู้ใช้ใน admin store; ปัจจุบันใช้ field id |
| `name` | VARCHAR | 80 ตัวอักษร | NOT NULL; ห้ามว่าง | ไม่มี | ชื่อที่แสดงของผู้ใช้ |
| `email` | VARCHAR | 254 ตัวอักษร | NOT NULL; รูปแบบ email; เสนอ uniqueness แบบ case-insensitive | ไม่มี | อีเมลผู้ใช้สำหรับแสดง/ตรวจซ้ำ; ไม่ใช่หลักฐานยืนยันตัวตน |
| `department` | VARCHAR | 120 ตัวอักษร | NULL ได้ | NULL | แผนกของผู้ใช้ ข้อมูลข้อความ; ไม่ผูก Organization master |
| `active` | BOOLEAN | TRUE / FALSE | NOT NULL | เสนอ: TRUE | เปิด/ปิดผู้ใช้ใน admin mockup โดยคง record ไว้ |

<a id="admin-role"></a>

## 32. ADMIN_ROLE

**คำอธิบายตาราง:** ทะเบียนบทบาทผู้ใช้ หนึ่งแถวต่อ role เช่น Asset Team หรือ Accounting ใช้แบ่งการเห็นเมนูใน admin model

**แหล่งข้อมูล/สถานะ:** roles ใน `adminData.js`, `AdministratorPage.jsx`

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `roleId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — admin UI สร้าง ID | ID บทบาท; ปัจจุบันใช้ field id |
| `name` | VARCHAR | 80 ตัวอักษร | NOT NULL; ห้ามว่าง; เสนอชื่อไม่ซ้ำแบบ case-insensitive | ไม่มี | ชื่อ role ที่แสดง เช่น Asset Team |
| `description` | TEXT | ไม่กำหนดความยาวตายตัว | NULL ได้ | NULL | คำอธิบายหน้าที่ของ role เพื่อให้ผู้ดูแลเข้าใจ |
| `active` | BOOLEAN | TRUE / FALSE | NOT NULL | เสนอ: TRUE | เปิด/ปิดการเลือก role โดยไม่ลบประวัติ mapping |

<a id="user-role"></a>

## 33. USER_ROLE

**คำอธิบายตาราง:** ตารางเชื่อมผู้ใช้กับบทบาท หนึ่งแถวคือ user ได้รับ role หนึ่งตัว; รองรับหนึ่ง user หลาย roles

**แหล่งข้อมูล/สถานะ:** เสนอ normalize users[].roleIds

**กติกา/ข้อควรเข้าใจ:** Composite PK (userId, roleId); ไม่เก็บ roleIds array ซ้ำเมื่อใช้ normalized schema

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `userId` | VARCHAR | 128 ตัวอักษร | PK ร่วม; FK → ADMIN_USER.userId; NOT NULL | ไม่มี | ผู้ใช้ที่ได้รับ role |
| `roleId` | VARCHAR | 128 ตัวอักษร | PK ร่วม; FK → ADMIN_ROLE.roleId; NOT NULL | ไม่มี | role ที่มอบให้ผู้ใช้ |

<a id="app-menu"></a>

## 34. APP_MENU

**คำอธิบายตาราง:** ทะเบียนเมนู/กลุ่มเมนู หนึ่งแถวต่อเมนู ใช้โครงสร้าง parent-child และ route reference สำหรับ permissions

**แหล่งข้อมูล/สถานะ:** menus ใน `adminData.js`, `AdministratorPage.jsx`

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `menuId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — admin UI สร้าง ID | ID ของเมนู เช่น assets; ปัจจุบันใช้ field id |
| `parentMenuId` | VARCHAR | 128 ตัวอักษร | FK → APP_MENU.menuId; NULL ได้; ห้าม self/cycle | NULL | เมนูกลุ่มแม่; ปัจจุบันใช้ parentId; เมนูระดับบนไม่มี parent |
| `name` | VARCHAR | 80 ตัวอักษร | NOT NULL; ห้ามว่าง | ไม่มี | ชื่อเมนูที่แสดงต่อผู้ใช้ |
| `route` | VARCHAR | 200 ตัวอักษร | NULL ได้สำหรับกลุ่มเมนู; child route ต้องไม่ว่างตาม UI | NULL | รหัสหน้า/route เช่น assets; เพิ่มเมนูไม่ได้สร้าง React page อัตโนมัติ |
| `active` | BOOLEAN | TRUE / FALSE | NOT NULL | เสนอ: TRUE | เปิด/ปิดเมนูใน admin model |

<a id="role-menu-permission"></a>

## 35. ROLE_MENU_PERMISSION

**คำอธิบายตาราง:** ตารางเชื่อมสิทธิ์ Role ต่อ Menu หนึ่งแถวคือ role ได้รับสิทธิ์เห็น/ใช้เมนูหนึ่งตัว ไม่ใช่ CRUD permission ทุก action

**แหล่งข้อมูล/สถานะ:** เสนอ normalize permissions[roleId] ซึ่งเก็บ menu ID array

**กติกา/ข้อควรเข้าใจ:** Composite PK (roleId, menuId). ไม่มี row หมายถึงไม่ grant เมนูนั้น; production route/action enforcement ยังไม่ใช่สิ่งที่ mockup รับประกัน

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `roleId` | VARCHAR | 128 ตัวอักษร | PK ร่วม; FK → ADMIN_ROLE.roleId; NOT NULL | ไม่มี | บทบาทที่ได้รับเมนู |
| `menuId` | VARCHAR | 128 ตัวอักษร | PK ร่วม; FK → APP_MENU.menuId; NOT NULL | ไม่มี | เมนูที่อนุญาตให้ role ใช้ใน model |

<a id="asset-issue"></a>

## 36. ASSET_ISSUE

**คำอธิบายตาราง:** คำแจ้งปัญหาจากหน้า QR/Asset Info หนึ่งแถวต่อการแจ้ง เก็บ locally โดยไม่เริ่ม Maintenance flow หรือส่ง notification อัตโนมัติ

**แหล่งข้อมูล/สถานะ:** `AssetInfoPage.jsx`; localStorage key tbkk-asset-reported-issues-v1

| Field name | Data type | Size | Constraints | Default value | Description |
| --- | --- | --- | --- | --- | --- |
| `issueId` | VARCHAR | 128 ตัวอักษร | PK; NOT NULL | ไม่มี — ระบบสร้าง ID | ID คำแจ้งปัญหาที่เสนอเพิ่ม; records ปัจจุบันยังไม่มี key นี้ |
| `assetId` | VARCHAR | 128 ตัวอักษร | FK → ASSET.assetId; NOT NULL | ไม่มี | Asset ที่ผู้ใช้แจ้งปัญหาจากหน้า Asset Info |
| `description` | TEXT | ไม่กำหนดความยาวตายตัว | NOT NULL; ห้ามข้อความว่าง | ไม่มี — ผู้ใช้กรอก | ข้อความปัญหา เช่น เครื่องมีเสียงผิดปกติ |
| `reportedAt` | TIMESTAMP WITH TIME ZONE | ความละเอียด 3 ตำแหน่ง (ms) | NOT NULL | ไม่มี — ระบบกำหนดตอน Save | วันเวลาที่กด Save issue ใน browser |
| `status` | VARCHAR | 80 ตัวอักษร | NOT NULL; รับ Reported ตาม mockup | Reported เมื่อสร้าง | สถานะคำแจ้ง ปัจจุบันมี Reported เท่านั้น; ยังไม่ยืนยัน resolution/approval workflow |

## ตัวอย่างการอ่าน field ที่มักสับสน

Asset `ME-2026-0005` เป็น Main Active. ผู้ใช้เลือกทำ Maintenance บน Sub `ME-2026-0005-1` มูลค่า base 60000 + installation 5000 = 65000 THB. ตาม confirmed requirement จะสร้าง child sibling เช่น `ME-2026-0005-2` เมื่อ Save Proposal สำเร็จ ไม่สร้าง `-1-1`

| Field | ค่าตัวอย่าง | อธิบาย |
| --- | --- | --- |
| Child.parentAssetId | ME-2026-0005 | Main Asset ที่ child ใหม่สังกัด |
| Child.sourceAssetId | ME-2026-0005-1 | Sub Asset ที่เลือกเป็นเป้าหมายงานต้นทาง |
| Child.workType | maintenance | งานต้นทางคือ Maintenance แม้ผลเป็น capitalized child |
| Child.acquisitionValue | 65000.00 | มูลค่าของ child ใหม่สำหรับฐาน DP ของตัวเอง ไม่บวก Parent DP value |
| Child.status | Proposal Processing | ก่อน Proposal approval; ยังไม่ Active |
| Child.draftOrigin | NULL | confirmed Proposal-driven child ไม่จำเป็นต้องผ่าน standalone Draft; ค่านี้มีไว้รองรับ implemented flow |
| Proposal item.sourceAssetId | ME-2026-0005-1 | เก็บ Asset ที่เลือกเดิม ไม่เปลี่ยนเป็น child ใหม่ |
| Proposal item.resultingAssetId | ME-2026-0005-2 | Asset ที่เกิดขึ้นและต้องเข้าสู่ acquisition/activation |

ถ้ายอดรวม **50000.00 THB พอดี** ผลคือ Expense: ไม่มี child, resultingAssetId/subAssetId = NULL; cost = 50000.00 เก็บบน event ของ Asset ที่เลือกและ Main history ดูรวมได้ แต่ acquisitionValue ของ Parent ไม่เพิ่ม

`draftOrigin = Create Sub Asset` หมายถึง Draft มาจากหน้าสร้าง Sub Asset ที่โค้ดปัจจุบันมีอยู่; `workType = subAsset` บอกประเภทงานที่มาของ Asset สอง field ตอบคนละคำถามและไม่ใช่ status

## กฎข้ามตารางที่ต้องกำหนดก่อนทำ DDL

1. **Hierarchy/ownership:** Parent ต้อง Main Company และไม่มี cycle; work target อาจ Main/Sub; Customer ต้องมีชื่อและไม่มี lifecycle/DP. ใช้ validation/transaction ตาม DB ที่เลือก ไม่สามารถอาศัย FK อย่างเดียว
2. **Proposal:** ทุก source/resulting Asset ต้อง ownership เดียวกับ header; Customer เลือก available Draft เท่านั้น. New Asset Draft ต้องยังไม่ถูกใช้ใน Proposal อื่น. ไม่สมมติว่า Customer Proposal ต้องเป็นลูกค้าชื่อเดียวกัน เพราะยังไม่ยืนยัน
3. **Capitalization:** existing item total = base + ITEM_COST amounts; >50000 creates child on successful Save Proposal ก่อน approval; <=50000 Expense ไม่สร้าง record/ไม่เพิ่ม Parent value. original workType คงอยู่ทั้งสามประเภท; flag workOnExistingAsset ใน code ไม่ใช่ exception ที่ยืนยันแล้ว
4. **Numbering:** ออก child suffix แบบ atomic, ใช้ next unused sequence ของ Main, ไม่ reuse เลข Cancelled/Reserved. ห้าม cascade ลบเลขที่เคยใช้เพื่อทำให้กลับมาใช้ได้อีก
5. **Purchasing/receiving:** PO_ITEM ต้องอยู่ PO ที่ Invoice/GR/validation อ้างเดียวกัน. Invoice exists/document reference + same PO เป็นเกณฑ์; amount/quantity บน Invoice ไม่ทำ 3-way matching. Receipt quantities/allocated values ที่แชร์หลาย Asset ยังต้องกำหนดวิธีแบ่งก่อน enforce final sums
6. **Expense completion:** GR save ทำ Completed เมื่อ reference ถูกต้อง + acceptance + รับครบ; partial เป็น GR Received, invalid/failed acceptance เป็น Hold / Correction Required. ไม่เข้ากระบวนการ activation
7. **Verification/approval:** ก่อน Submit ต้อง receiving complete, Asset info ครบ, result Complete; photos/sheet เป็น current UI gate เพิ่ม. Company final approval ต้อง depreciation date, Customer ไม่ต้องมี. decisions/snapshots ควร append-only และไม่มีการ copy Parent approvals/DP dates ให้ child
8. **Transfer:** มี FROM/TO exactly สอง snapshot และ four-stage confirmed chain; update assignment หลังจบทุก approval. ไม่ invent return/disposal workflow; current three-stage code เป็น gap
9. **JSON vs normalized source:** PR/PO/Control Sheet เป็น document snapshots; จำนวนเงินซ้ำใน lifecycle/spare usage ต้องไม่ aggregate สองครั้ง. ไม่เก็บ master arrays ซ้ำเป็น source of truth อีกชุดเมื่อใช้ bridges จริง
10. **Unique/FK/delete policy:** UNIQUE/code collation, nullable UNIQUE behavior, actor audit identity, soft-delete/retention และ cascade rules ยังต้องเลือกตาม DB/นโยบายองค์กร. ตาราง audit/acquisition histories และ reservations ควรรักษาหลักฐาน ไม่ถือว่ามี ON DELETE CASCADE ที่ยืนยันแล้ว

## สิ่งที่เอกสารนี้ไม่ได้ยืนยันเป็น physical schema

PO ↔ PO Item ↔ Asset cardinality, multiple GR policy, receipt allocation, production MIS integration, authenticated actor identity, SQL engine/collation, approval result dictionaries และ Disposal/Write-off ยังต้องยืนยันก่อนทำ migration/DDL. ดู [ER notes](./asset-management-er-notes.md) สำหรับ implementation gaps และ [Swimlanes](./asset-management-swimlane.md) สำหรับ handoffs ของ workflow

**การตรวจความครบถ้วน:** ชื่อตารางและชื่อ field ทุกตัวตรวจเทียบกับ `.mmd` โดยตรง; ไม่มี field ใน ER ที่ตกหล่น และไม่มี field เพิ่มนอก ER. คำอธิบายและ physical type/size/constraint/default ในไฟล์นี้เป็นเอกสาร ไม่ได้เปลี่ยน application, localStorage หรือ schema จริง
