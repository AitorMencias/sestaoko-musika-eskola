import { useState, useEffect } from 'react'
import {
  getMaxSongIndex,
  checkIndexConflict,
  shiftIndexesFrom,
  saveSong,
} from '../../services/firestore'
import IndexConflictModal from './IndexConflictModal'

export default function SongForm({ song, onCancel, onSaved }) {
  const isNew = !song?.id
  const [index, setIndex] = useState(song?.index?.toString() || '')
  const [title, setTitle] = useState(song?.title || '')
  const [lyrics, setLyrics] = useState(song?.lyrics || '')
  const [youtubeUrl, setYoutubeUrl] = useState(song?.youtubeUrl || '')
  const [conflict, setConflict] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isNew) {
      getMaxSongIndex().then(max => setIndex(String(max + 1)))
    }
  }, [isNew])

  async function handleSubmit(e) {
    e.preventDefault()
    const idx = parseInt(index, 10)
    if (isNaN(idx) || idx < 1) return

    const conflicting = await checkIndexConflict(idx, song?.id)
    if (conflicting) {
      setConflict(conflicting)
      return
    }

    await doSave(idx)
  }

  async function doSave(idx) {
    setSaving(true)
    try {
      await saveSong(
        {
          index: idx,
          title: title.trim(),
          lyrics: lyrics.trim(),
          youtubeUrl: youtubeUrl.trim(),
        },
        song?.id
      )
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  async function handleConflictConfirm() {
    const idx = parseInt(index, 10)
    setSaving(true)
    try {
      await shiftIndexesFrom(idx, song?.id)
      setConflict(null)
      await doSave(idx)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="form-card">
        <h3>{isNew ? 'Nueva canción' : `Editando: ${song.title}`}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="s-index">Índice</label>
              <input
                id="s-index"
                type="number"
                min="1"
                value={index}
                onChange={e => setIndex(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="s-title">Título</label>
              <input
                id="s-title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Nombre de la canción"
                required
                autoFocus={isNew}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="s-lyrics">Letra</label>
            <textarea
              id="s-lyrics"
              value={lyrics}
              onChange={e => setLyrics(e.target.value)}
              placeholder="Escribe o pega la letra aquí..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="s-youtube">URL de YouTube (opcional)</label>
            <input
              id="s-youtube"
              type="url"
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar canción'}
            </button>
          </div>
        </form>
      </div>

      {conflict && (
        <IndexConflictModal
          index={parseInt(index, 10)}
          conflictingSong={conflict}
          onConfirm={handleConflictConfirm}
          onCancel={() => setConflict(null)}
        />
      )}
    </>
  )
}
