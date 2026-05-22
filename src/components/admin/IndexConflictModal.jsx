export default function IndexConflictModal({ index, conflictingSong, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="conflict-title">
      <div className="modal">
        <h3 id="conflict-title">Índice ya en uso</h3>
        <p>
          El índice <strong>{index}</strong> ya está asignado a{' '}
          <strong>"{conflictingSong.title}"</strong>. ¿Quieres desplazar hacia adelante
          todas las canciones a partir de ese índice para hacer hueco?
        </p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            Sí, desplazar
          </button>
        </div>
      </div>
    </div>
  )
}
