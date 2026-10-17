import { createContext, useContext, useState, useEffect } from 'react'
import { applyTheme, readOwnerTheme, setOwnerThemeActive } from './themeStore'

const OwnerThemeContext = createContext()

export const useOwnerTheme = () => {
  const context = useContext(OwnerThemeContext)
  if (!context) {
    throw new Error('useOwnerTheme must be used within an OwnerThemeProvider')
  }
  return context
}

export const OwnerThemeProvider = ({ children }) => {
  const [ownerTheme, setOwnerTheme] = useState(readOwnerTheme)

  useEffect(() => {
    localStorage.setItem('ownerTheme', ownerTheme)
    applyTheme()
  }, [ownerTheme])

  useEffect(() => {
    setOwnerThemeActive(true)
    return () => setOwnerThemeActive(false)
  }, [])

  const value = {
    ownerTheme,
    isDarkMode: ownerTheme === 'dark',
    setOwnerTheme,
    toggleTheme: () => setOwnerTheme((t) => (t === 'dark' ? 'light' : 'dark')),
  }

  return (
    <OwnerThemeContext.Provider value={value}>
      {children}
    </OwnerThemeContext.Provider>
  )
}
