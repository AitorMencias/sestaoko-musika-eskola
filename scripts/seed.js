/**
 * Inserción masiva de canciones en Firestore.
 *
 * Uso (una sola vez):
 *   node scripts/seed.js "TU_CLAVE_ADMIN"
 *
 * Lee la configuración de Firebase desde .env.local (las mismas VITE_*
 * que usa la app) e inicia sesión con el usuario admin, así que respeta
 * las reglas de seguridad. Las canciones se leen de scripts/songs.json.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import {
  getFirestore, collection, doc, writeBatch, serverTimestamp,
  getDocs, query, orderBy,
} from 'firebase/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// ── Cargar .env.local manualmente (Node no lo hace solo) ──
function loadEnv() {
  const raw = readFileSync(join(root, '.env.local'), 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
  return env
}

async function main() {
  const password = process.argv[2]
  if (!password) {
    console.error('❌ Falta la clave. Uso: node scripts/seed.js "TU_CLAVE_ADMIN"')
    process.exit(1)
  }

  const env = loadEnv()
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  })
  const auth = getAuth(app)
  const db = getFirestore(app)

  console.log('🔐 Iniciando sesión como admin...')
  await signInWithEmailAndPassword(auth, env.VITE_ADMIN_EMAIL, password)

  // Cargar canciones del JSON
  const songs = JSON.parse(readFileSync(join(__dirname, 'songs.json'), 'utf8'))
  if (!Array.isArray(songs) || songs.length === 0) {
    console.error('❌ scripts/songs.json está vacío o no es una lista.')
    process.exit(1)
  }

  // Avisar si ya hay canciones (para no duplicar sin querer)
  const existing = await getDocs(query(collection(db, 'songs'), orderBy('index')))
  if (!existing.empty) {
    console.warn(`⚠️  Ya hay ${existing.size} canción(es) en la base de datos.`)
    console.warn('   Este script AÑADE, no reemplaza. Cancela con Ctrl+C si no quieres duplicar.')
  }

  // Validación rápida
  for (const [i, s] of songs.entries()) {
    if (typeof s.index !== 'number' || !s.title || typeof s.lyrics !== 'string') {
      console.error(`❌ Canción nº ${i + 1} inválida (necesita index numérico, title y lyrics).`)
      process.exit(1)
    }
  }

  // Insertar en batches de 500 (límite de Firestore)
  let inserted = 0
  for (let start = 0; start < songs.length; start += 500) {
    const batch = writeBatch(db)
    for (const s of songs.slice(start, start + 500)) {
      const ref = doc(collection(db, 'songs'))
      batch.set(ref, {
        index: s.index,
        title: s.title.trim(),
        lyrics: s.lyrics,
        youtubeUrl: s.youtubeUrl || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }
    await batch.commit()
    inserted += Math.min(500, songs.length - start)
    console.log(`✅ Insertadas ${inserted}/${songs.length}`)
  }

  console.log(`🎉 Listo. ${inserted} canciones añadidas.`)
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Error:', err.message || err)
  process.exit(1)
})
