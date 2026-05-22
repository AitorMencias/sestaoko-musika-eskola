import { useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

export default function HelpModal({ content, title, onClose }) {
  // Cerrar con Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="help-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        <div className="help-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar ayuda">✕</button>
        </div>
        <div className="help-body">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
