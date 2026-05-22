export default function SetlistSelector({ setlists, activeId, onChange }) {
  if (setlists.length === 0) return null

  return (
    <div className="setlist-selector" role="tablist" aria-label="Seleccionar lista de canciones">
      <button
        className={`setlist-chip ${activeId === null ? 'active' : ''}`}
        onClick={() => onChange(null)}
        role="tab"
        aria-selected={activeId === null}
      >
        Todas
      </button>
      {setlists.map(sl => (
        <button
          key={sl.id}
          className={`setlist-chip ${activeId === sl.id ? 'active' : ''}`}
          onClick={() => onChange(sl.id)}
          role="tab"
          aria-selected={activeId === sl.id}
        >
          {sl.title}
        </button>
      ))}
    </div>
  )
}
