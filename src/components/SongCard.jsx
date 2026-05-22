import { useNavigate } from 'react-router-dom'

export default function SongCard({ song }) {
  const navigate = useNavigate()

  return (
    <button
      className="song-card"
      onClick={() => navigate(`/cancion/${song.id}`)}
      aria-label={`Ver letra: ${song.title}`}
    >
      <span className="song-card-index">{song.index}</span>
      <span className="song-card-title">{song.title}</span>
      <span className="song-card-arrow" aria-hidden="true">›</span>
    </button>
  )
}
