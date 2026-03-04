import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme')
        return saved ? JSON.parse(saved) : false
    })

    useEffect(() => {
        localStorage.setItem('theme', JSON.stringify(isDarkMode))
    }, [isDarkMode])

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode)
    }

    const theme = {
        isDarkMode,
        toggleTheme,
        colors: isDarkMode ? {
            background: '#0a0a15',
            secondaryBg: 'rgba(20, 20, 40, 0.9)',
            tertiary: 'rgba(40, 40, 60, 0.8)',
            text: '#d0d0d0',
            textSecondary: '#c0c0c0',
            textTertiary: '#808080',
            accent: '#ff6b6b',
            buttonBg: '#8b0000',
            border: 'rgba(139, 0, 0, 0.6)',
            hoverBg: 'rgba(139, 0, 0, 0.3)',
        } : {
            background: '#ffffff',
            secondaryBg: '#f8f9fa',
            tertiary: '#ffffff',
            text: '#1a1a1a',
            textSecondary: '#666666',
            textTertiary: '#999999',
            accent: '#ff6b6b',
            buttonBg: '#ff6b6b',
            border: '#e0e0e0',
            hoverBg: '#f0f0f0',
        }
    }

    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    )
}

export default ThemeContext
