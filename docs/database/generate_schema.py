"""Generate Asset-only DDL, dictionary and ER from schema-definition.json."""
from pathlib import Path
import csv, json, re
ROOT=Path(__file__).resolve().parent
spec=json.loads((ROOT/'schema-definition.json').read_text())
T=spec['tables']
composite_fks=spec['composite_foreign_keys']
def esc(s): return s.replace("'","''")
def colname(t,n): return T[t].get('column_names',{}).get(n,T[t]['prefix']+'_'+n)
# Names can be shared across tables, but must be unique within a table.
for table_name, table_spec in T.items():
    resolved=[colname(table_name,c['name']) for c in table_spec['columns']]
    assert len(resolved)==len(set(resolved)),('Duplicate column name',table_name)
    assert set(table_spec.get('column_names',{})) <= {c['name'] for c in table_spec['columns']}
    assert all(re.fullmatch(r'[a-z][a-z0-9_]{0,63}',n) for n in resolved)
def q(s): return '`'+s+'`'
def names(t,ns): return ', '.join(q(colname(t,n)) for n in ns)
def checkexpr(t,e):
    for col in sorted(T[t]['columns'], key=lambda x:len(x['name']), reverse=True):
        e=re.sub(r'\b'+re.escape(col['name'])+r'\b',q(colname(t,col['name'])),e)
    return e
sql=["-- TBKK Asset-only database design. External MIS references only. Target MySQL 8.4+, InnoDB, UTF8MB4.","-- Run in an EMPTY, explicitly selected database. No DROP/CREATE DATABASE statements.","SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;","SET time_zone = '+00:00';","SET SESSION sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';",'']
refs=[]; rows=[]
for name,t in T.items():
    definitions=[]
    for col in t['columns']:
        n=colname(name,col['name']); default=col['default']
        extra=''
        if default=='AUTO_INCREMENT': extra=' AUTO_INCREMENT'
        elif default is not None: extra=' DEFAULT '+default
        definitions.append('  '+q(n)+' '+col['type']+(' NULL' if col['nullable'] else ' NOT NULL')+extra+" COMMENT '"+esc(col['description'])+"'")
        if col['ref']:
            assert col['ref'] in T,col
            refs.append((name,col['name'],col['ref']))
        rows.append([name,t['prefix'],t['module'],n,col['type'],'YES' if col['nullable'] else 'NO',default or '', 'PK' if col['name']=='id' else '', (col['ref']+'.'+colname(col['ref'],'id')) if col['ref'] else '',col['description']])
    definitions.append('  PRIMARY KEY ('+q(colname(name,'id'))+')')
    existing={x['name'] for x in t['columns']}
    for i,ns in enumerate(t['unique'],1):
        assert set(ns)<=existing,(name,ns)
        definitions.append(f'  UNIQUE KEY {q("uq_"+t["prefix"]+"_"+str(i))} ({names(name,ns)})')
    for i,ns in enumerate(t['idx'],1):
        assert set(ns)<=existing,(name,ns)
        definitions.append(f'  KEY {q("ix_"+t["prefix"]+"_"+str(i))} ({names(name,ns)})')
    for i,e in enumerate(t['checks'],1): definitions.append(f'  CONSTRAINT {q("ck_"+t["prefix"]+"_"+str(i))} CHECK ({checkexpr(name,e)})')
    sql.append('CREATE TABLE '+q(name)+' (\n'+',\n'.join(definitions)+"\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='"+esc(t['description'])+"';\n")
# Add FKs after all CREATEs; default RESTRICT avoids conflicts with CHECK FK fields.
for name,col,target in refs:
    sql.append('ALTER TABLE '+q(name)+' ADD CONSTRAINT '+q('fk_'+T[name]['prefix']+'_'+col)+' FOREIGN KEY ('+q(colname(name,col))+') REFERENCES '+q(target)+' ('+q(colname(target,'id'))+');')
for i,(name,columns,target,target_columns) in enumerate(composite_fks,1):
    sql.append('ALTER TABLE '+q(name)+' ADD CONSTRAINT '+q('fk_same_po_'+str(i))+' FOREIGN KEY ('+names(name,columns)+') REFERENCES '+q(target)+' ('+names(target,target_columns)+');')
sql+=['','-- Append-only guards: application role must also have INSERT/SELECT only on log_*.', 'DELIMITER $$']
for name,t in T.items():
    if not t['mutable']:
        for op in ['UPDATE','DELETE']:
            sql.append(f"CREATE TRIGGER {q('tr_'+t['prefix']+'_'+op.lower())} BEFORE {op} ON {q(name)} FOR EACH ROW\nBEGIN\n  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Append-only log: append a new or reversing entry';\nEND$$")
sql+=['DELIMITER ;','']
(ROOT/'schema.sql').write_text('\n'.join(sql))
with (ROOT/'data-dictionary.csv').open('w',encoding='utf-8-sig',newline='') as out:
    w=csv.writer(out); w.writerow(['table','prefix','module','column','type','nullable','default','key','references','description_th']);w.writerows(rows)
with (ROOT/'table-catalog.csv').open('w',encoding='utf-8-sig',newline='') as out:
    w=csv.writer(out);w.writerow(['table','prefix','module','description_th','storage_rule']);w.writerows([n,t['prefix'],t['module'],t['description'],'mutable' if t['mutable'] else 'append-only'] for n,t in T.items())
md=['# TBKK Asset Data Dictionary','',f'รวม {len(T)} ตาราง {len(rows)} คอลัมน์ สร้างจาก generate_schema.py ซึ่งเป็นแหล่งนิยามเดียวกับ schema.sql','', 'PK ทุกตารางเป็น BIGINT UNSIGNED AUTO_INCREMENT; FK ใช้ชนิดเดียวกัน ไม่ทำ cascade delete. NULL คือยังไม่มีข้อมูล ไม่ใช้สตริงว่างแทนวันที่หรือ FK.','']
for name,t in T.items():
    md += ['## '+name,'',t['description']+' — prefix `'+t['prefix']+'` — '+('แก้ไขได้โดย workflow' if t['mutable'] else 'เพิ่มอย่างเดียว ห้าม UPDATE/DELETE'),'', '| Column | Type | Null | Default | FK | ความหมาย |','|---|---|---|---|---|---|']
    for row in [x for x in rows if x[0]==name]:md.append('| '+' | '.join(str(v).replace('|',' / ') for v in [row[3],row[4],row[5],row[6],row[8],row[9]])+' |')
    if t['unique']: md+=['','Unique: '+', '.join('('+', '.join(colname(name,n) for n in ns)+')' for ns in t['unique'])]
    if t['idx']:md+=['','Indexes: '+', '.join('('+', '.join(colname(name,n) for n in ns)+')' for ns in t['idx'])]
    if t['checks']:md+=['','Checks: '+ '; '.join('`'+checkexpr(name,e)+'`' for e in t['checks'])]
    for source,cols,target,target_cols in composite_fks:
        if source==name: md+=['','Composite FK: `'+names(name,cols)+'` → `'+target+'('+names(target,target_cols)+')` บังคับ PO scope ของเอกสารตรงกับ link']
    md+=['']
(ROOT/'data-dictionary.md').write_text('\n'.join(md))
# Full ER omits repeated administrative created_by/updated_by edges only, not business edges.
er=['erDiagram']
for name,t in T.items():
    er+=['  '+name+' {',f'    bigint {t["prefix"]}_id PK']
    for col in t['columns']:
        if col['ref'] and col['name'] not in ['created_by','updated_by']:er.append(f'    bigint {colname(name,col["name"])} FK')
    er.append('  }')
for name,col,target in refs:
    if col not in ['created_by','updated_by']:
        cdef=next(c for c in T[name]['columns'] if c['name']==col)
        one='|o' if cdef['nullable'] else '||'
        er.append(f'  {target} {one}--o{{ {name} : "{colname(name,col)}"')
(ROOT/'er-full.mmd').write_text('\n'.join(er)+'\n')
(ROOT/'schema-model.json').write_text(json.dumps(T,ensure_ascii=False,indent=2)+'\n')
print(f'Generated {len(T)} tables, {len(rows)} columns, {len(refs)+len(composite_fks)} foreign keys')
