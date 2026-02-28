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

// MUCH DARKER theme colors - professional dark mode
export const getThemeColors = (isDark: boolean) => ({
  // Brand colors - slightly adjusted for dark mode
  primary: isDark ? '#6B46C1' : '#401D6C',      // Deeper purple in dark
  secondary: isDark ? '#EC4899' : '#EC385D',     // Vibrant pink maintained
  accent: isDark ? '#F97316' : '#FF8073',        // Warmer orange in dark
  
  // Background colors - MUCH darker
  lightBg: isDark ? '#0F0F23' : '#F8F4FF',       // Very dark navy instead of purple
  surface: isDark ? '#1A1B2E' : '#FFFFFF',       // Dark slate
  surfaceElevated: isDark ? '#16213E' : '#FFFFFF', // Slightly lighter dark slate
  
  // Semantic colors
  success: '#10B981',  // Emerald green
  warning: '#F59E0B',  // Amber
  error: '#EF4444',    // Red
  
  // Text colors - high contrast for dark mode
  text: {
    primary: isDark ? '#F1F5F9' : '#111827',     // Almost white in dark
    secondary: isDark ? '#CBD5E1' : '#374151',   // Light gray in dark
    muted: isDark ? '#64748B' : '#6B7280'        // Medium gray
  },
  
  // Border colors - subtle but visible
  border: isDark ? 'rgba(241, 245, 249, 0.08)' : 'rgba(17, 24, 39, 0.1)',
  borderElevated: isDark ? 'rgba(241, 245, 249, 0.12)' : 'rgba(17, 24, 39, 0.2)',
  
  // Glass morphism effects - much darker
  glass: {
    // Main backgrounds with dark gradients
    background: isDark 
      ? 'linear-gradient(135deg, rgba(15, 15, 35, 0.95) 0%, rgba(26, 27, 46, 0.98) 100%)'
      : 'linear-gradient(135deg, #F8F4FF 0%, rgba(255,255,255,0.95) 100%)',
      
    // Surface elements
    surface: isDark 
      ? 'rgba(26, 27, 46, 0.6)' 
      : 'rgba(255, 255, 255, 0.8)',
      
    // Hover states
    surfaceHover: isDark 
      ? 'rgba(22, 33, 62, 0.8)' 
      : 'rgba(255, 255, 255, 0.95)',
      
    // Active/selected states
    surfaceActive: isDark 
      ? 'rgba(22, 33, 62, 0.4)' 
      : 'rgba(255, 255, 255, 0.6)',
      
    // Card backgrounds
    card: isDark
      ? 'rgba(26, 27, 46, 0.7)'
      : 'rgba(255, 255, 255, 0.9)',
      
    // Sidebar specific
    sidebar: isDark
      ? 'linear-gradient(135deg, rgba(15, 15, 35, 0.98) 0%, rgba(22, 33, 62, 0.95) 100%)'
      : 'linear-gradient(135deg, #F8F4FF 0%, rgba(255,255,255,0.95) 100%)',
      
    // Navbar specific
    navbar: isDark
      ? 'rgba(15, 15, 35, 0.95)'
      : 'linear-gradient(135deg, #F8F4FF 0%, rgba(255,255,255,0.95) 100%)'
  },
  
  // Shadow colors for depth
  shadow: {
    light: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
    medium: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)',
    heavy: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.25)'
  }
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