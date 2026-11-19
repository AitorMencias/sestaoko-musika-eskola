import { auth } from '../firebase'

// ── Ajustes de compresión ──────────────────────────────────
// Desactivada: con los 15 GB de Drive sobra espacio. Poner a true para volver a comprimir.
const COMPRESS_AUDIO = false
const COMPRESS_VIDEO = false
// Audio: MP3 a 96 kbps (de sobra para ensayar; un MP3 típico de 128-320 kbps baja un 25-70 %)
// Vídeo: MP4 H.264, lado corto máx. 720 px, ~1,2 Mbps + audio AAC 96 kbps
const AUDIO_BITRATE = 96_000
const VIDEO_BITRATE = 1_200_000
const VIDEO_MAX_SHORT_SIDE = 720
export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024 // debe coincidir con MAX_FILE_BYTES en apps-script/Code.gs

export function mediaKind(file) {
  if (file.type.startsWith('audio/')) return 'audio'
  if (file.type.startsWith('video/')) return 'video'
  return null
}

export function formatBytes(bytes) {
  if (!bytes) return '0 MB'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * Indica si hay que comprimir un archivo y por qué:
 * - 'preference': la compresión está activada para ese tipo
 * - 'limit': está desactivada, pero el archivo supera MAX_UPLOAD_BYTES y se comprime igualmente
 * - null: se sube el original
 */
export function compressionReason(file) {
  const kind = mediaKind(file)
  if (!kind) return null
  if (kind === 'audio' ? COMPRESS_AUDIO : COMPRESS_VIDEO) return 'preference'
  if (file.size > MAX_UPLOAD_BYTES) return 'limit'
  return null
}

function replaceExt(name, ext) {
  const base = name.replace(/\.[^.]+$/, '')
  return `${base}.${ext}`
}

/**
 * Comprime un archivo de audio o vídeo en el navegador.
 * Si no se puede comprimir (navegador sin soporte, formato raro...) o el resultado
 * no ahorra al menos un 10 %, devuelve el original.
 * @returns {Promise<{ blob: Blob, name: string, contentType: string, compressed: boolean }>}
 */
export async function compressMedia(file, onProgress = () => {}) {
  const kind = mediaKind(file)
  const original = { blob: file, name: file.name, contentType: file.type, compressed: false }
  if (!compressionReason(file)) return original

  try {
    // Carga diferida: la librería solo se descarga cuando el admin sube algo
    const mb = await import('mediabunny')
    const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS })

    let output, conversion, contentType, ext
    if (kind === 'audio') {
      if (!(await mb.canEncodeAudio('mp3'))) {
        const { registerMp3Encoder } = await import('@mediabunny/mp3-encoder')
        registerMp3Encoder()
      }
      output = new mb.Output({ format: new mb.Mp3OutputFormat(), target: new mb.BufferTarget() })
      conversion = await mb.Conversion.init({
        input, output,
        tracks: 'primary',
        audio: { codec: 'mp3', quality: new mb.Quality({ bitrate: AUDIO_BITRATE }), forceTranscode: true },
        showWarnings: false,
      })
      contentType = 'audio/mpeg'
      ext = 'mp3'
    } else {
      if (!(await mb.canEncodeVideo('avc')) || !(await mb.canEncodeAudio('aac'))) return original
      output = new mb.Output({
        format: new mb.Mp4OutputFormat({ fastStart: 'in-memory' }),
        target: new mb.BufferTarget(),
      })
      conversion = await mb.Conversion.init({
        input, output,
        tracks: 'primary',
        video: track => {
          const w = track.displayWidth, h = track.displayHeight
          const resize = Math.min(w, h) > VIDEO_MAX_SHORT_SIDE
            ? (w >= h ? { height: VIDEO_MAX_SHORT_SIDE } : { width: VIDEO_MAX_SHORT_SIDE })
            : {}
          return { codec: 'avc', quality: new mb.Quality({ bitrate: VIDEO_BITRATE }), forceTranscode: true, ...resize }
        },
        audio: { codec: 'aac', quality: new mb.Quality({ bitrate: AUDIO_BITRATE }) },
        showWarnings: false,
      })
      contentType = 'video/mp4'
      ext = 'mp4'
    }

    if (!conversion.isValid) return original
    conversion.onProgress = p => onProgress(p)
    await conversion.execute()

    const buffer = output.target.buffer
    // Si se comprime por superar el límite, vale cualquier reducción; si no, solo si ahorra ≥10 %
    const minSaving = compressionReason(file) === 'limit' ? 1 : 0.9
    if (!buffer || buffer.byteLength >= file.size * minSaving) return original
    return {
      blob: new Blob([buffer], { type: contentType }),
      name: replaceExt(file.name, ext),
      contentType,
      compressed: true,
    }
  } catch (err) {
    console.warn('No se pudo comprimir, se sube el original:', err)
    return original
  }
}

// ── Subida a Google Drive vía Apps Script (ver apps-script/README.md) ──
const SCRIPT_URL = import.meta.env.VITE_DRIVE_SCRIPT_URL
// Múltiplo de 256 KiB (lo exige Drive). En base64 ocupa ~11 MB por petición,
// muy por debajo del límite de Apps Script.
const CHUNK_BYTES = 8 * 1024 * 1024

async function callScript(payload) {
  if (!SCRIPT_URL) throw new Error('Falta configurar VITE_DRIVE_SCRIPT_URL')
  const user = auth.currentUser
  if (!user) throw new Error('Sesión caducada, vuelve a entrar')
  const idToken = await user.getIdToken()
  // text/plain evita la petición previa CORS, que Apps Script no responde
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ ...payload, idToken }),
  })
  if (!res.ok) throw new Error(`Error del servidor de archivos (${res.status})`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export const driveUrl = id => `https://drive.google.com/file/d/${id}/preview`

/**
 * Sube un blob al Drive de la escuela en trozos e informa del progreso (0-1).
 * `path` guarda el id del archivo en Drive (se usa para borrarlo).
 * @returns {Promise<{ name, url, path, size, contentType, kind }>}
 */
export async function uploadMedia({ blob, name, contentType }, onProgress = () => {}) {
  const total = blob.size
  const { session } = await callScript({ action: 'start', name, contentType, size: total })
  let id = null
  for (let offset = 0; offset < total; offset += CHUNK_BYTES) {
    const chunk = blob.slice(offset, Math.min(offset + CHUNK_BYTES, total))
    const data = await blobToBase64(chunk)
    const res = await callScript({ action: 'chunk', session, offset, total, contentType, data })
    onProgress(Math.min(offset + chunk.size, total) / total)
    if (res.done) id = res.id
  }
  if (!id) throw new Error('La subida no terminó correctamente')
  return {
    name,
    url: driveUrl(id),
    path: id,
    size: total,
    contentType,
    kind: contentType.startsWith('video/') ? 'video' : 'audio',
  }
}

export async function deleteMediaFiles(ids) {
  if (!ids?.length) return
  try {
    await callScript({ action: 'delete', ids })
  } catch (err) {
    // No bloquea el guardado: como mucho queda un archivo huérfano en Drive
    console.warn('Error borrando archivos de Drive', ids, err)
  }
}
