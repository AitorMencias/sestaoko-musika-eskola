import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../firebase'

// ── Ajustes de compresión ──────────────────────────────────
// Audio: MP3 a 96 kbps (de sobra para ensayar; un MP3 típico de 128-320 kbps baja un 25-70 %)
// Vídeo: MP4 H.264, lado corto máx. 720 px, ~1,2 Mbps + audio AAC 96 kbps
const AUDIO_BITRATE = 96_000
const VIDEO_BITRATE = 1_200_000
const VIDEO_MAX_SHORT_SIDE = 720
export const MAX_UPLOAD_BYTES = 60 * 1024 * 1024 // debe coincidir con storage.rules

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
  if (!kind) return original

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
    if (!buffer || buffer.byteLength > file.size * 0.9) return original
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

/**
 * Sube un blob a Storage (carpeta media/) e informa del progreso (0-1).
 * @returns {Promise<{ name, url, path, size, contentType, kind }>}
 */
export function uploadMedia({ blob, name, contentType }, onProgress = () => {}) {
  const safeName = name.replace(/[^\w.\-]+/g, '_')
  const path = `media/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`
  const task = uploadBytesResumable(ref(storage, path), blob, {
    contentType,
    cacheControl: 'public, max-age=31536000',
  })
  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      snap => onProgress(snap.bytesTransferred / snap.totalBytes),
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        resolve({
          name,
          url,
          path,
          size: blob.size,
          contentType,
          kind: contentType.startsWith('video/') ? 'video' : 'audio',
        })
      }
    )
  })
}

export async function deleteMediaFiles(paths) {
  await Promise.all(
    paths.map(p =>
      deleteObject(ref(storage, p)).catch(err => {
        // Si ya no existe, no pasa nada
        if (err?.code !== 'storage/object-not-found') console.warn('Error borrando', p, err)
      })
    )
  )
}
