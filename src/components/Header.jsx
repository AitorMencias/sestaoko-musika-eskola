import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import HelpModal from './HelpModal'

export default function Header({
  showBack = false,
  showFontControls = false,
  helpContent = null,
  helpTitle = 'Ayuda',
  title,
}) {
  const navigate = useNavigate()
  const { theme, toggleTheme, increaseFontSize, decreaseFontSize, canIncrease, canDecrease } = useTheme()
  const [showHelp, setShowHelp] = useState(false)

  return (
    <>
      <header className="header">
        {showBack ? (
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Volver a la lista">
            ← Volver
          </button>
        ) : (
          <span className="header-title">{title || 'Sestaoko Musika Eskola'}</span>
        )}

        <div className="header-controls">
          {showFontControls && (
            <>
              <button
                className="icon-btn"
                onClick={decreaseFontSize}
                disabled={!canDecrease}
                aria-label="Reducir tamaño de texto"
                title="Texto más pequeño"
              >
                A-
              </button>
              <button
                className="icon-btn"
                onClick={increaseFontSize}
                disabled={!canIncrease}
                aria-label="Aumentar tamaño de texto"
                title="Texto más grande"
              >
                A+
              </button>
            </>
          )}
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
            title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          {helpContent && (
            <button
              className="icon-btn"
              onClick={() => setShowHelp(true)}
              aria-label="Abrir guía de uso"
              title="Ayuda"
              style={{ fontWeight: 700, fontSize: 17 }}
            >
              ?
            </button>
          )}
        </div>
      </header>

      {showHelp && (
        <HelpModal
          content={helpContent}
          title={helpTitle}
          onClose={() => setShowHelp(false)}
        />
      )}
    </>
  )
}
