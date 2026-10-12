import { useCallback, useEffect, useState } from 'react'

const MIS_PROPOSAL_STORAGE_KEY = 'tbkk-mis-proposals-v1'

function readProposals() {
  try {
    const saved = window.localStorage.getItem(MIS_PROPOSAL_STORAGE_KEY)
    const parsed = saved ? JSON.parse(saved) : null
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function useMISProposalStore() {
  const [proposals, setProposals] = useState(readProposals)

  useEffect(() => {
    try {
      window.localStorage.setItem(MIS_PROPOSAL_STORAGE_KEY, JSON.stringify(proposals))
    } catch {
      // Keep this prototype usable for the current browser session if storage is unavailable.
    }
  }, [proposals])

  const addProposal = useCallback((proposal) => {
    setProposals((currentProposals) => [proposal, ...currentProposals])
  }, [])

  const setProposalStatus = useCallback((proposalId, status) => {
    setProposals((currentProposals) => currentProposals.map((proposal) => (
      proposal.proposalId === proposalId ? { ...proposal, status } : proposal
    )))
  }, [])

  return { proposals, addProposal, setProposalStatus }
}
