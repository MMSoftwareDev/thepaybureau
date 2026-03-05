// src/contexts/ThemeContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  isDark: boolean
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'thepaybureau-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Get theme from localStorage or system preference
    const savedTheme = localStorage.getItem(storageKey) as Theme
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    
    const initialTheme = savedTheme || systemTheme
    setTheme(initialTheme)
    
    // Apply theme to document
    applyTheme(initialTheme)
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(storageKey)) {
        const newTheme = e.matches ? 'dark' : 'light'
        setTheme(newTheme)
        applyTheme(newTheme)
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [storageKey])

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // Set CSS custom properties for smooth transitions
    root.style.setProperty('--theme-transition', 'all 0.3s ease-in-out')
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem(storageKey, newTheme)
    applyTheme(newTheme)
  }

  const toggleTheme = () => {
    handleThemeChange(theme === 'light' ? 'dark' : 'light')
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{
        theme: defaultTheme,
        isDark: defaultTheme === 'dark',
        toggleTheme: () => {},
        setTheme: () => {},
      }}>
        {children}
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      isDark: theme === 'dark',
      toggleTheme,
      setTheme: handleThemeChange,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Theme colors — aligned with the login/signup brand palette (--login-* tokens)
export const getThemeColors = (isDark: boolean) => ({
  // Brand colors
  primary: isDark ? '#7C5CBF' : '#401D6C',
  secondary: isDark ? '#F06082' : '#EC385D',
  accent: isDark ? '#FFA599' : '#FF8073',

  // Backgrounds
  lightBg: isDark ? '#1A1A1A' : '#FAF7FF',
  surface: isDark ? '#333333' : '#FFFFFF',
  surfaceElevated: isDark ? '#2A2A2A' : '#FFFFFF',

  // Semantic
  success: isDark ? '#10B981' : '#188038',
  warning: '#F59E0B',
  error: isDark ? '#EF4444' : '#D93025',

  // Text
  text: {
    primary: isDark ? '#F1F5F9' : '#1A1225',
    secondary: isDark ? '#CBD5E1' : '#5E5470',
    muted: isDark ? '#64748B' : '#8E849A',
  },

  // Borders
  border: isDark ? 'rgba(255, 255, 255, 0.10)' : '#E8E2F0',
  borderElevated: isDark ? 'rgba(255, 255, 255, 0.15)' : '#D4CBE3',

  // Glass effects
  glass: {
    background: isDark
      ? 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(51, 51, 51, 0.98) 100%)'
      : 'linear-gradient(135deg, #FAF7FF 0%, #FFFFFF 100%)',
    surface: isDark ? 'rgba(51, 51, 51, 0.6)' : 'rgba(255, 255, 255, 0.8)',
    surfaceHover: isDark ? 'rgba(60, 60, 60, 0.8)' : 'rgba(255, 255, 255, 0.95)',
    surfaceActive: isDark ? 'rgba(60, 60, 60, 0.4)' : 'rgba(255, 255, 255, 0.6)',
    card: isDark ? 'rgba(51, 51, 51, 0.7)' : 'rgba(255, 255, 255, 0.92)',
    sidebar: isDark
      ? 'linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(45, 45, 45, 0.95) 100%)'
      : 'linear-gradient(135deg, #FAF7FF 0%, rgba(255,255,255,0.95) 100%)',
    navbar: isDark ? 'rgba(26, 26, 26, 0.95)' : '#FFFFFF',
  },

  // Shadows
  shadow: {
    light: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.06)',
    medium: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)',
    heavy: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.18)',
  },
})

// Enhanced Theme Toggle Component with better dark mode styling
export function ThemeToggle({ 
  className = '',
  size = 'default',
  showLabel = false 
}: { 
  className?: string
  size?: 'sm' | 'default' | 'lg'
  showLabel?: boolean
}) {
  const { isDark, toggleTheme } = useTheme()
  const colors = getThemeColors(isDark)

  const sizeClasses = {
    sm: 'p-2 w-8 h-8',
    default: 'p-3 w-12 h-12',
    lg: 'p-4 w-16 h-16'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    default: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]} 
        rounded-xl transition-all duration-300 
        hover:shadow-lg hover:scale-[1.05] 
        flex items-center justify-center gap-2
        ${className}
      `}
      style={{
        background: colors.glass.surfaceActive,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${colors.borderElevated}`,
        boxShadow: isDark 
          ? `0 4px 15px ${colors.shadow.medium}` 
          : `0 4px 15px ${colors.shadow.light}`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = colors.glass.surfaceHover
        e.currentTarget.style.transform = 'scale(1.05)'
        e.currentTarget.style.boxShadow = isDark 
          ? `0 8px 25px ${colors.shadow.heavy}` 
          : `0 8px 25px ${colors.shadow.medium}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = colors.glass.surfaceActive
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = isDark 
          ? `0 4px 15px ${colors.shadow.medium}` 
          : `0 4px 15px ${colors.shadow.light}`
      }}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <svg 
          className={`${iconSizes[size]} text-yellow-400 transition-transform duration-300 hover:rotate-12`}
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" 
            clipRule="evenodd" 
          />
        </svg>
      ) : (
        <svg 
          className={`${iconSizes[size]} transition-transform duration-300 hover:rotate-12`}
          style={{ color: colors.text.muted }}
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" 
          />
        </svg>
      )}
      {showLabel && (
        <span 
          className="text-sm font-medium transition-colors duration-300"
          style={{ color: colors.text.secondary }}
        >
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  )
}

// Utility function for getting theme-aware CSS variables
export const getThemeCSSVariables = (isDark: boolean) => {
  const colors = getThemeColors(isDark)
  
  return {
    '--color-primary': colors.primary,
    '--color-secondary': colors.secondary,
    '--color-accent': colors.accent,
    '--color-surface': colors.surface,
    '--color-surface-elevated': colors.surfaceElevated,
    '--color-text-primary': colors.text.primary,
    '--color-text-secondary': colors.text.secondary,
    '--color-text-muted': colors.text.muted,
    '--color-border': colors.border,
    '--color-border-elevated': colors.borderElevated,
    '--glass-background': colors.glass.background,
    '--glass-surface': colors.glass.surface,
    '--glass-surface-hover': colors.glass.surfaceHover,
    '--shadow-light': colors.shadow.light,
    '--shadow-medium': colors.shadow.medium,
    '--shadow-heavy': colors.shadow.heavy,
  }
}