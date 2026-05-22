import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Header from '../components/Header'
import LyricsDisplay from '../components/LyricsDisplay'
import YouTubeEmbed from '../components/YouTubeEmbed'

export default function SongViewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [song, setSong] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDoc(doc(db, 'songs', id)).then(snap => {
      if (snap.exists()) {
        setSong({ id: snap.id, ...snap.data() })
      } else {
        navigate('/', { replace: true })
      }
      setLoading(false)
    })
  }, [id, navigate])

  if (loading) return <div className="loading">Cargando...</div>
  if (!song) return null

  return (
    <div className="page">
      <Header showBack showFontControls title={song.title} />
      <main className="page-content">
        <h1 className="song-view-title">{song.title}</h1>
        <LyricsDisplay lyrics={song.lyrics} />
        {song.youtubeUrl && <YouTubeEmbed url={song.youtubeUrl} />}
      </main>
    </div>
  )
}
