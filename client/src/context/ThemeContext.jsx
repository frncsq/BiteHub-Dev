import { createContext, useContext, useState, useEffect } from 'react'
import { applyTheme } from './themeStore'

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
        applyTheme()
    }, [isDarkMode])

    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode)
    }

    const theme = {
        isDarkMode,
        toggleTheme,
        colors: isDarkMode ? {
            background: '#111111',
            secondaryBg: '#1A1A1A',
            tertiary: '#222222',
            text: '#F5F5F5',
            textSecondary: '#A0A0A0',
            textTertiary: '#666666',
            accent: '#EA580C',
            buttonBg: '#EA580C',
            border: '#2A2A2A',
            hoverBg: '#252525',
            cardBg: '#1A1A1A',
        } : {
            background: '#FAFAFA',
            secondaryBg: '#FFFFFF',
            tertiary: '#F5F5F5',
            text: '#171717',
            textSecondary: '#6B7280',
            textTertiary: '#9CA3AF',
            accent: '#EA580C',
            buttonBg: '#EA580C',
            border: '#E5E7EB',
            hoverBg: '#F5F5F5',
            cardBg: '#FFFFFF',
        }
    }

    return (
        <ThemeContext.Provider value={theme}>
            {children}
        </ThemeContext.Provider>
    )
}

export default ThemeContext
