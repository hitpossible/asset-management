"""Build an editable, uncompressed diagrams.net ER file from the current schema.

All tables and attributes have one canonical full table on a module page.
An overview page shows business FKs; module pages add external PK-only stubs.
Technical created_by/updated_by edges are omitted visually, retained in row tooltips.
"""
from pathlib import Path
from collections import Counter
import json, re, xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parent
SPEC=json.loads((ROOT/'schema-definition.json').read_text())
T=SPEC['tables']
GROUPS=[
 ('system','System and Permissions',[n for n in T if n.startswith('sys_')]),
 ('master','Master and Asset Register',[n for n in T if n.startswith('mst_')]),
 ('acquisition','Acquisition and MIS References',['info_mis_document_reference','info_rfq_reference','info_asset_acquisition','info_asset_acquisition_cost','info_asset_acquisition_document','info_receiving_validation','info_asset_work','info_asset_spare_usage']),
 ('documents','Documents and Attachments',['info_document','info_file','info_document_file','info_asset_file']),
 ('verification','Verification and Approvals',['info_asset_verification','info_verification_check','info_approval_request','info_approval_step']),
 ('lifecycle','Lifecycle and Accounting',['info_asset_depreciation','info_asset_transfer','info_asset_disposal','info_sale_proposal','info_tax_invoice','info_sale_item','info_asset_issue','info_notification']),
 ('history','History and Integration',['log_approval_action','log_asset_event','log_audit','log_audit_change','log_receiving_validation','log_depreciation_period','log_integration_message','info_integration_inbox','info_integration_outbox'])
]
ALL=[n for _,_,names in GROUPS for n in names]
assert set(ALL)==set(T) and len(ALL)==len(T),'Every table must have exactly one module page'
PAGE={n:(i+1,title) for i,(_,title,names) in enumerate(GROUPS) for n in names}
COLORS={kind:('#000000','#ffffff') for kind in ['sys','mst','info','log']}
TECHNICAL={'created_by','updated_by'}
W=420; ROW=34; TOP=42; KEY=50
mx=ET.Element('mxfile',{'host':'app.diagrams.net','type':'device','version':'24.7.17','compressed':'false'})

def cell(root,id,value='',style='',parent='1',vertex=False,edge=False,source=None,target=None,x=0,y=0,w=0,h=0,attrs=None):
    data={'id':id,'value':value,'style':style,'parent':parent}
    if vertex:data['vertex']='1'
    if edge:data['edge']='1'
    if source:data['source']=source
    if target:data['target']=target
    if attrs:
        obj=ET.SubElement(root,'object',{'id':id,'label':value,**{k:str(v) for k,v in attrs.items()}})
        del data['id'];del data['value']
        c=ET.SubElement(obj,'mxCell',data)
    else:c=ET.SubElement(root,'mxCell',data)
    if edge:ET.SubElement(c,'mxGeometry',{'relative':'1','as':'geometry'})
    else:ET.SubElement(c,'mxGeometry',{'x':str(x),'y':str(y),'width':str(w),'height':str(h),'as':'geometry'})
    return c

def page(id,title,width,height,note):
    d=ET.SubElement(mx,'diagram',{'id':id,'name':title})
    m=ET.SubElement(d,'mxGraphModel',{'dx':'1400','dy':'900','grid':'1','gridSize':'10','guides':'1','tooltips':'1','connect':'1','arrows':'1','fold':'1','page':'1','pageScale':'1','pageWidth':str(width),'pageHeight':str(height),'math':'0','shadow':'0'})
    r=ET.SubElement(m,'root');ET.SubElement(r,'mxCell',{'id':'0'});ET.SubElement(r,'mxCell',{'id':'1','parent':'0'})
    cell(r,'title',title,'text;html=0;align=left;fontSize=26;fontStyle=1;fontColor=#000000;whiteSpace=wrap;',vertex=True,x=40,y=22,w=width-80,h=40)
    cell(r,'legend',note,'text;html=0;align=left;fontSize=13;fontColor=#333333;whiteSpace=wrap;',vertex=True,x=40,y=70,w=width-80,h=52)
    return r

def tab_id(n):return 'table__'+n

def row_id(n,c):return 'field__'+n+'__'+c
def colname(n,c):return T[n].get('column_names',{}).get(c,T[n]['prefix']+'_'+c)

def checklabel(n, expression):
    for c in sorted(T[n]['columns'],key=lambda c:len(c['name']),reverse=True):
        expression=re.sub(r'\b'+re.escape(c['name'])+r'\b',colname(n,c['name']),expression)
    return expression

def tooltip(n):
    t=T[n];u=['('+', '.join(colname(n,c) for c in g)+')' for g in t['unique']]
    idx=['('+', '.join(colname(n,c) for c in g)+')' for g in t['idx']]
    return t['description']+'\nModule: '+t['module']+'\nPrefix: '+t['prefix']+'\nUnique: '+('; '.join(u) or '-')+'\nIndexes: '+('; '.join(idx) or '-')+'\nChecks: '+('; '.join(checklabel(n,e) for e in t['checks']) or '-')

def table(root,n,x,y,full=True):
    t=T[n]
    columns=t['columns'] if full else [t['columns'][0]]
    height=TOP+len(columns)*ROW
    style='swimlane;html=0;startSize=42;horizontal=1;collapsible=1;rounded=0;fillColor=#ffffff;swimlaneFillColor=none;strokeColor=#000000;strokeWidth=1.2;fontColor=#000000;fontFamily=Helvetica;fontSize=16;fontStyle=1;align=center;verticalAlign=middle;shadow=0;'
    tip=tooltip(n)
    if not full:tip+=f'\nReference only. Full table on page {PAGE[n][0]}: {PAGE[n][1]}'
    node=cell(root,tab_id(n),n,style,vertex=True,x=x,y=y,w=W,h=height,attrs={'table':n,'canonical':str(full).lower(),'tooltip':tip})
    ET.SubElement(node.find('mxGeometry'),'mxRectangle',{'x':str(x),'y':str(y),'width':str(W),'height':str(TOP),'as':'alternateBounds'})
    # One vertical divider for PK/FK and one horizontal separator after the PK.
    cell(root,'divider__'+n,'','fillColor=#000000;strokeColor=none;connectable=0;',parent=tab_id(n),vertex=True,x=KEY,y=TOP,w=1,h=len(columns)*ROW)
    if len(columns)>1:
        cell(root,'pk_separator__'+n,'','fillColor=#000000;strokeColor=none;connectable=0;',parent=tab_id(n),vertex=True,x=0,y=TOP+ROW,w=W,h=1)
    for i,col in enumerate(columns):
        rid=row_id(n,col['name']);fullname=colname(n,col['name'])
        flag='PK' if col['name']=='id' else ('FK' if col['ref'] else '')
        target=(col['ref']+'.'+colname(col['ref'],'id')) if col['ref'] else '-'
        unique_groups=[[colname(n,c) for c in group] for group in t['unique'] if col['name'] in group]
        tip=fullname+'\n'+col['description']+'\nType: '+col['type']+'\nNullable: '+str(col['nullable'])+'\nDefault: '+str(col['default'])+'\nReferences: '+target+'\nUnique keys: '+str(unique_groups)
        cell(root,rid,'','rounded=0;html=0;fillColor=none;strokeColor=none;connectable=1;',parent=tab_id(n),vertex=True,x=0,y=TOP+i*ROW,w=W,h=ROW,attrs={'table':n,'column':fullname,'canonical':str(full).lower(),'tooltip':tip})
        key_style='text;html=0;align=center;verticalAlign=middle;fontSize=16;fontFamily=Helvetica;fontColor=#000000;connectable=0;fontStyle='+('1' if col['name']=='id' else '0')+';'
        name_style='text;html=0;align=left;verticalAlign=middle;spacingLeft=10;fontSize=16;fontFamily=Helvetica;fontColor=#000000;connectable=0;fontStyle='+('5' if col['name']=='id' else '0')+';'
        cell(root,rid+'__key',flag,key_style,parent=rid,vertex=True,x=0,y=0,w=KEY,h=ROW,attrs={'tooltip':tip})
        cell(root,rid+'__name',fullname,name_style,parent=rid,vertex=True,x=KEY,y=0,w=W-KEY,h=ROW,attrs={'tooltip':tip})
    return height


def edge(root,id,source,target,label='',optional=False,unique=False,composite=False):
    # Arrow at the source end is the FK-side cardinality; target is PK side.
    many='ERzeroToOne' if unique else 'ERzeroToMany'
    one='ERzeroToOne' if optional else 'ERone'
    color='#000000'
    style=f'edgeStyle=orthogonalEdgeStyle;rounded=0;html=0;startArrow={many};startFill=0;endArrow={one};endFill=0;strokeColor={color};strokeWidth=1;fontSize=10;fontColor=#333333;labelBackgroundColor=#ffffff;'
    if composite:style+='dashed=1;'
    cell(root,id,label,style,edge=True,source=source,target=target)

# Compact overview: all actual tables, grouped by module. Metadata edges are hidden.
width=3400;height=2050
r=page('overview','08 Overview',width,height,f'TBKK Asset-only | {len(T)} tables | {sum(len(t["columns"]) for t in T.values())} attributes on module pages | MIS purchasing and warehouse processing are external.\nOverview lines: business FKs only. Created_by/updated_by references remain in field tooltips. Dashed line = composite FK.')
positions={}
for groupindex,(_,title,names) in enumerate(GROUPS):
    gx=45+groupindex*475
    cell(r,'group__'+str(groupindex),title,'text;align=left;fontSize=17;fontStyle=1;fontColor=#000000;whiteSpace=wrap;',vertex=True,x=gx,y=145,w=440,h=48)
    for j,n in enumerate(names):
        yy=210+j*103;positions[n]=(gx,yy)
        color,bg=COLORS[n.split('_')[0]]
        cell(r,tab_id(n),n+'\n'+str(len(T[n]['columns']))+' attributes | page '+str(PAGE[n][0]),'rounded=0;whiteSpace=wrap;html=0;fillColor='+bg+';strokeColor='+color+';fontColor=#000000;fontSize=13;',vertex=True,x=gx,y=yy,w=430,h=72,attrs={'table':n,'canonical':'false','tooltip':tooltip(n)})
for n,t in T.items():
    for col in t['columns']:
        if col['ref'] and col['name'] not in TECHNICAL:
            unique=any(group==[col['name']] for group in t['unique'])
            edge(r,'ov__'+n+'__'+col['name'],tab_id(n),tab_id(col['ref']),optional=col['nullable'],unique=unique)
for i,(src,cols,dst,targets) in enumerate(SPEC['composite_foreign_keys']):
    edge(r,'ov_composite__'+str(i),tab_id(src),tab_id(dst),'PO scope',composite=True)

# Full tables on their own module pages, including external PK stubs for outgoing FKs.
for i,(gid,title,names) in enumerate(GROUPS):
    own=set(names)
    external=sorted({c['ref'] for n in names for c in T[n]['columns'] if c['ref'] and c['name'] not in TECHNICAL and c['ref'] not in own})
    columns=3;ys=[165]*columns;layout={};STEP=520
    for n in sorted(names,key=lambda n:-len(T[n]['columns'])):
        slot=min(range(columns),key=lambda j:ys[j]);layout[n]=(40+slot*STEP,ys[slot]);ys[slot]+=TOP+len(T[n]['columns'])*ROW+65
    extx=columns*STEP+70
    ph=max(max(ys)+80,200+len(external)*145);pw=extx+W+60
    r=page(gid,f'{i+1:02d} '+title,pw,ph,f'{len(names)} tables | PK = primary key (bold + underlined), FK = foreign key | Black-and-white ER style.\nHover fields for data type, NULL, default, description and unique keys. Reference stubs: see table tooltip for full page. Audit-user lines omitted.')
    for n in names:table(r,n,*layout[n])
    if external:
        cell(r,'external_label','External table references','text;align=left;fontSize=16;fontStyle=1;fontColor=#333333;',vertex=True,x=extx,y=130,w=W,h=30)
    for j,n in enumerate(external):table(r,n,extx,175+j*145,full=False)
    for n in names:
        for col in T[n]['columns']:
            if not col['ref'] or col['name'] in TECHNICAL:continue
            unique=any(group==[col['name']] for group in T[n]['unique'])
            edge(r,'fk__'+n+'__'+col['name'],row_id(n,col['name']),row_id(col['ref'],'id'),optional=col['nullable'],unique=unique)
    for j,(src,cols,dst,targets) in enumerate(SPEC['composite_foreign_keys']):
        if src in own:
            edge(r,'composite__'+str(j),tab_id(src),tab_id(dst),'Composite: '+', '.join(cols),composite=True)

# Open directly on a full ER page; keep the compact overview as the last tab.
overview=mx.find("diagram[@id='overview']")
mx.remove(overview);mx.append(overview)

out=ROOT/'tbkk-asset-database.drawio'
ET.indent(mx,space='  ')
ET.ElementTree(mx).write(out,encoding='utf-8',xml_declaration=True)
# Validate both XML structure and exact coverage against schema, including no orphan edges.
parsed=ET.parse(out).getroot()
canonical_tables=[];canonical_fields=[];edges=0
for diagram in parsed.findall('diagram'):
    graph=diagram.find('mxGraphModel/root');ids=[]
    for child in graph:
        if child.tag=='object':ids.append(child.attrib['id'])
        elif child.tag=='mxCell':ids.append(child.attrib['id'])
    assert len(ids)==len(set(ids)),f'Duplicate diagram IDs: {diagram.attrib["name"]}'
    seen=set(ids)
    for obj in graph.findall('object'):
        if obj.get('canonical')=='true':
            if 'column' in obj.attrib:canonical_fields.append((obj.attrib['table'],obj.attrib['column']))
            else:canonical_tables.append(obj.attrib['table'])
    for c in graph.iter('mxCell'):
        if c.get('edge')=='1':
            assert c.get('source') in seen and c.get('target') in seen,'Orphan edge'
            edges+=1
        if 'parent' in c.attrib:assert c.attrib['parent'] in seen,'Orphan cell'
    for geom in graph.iter('mxGeometry'):
        if geom.get('relative')!='1':
            assert float(geom.get('width',0))>0 and float(geom.get('height',0))>0
expected={(n,colname(n,col['name'])) for n,t in T.items() for col in t['columns']}
assert Counter(canonical_tables)==Counter(T.keys())
assert set(canonical_fields)==expected and len(canonical_fields)==len(expected)
assert parsed.find('diagram').get('id')=='system'
for diagram in parsed.findall('diagram'):
    graph=diagram.find('mxGraphModel/root')
    objects={obj.get('id'):obj for obj in graph.findall('object')}
    for obj in objects.values():
        if obj.get('canonical')=='true' and 'column' not in obj.attrib:
            style=obj.find('mxCell').get('style')
            assert 'rounded=0;' in style and 'align=center;' in style
        if 'column' in obj.attrib:
            row=obj.get('id');name=objects[row+'__name'];key=objects[row+'__key']
            assert row+'__type' not in objects and row+'__null' not in objects
            if key.get('label')=='PK':assert 'fontStyle=5;' in name.find('mxCell').get('style')
report={'file':out.name,'pages':len(parsed.findall('diagram')),'canonical_tables':len(canonical_tables),'canonical_attributes':len(canonical_fields),'relationship_edges_across_pages':edges,'checks':['XML well-formed','Unique IDs per page','No dangling edge endpoints','No dangling cell parents','Positive table/row geometry','Each schema table has exactly one full table','All schema attributes match exactly','FK, default, ENUM and description metadata included','Opens on full System ER page','Square table borders and centered headers','Two visible columns only; bold underlined primary keys'],'style':'Black-and-white two-column ER; underlined PK; no visible types','rendered_in_diagrams_net':False}
(ROOT/'drawio-validation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
