# TBKK Asset Management

A React and Tailwind mockup for the TBKK asset register. Asset records are stored in the current browser with `localStorage`; no database or server API is connected.

## Run locally

```sh
npm install
npm run dev
```

The app includes a dashboard, searchable and filterable asset list, asset detail view, CSV export, and a draft asset form. Draft records can be edited from their detail view. New records remain in the browser where they were created.

## Source layout

- `src/pages/` contains the Dashboard, Asset List, and Create Asset screens. Pages are loaded on demand.
- `src/components/` contains the shared shell, table, status, and detail components. Icons use the Lucide set from `react-icons`.
- `src/hooks/` contains local asset storage and list filtering.
- `src/data/` contains mock records and form options.
- `src/utils/` contains asset formatting, summary, and CSV helpers.

### Existing-asset Proposal work

**Create Sub Asset → Save draft** creates a Draft record in the Asset list immediately, numbered with the Main Asset number followed by its next suffix (`-1`, `-2`, etc.). It inherits the Main Asset's classification, assignment and project, with separate component and acquisition details. Each new request reserves a new suffix; edit an existing Draft from its Asset detail. **Create Proposal (MIS)** continues with the saved record: totals over THB 50,000 reuse that number for capitalization; totals up to THB 50,000 record Expense against the Main Asset and cancel the unused Draft while retaining its number. Cancelled suffixes are not reused. Older saved standalone requests with valid Active Company Main Assets migrate into numbered Drafts automatically when the Workspace opens.

In **MIS → Create Proposal**, select a Draft Asset or a previously created Draft Sub Asset to acquire that record. Selecting an Active Main Asset or Sub Asset shows only the **Modification** / **Maintenance** Work type radio buttons. The Proposal name describes the work; its scoped budget and additional costs stay on the selected Asset. This flow does not ask for new component details or create another Sub Asset. Existing historical Proposal records retain their original work types and relationships.

The hierarchy stays at two levels: Main Asset → Sub Asset. Work on a Sub Asset creates a sibling under the Main Asset when capitalized, using the next Main Asset suffix (never `-1-1`). The original work target remains recorded separately; Expense stays on that selected Asset. Main Asset history includes work on its Sub Assets. Approve the Proposal and continue through the existing PR/PO/receiving/Asset approval screens. The Parent remains Active. The child has its own value and depreciation. Asset Detail → Lifecycle displays Parent relationships, children, original work types and document references; the three work types are created through Proposal only. Expense items and Modification/Maintenance work on an Active Asset complete automatically on GR save after same-PO document checks and goods/work acceptance by Purchasing + Asset Owner. Partial receiving stays GR Received; invalid references or failed acceptance require Hold / Correction Required. Completed costs and document references appear in Parent lifecycle history and expense totals. Invoice amounts are not matched, and Expense items never enter Asset activation.

Run business-rule checks with `node --test src/utils/*.test.js` and validate bundling with `npm run build`.
