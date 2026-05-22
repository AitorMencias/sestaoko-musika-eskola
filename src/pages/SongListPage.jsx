import { useState, useMemo } from 'react'
import Header from '../components/Header'
import guiaUsuario from '../../GUIA-USUARIO.md?raw'
import SongCard from '../components/SongCard'
import SetlistSelector from '../components/SetlistSelector'
import { useSongs } from '../hooks/useSongs'
import { useSetlists } from '../hooks/useSetlists'

export default function SongListPage() {
  const { songs, loading } = useSongs()
  const { setlists } = useSetlists()
  const [activeSetlistId, setActiveSetlistId] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('index') // 'index' | 'alpha'

  const visibleSongs = useMemo(() => {
    const activeSetlist = setlists.find(sl => sl.id === activeSetlistId)

    return songs
      .filter(s => {
        if (activeSetlist && !activeSetlist.songIds?.includes(s.id)) return false
        if (search.trim()) {
          const q = search.toLowerCase()
          return s.title.toLowerCase().includes(q) || s.lyrics?.toLowerCase().includes(q)
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'alpha') return a.title.localeCompare(b.title, 'eu')
        if (activeSetlist?.songIds) {
          return activeSetlist.songIds.indexOf(a.id) - activeSetlist.songIds.indexOf(b.id)
        }
        return a.index - b.index
      })
  }, [songs, setlists, activeSetlistId, search, sortBy])

  return (
    <div className="page">
      <Header helpContent={guiaUsuario} helpTitle="Guía de uso" />
      <main className="page-content">
        <SetlistSelector
          setlists={setlists}
          activeId={activeSetlistId}
          onChange={setActiveSetlistId}
        />

        <div className="search-wrapper">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            className="search-input"
            type="search"
            placeholder="Buscar canción..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Buscar canción por título o letra"
          />
        </div>

        <div className="list-toolbar">
          <div className="sort-toggle" role="group" aria-label="Ordenar canciones">
            <button
              className={sortBy === 'index' ? 'active' : ''}
              onClick={() => setSortBy('index')}
              aria-pressed={sortBy === 'index'}
            >
              # Índice
            </button>
            <button
              className={sortBy === 'alpha' ? 'active' : ''}
              onClick={() => setSortBy('alpha')}
              aria-pressed={sortBy === 'alpha'}
            >
              A-Z
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Cargando canciones...</div>
        ) : visibleSongs.length === 0 ? (
          <div className="empty-state">
            <p>{search ? 'No se encontraron canciones' : 'No hay canciones todavía'}</p>
          </div>
        ) : (
          <div role="list" aria-label="Lista de canciones">
            {visibleSongs.map(song => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
