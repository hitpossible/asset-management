import { useState } from 'react'
import { INITIAL_ADMIN_DATA } from '../data/adminData.js'
const STORAGE_KEY = 'tbkk-administrator-v1'
export function useAdminStore() {
  const [data, setData] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      return saved && ['users', 'roles', 'menus'].every(key => Array.isArray(saved[key])) && saved.permissions ? saved : INITIAL_ADMIN_DATA
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
