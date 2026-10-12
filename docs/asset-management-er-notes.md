# TBKK Asset Management — Logical ER

ตรวจสอบจากโค้ดในโปรเจกต์และ AGENTS.md ข้อ 28–29 เมื่อ 8 ตุลาคม 2026

ไฟล์ Mermaid: [asset-management-er.mmd](./asset-management-er.mmd) · Swimlane: [asset-management-swimlane.md](./asset-management-swimlane.md)

Data Dictionary: [asset-management-data-dictionary.md](./asset-management-data-dictionary.md) — คำอธิบายทุกตาราง/field พร้อม proposed data type, size, constraints และ default value (9 ตุลาคม 2026)

## ขอบเขต

ระบบปัจจุบันเป็น React mockup ที่เก็บข้อมูลใน localStorage ไม่มี schema ฐานข้อมูลหรือ backend API ดังนั้น ER นี้เป็น Logical model ที่สกัดจากข้อมูลจริงและปรับให้รองรับกติกาล่าสุด ไม่ใช่ physical schema ที่ติดตั้งอยู่แล้ว

ชื่อที่ขึ้นต้นด้วย MIS หมายถึงข้อมูลอ้างอิงเอกสารของระบบ MIS ภายนอก ไม่ได้เสนอให้ Asset System รับผิดชอบ purchasing workflow หรือ stock inventory

ใช้ `||` = หนึ่ง, `o|` = ศูนย์หรือหนึ่ง, `o{` = ศูนย์หรือหลาย, `|{` = หนึ่งหรือหลาย และ FK ที่ระบุ Nullable สามารถไม่มีค่าได้ในช่วงก่อนเกิดเอกสาร

## แหล่งข้อมูลและการแยก entity

| Entity | แหล่งข้อมูลปัจจุบัน / ข้อเสนอ |
| --- | --- |
| ASSET | `src/hooks/useAssetStore.js`, `src/data/mockAssets.js` |
| ASSET_TYPE | `src/hooks/useAssetTypeStore.js`, `src/data/assetTypes.js`; assetClass ปัจจุบันมักเป็นข้อความ จึงเสนอ explicit assetTypeId |
| MIS_PROPOSAL, PROPOSAL_ITEM, ITEM_COST | `useMISProposalStore.js`, `MISCreateProposalPage.jsx`; แยก assetItems และ costs ที่ฝังในเอกสาร |
| MIS_PR, PR_ITEM | `useMISPurchasingStore.js`, `MISCreatePRPage.jsx`; PR ปัจจุบันคัดลอก item และ costs เป็น snapshot |
| MIS_PO, PO_ITEM | `useMISPurchasingStore.js`, `MISCreatePOPage.jsx`; itemNo อยู่ภายใต้ poNo และ PO เก็บข้อมูล item snapshot |
| PO_ITEM_ALLOCATION | เสนอ bridge เพื่อไม่ผูก 1 PO/PO item ต่อ 1 Asset เป็นกฎถาวร |
| MIS_INVOICE, INVOICE_ITEM | `useMISPurchasingStore.js` มี vendorInvoices; `VendorDeliveryPage.jsx` เก็บ reference/date/documentName/amount/items/roundId/submittedAt ส่วน legacy Invoice references ยังอยู่บน Asset และ GR |
| MIS_GR, GR_ITEM | `useMISPurchasingStore.js`, `MISCreateGRPage.jsx`; แยก assetItems ที่ฝังใน GR |
| RECEIVING_VALIDATION, VALIDATION_GR, VALIDATION_INVOICE | เสนอการแยกข้อมูลจาก receivingValidations/receivingChecks และ reference arrays |
| ASSET_VERIFICATION, VERIFICATION_PHOTO, ASSET_CONTROL_SHEET | แยก `validationDraft` และ `assetControlSheet` จาก `AssetValidationWizard.jsx`, `AssetControlSheet.jsx`, `App.jsx`; ผล Complete/Mismatch, Confirmed SOP, photographs และ reviewed snapshot มีแล้ว ส่วน checklist แยกรายการเป็นข้อเสนอ |
| ASSET_APPROVAL | แยก approvalHistory บน Asset ใน `App.jsx` |
| LIFECYCLE_EVENT | `useAssetLifecycleStore.js`, `proposalAssetUtils.js`, `expenseReceivingUtils.js` |
| TRANSFER_DETAIL, TRANSFER_ASSIGNMENT, LIFECYCLE_APPROVAL | แยก approvalSteps/currentApprovalStep/from/to/approvalHistory จาก transfer event |
| SPARE_PART_USAGE | แยกข้อมูล sparePartUsage จาก lifecycle event และ `mockLifecycleEvents.js` |

IDs ที่เพิ่มเพื่อแยก nested object เช่น costId, prItemId, poItemId, allocationId, invoiceId, grItemId, validationId, verificationId และ approvalId เป็นข้อเสนอ ในโค้ดปัจจุบันไม่ได้มีครบทุก key คำว่า PK/FK แสดง logical identity และ relationship ไม่ใช่ constraint ฐานข้อมูลที่มีอยู่แล้ว

ใช้ข้อความ custodian, department, plant, location, line, area, vendor และ actor ตามโค้ดจริง แม้มี ADMIN_USER ก็ยังไม่มี FK จาก custodian/actor ไปยัง user; ยังไม่สมมติ Organization/Vendor master หรือโครงสร้างลำดับ Plant → Location → Line → Area ที่ยืนยันแล้ว

## กติกาหลัก

1. Asset มีเพียง Main Asset → Sub Asset สองระดับ parentAssetId ต้องชี้ Main Asset เท่านั้น และห้าม cycle หรือเป็น parent ของตัวเอง เส้น self relationship ใน ER ไม่สามารถบังคับความลึกได้ ต้องมี validation เพิ่ม
2. sourceAssetId เก็บ Asset ที่เลือกทำงาน อาจเป็น Main หรือ Sub Asset ส่วน parentAssetId ของ child เก็บ Main Asset เสมอ งานทุนบน Sub Asset จึงสร้าง sibling ไม่ใช่ `-1-1`
3. ใน PROPOSAL_ITEM, sourceAssetId คือ Asset ที่ผู้ใช้เลือกเดิม ส่วน resultingAssetId เป็น Draft เดิมเมื่อ New Asset, child ใหม่เมื่อ Capitalized และ null เมื่อ Expense ปัจจุบัน item.assetId ถูกเขียนทับหลังสร้าง child จึงแยกความหมายสอง field ใน ER ให้ชัดเจน
4. Existing Asset item ทั้ง Addition Sub-Asset, Modification และ Maintenance ใช้ยอดรวม base amount + scoped costs: **> 50,000 THB = Capitalized**, **<= 50,000 THB = Expense** ไม่ใช้ budgetType ของ Proposal header แทน treatment ของแต่ละ item
5. Capitalized item สร้าง child ตอน Save Proposal สำเร็จ โดยเริ่ม Proposal Processing และออกเลขต่อจาก suffix สูงสุดที่เคยใช้ ห้ามนำ suffix กลับมาใช้ แม้มีการลบ/ยกเลิก record ในอนาคตต้องเก็บทะเบียนเลขที่ใช้แล้วด้วย
6. เฉพาะ Company Asset: Child คัดลอก classification/assignment จาก work target เก็บ name/model/power/Target SOP ใหม่ และมี acquisition value, depreciation และ approval ของตัวเอง Parent ยัง Active ไม่คัดลอก purchasing document, approval history หรือ depreciation date ของ Parent
7. Expense ไม่สร้าง Asset และไม่เพิ่ม depreciation value ของ Parent มี lifecycle event เก็บ work type/cost/completion date เอกสารตามย้อนผ่าน proposal item → PO allocation → PO item → PO → Invoice/GR ได้
8. Expense ใช้ flow Proposal → PR → PO → Invoice → GR Received → Completed เมื่อ reference ถูกต้องสำหรับ PO เดียวกันและ Purchasing + Asset Owner ยืนยันรับของ/งานครบ Partial receiving คง GR Received ส่วน reference ผิดหรือไม่รับงานเป็น Hold / Correction Required ไม่ตรวจ Invoice amount เพื่อ pass/fail และไม่เข้าสู่ activation
9. Main Asset history รวม events ของ Main และ Sub Assets ผ่าน parentAssetId/mainAssetId โดยไม่จำเป็นต้องสร้าง event ซ้ำ
10. การอนุมัติ Company และ Customer Asset: Asset Team Verification → Asset Team Leader → Accounting Review (ตั้ง Depreciation Start Date เฉพาะ Company Asset) → Accounting Final Approval → Active เก็บ approval history แยกจาก lifecycle approval
11. สำหรับ Company Asset เท่านั้น: Useful Life อยู่บน ASSET_TYPE; Monthly Depreciation = acquisitionValue / usefulLifeYears / 12, Accumulated = min(acquisitionValue, monthly × periods), NBV = acquisitionValue − accumulated เริ่มนับ start month เป็นงวดเต็มแรกจนถึงเดือนปัจจุบัน เป็นค่าคำนวณ ไม่ต้องเก็บซ้ำเป็น entity
12. Transfer เก็บ FROM และ TO snapshot อย่างละหนึ่งชุด ประวัติคงอยู่หลังเปลี่ยน assignment และกำหนด approvalSteps แบบยืดหยุ่น
13. SPARE_PART_USAGE เก็บ usage/cost/MIS reference เท่านั้น ไม่มี stock balance หรือ inventory approval

## Cardinality ที่ยังไม่ยืนยัน

- **PO ↔ PO Item ↔ Asset**: PO_ITEM_ALLOCATION เปิดให้เชื่อม Proposal item กับ PO item ได้หลายรายการ เป็นความสามารถของแบบจำลอง ไม่ใช่การยืนยัน business cardinality โดย Asset ที่เกี่ยวข้องหาได้จาก source/resulting Asset ของ Proposal item
- **หลาย GR ต่อ PO**: วาด 0..N เพื่อรองรับข้อมูล receipt arrays และ cumulative receiving ที่โค้ดมี แต่ final partial-delivery policy ยัง OPEN / TO CONFIRM
- **PR/PO header**: โค้ดสร้าง PR จาก Proposal เดียว และ PO จาก PR เดียว จึงแสดงตาม implementation; ไม่ถือเป็นการยืนยัน cardinality สำหรับ MIS integration ในอนาคต Imported demo PO อาจยังไม่มี PR reference จึงเป็น nullable
- **Invoice → GR**: โค้ดปัจจุบันมี invoiceReference เดียวต่อ GR และหลาย Invoice ต่อ PO ไม่ได้สมมติว่าต้องมี Invoice line matching หรือทุก Invoice ต้องมี GR
- Bridge ต้อง unique คู่ poItemId/proposalItemId; allocation quantity/value เป็นข้อเสนอและต้องกำหนดวิธีแบ่งยอด/จำนวนก่อนนำไปใช้จริง GR_ITEM มีจำนวนรับของทั้ง PO item หาก PO item ผูกหลาย allocation ต้องเพิ่มการจัดสรรจำนวนรับต่อ allocation ก่อนคำนวณผลตรวจ ไม่สามารถนำยอด GR เต็มมานับให้ทุก Asset
- Validation Invoice/GR ต้องอ้าง PO เดียวกับ allocation ของ validation; GR_ITEM ต้องอ้าง PO item ภายใต้ PO ของ GR ต้องมี business validation เพิ่มจาก FK

## จุดต่างระหว่างโค้ดและ requirement

- Transfer ใน `AssetLifecycleDialog.jsx` ปัจจุบันมี Requester Manager → Destination Department Leader → Asset Team Acknowledgement รวม 3 ขั้น ขณะที่ AGENTS.md ระบุ Area Owner → Source Department Leader → Destination Department Leader → Asset Team Acknowledgement รวม 4 ขั้น ER เก็บขั้นอนุมัติแบบ configurable และใช้ AGENTS.md เป็นกติกาหลัก ไม่เปลี่ยนโค้ดในงานนี้
- Verification มี Complete/Mismatch, Confirmed SOP, remark, photographs และ reviewed control sheet แล้ว แต่เก็บเป็น nested `validationDraft`/`assetControlSheet` ล่าสุดบน Asset ไม่ใช่ verification table/history แยก; checklist หกหัวข้อยังไม่มี field แยกครบ และ queue/submission ยังอิง Asset + PO โดยต้องตรวจทุก linked PO ก่อนส่ง Leader ส่วน logical schema แยก receiving กับ verification ตาม requirement
- Approval history ปัจจุบันเก็บ stage/action/actor/date และบางรายการมี comment ส่วน explicit result และ remark ที่เป็นรูปแบบเดียวกันเป็นข้อเสนอสำหรับ logical schema
- Standalone Sub Asset เป็น flow ที่เข้าถึงได้จริงจาก `App.jsx` → `CreateSubAssetPage.jsx` → `createSubAssetDraft`: สร้างเลขและ Draft ก่อน Proposal ต่างจากข้อ 28 ที่ให้เริ่มใน Proposal และสร้าง child เมื่อ Save Proposal สำเร็จ หากยอด Expense โค้ดยกเลิก Draft แต่เก็บเลขไว้
- Active Asset selection ใน `MISCreateProposalPage.jsx` มีเฉพาะ Modification/Maintenance และตั้ง `workOnExistingAsset=true`; `prepareProposalAssets` ไม่สร้าง child แม้ Capitalized และ `expenseReceivingUtils` ให้รายการดังกล่าว Completed บน GR save ต่างจากข้อ 28 ที่ให้ทั้งสาม work types > 50,000 สร้าง child และเข้าสู่ activation จึงเก็บ flag เพื่ออธิบายโค้ด ไม่ถือเป็นกฎที่ยืนยันแล้ว
- Proposal UI ปัจจุบันเลือก Asset เดียว (`form.assetItems[0]`) แม้ stores/utilities ใช้ arrays และ requirement รองรับหลาย Asset ต่อ Proposal ER แสดง 1..N ตาม requirement; projectCode ยังเป็นตัวกรอง eligibility เพิ่มใน UI
- Vendor Delivery ใช้ยอด Invoice รวมเทียบ `po.referenceTotal`, กัน Invoice เกินยอดคงเหลือ และบังคับจำนวนส่งไม่เกิน PO ใน `vendorDeliveryUtils.js` ต่างจาก receiving rule ที่ตรวจแค่ document exists + same PO และไม่ใช้ Invoice amount/quantity เป็นเกณฑ์ สมควรแยก delivery tracking ออกจาก receiving pass/fail; Swimlane ไม่ใช้ amount matching
- `advanceTransferApproval` อัปเดต department/custodian/plant/location/line แต่ยังไม่อัปเดต area ส่วน Transfer schema เก็บ area เพื่อรองรับ requirement
- ตัวอย่าง Vendor Delivery มี demo Invoice storage แยก; `documentName` เป็น metadata ไม่ใช่ไฟล์ Invoice ที่ persist จริง ไม่มี OCR หรือ MIS sync API
- หลาย store เขียน localStorage แยกกันและอาจ fallback เป็น session state; Save Proposal ใน mockup ไม่ใช่ atomic database transaction จึงยังรับประกัน durable save/number reservation ไม่ได้

เอกสารนี้ไม่ได้แก้ไข application code หรือสร้างฐานข้อมูล และไม่รวม Disposal/Write-off เพราะ workflow ยังไม่ยืนยัน


## Customer Assets — confirmed 6 Oct 2026

- `ASSET.ownershipType`: `company` / `customer`; ไม่มีค่าใน legacy record = Company Asset (TBKK) ตาม `assetOwnershipUtils.js`
- Customer Asset ต้องมี customerName ที่ไม่ว่างบน record; ยังไม่มี Customer master และไม่อนุมานว่าทั้ง Proposal ต้องเป็น customerName เดียวกัน เพราะข้อ 29 ยืนยันเฉพาะ ownership เดียว
- `MIS_PROPOSAL.ownershipType` เลือกตั้งแต่เริ่ม Proposal; ทุก source/resulting Asset ต้องมี ownership เดียวกัน Customer เลือกเฉพาะ Draft ที่ยังไม่ถูกผูก Proposal ส่วน Company เลือก Draft หรือ Active เพื่อทำ existing work
- Customer ผ่าน Proposal/PR/PO/Invoice/GR/Verification/Leader/Accounting จน Active แต่ไม่มี depreciationStartDate, DP profile, DP calculation หรือ DP edit; acquisition amount/document references ยังเก็บได้
- Customer ไม่มี Sub Asset/Modification/Maintenance/Transfer/Spare Part Usage และห้ามอยู่ใน Movement หรือ simulated MIS issue selection เงื่อนไขนี้ต้อง enforce เพิ่มจาก ER cardinality
- `specialControl = Customer Asset` ใน verification form เป็นข้อมูล control plate ไม่ใช่ตัวแทน ownershipType

## ขอบเขตอื่นที่ตรวจสอบและเพิ่มใน ER

| Entity / surface | Mapping และข้อจำกัด |
| --- | --- |
| PROJECT | `useProjectStore.js`, `CreateProjectPage.jsx`: projectCode/projectName/detail/date; Asset/Proposal มี code/name snapshot และอาจใส่ code แบบ free text จึงยังไม่เป็น FK ที่ enforce จริง |
| MIS_PART | `mockParts.js`, Proposal Part browser: partNo/name/model เป็น external reference ไม่ใช่ spare part inventory |
| ADMIN_USER, ADMIN_ROLE, USER_ROLE | `useAdminStore.js`, `adminData.js`, `AdministratorPage.jsx`: users, roles, user.roleIds; normalize array เป็น bridge |
| APP_MENU, ROLE_MENU_PERMISSION | menus.parentId และ permissions[roleId] เป็น menu ID arrays; ไม่สมมติ CRUD/action permissions หรือ production authorization |
| ASSET_NUMBER_RESERVATION | เสนอเพื่อเก็บเลข child ที่เคยใช้ถาวร; ปัจจุบันคำนวณจาก Asset IDs ที่ยังเก็บไว้ รวม Cancelled ไม่ใช่ registry แยก |
| VERIFICATION_PHOTO | machine ได้สูงสุด 3 รูป; assetPlate/machinePlate/specialPlate อย่างละ 1 รูป specialPlate เลือก N/A ได้; ใช้ data URL ใน localStorage ไม่ใช่ file service |
| ASSET_CONTROL_SHEET | snapshot ของ asset fields/ownership/references, PO และ verification form เมื่อ review; print 2-page control sheet จาก snapshot และ photos ไม่ใช่ acquisition approval ใหม่ |
| DEPRECIATION_PROFILE | nested metadata จาก DP editor; Useful Life ที่ใช้คำนวณยังอ่าน Asset Type ไม่ใช้ snapshot แทน master |
| Reports / dashboard / labels | aggregate, monthly depreciation report, CSV, QR/Asset labels, control sheet เป็น derived views ไม่เพิ่ม transaction entity |
| ASSET_ISSUE | `AssetInfoPage.jsx` เก็บ assetId/description/reportedAt/status ใน `tbkk-asset-reported-issues-v1`; issueId เป็น proposed key ไม่มี notification หรือ resolution/maintenance workflow ที่ยืนยัน |
| Legacy Sub Asset requests | `useSubAssetRequestStore.js` และ migration ไป numbered Draft เป็น compatibility store ไม่ใช่ confirmed standalone request entity |

## Identity, audit และ constraints เพิ่มเติม

- ER ใช้ `assetId` เป็นเลขที่แสดงใน mockup; PR_ITEM/PO_ITEM/GR_ITEM keys เสนอให้ไม่ชนข้ามเอกสาร PO item identity ต้อง unique (poNo, itemNo)
- `PROPOSAL_ITEM.resultingAssetId` หมายถึง Asset ที่เข้าสู่ acquisition ตาม requirement; implementation capitalized receiving-only branch ไม่มี resulting child จึงต้องอ่านควบคู่ gap ข้างต้น ห้ามแปลง selected Active Asset เป็น child โดยอัตโนมัติใน migration
- `ASSET.proposalItemId` เป็น origin reference ส่วน sourceAssetId/parentAssetId เป็นคนละความหมาย; ตัวเลข suffix ต้องเพิ่มไม่ย้อนกลับ เลข Reserved/Cancelled ต้องคงอยู่ แม้ Asset ถูกลบในอนาคต
- Invoice identity แยก invoiceId จาก invoiceNo (`vendorInvoices.reference`); UI ปัจจุบันตรวจเลขซ้ำภายใน PO แบบ case-insensitive ไม่ยืนยัน global unique Invoice number. Legacy reference อาจมีแค่เลข/PO ไม่มี vendor upload rows ให้ migrate แบบ optional metadata
- INVOICE_ITEM แยก reported delivery quantity จาก GR_ITEM ที่เป็นจำนวนรับจริง ห้ามใช้ Invoice line quantity/amount เพื่อทำ 3-way matching
- `ASSET_VERIFICATION.poNo` สะท้อน wizard context ปัจจุบัน; FK ต้องเป็น PO ที่เกี่ยวข้องกับ Asset ส่วน receiving allocation linkage เป็นคนละ record และไม่บังคับหนึ่ง verification ต่อ PO เป็น business cardinality ถาวร
- Checklist booleans, actor/verifiedAt ของ verification และ IDs/history แยกเป็น proposed normalization. Control sheet snapshots และ photo references ควรคงตาม revision หากทำ persistent audit จริง; mockup ปัจจุบันเก็บ latest snapshot
- ASSET_CONTROL_SHEET เป็น 0..1 ต่อ verification แต่ draft ยังไม่มี sheet; แยก photo rows ออกจาก sheet snapshot เพื่อไม่ duplicate image bytes
- TRANSFER_ASSIGNMENT ต้องมี FROM/TO สองแถวเท่านั้นต่อ Transfer; generic cardinality 1..N ใน Mermaid ไม่บังคับ exactly two จึงต้อง validate เพิ่ม
- Approval actor ปัจจุบันเป็นข้อความ role/ชื่อ ไม่ใช่ authenticated user ID; admin data/login simulation ไม่ยืนยัน production authentication, RBAC enforcement หรือ approval audit ของ MIS ซึ่งยังไม่ได้เก็บแยกครบ
- ASSET_APPROVAL และ LIFECYCLE_APPROVAL เป็น append-only logical histories; ไม่คัดลอก approval/depreciation/purchasing references จาก Main เข้า child

## Review coverage และลำดับการแก้ภายหลัง

ตรวจ routes/handlers ใน `App.jsx`, pages, shared detail/validation/lifecycle components, hooks/data และ business utilities/tests. งานนี้ปรับเอกสารเท่านั้น; ไม่แก้ UI, localStorage หรือ workflow ของผู้ใช้

ลำดับที่ควร reconcile กับ product owner ก่อนแก้ implementation: (1) standalone Draft Sub Asset และ capitalized receiving-only work เทียบข้อ 28, (2) transfer chain สี่ขั้น, (3) vendor Invoice matching เทียบ receiving rule, (4) multi-Asset Proposal UI, (5) persisted verification/audit และ durable numbering. README ปัจจุบันอธิบาย implemented flow ที่ต่างจาก AGENTS.md จึงไม่ใช้แทน confirmed requirements

Swimlane ใช้ confirmed flow ตาม AGENTS.md ข้อ 28–29 ส่วน verification photographs/control-sheet preview เป็นรายละเอียดที่มีใน mockup และระบุไว้ชัดใน swimlane notes. Disposal/Write-off และ production MIS sync ยัง OPEN / TO CONFIRM


## Validation — 8 Oct 2026

- `node --test src/utils/*.test.js`: 59 tests passed. Tests verify current implemented behavior; passing tests do not resolve the requirement discrepancies listed above.
- `npm run build`: passed.
- Mermaid 11.15 syntax parser: ER และ swimlane ทั้งสามไฟล์ผ่าน (syntax-only ใน Node โดยแทน DOM sanitizer ใน temporary browser bundle; ไม่เปลี่ยน grammar หรือ repository dependencies). Entity references, relative document links และ embedded diagrams ตรงกับ `.mmd` sources ผ่านการตรวจ
- ไม่ได้ตรวจ visual rendering ใน browser เนื่องจากไม่มี browser surface ที่ใช้ได้ใน session นี้; เปิด `asset-management-swimlane.md` ใน Mermaid-capable Markdown preview เพื่อดู layout
