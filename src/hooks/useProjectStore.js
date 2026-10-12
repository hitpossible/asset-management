import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'tbkk-projects-v1'

function readProjects() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(saved) ? saved.filter((project) => project && typeof project.projectCode === 'string' && typeof project.projectName === 'string') : []
  } catch {
    return []
  }
}

export function useProjectStore() {
  const [projects, setProjects] = useState(readProjects)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
    } catch {
      // Keep the current session usable if browser storage is unavailable.
    }
  }, [projects])

  const addProject = useCallback((project) => {
    if (projects.some((record) => record.projectCode.toLowerCase() === project.projectCode.toLowerCase())) {
      throw new Error('This Project Code already exists. Enter a different code.')
    }
    setProjects((current) => [project, ...current])
  }, [projects])

  return { projects, addProject }
}
