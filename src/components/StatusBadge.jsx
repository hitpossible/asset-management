const RETURNED_OR_HOLD_STATUS = /Returned|Hold/
const WAITING_STATUS = /Waiting|Pending/

export default function StatusBadge({ status }) {
  const className = ['Active', 'Completed', 'Complete', 'Approved', 'Validation Complete'].includes(status)
    ? 'status-badge status-green'
    : RETURNED_OR_HOLD_STATUS.test(status)
      ? 'status-badge status-red'
      : WAITING_STATUS.test(status)
        ? 'status-badge status-amber'
        : ['Draft', 'Sold'].includes(status)
          ? 'status-badge status-gray'
          : 'status-badge status-blue'

  return <span className={className}><span className="status-dot" />{status}</span>
}
