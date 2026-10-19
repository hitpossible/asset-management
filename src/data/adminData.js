export const ADMIN_PAGES = { 'admin-users': 'Manage User', 'admin-roles': 'Manage Roles', 'admin-permissions': 'Manage Permission', 'activation-approval': 'Approval Management' }
const groups = [
  ['dashboard', 'Dashboard', [['dashboard-page', 'Dashboard', 'dashboard']]],
  ['asset-management', 'Asset management', [['assets', 'Asset list'], ['create', 'Create asset'], ['asset-validation', 'Asset validation'], ['movement', 'Movement asset'], ['movements', 'Assets in movement']]],
  ['approval-menu', 'Approval', [['approval', 'My approvals']]],
  ['mis', 'MIS purchasing', [['mis-proposals', 'Proposal list'], ['mis-proposal', 'Create Proposal'], ['mis-prs', 'PR list'], ['mis-create-pr', 'Create PR'], ['mis-create-po', 'Create PO'], ['mis-create-gr', 'Create GR']]],
  ['administrator', 'Administrator', [['master', 'Manage Asset Type'], ['audit-log', 'Audit Log'], ...Object.entries(ADMIN_PAGES)]]
]
const menus = groups.flatMap(([id, name, children]) => [{ id, name, parentId: '', route: '', active: true }, ...children.map(([key, label, route]) => ({ id: key, name: label, parentId: id, route: route || key, active: true }))])
export const INITIAL_ADMIN_DATA = {
  users: [
    { id: 'user-admin', name: 'Pat S.', email: 'pat.s@tbkk.co.th', department: 'IT', roleIds: ['role-admin'], active: true },
    { id: 'user-asset', name: 'Maya Singh', email: 'maya.s@tbkk.co.th', department: 'Asset Management', roleIds: ['role-asset'], active: true },
    { id: 'user-accounting', name: 'Narin P.', email: 'narin.p@tbkk.co.th', department: 'Accounting', roleIds: ['role-accounting'], active: true },
    { id: 'user-owner', name: 'Somchai K.', email: 'somchai.k@tbkk.co.th', department: 'Production', roleIds: ['role-owner'], active: false }
  ],
  roles: [
    { id: 'role-admin', name: 'Administrator', description: 'User, role and menu administration', active: true },
    { id: 'role-asset', name: 'Asset Team', description: 'Asset records and verification', active: true },
    { id: 'role-accounting', name: 'Accounting', description: 'Accounting review and activation', active: true },
    { id: 'role-owner', name: 'Asset Owner', description: 'Asset requests and assigned assets', active: true }
  ], menus,
  permissions: {
    'role-admin': menus.map(menu => menu.id),
    'role-asset': ['dashboard', 'dashboard-page', 'asset-management', 'assets', 'create', 'asset-validation', 'movement', 'movements', 'approval-menu', 'approval'],
    'role-accounting': ['dashboard', 'dashboard-page', 'asset-management', 'assets', 'approval-menu', 'approval'],
    'role-owner': ['dashboard', 'dashboard-page', 'asset-management', 'assets', 'create', 'movement']
  }
}
