/**
 * Intermediario entre la app y el Google Drive de la escuela.
 *
 * Se publica como "Aplicación web" ejecutándose como la cuenta de Gmail de la
 * escuela, así que actúa con los permisos de Drive de esa cuenta sin guardar
 * ningún token. Solo atiende peticiones que traigan un ID token de Firebase
 * válido del admin.
 *
 * Los archivos llegan en trozos (base64) y se van añadiendo a una subida
 * reanudable de Drive: ninguna petición se acerca al límite de tamaño de
 * Apps Script, así que no hay límite práctico por archivo.
 *
 * Ver apps-script/README.md para desplegarlo.
 */

// ── Configuración ──────────────────────────────────────────
const FIREBASE_API_KEY = 'PEGA_AQUI_TU_VITE_FIREBASE_API_KEY'
const ADMIN_EMAIL = 'PEGA_AQUI_TU_VITE_ADMIN_EMAIL'
const FOLDER_ID = 'PEGA_AQUI_EL_ID_DE_LA_CARPETA_DE_DRIVE'
const MAX_FILE_BYTES = 200 * 1024 * 1024
// ───────────────────────────────────────────────────────────

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents)
    verifyAdmin_(req.idToken)
    switch (req.action) {
      case 'start': return json_(startUpload_(req))
      case 'chunk': return json_(uploadChunk_(req))
      case 'delete': return json_(deleteFiles_(req))
      default: throw new Error('Acción desconocida')
    }
  } catch (err) {
    return json_({ error: String(err && err.message || err) })
  }
}

// Para comprobar en el navegador que el despliegue responde
function doGet() {
  return json_({ ok: true })
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

/** Comprueba con Firebase que el token es válido y pertenece al admin. */
function verifyAdmin_(idToken) {
  if (!idToken) throw new Error('No autenticado')
  const cache = CacheService.getScriptCache()
  const key = 'tok_' + Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, idToken)
  )
  if (cache.get(key)) return

  const res = UrlFetchApp.fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FIREBASE_API_KEY,
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ idToken: idToken }),
      muteHttpExceptions: true,
    }
  )
  const data = JSON.parse(res.getContentText() || '{}')
  const user = data.users && data.users[0]
  if (res.getResponseCode() !== 200 || !user) throw new Error('Sesión no válida, vuelve a entrar')
  if (String(user.email).toLowerCase() !== ADMIN_EMAIL.toLowerCase()) throw new Error('No autorizado')
  cache.put(key, '1', 600) // 10 min; los ID token de Firebase duran 1 h
}

/** Abre una subida reanudable en Drive y devuelve su URL de sesión. */
function startUpload_(req) {
  if (!/^(audio|video)\//.test(req.contentType || '')) throw new Error('Solo se admiten audio o vídeo')
  if (!(req.size > 0) || req.size > MAX_FILE_BYTES) throw new Error('Tamaño no permitido')

  const res = UrlFetchApp.fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id',
    {
      method: 'post',
      contentType: 'application/json; charset=UTF-8',
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
        'X-Upload-Content-Type': req.contentType,
        'X-Upload-Content-Length': String(req.size),
      },
      payload: JSON.stringify({ name: req.name, parents: [FOLDER_ID], mimeType: req.contentType }),
      muteHttpExceptions: true,
    }
  )
  if (res.getResponseCode() !== 200) throw new Error('Drive no aceptó la subida: ' + res.getContentText())
  const headers = res.getAllHeaders()
  const session = headers.Location || headers.location
  if (!session) throw new Error('Drive no devolvió la sesión de subida')
  return { session: session }
}

/** Añade un trozo a la subida. Al llegar el último, comparte el archivo y devuelve su id. */
function uploadChunk_(req) {
  if (!/^https:\/\/www\.googleapis\.com\/upload\/drive\//.test(req.session || '')) {
    throw new Error('Sesión de subida no válida')
  }
  const bytes = Utilities.base64Decode(req.data)
  const end = req.offset + bytes.length - 1
  const res = UrlFetchApp.fetch(req.session, {
    method: 'put',
    contentType: req.contentType,
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
      'Content-Range': 'bytes ' + req.offset + '-' + end + '/' + req.total,
    },
    payload: bytes,
    muteHttpExceptions: true,
    followRedirects: false, // Drive responde 308 en los trozos intermedios
  })
  const code = res.getResponseCode()
  if (code === 308) return { done: false }
  if (code !== 200 && code !== 201) throw new Error('Error subiendo a Drive (' + code + '): ' + res.getContentText())

  const id = JSON.parse(res.getContentText()).id
  DriveApp.getFileById(id).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)
  return { done: true, id: id }
}

/** Manda a la papelera los archivos indicados, solo si están en la carpeta de la app. */
function deleteFiles_(req) {
  const ids = Array.isArray(req.ids) ? req.ids : []
  const result = {}
  ids.forEach(function (id) {
    try {
      const file = DriveApp.getFileById(id)
      let inFolder = false
      const parents = file.getParents()
      while (parents.hasNext()) if (parents.next().getId() === FOLDER_ID) inFolder = true
      if (!inFolder) { result[id] = 'fuera de la carpeta'; return }
      file.setTrashed(true)
      result[id] = 'ok'
    } catch (err) {
      result[id] = 'no encontrado' // ya borrado: no pasa nada
    }
  })
  return { result: result }
}
