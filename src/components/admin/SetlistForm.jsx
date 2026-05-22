import { useState, useMemo } from 'react'
import { saveSetlist } from '../../services/firestore'

export default function SetlistForm({ setlist, songs, onCancel, onSaved }) {
  const isNew = !setlist?.id
  const [title, setTitle] = useState(setlist?.title || '')
  const [date, setDate] = useState(setlist?.date || '')
  const [selectedIds, setSelectedIds] = useState(setlist?.songIds || [])
  const [pickerSearch, setPickerSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const songsById = useMemo(() => Object.fromEntries(songs.map(s => [s.id, s])), [songs])

  const filteredSongs = useMemo(() => {
    const q = pickerSearch.toLowerCase().trim()
    if (!q) return songs
    return songs.filter(s => s.title.toLowerCase().includes(q))
  }, [songs, pickerSearch])

  function toggleSong(id) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function moveUp(i) {
    setSelectedIds(prev => {
      const arr = [...prev]
      ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
      return arr
    })
  }

  function moveDown(i) {
    setSelectedIds(prev => {
      const arr = [...prev]
      ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
      return arr
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await saveSetlist(
        { title: title.trim(), date: date || null, songIds: selectedIds },
        setlist?.id
      )
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="form-card">
      <h3>{isNew ? 'Nueva lista' : `Editando: ${setlist.title}`}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="sl-title">Nombre de la lista</label>
            <input
              id="sl-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Actuación 25 mayo"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="sl-date">Fecha (opcional)</label>
            <input
              id="sl-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>
            Canciones incluidas
            {selectedIds.length > 0 && (
              <span style={{ fontWeight: 400, marginLeft: 8, color: 'var(--accent)' }}>
                ({selectedIds.length} seleccionadas)
              </span>
            )}
          </label>
          <div className="song-picker">
            <div className="song-picker-search">
              <input
                type="search"
                placeholder="Buscar canción..."
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                aria-label="Buscar canción para añadir a la lista"
              />
            </div>
            {filteredSongs.length === 0 ? (
              <div style={{ padding: '16px', color: 'var(--text-muted)', textAlign: 'center' }}>
                No se encontraron canciones
              </div>
            ) : (
              filteredSongs.map(s => (
                <label key={s.id} className="song-picker-item">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(s.id)}
                    onChange={() => toggleSong(s.id)}
                  />
                  <span className="custom-checkbox" aria-hidden="true" />
                  <span className="song-picker-text">
                    <strong className="song-picker-num">{s.index}.</strong> {s.title}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="form-group">
            <label>Orden en la lista</label>
            <div>
              {selectedIds.map((id, i) => (
                <div key={id} className="setlist-song-row">
                  <span>{i + 1}. {songsById[id]?.title ?? id}</span>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    aria-label="Subir"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => moveDown(i)}
                    disabled={i === selectedIds.length - 1}
                    aria-label="Bajar"
                  >
                    ↓
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar lista'}
          </button>
        </div>
      </form>
    </div>
  )
}
