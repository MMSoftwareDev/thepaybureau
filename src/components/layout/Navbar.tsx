// src/components/layout/Navbar.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { 
  Search,
  Bell,
  User,
  HelpCircle,
  ChevronDown,
  LogOut,
  Settings,
  Sun,
  Moon
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NavbarProps {
  user?: any
}

// Theme Toggle Component
function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()
  const colors = getThemeColors(isDark)

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="sm"
      className="p-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.05] group"
      style={{
        background: colors.glass.surfaceActive,
        backdropFilter: 'blur(15px)',
        border: `1px solid ${colors.borderElevated}`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = colors.glass.surfaceHover
        e.currentTarget.style.transform = 'scale(1.05)'
        e.currentTarget.style.boxShadow = isDark 
          ? `0 8px 25px ${colors.shadow.medium}` 
          : `0 8px 25px ${colors.shadow.light}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = colors.glass.surfaceActive
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = 'none'
      }}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-400 transition-transform duration-300 group-hover:rotate-12" />
      ) : (
        <Moon className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" style={{ color: colors.text.muted }} />
      )}
    </Button>
  )
}

export default function Navbar({ user }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'client', message: 'New client onboarding completed', time: '5m ago', unread: true },
    { id: 2, type: 'payroll', message: 'Payroll run requires attention', time: '1h ago', unread: true },
    { id: 3, type: 'system', message: 'System maintenance scheduled', time: '2h ago', unread: false }
  ])
  const [showNotifications, setShowNotifications] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const router = useRouter()
  const supabase = createClientSupabaseClient()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      console.log('Search query:', searchQuery)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const markNotificationAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, unread: false } : notif
      )
    )
  }

  const unreadCount = notifications.filter(n => n.unread).length

  const getUserInitial = () => {
    if (!mounted) return 'U'
    return user?.user_metadata?.name?.[0] || user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'
  }

  const getUserName = () => {
    if (!mounted) return 'User'
    return user?.user_metadata?.name || user?.name || user?.email?.split('@')[0] || 'User'
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <nav className="h-16 border-b bg-white animate-pulse">
        <div className="max-w-full mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="w-96 h-10 bg-gray-200 rounded-xl"></div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
              <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
              <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav 
      className="border-b shadow-2xl relative z-50 transition-all duration-300"
      style={{
        background: colors.glass.navbar || colors.glass.background,
        backdropFilter: 'blur(25px)',
        borderBottom: `1px solid ${colors.borderElevated}`,
        boxShadow: isDark 
          ? `0 4px 20px ${colors.shadow.medium}` 
          : `0 4px 20px ${colors.shadow.light}`
      }}
    >
      <div className="max-w-full mx-auto px-6 relative z-10">
        <div className="flex items-center justify-between h-16">
          
          {/* Left Section - Search Bar (Keep Exactly As-Is) */}
          <div className="flex items-center flex-1 max-w-lg">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300" 
                style={{ color: colors.text.muted }} 
              />
              <Input
                type="text"
                placeholder="Search clients, contracts, invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-sm border-0 shadow-lg transition-all duration-300 focus:shadow-2xl rounded-xl font-medium"
                style={{
                  background: colors.glass.surface,
                  backdropFilter: 'blur(15px)',
                  color: colors.text.primary,
                  fontSize: '14px',
                  border: `1px solid ${colors.borderElevated}`,
                  boxShadow: isDark 
                    ? `0 4px 20px ${colors.shadow.light}` 
                    : `0 4px 15px ${colors.shadow.light}`
                }}
                onFocus={(e) => {
                  e.target.style.background = colors.glass.surfaceHover
                  e.target.style.boxShadow = isDark
                    ? `0 12px 35px ${colors.shadow.medium}, 0 0 0 1px ${colors.primary}40`
                    : `0 8px 25px ${colors.primary}25, 0 0 0 1px ${colors.primary}30`
                  e.target.style.borderColor = `${colors.primary}60`
                }}
                onBlur={(e) => {
                  e.target.style.background = colors.glass.surface
                  e.target.style.boxShadow = isDark 
                    ? `0 4px 20px ${colors.shadow.light}` 
                    : `0 4px 15px ${colors.shadow.light}`
                  e.target.style.borderColor = colors.borderElevated
                }}
              />
            </form>
          </div>

          {/* Right Section - Enhanced Icons */}
          <div className="flex items-center space-x-3">
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Help Button */}
            <Button
              variant="ghost"
              size="sm"
              className="p-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.05] group"
              style={{
                background: colors.glass.surfaceActive,
                backdropFilter: 'blur(15px)',
                border: `1px solid ${colors.borderElevated}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.glass.surfaceHover
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = isDark 
                  ? `0 8px 25px ${colors.shadow.medium}` 
                  : `0 8px 25px ${colors.shadow.light}`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = colors.glass.surfaceActive
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <HelpCircle 
                className="w-5 h-5 transition-all duration-300 group-hover:rotate-12" 
                style={{ color: colors.text.muted }} 
              />
            </Button>

            {/* Notifications */}
            <div className="relative">
              <Button
                onClick={() => setShowNotifications(!showNotifications)}
                variant="ghost"
                size="sm"
                className="relative p-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.05] group"
                style={{
                  background: colors.glass.surfaceActive,
                  backdropFilter: 'blur(15px)',
                  border: `1px solid ${colors.borderElevated}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.glass.surfaceHover
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = isDark 
                    ? `0 8px 25px ${colors.shadow.medium}` 
                    : `0 8px 25px ${colors.shadow.light}`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = colors.glass.surfaceActive
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <Bell 
                  className="w-5 h-5 transition-all duration-300 group-hover:rotate-12" 
                  style={{ color: colors.text.muted }} 
                />
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full text-xs flex items-center justify-center text-white border-2 font-bold shadow-xl animate-pulse transition-all duration-300"
                    style={{ 
                      background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.accent} 100%)`,
                      boxShadow: isDark
                        ? `0 8px 20px ${colors.secondary}60, 0 0 20px ${colors.secondary}40`
                        : `0 8px 20px ${colors.secondary}40`,
                      borderColor: colors.surface
                    }}
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div 
                  className="absolute right-0 top-full mt-3 w-80 rounded-2xl shadow-2xl z-50 overflow-hidden transition-all duration-300"
                  style={{
                    background: colors.glass.card,
                    backdropFilter: 'blur(25px)',
                    border: `1px solid ${colors.borderElevated}`,
                    boxShadow: isDark 
                      ? `0 25px 50px ${colors.shadow.heavy}, 0 0 40px ${colors.shadow.medium}` 
                      : `0 20px 40px ${colors.primary}20`
                  }}
                >
                  <div className="p-5 border-b transition-colors duration-300" style={{ borderColor: colors.borderElevated }}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold transition-colors duration-300" style={{ color: colors.text.primary }}>
                        Notifications
                      </h3>
                      <Badge 
                        className="text-white text-xs px-3 py-1 font-bold transition-all duration-300 shadow-lg"
                        style={{ 
                          background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.accent} 100%)`,
                          boxShadow: `0 4px 15px ${colors.secondary}30`
                        }}
                      >
                        {unreadCount} new
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => markNotificationAsRead(notification.id)}
                        className={`w-full p-4 text-left transition-all duration-300 border-b group hover:scale-[1.01] ${
                          notification.unread 
                            ? isDark ? 'bg-white/3' : 'bg-white/40' 
                            : ''
                        }`}
                        style={{
                          borderColor: colors.borderElevated
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = colors.glass.surfaceHover
                          e.currentTarget.style.transform = 'scale(1.01)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = notification.unread 
                            ? (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)')
                            : 'transparent'
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <div 
                            className={`w-3 h-3 rounded-full mt-2 shadow-lg transition-all duration-300 ${
                              notification.unread ? 'animate-pulse scale-110' : 'opacity-30'
                            }`}
                            style={{ 
                              backgroundColor: colors.secondary,
                              boxShadow: notification.unread 
                                ? `0 0 15px ${colors.secondary}60` 
                                : 'none'
                            }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold transition-colors duration-300 group-hover:scale-[1.01]" 
                               style={{ color: colors.text.primary }}>
                              {notification.message}
                            </p>
                            <p className="text-xs mt-1 font-medium transition-colors duration-300" 
                               style={{ color: colors.text.muted }}>
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="p-4 border-t transition-colors duration-300" style={{ borderColor: colors.borderElevated }}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-sm font-semibold transition-all duration-300 hover:scale-[1.02] rounded-xl py-2"
                      style={{ 
                        color: colors.primary,
                        background: `${colors.primary}10`,
                        border: `1px solid ${colors.primary}20`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${colors.primary}20`
                        e.currentTarget.style.transform = 'scale(1.02)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `${colors.primary}10`
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                    >
                      View All Notifications
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-3 pl-4 ml-2 border-l transition-colors duration-300" 
                 style={{ borderColor: colors.borderElevated }}>
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold transition-colors duration-300" style={{ color: colors.text.primary }}>
                  {getUserName()}
                </div>
                <div className="text-xs font-medium transition-colors duration-300" style={{ color: colors.text.muted }}>
                  Administrator
                </div>
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group"
                  style={{
                    background: 'transparent',
                    backdropFilter: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.glass.surfaceHover
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = isDark 
                      ? `0 12px 30px ${colors.shadow.medium}` 
                      : `0 8px 25px ${colors.shadow.light}`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-xl relative overflow-hidden transition-all duration-300 group-hover:scale-110"
                    style={{ 
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                      boxShadow: isDark
                        ? `0 15px 35px ${colors.primary}40, 0 0 25px ${colors.secondary}30`
                        : `0 10px 25px ${colors.primary}30`
                    }}
                  >
                    {getUserInitial()}
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/10 to-transparent group-hover:from-white/30"></div>
                  </div>
                  <ChevronDown 
                    className={`w-4 h-4 hidden md:block transition-all duration-300 ${showUserMenu ? 'rotate-180' : ''} group-hover:scale-110`}
                    style={{ color: colors.text.muted }}
                  />
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div 
                    className="absolute right-0 top-full mt-3 w-64 rounded-2xl shadow-2xl z-50 overflow-hidden transition-all duration-300"
                    style={{
                      background: colors.glass.card,
                      backdropFilter: 'blur(25px)',
                      border: `1px solid ${colors.borderElevated}`,
                      boxShadow: isDark 
                        ? `0 25px 50px ${colors.shadow.heavy}, 0 0 40px ${colors.shadow.medium}` 
                        : `0 20px 40px ${colors.primary}20`
                    }}
                  >
                    <div className="p-5 border-b transition-colors duration-300" style={{ borderColor: colors.borderElevated }}>
                      <div className="font-bold text-base transition-colors duration-300" style={{ color: colors.text.primary }}>
                        {getUserName()}
                      </div>
                      <div className="text-sm mt-1 transition-colors duration-300" style={{ color: colors.text.muted }}>
                        {user?.email}
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <button 
                        className="w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group"
                        style={{ 
                          color: colors.text.secondary,
                          background: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = colors.glass.surfaceHover
                          e.currentTarget.style.color = colors.text.primary
                          e.currentTarget.style.transform = 'scale(1.02)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = colors.text.secondary
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        <User className="w-5 h-5 mr-3 transition-transform duration-300 group-hover:scale-110" />
                        Profile Settings
                      </button>
                      
                      <button 
                        className="w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group"
                        style={{ 
                          color: colors.text.secondary,
                          background: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = colors.glass.surfaceHover
                          e.currentTarget.style.color = colors.text.primary
                          e.currentTarget.style.transform = 'scale(1.02)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = colors.text.secondary
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        <Settings className="w-5 h-5 mr-3 transition-transform duration-300 group-hover:rotate-90" />
                        Account Settings
                      </button>
                      
                      <div className="my-3 border-t transition-colors duration-300" style={{ borderColor: colors.borderElevated }}></div>
                      
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group"
                        style={{ 
                          color: colors.error,
                          background: `${colors.error}10`,
                          border: `1px solid ${colors.error}20`
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `${colors.error}20`
                          e.currentTarget.style.transform = 'scale(1.02)'
                          e.currentTarget.style.boxShadow = `0 8px 25px ${colors.error}30`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = `${colors.error}10`
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        <LogOut className="w-5 h-5 mr-3 transition-transform duration-300 group-hover:scale-110" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showUserMenu || showNotifications) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowUserMenu(false)
            setShowNotifications(false)
          }}
        />
      )}
    </nav>
  )
}