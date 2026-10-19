import { useState } from 'react'
import { INITIAL_ADMIN_DATA } from '../data/adminData.js'
const STORAGE_KEY = 'tbkk-administrator-v1'
export function useAdminStore() {
  const [data, setData] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      if (!saved || !['users', 'roles', 'menus'].every(key => Array.isArray(saved[key])) || !saved.permissions) return INITIAL_ADMIN_DATA
      const visibleMenus = saved.menus.filter((menu) => menu.id !== 'department-approvers' && menu.route !== 'department-approvers').map((menu) => menu.route === 'activation-approval' ? { ...menu, name: 'Approval Management' } : menu)
      const newMenus = INITIAL_ADMIN_DATA.menus.filter((menu) => menu.route === 'activation-approval' && !visibleMenus.some((item) => item.id === menu.id))
      const menus = [...visibleMenus, ...newMenus]
      const permissions = Object.fromEntries(Object.entries(saved.permissions).map(([roleId, ids]) => [roleId, (ids || []).filter((id) => id !== 'department-approvers')]))
      if (newMenus.length) permissions['role-admin'] = [...new Set([...(permissions['role-admin'] || []), ...newMenus.map((menu) => menu.id)])]
      if (JSON.stringify(visibleMenus) !== JSON.stringify(saved.menus) || newMenus.length || Object.keys(permissions).some((key) => JSON.stringify(permissions[key]) !== JSON.stringify(saved.permissions[key]))) return { ...saved, menus, permissions }
      return saved
    } catch { return INITIAL_ADMIN_DATA }
  })
  function save(next) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) }
    catch { return false }
    setData(next)
    return true
  }
  return { data, save }
}
