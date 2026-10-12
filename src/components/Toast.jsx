import Icon from './Icon.jsx'

export default function Toast({ message, onDismiss }) {
  if (!message) return null

  return (
    <div className="toast" role="status">
      <span className="toast-check"><Icon name="check" size={15} /></span>
      {message}
      <button aria-label="Dismiss notification" onClick={onDismiss}><Icon name="close" size={15} /></button>
    </div>
  )
}
