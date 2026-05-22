import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

export function useSetlists() {
  const [setlists, setSetlists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'setlists'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, snap => {
      setSetlists(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
  }, [])

  return { setlists, loading }
}
