import { useRef, useState } from 'react'
import {
  compressMedia, uploadMedia, mediaKind, formatBytes, MAX_UPLOAD_BYTES,
} from '../../services/media'

/**
 * Lista de archivos de audio/vídeo de una canción.
 * - media: archivos ya subidos [{ name, url, path, size, contentType, kind }]
 * - onAdd(item): se llama al terminar de subir cada archivo
 * - onRemove(item): quitar un archivo de la canción
 * - onBusyChange(bool): avisa mientras hay compresiones/subidas en curso
 */
export default function MediaUploader({ media, onAdd, onRemove, onBusyChange }) {
  const inputRef = useRef(null)
  const [jobs, setJobs] = useState([]) // { id, name, stage, progress, originalSize, error }

  function patchJob(id, patch) {
    setJobs(js => js.map(j => (j.id === id ? { ...j, ...patch } : j)))
  }

  async function processFile(file) {
    const id = `${Date.now()}-${Math.random()}`
    setJobs(js => [...js, { id, name: file.name, stage: 'compress', progress: 0, originalSize: file.size }])
    try {
      const result = await compressMedia(file, p => patchJob(id, { progress: p }))
      if (result.blob.size > MAX_UPLOAD_BYTES) {
        throw new Error(`Ocupa ${formatBytes(result.blob.size)} incluso comprimido (máx. ${formatBytes(MAX_UPLOAD_BYTES)})`)
      }
      patchJob(id, { stage: 'upload', progress: 0 })
      const item = await uploadMedia(result, p => patchJob(id, { progress: p }))
      onAdd({ ...item, originalSize: file.size })
      setJobs(js => js.filter(j => j.id !== id))
    } catch (err) {
      console.error(err)
      patchJob(id, { stage: 'error', error: err.message || 'Error al subir' })
    }
  }

  async function handleFiles(e) {
    const files = [...e.target.files].filter(f => mediaKind(f))
    e.target.value = ''
    if (!files.length) return
    onBusyChange?.(true)
    // De uno en uno: comprimir vídeo en paralelo saturaría el móvil
    for (const f of files) await processFile(f)
    onBusyChange?.(false)
  }

  const totalSize = media.reduce((sum, m) => sum + (m.size || 0), 0)

  return (
    <div className="media-uploader">
      {media.length > 0 && (
        <ul className="media-list">
          {media.map(m => (
            <li key={m.path} className="media-item">
              <span className="media-icon" aria-hidden>{m.kind === 'video' ? '🎬' : '🎵'}</span>
              <span className="media-name" title={m.name}>{m.name}</span>
              <span className="media-size">
                {formatBytes(m.size)}
                {m.originalSize > m.size && (
                  <> · <span className="media-saved">−{Math.round((1 - m.size / m.originalSize) * 100)} %</span></>
                )}
              </span>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => onRemove(m)}>
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      {jobs.map(j => (
        <div key={j.id} className={`media-job ${j.stage === 'error' ? 'is-error' : ''}`}>
          <div className="media-job-label">
            <span className="media-name">{j.name}</span>
            <span>
              {j.stage === 'compress' && `Comprimiendo… ${Math.round(j.progress * 100)} %`}
              {j.stage === 'upload' && `Subiendo… ${Math.round(j.progress * 100)} %`}
              {j.stage === 'error' && j.error}
            </span>
          </div>
          {j.stage === 'error' ? (
            <button type="button" className="btn btn-secondary btn-sm"
              onClick={() => setJobs(js => js.filter(x => x.id !== j.id))}>
              Cerrar
            </button>
          ) : (
            <progress value={j.progress} max={1} />
          )}
        </div>
      ))}

      <div className="media-actions">
        <button type="button" className="btn btn-secondary" onClick={() => inputRef.current?.click()}>
          + Añadir audio o vídeo
        </button>
        {media.length > 0 && <span className="media-total">Total: {formatBytes(totalSize)}</span>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,video/*"
        multiple
        hidden
        onChange={handleFiles}
      />
    </div>
  )
}
