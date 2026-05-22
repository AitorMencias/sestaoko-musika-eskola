import {
  collection, doc,
  addDoc, updateDoc, deleteDoc,
  getDocs, query, where, orderBy,
  writeBatch, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

// ── Canciones ──────────────────────────────────────────────

export async function getMaxSongIndex() {
  const snap = await getDocs(query(collection(db, 'songs'), orderBy('index', 'desc')))
  if (snap.empty) return 0
  return snap.docs[0].data().index
}

export async function checkIndexConflict(index, excludeId = null) {
  const snap = await getDocs(
    query(collection(db, 'songs'), where('index', '==', index))
  )
  const hit = snap.docs.find(d => d.id !== excludeId)
  if (!hit) return null
  return { id: hit.id, ...hit.data() }
}

// Desplaza +1 todos los índices >= index (excepto excludeId)
export async function shiftIndexesFrom(index, excludeId = null) {
  const snap = await getDocs(
    query(collection(db, 'songs'), where('index', '>=', index), orderBy('index'))
  )
  const batch = writeBatch(db)
  snap.docs
    .filter(d => d.id !== excludeId)
    .forEach(d => batch.update(d.ref, { index: d.data().index + 1 }))
  await batch.commit()
}

export async function saveSong(data, id = null) {
  const payload = {
    index: data.index,
    title: data.title,
    lyrics: data.lyrics,
    youtubeUrl: data.youtubeUrl || null,
    updatedAt: serverTimestamp(),
  }
  if (id) {
    await updateDoc(doc(db, 'songs', id), payload)
  } else {
    await addDoc(collection(db, 'songs'), { ...payload, createdAt: serverTimestamp() })
  }
}

export async function deleteSong(id) {
  await deleteDoc(doc(db, 'songs', id))
}

// ── Listas (setlists) ──────────────────────────────────────

export async function saveSetlist(data, id = null) {
  const payload = {
    title: data.title,
    date: data.date || null,
    songIds: data.songIds,
  }
  if (id) {
    await updateDoc(doc(db, 'setlists', id), payload)
  } else {
    await addDoc(collection(db, 'setlists'), { ...payload, createdAt: serverTimestamp() })
  }
}

export async function deleteSetlist(id) {
  await deleteDoc(doc(db, 'setlists', id))
}
