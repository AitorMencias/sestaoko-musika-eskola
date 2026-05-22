import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

const SIZES = ['S', 'M', 'L', 'XL', 'XXL']
const SIZE_PX = { S: 16, M: 20, L: 26, XL: 32, XXL: 40 }

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')
  const [sizeKey, setSizeKey] = useState(() => localStorage.getItem('fontSize') || 'M')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--lyrics-size', `${SIZE_PX[sizeKey]}px`)
    localStorage.setItem('fontSize', sizeKey)
  }, [sizeKey])

  function increaseFontSize() {
    setSizeKey(k => {
      const i = SIZES.indexOf(k)
      return i < SIZES.length - 1 ? SIZES[i + 1] : k
    })
  }

  function decreaseFontSize() {
    setSizeKey(k => {
      const i = SIZES.indexOf(k)
      return i > 0 ? SIZES[i - 1] : k
    })
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light'),
      sizeKey,
      increaseFontSize,
      decreaseFontSize,
      canIncrease: SIZES.indexOf(sizeKey) < SIZES.length - 1,
      canDecrease: SIZES.indexOf(sizeKey) > 0,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
