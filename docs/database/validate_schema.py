"""Validate generated DDL against an explicitly disposable MySQL schema.

Usage: python3 validate_schema.py --socket /path/to/test.sock --database tbkk_schema_review_asset
Schema and reference seed must already be imported. Uses local root socket auth only.
Fixtures are rolled back after each case. Never points at the application's database.
"""
import argparse, csv, json, re, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parent
p=argparse.ArgumentParser()
p.add_argument('--socket',required=True)
p.add_argument('--database',required=True)
a=p.parse_args()
if not re.fullmatch(r'tbkk_schema_review[a-zA-Z0-9_]*',a.database):
    raise SystemExit('Refusing non-review database name')
base=['mysql','--no-defaults','--protocol=SOCKET','--socket='+a.socket,'-u','root',
      '--default-character-set=utf8mb4','--batch','--skip-column-names',a.database]
def run(sql):
    return subprocess.run(base,input=sql,encoding='utf-8',capture_output=True)
def query(sql):
    r=run(sql)
    if r.returncode: raise RuntimeError(r.stderr)
    return r.stdout.strip()
model=json.loads((ROOT/'schema-model.json').read_text())
results=[]
def check(label,condition,detail=''):
    results.append((label,bool(condition),detail))
    if not condition: print('FAIL:',label,detail)
db="DATABASE()"
check('Table count',int(query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_type=\'BASE TABLE\''))==len(model))
expected_columns=sum(len(t['columns']) for t in model.values())
check('Column count',int(query('SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE()'))==expected_columns)
expected_fks=sum(bool(c['ref']) for t in model.values() for c in t['columns'])+len(json.loads((ROOT/'schema-definition.json').read_text())['composite_foreign_keys'])
check('Foreign key count',int(query("SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND constraint_type='FOREIGN KEY'"))==expected_fks)
check('CHECK constraint count',int(query("SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND constraint_type='CHECK'"))==sum(len(t['checks']) for t in model.values()))
log_count=sum(n.startswith('log_') for n in model)
check('Append-only trigger count',int(query('SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema=DATABASE()'))==log_count*2)
with (ROOT/'data-dictionary.csv').open(encoding='utf-8-sig',newline='') as f: dictionary=list(csv.DictReader(f))
check('Dictionary exactly matches model column names',
      {(r['table'],r['column']) for r in dictionary}=={(n,t.get('column_names',{}).get(c['name'],t['prefix']+'_'+c['name'])) for n,t in model.items() for c in t['columns']})
actual=query('SELECT table_name,column_name FROM information_schema.columns WHERE table_schema=DATABASE()')
check('Every database column matches the model-defined name',all(col in {model[table].get('column_names',{}).get(c['name'],model[table]['prefix']+'_'+c['name']) for c in model[table]['columns']} for table,col in (line.split('\t') for line in actual.splitlines())))
removed=json.loads((ROOT/'scope-changes.json').read_text())['removed_tables']
check('Purchasing and stock tables removed', not (set(removed) & set(model)))
check('No historical audit seed',query('SELECT COUNT(*) FROM log_audit')=='0')

fixture="""
INSERT INTO sys_department (sd_id,sd_plant_cd,sd_code,sd_name) VALUES (900000,'REVIEW_PLANT','REVIEW_DEP','Review');
INSERT INTO sys_permission_group (spg_id,spg_name) VALUES (900000,'Review');
INSERT INTO sys_users (su_id,spg_id,su_username,su_employee_code,su_password,su_firstname,su_lastname,su_email,sd_id) VALUES (900000,900000,'review-user','REVIEW_EMP','review-hash-only','Review','User','review@example.invalid',900000);
INSERT INTO mst_project (mprj_id,mprj_code,mprj_name) VALUES (900000,'REVIEW_PROJECT','Review');
INSERT INTO mst_account (mac_id,mac_code,mac_name) VALUES (900000,'REVIEW_ACCOUNT','Review');
INSERT INTO mst_customer (mc_id,mc_code,mc_name) VALUES (900000,'REVIEW_CUSTOMER','Customer');
INSERT INTO mst_vendor (mv_id,mv_code,mv_name) VALUES (900000,'REVIEW_VENDOR','Vendor');
INSERT INTO mst_asset_type (mat_id,mat_code,mat_name,mag_id,mat_useful_life_years)
 SELECT 900000,'REVIEW_TYPE','Review',mag_id,10 FROM mst_asset_group WHERE mag_code='ME';
INSERT INTO mst_asset (ma_id,ma_temporary_ref,ma_no,ma_name,mat_id,ma_status)
 VALUES (900000,'REVIEW_DRAFT_1','REVIEW_ME_1','Review Main',900000,'Active');
INSERT INTO mst_asset (ma_id,ma_temporary_ref,ma_name,mat_id,parent_ma_id,source_ma_id)
 VALUES (900001,'REVIEW_DRAFT_2','Review Sub',900000,900000,900000);
INSERT INTO info_mis_document_reference (imdr_id,imdr_source,imdr_external_key,imdr_kind,imdr_no,imdr_status,po_imdr_id,imdr_document_exists,imdr_synced_at) VALUES
 (900000,'MIS','PROP_KEY','PROPOSAL','REVIEW_PROP','Draft',NULL,1,UTC_TIMESTAMP(6)),
 (900001,'MIS','PO1_KEY','PO','REVIEW_PO1','Approved',NULL,1,UTC_TIMESTAMP(6)),
 (900002,'MIS','PO2_KEY','PO','REVIEW_PO2','Approved',NULL,1,UTC_TIMESTAMP(6)),
 (900003,'MIS','INV_KEY','INVOICE','REVIEW_INV','Available',900001,1,UTC_TIMESTAMP(6)),
 (900004,'MIS','GR1_KEY','GR','REVIEW_GR1','Received',900001,1,UTC_TIMESTAMP(6)),
 (900005,'MIS','GR2_KEY','GR','REVIEW_GR2','Received',900002,1,UTC_TIMESTAMP(6));
INSERT INTO info_asset_acquisition (iaa_id,imdr_id,iaa_proposal_item_key,selected_ma_id,mprj_id,iaa_ownership,iaa_selection,iaa_work_type,iaa_treatment,iaa_title,iaa_budget_type,iaa_base_amount,iaa_total_amount,iaa_synced_at)
 VALUES (900000,900000,'ITEM1',900000,900000,'COMPANY','EXISTING','MAINTENANCE','EXPENSE','Review work','EXPENSE',50000,50000,UTC_TIMESTAMP(6));
INSERT INTO log_audit (la_id,la_actor_name_snapshot,la_module,la_action,la_record_table,la_record_id,la_record_ref,la_correlation_id,la_occurred_at)
 VALUES (900000,'Review','Asset','UPDATE','mst_asset',900000,'REVIEW_ME_1','review-case',UTC_TIMESTAMP(6));
"""
def case(label,sql,error_code=None,output=None):
    r=run('START TRANSACTION;\n'+fixture+'\n'+sql+'\nROLLBACK;')
    ok=(r.returncode==0) if error_code is None else (r.returncode!=0 and ('ERROR '+str(error_code)+' ') in r.stderr)
    if output is not None: ok=ok and r.stdout.strip()==output
    check(label,ok,r.stderr.strip() if not ok else '')
case('Fixture and valid two-level Draft', 'SELECT COUNT(*) FROM mst_asset WHERE ma_id BETWEEN 900000 AND 900001;',output='2')
case('Reject duplicate temporary reference',"INSERT INTO mst_asset (ma_temporary_ref,ma_name,mat_id) VALUES ('REVIEW_DRAFT_1','Duplicate',900000);",1062)
case('Reject dangling asset type FK',"INSERT INTO mst_asset (ma_temporary_ref,ma_name,mat_id) VALUES ('REVIEW_DANGLING','Dangling',999999999);",1452)
case('Reject Active asset without real number',"INSERT INTO mst_asset (ma_temporary_ref,ma_name,mat_id,ma_status) VALUES ('REVIEW_NO_REAL','Invalid',900000,'Active');",3819)
case('Reject Customer asset without customer',"INSERT INTO mst_asset (ma_temporary_ref,ma_name,mat_id,ma_ownership) VALUES ('REVIEW_CUSTOMER_BAD','Invalid',900000,'CUSTOMER');",3819)
case('Accept Customer Draft with named customer',"INSERT INTO mst_asset (ma_temporary_ref,ma_name,mat_id,ma_ownership,mc_id,ma_customer_name_snapshot) VALUES ('REVIEW_CUSTOMER_OK','Customer',900000,'CUSTOMER',900000,'Customer');")
case('Reject Company asset with customer fields',"UPDATE mst_asset SET mc_id=900000 WHERE ma_id=900000;",3819)
case('Reject duplicate child suffix',"UPDATE mst_asset SET ma_no='REVIEW_ME_1-1',ma_child_suffix=1,ma_status='Purchasing' WHERE ma_id=900001; INSERT INTO mst_asset (ma_temporary_ref,ma_no,ma_name,mat_id,parent_ma_id,ma_child_suffix) VALUES ('REVIEW_DRAFT_3','REVIEW_ALT_NUMBER','Duplicate suffix',900000,900000,1);",1062)
case('Reject duplicate selected asset in external Proposal',"INSERT INTO info_asset_acquisition (imdr_id,iaa_proposal_item_key,selected_ma_id,mprj_id,iaa_ownership,iaa_selection,iaa_work_type,iaa_treatment,iaa_title,iaa_budget_type,iaa_base_amount,iaa_total_amount,iaa_synced_at) VALUES (900000,'ITEM2',900000,900000,'COMPANY','EXISTING','MAINTENANCE','EXPENSE','Duplicate','EXPENSE',50000,50000,UTC_TIMESTAMP(6));",1062)
work="INSERT INTO info_asset_work (iaa_id,source_ma_id,iaw_work_type,iaw_treatment,iaw_total_cost) VALUES (900000,900000,'MAINTENANCE','EXPENSE',{});"
case('Accept Expense at 49999.99',work.format('49999.99'))
case('Accept Expense at exactly 50000',work.format('50000.00'))
case('Reject Expense above 50000',work.format('50000.01'),3819)
case('Reject capitalized work without child',"INSERT INTO info_asset_work (iaa_id,source_ma_id,iaw_work_type,iaw_treatment,iaw_total_cost) VALUES (900000,900000,'MAINTENANCE','CAPITALIZED_SUB_ASSET',50000.01);",3819)
capital_setup="UPDATE info_asset_acquisition SET iaa_treatment='CAPITALIZED_SUB_ASSET',ma_id=900001,iaa_base_amount=50000.01,iaa_total_amount=50000.01 WHERE iaa_id=900000; "
capital_work="INSERT INTO info_asset_work (iaa_id,source_ma_id,result_ma_id,iaw_work_type,iaw_treatment,iaw_total_cost) VALUES (900000,900000,900001,'MAINTENANCE','CAPITALIZED_SUB_ASSET',{});"
case('Accept capitalized Maintenance at 50000.01 with Sub Draft',capital_setup+capital_work.format('50000.01'))
case('Reject capitalized work at exactly 50000',capital_setup+capital_work.format('50000.00'),3819)
case('Accept acquisition GR link for same PO',"INSERT INTO info_asset_acquisition_document (iaa_id,imdr_id,iaad_document_item_key,po_imdr_id,iaad_po_item_key,iaad_synced_at) VALUES (900000,900004,'GRLINE1',900001,'POLINE1',UTC_TIMESTAMP(6));")
case('Reject acquisition GR link for different PO',"INSERT INTO info_asset_acquisition_document (iaa_id,imdr_id,iaad_document_item_key,po_imdr_id,iaad_po_item_key,iaad_synced_at) VALUES (900000,900004,'GRLINE1',900002,'POLINE1',UTC_TIMESTAMP(6));",1452)
case('Reject Invoice reference without PO',"INSERT INTO info_mis_document_reference (imdr_source,imdr_external_key,imdr_kind,imdr_no,imdr_status,imdr_synced_at) VALUES ('MIS','BAD_INV','INVOICE','BAD','Available',UTC_TIMESTAMP(6));",3819)
case('Reject Customer existing work in acquisition',"UPDATE info_asset_acquisition SET iaa_ownership='CUSTOMER' WHERE iaa_id=900000;",3819)
case('Reject Expense acquisition above threshold',"UPDATE info_asset_acquisition SET iaa_total_amount=50000.01 WHERE iaa_id=900000;",3819)
case('Reject duplicate external document source key',"INSERT INTO info_mis_document_reference (imdr_source,imdr_external_key,imdr_kind,imdr_no,imdr_status,imdr_synced_at) VALUES ('MIS','PO1_KEY','PO','DUP','Approved',UTC_TIMESTAMP(6));",1062)
case('Reject local purchasing document kind',"INSERT INTO info_document (idoc_no,idoc_kind,idoc_status,idoc_origin,idoc_document_date) VALUES ('INVALID_LOCAL_PO','PO','Draft','ASSET','2026-10-18');",1265)
case('Reject accepted quantity above received quantity',"INSERT INTO info_asset_acquisition_document (iaa_id,imdr_id,iaad_document_item_key,po_imdr_id,iaad_po_item_key,iaad_received_quantity,iaad_accepted_quantity,iaad_synced_at) VALUES (900000,900004,'GRLINE1',900001,'POLINE1',1,2,UTC_TIMESTAMP(6));",3819)
case('Append-only Audit rejects UPDATE',"UPDATE log_audit SET la_action='TAMPERED' WHERE la_id=900000;",1644)
case('Append-only Audit rejects DELETE',"DELETE FROM log_audit WHERE la_id=900000;",1644)
case('Accept balanced DP period',"INSERT INTO log_depreciation_period (ma_id,ldp_period_month,ldp_opening_cost,ldp_closing_cost,ldp_period_dp,ldp_closing_accumulated_dp,ldp_closing_net_book_value) VALUES (900000,'2026-10-01',120000,120000,1000,1000,119000);")
case('Reject inconsistent DP net book value',"INSERT INTO log_depreciation_period (ma_id,ldp_period_month,ldp_opening_cost,ldp_closing_cost,ldp_period_dp,ldp_closing_accumulated_dp,ldp_closing_net_book_value) VALUES (900000,'2026-10-01',120000,120000,1000,1000,120000);",3819)
case('Reject DP period not first day of month',"INSERT INTO log_depreciation_period (ma_id,ldp_period_month) VALUES (900000,'2026-10-18');",3819)
case('Allow zero-DP cutoff before start in first sale month',"INSERT INTO info_asset_depreciation (ma_id,iad_acquisition_value,iad_useful_life_months,iad_start_date,iad_stop_date,iad_value_source) VALUES (900000,120000,120,'2026-10-01','2026-09-30','REVIEW');")
case('Stale optimistic update changes zero rows',"UPDATE mst_asset SET ma_name='New',ma_row_version=ma_row_version+1 WHERE ma_id=900000 AND ma_row_version=1; UPDATE mst_asset SET ma_name='Stale' WHERE ma_id=900000 AND ma_row_version=1; SELECT ROW_COUNT();",output='0')
check('All fixture writes rolled back',query('SELECT COUNT(*) FROM mst_asset WHERE ma_id >= 900000')=='0')

version=query('SELECT VERSION()')
lines=['# TBKK Database Validation','',
       'Validated on 18 October 2026 (Asia/Bangkok).',
       f'Actual server: MySQL {version}; isolated temporary instance, networking disabled.',
       'Design target: MySQL 8.4+. This run validates the installed 9.6 server; a separate 8.4 deployment run remains required.',
       '',f'{len(model)} tables, {expected_columns} columns, {expected_fks} foreign keys and {log_count*2} append-only triggers.',
       '', '| Check | Result |','|---|---|']
lines += ['| '+label+' | '+('PASS' if ok else 'FAIL')+' |' for label,ok,_ in results]
passed=sum(ok for _,ok,_ in results)
lines += ['',f'Result: {passed}/{len(results)} checks passed.','',
          'DDL, reference seed and read-only example queries were imported/executed separately in a fresh review schema.',
          'Tests verify structural and row-level database constraints, not application workflows. Cross-table business rules listed in workflow-contracts.md require backend implementation and acceptance tests.',
          'No application data, localStorage, existing database or UI was modified. Fixtures use only the disposable review schema and roll back after each case.',
          '', 'Reproduce after importing schema.sql and reference-seed.sql:', '', '```sh',
          f'python3 docs/database/validate_schema.py --socket /path/to/test.sock --database {a.database}','```','']
(ROOT/'validation-report.md').write_text('\n'.join(lines))
print(f'{passed}/{len(results)} checks passed on MySQL {version}')
raise SystemExit(0 if passed==len(results) else 1)
