import { useState, useEffect, useRef } from 'react'
import {
  getMaxSongIndex,
  checkIndexConflict,
  shiftIndexesFrom,
  saveSong,
} from '../../services/firestore'
import IndexConflictModal from './IndexConflictModal'
import MediaUploader from './MediaUploader'
import { deleteMediaFiles } from '../../services/media'
import { importSongFile, IMPORT_ACCEPT } from '../../services/importSong'

export default function SongForm({ song, onCancel, onSaved }) {
  const isNew = !song?.id
  const [index, setIndex] = useState(song?.index?.toString() || '')
  const [title, setTitle] = useState(song?.title || '')
  const [lyrics, setLyrics] = useState(song?.lyrics || '')
  const [youtubeUrl, setYoutubeUrl] = useState(song?.youtubeUrl || '')
  const [media, setMedia] = useState(song?.media || [])
  const [uploading, setUploading] = useState(false)
  // Archivos subidos en esta edición (se borran si se cancela) y quitados (se borran al guardar)
  const [addedPaths, setAddedPaths] = useState([])
  const [removedPaths, setRemovedPaths] = useState([])
  const [conflict, setConflict] = useState(null)
  const importRef = useRef(null)
  const [importState, setImportState] = useState(null) // { status: 'loading'|'ok'|'error', msg }

  async function handleImport(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    if ((title.trim() || lyrics.trim()) &&
        !window.confirm('Se sustituirán el título y la letra actuales. ¿Continuar?')) return
    setImportState({ status: 'loading', msg: `Leyendo ${file.name}…` })
    try {
      const result = await importSongFile(file)
      setTitle(result.title)
      setLyrics(result.lyrics)
      if (result.index) setIndex(String(result.index))
      setImportState({
        status: result.lyrics ? 'ok' : 'error',
        msg: result.lyrics
          ? `Importado de ${file.name}. Revisa el título y la letra antes de guardar.`
          : `No se ha encontrado letra en ${file.name}.`,
      })
    } catch (err) {
      console.error(err)
      setImportState({ status: 'error', msg: err.message || 'No se pudo leer el archivo' })
    }
  }
  const [saving, setSaving] = useState(false)

  function handleAddMedia(item) {
    setMedia(m => [...m, item])
    setAddedPaths(p => [...p, item.path])
  }

  function handleRemoveMedia(item) {
    setMedia(m => m.filter(x => x.path !== item.path))
    setRemovedPaths(p => [...p, item.path])
  }

  async function handleCancel() {
    if (uploading && !window.confirm('Hay archivos subiéndose. ¿Salir igualmente?')) return
    if (addedPaths.length) await deleteMediaFiles(addedPaths)
    onCancel()
  }

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
          media,
        },
        song?.id
      )
      if (removedPaths.length) await deleteMediaFiles(removedPaths)
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
        {isNew && (
          <div className="import-box">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => importRef.current?.click()}
              disabled={importState?.status === 'loading'}
            >
              📄 Importar desde Word o PDF
            </button>
            <span className="import-hint">Rellena el título y la letra automáticamente</span>
            <input ref={importRef} type="file" accept={IMPORT_ACCEPT} hidden onChange={handleImport} />
            {importState && (
              <div className={`import-status is-${importState.status}`} role="status">
                {importState.msg}
              </div>
            )}
          </div>
        )}
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

          <div className="form-group">
            <label>Archivos de audio / vídeo (opcional)</label>
            <MediaUploader
              media={media}
              onAdd={handleAddMedia}
              onRemove={handleRemoveMedia}
              onBusyChange={setUploading}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancel} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
              {saving ? 'Guardando...' : uploading ? 'Esperando archivos...' : 'Guardar canción'}
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
