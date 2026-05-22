export default function LyricsDisplay({ lyrics }) {
  return (
    <div className="lyrics-container" aria-label="Letra de la canción">
      {lyrics}
    </div>
  )
}
