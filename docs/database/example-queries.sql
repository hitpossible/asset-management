-- Asset-only read models. MIS is external; no purchasing or stock transactions.
SET @asset_id = 1;
SET @report_month = '2026-10-01';
SET @audit_from = '2026-10-17 17:00:00';
SET @audit_until = '2026-10-18 17:00:00';

-- Aggregate scoped costs FIRST to avoid multiplying the base amount by joins.
WITH costs AS (
 SELECT iaa_id,SUM(iaac_amount) AS total
 FROM info_asset_acquisition_cost GROUP BY iaa_id
)
SELECT a.iaa_id,r.imdr_no AS proposal_no,a.iaa_proposal_item_key,
       a.iaa_base_amount,COALESCE(c.total,0) AS additional_cost,
       a.iaa_base_amount+COALESCE(c.total,0) AS calculated_item_total,
       a.iaa_total_amount AS source_item_total,a.iaa_treatment
FROM info_asset_acquisition a
JOIN info_mis_document_reference r ON r.imdr_id=a.imdr_id
LEFT JOIN costs c ON c.iaa_id=a.iaa_id
WHERE a.ma_id=@asset_id OR a.selected_ma_id=@asset_id;

-- All acquisition document references, retaining separate document KIND and item scope.
SELECT a.iaa_id,r.imdr_kind,r.imdr_no,r.imdr_status,
       l.iaad_document_item_key,po.imdr_no AS scope_po,l.iaad_po_item_key,
       l.iaad_ordered_quantity,l.iaad_received_quantity,l.iaad_accepted_quantity
FROM info_asset_acquisition a
JOIN info_asset_acquisition_document l ON l.iaa_id=a.iaa_id
JOIN info_mis_document_reference r ON r.imdr_id=l.imdr_id
LEFT JOIN info_mis_document_reference po ON po.imdr_id=l.po_imdr_id
WHERE a.ma_id=@asset_id OR a.selected_ma_id=@asset_id
ORDER BY a.iaa_id,r.imdr_kind,r.imdr_no,l.iaad_document_item_key;

-- Timeline of selected Asset; a Main also includes events of its Subs.
SELECT e.lae_occurred_at,a.ma_no,a.ma_temporary_ref,e.lae_event_type,
       e.lae_origin,e.lae_snapshot,d.idoc_kind,d.idoc_no,p.imdr_no AS proposal_no
FROM log_asset_event e JOIN mst_asset a ON a.ma_id=e.ma_id
LEFT JOIN info_document d ON d.idoc_id=e.idoc_id
LEFT JOIN info_asset_acquisition ac ON ac.iaa_id=e.iaa_id
LEFT JOIN info_mis_document_reference p ON p.imdr_id=ac.imdr_id
WHERE e.ma_id=@asset_id OR e.main_ma_id=@asset_id
ORDER BY e.lae_occurred_at DESC,e.lae_id DESC;

-- Posted DP report: use the latest revision per Asset/month only.
WITH latest AS (
 SELECT l.*,ROW_NUMBER() OVER (
  PARTITION BY l.ma_id,l.ldp_period_month ORDER BY l.ldp_revision DESC
 ) AS rn FROM log_depreciation_period l WHERE l.ldp_period_month=@report_month
)
SELECT a.ma_no,l.ldp_opening_cost,l.ldp_addition_cost,l.ldp_period_dp,
       l.ldp_disposal_cost,l.ldp_disposal_accumulated_dp,l.ldp_closing_cost,
       l.ldp_closing_accumulated_dp,l.ldp_closing_net_book_value
FROM latest l JOIN mst_asset a ON a.ma_id=l.ma_id
LEFT JOIN info_asset_disposal ds ON ds.ma_id=a.ma_id
WHERE l.rn=1 AND a.ma_ownership='COMPANY'
AND (ds.iads_id IS NULL OR DATE_FORMAT(ds.iads_sold_on,'%Y-%m-01')>=@report_month);

-- Audit: filter UTC range for index use, display Bangkok offset.
SELECT la.la_id,CONVERT_TZ(la.la_occurred_at,'+00:00','+07:00') AS bangkok_time,
       la.la_actor_name_snapshot,la.la_module,la.la_action,la.la_record_ref,
       c.lac_field_name,c.lac_before_value,c.lac_after_value
FROM log_audit la LEFT JOIN log_audit_change c ON c.la_id=la.la_id
WHERE la.la_occurred_at>=@audit_from AND la.la_occurred_at<@audit_until
ORDER BY la.la_occurred_at DESC,la.la_id DESC;

-- Spare usage is a net posted projection received from MIS, not stock calculations.
SELECT u.iasu_issued_on,u.iasu_part_no_snapshot,u.iasu_part_name_snapshot,
       u.iasu_quantity,m.mu_name AS unit,u.iasu_total_cost,r.imdr_no AS mis_reference
FROM info_asset_spare_usage u
JOIN mst_uom m ON m.mu_id=u.mu_id
JOIN info_mis_document_reference r ON r.imdr_id=u.imdr_id
WHERE u.ma_id=@asset_id AND u.iasu_status='COMPLETED'
ORDER BY u.iasu_issued_on DESC,u.iasu_id DESC;
