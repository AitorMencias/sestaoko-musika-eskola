import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useSongs } from '../hooks/useSongs'
import { useSetlists } from '../hooks/useSetlists'
import { deleteSong, deleteSetlist } from '../services/firestore'
import SongForm from '../components/admin/SongForm'
import SetlistForm from '../components/admin/SetlistForm'
import HelpModal from '../components/HelpModal'
import guiaAdmin from '../../GUIA-ADMIN.md?raw'

export default function AdminPage() {
  const [tab, setTab] = useState('songs')
  const [editingSong, setEditingSong] = useState(null)
  const [editingSetlist, setEditingSetlist] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const { songs, loading: songsLoading } = useSongs()
  const { setlists, loading: setlistsLoading } = useSetlists()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut(auth)
    navigate('/admin/login', { replace: true })
  }

  async function handleDeleteSong(song) {
    if (!window.confirm(`¿Eliminar la canción "${song.title}"?`)) return
    await deleteSong(song.id)
  }

  async function handleDeleteSetlist(sl) {
    if (!window.confirm(`¿Eliminar la lista "${sl.title}"?`)) return
    await deleteSetlist(sl.id)
  }

  function switchTab(t) {
    setTab(t)
    setEditingSong(null)
    setEditingSetlist(null)
  }

  return (
    <div className="admin-page">
      {/* Cabecera */}
      <div className="admin-header">
        <span className="admin-header-title">Admin · Sestaoko Musika Eskola</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="icon-btn"
            onClick={() => setShowHelp(true)}
            aria-label="Abrir guía de administración"
            title="Ayuda"
            style={{ fontWeight: 700, fontSize: 17 }}
          >
            ?
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {showHelp && (
        <HelpModal
          content={guiaAdmin}
          title="Guía de administración"
          onClose={() => setShowHelp(false)}
        />
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${tab === 'songs' ? 'active' : ''}`}
          onClick={() => switchTab('songs')}
        >
          Canciones
        </button>
        <button
          className={`admin-tab ${tab === 'setlists' ? 'active' : ''}`}
          onClick={() => switchTab('setlists')}
        >
          Listas
        </button>
      </div>

      <div className="admin-content">
        {/* ── Panel canciones ── */}
        {tab === 'songs' && (
          editingSong !== null ? (
            <SongForm
              song={editingSong === 'new' ? null : editingSong}
              onCancel={() => setEditingSong(null)}
              onSaved={() => setEditingSong(null)}
            />
          ) : (
            <>
              <div className="admin-toolbar">
                <h2>Canciones ({songs.length})</h2>
                <button className="btn btn-primary" onClick={() => setEditingSong('new')}>
                  + Nueva canción
                </button>
              </div>

              {songsLoading ? (
                <div className="loading">Cargando...</div>
              ) : songs.length === 0 ? (
                <div className="empty-state">No hay canciones todavía.</div>
              ) : (
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th style={{ width: 56 }}>#</th>
                        <th>Título</th>
                        <th style={{ width: 80 }}>YouTube</th>
                        <th style={{ width: 148 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {songs.map(song => (
                        <tr key={song.id}>
                          <td>{song.index}</td>
                          <td>{song.title}</td>
                          <td>{song.youtubeUrl ? '✓' : '—'}</td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setEditingSong(song)}
                              >
                                Editar
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteSong(song)}
                              >
                                Borrar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )
        )}

        {/* ── Panel listas ── */}
        {tab === 'setlists' && (
          editingSetlist !== null ? (
            <SetlistForm
              setlist={editingSetlist === 'new' ? null : editingSetlist}
              songs={songs}
              onCancel={() => setEditingSetlist(null)}
              onSaved={() => setEditingSetlist(null)}
            />
          ) : (
            <>
              <div className="admin-toolbar">
                <h2>Listas ({setlists.length})</h2>
                <button className="btn btn-primary" onClick={() => setEditingSetlist('new')}>
                  + Nueva lista
                </button>
              </div>

              {setlistsLoading ? (
                <div className="loading">Cargando...</div>
              ) : setlists.length === 0 ? (
                <div className="empty-state">No hay listas todavía.</div>
              ) : (
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th style={{ width: 120 }}>Fecha</th>
                        <th style={{ width: 80 }}>Canciones</th>
                        <th style={{ width: 148 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {setlists.map(sl => (
                        <tr key={sl.id}>
                          <td>{sl.title}</td>
                          <td>{sl.date ?? '—'}</td>
                          <td>{sl.songIds?.length ?? 0}</td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setEditingSetlist(sl)}
                              >
                                Editar
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteSetlist(sl)}
                              >
                                Borrar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  )
}
