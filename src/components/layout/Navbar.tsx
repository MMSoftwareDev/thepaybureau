// src/components/layout/Navbar.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { 
  Search,
  Bell,
  User,
  HelpCircle,
  ChevronDown,
  LogOut,
  Settings
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NavbarProps {
  user?: any
}

// Brand Colors with Pink as Primary Accent
const colors = {
  primary: '#5B3A8E',
  primaryDark: '#472D70',
  accent: '#E94B6D',       // Pink as main accent
  accentDark: '#D62D52',   // Darker pink
  accentLight: '#FF6B8A',  // Light pink
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  
  gray50: '#FAFAFA',
  gray100: '#F4F4F5',
  gray200: '#E4E4E7',
  gray400: '#A1A1AA',
  gray500: '#71717A',
  gray600: '#52525B',
  gray700: '#3F3F46',
  gray900: '#18181B',
  
  background: '#FAFBFC',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6'
}

export default function Navbar({ user }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'client', message: 'New client onboarding completed', time: '5m ago', unread: true },
    { id: 2, type: 'payroll', message: 'Payroll run requires attention', time: '1h ago', unread: true },
    { id: 3, type: 'system', message: 'System maintenance scheduled', time: '2h ago', unread: false }
  ])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClientSupabaseClient()

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
      <nav className="h-16 border-b bg-white">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="w-96 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav 
      className="h-16 border-b"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border
      }}
    >
      <div className="h-full px-6 flex items-center justify-between">
        
        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <form onSubmit={handleSearch} className="relative">
            <Search 
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" 
              style={{ color: colors.gray400 }} 
            />
            <input
              type="text"
              placeholder="Search clients, contracts, invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{
                backgroundColor: colors.gray50,
                border: `1px solid ${colors.border}`,
                color: colors.gray900
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.accent
                e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.accent}15`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.border
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 ml-6">
          
          {/* Help Button */}
          <button
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:bg-pink-50"
            style={{ 
              border: `1px solid ${colors.border}`,
              color: colors.gray600
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.accent
              e.currentTarget.style.color = colors.accent
              e.currentTarget.style.backgroundColor = `${colors.accent}10`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border
              e.currentTarget.style.color = colors.gray600
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-all hover:bg-pink-50 relative"
              style={{ 
                border: `1px solid ${colors.border}`,
                color: colors.gray600
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.accent
                e.currentTarget.style.color = colors.accent
                e.currentTarget.style.backgroundColor = `${colors.accent}10`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border
                e.currentTarget.style.color = colors.gray600
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center text-white font-semibold animate-pulse"
                  style={{ 
                    backgroundColor: colors.accent,
                    border: `2px solid ${colors.surface}`,
                    boxShadow: '0 2px 8px rgba(233, 75, 109, 0.3)'
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div 
                className="absolute right-0 top-full mt-2 w-80 rounded-xl shadow-lg z-50 overflow-hidden"
                style={{
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`
                }}
              >
                <div 
                  className="p-4 border-b flex items-center justify-between"
                  style={{ borderColor: colors.borderLight }}
                >
                  <h3 className="font-semibold" style={{ color: colors.gray900 }}>
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span 
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: `${colors.accent}15`,
                        color: colors.accent
                      }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => markNotificationAsRead(notification.id)}
                      className="w-full p-4 text-left transition-colors hover:bg-pink-50 border-b"
                      style={{
                        borderColor: colors.borderLight,
                        backgroundColor: notification.unread ? `${colors.accent}05` : 'transparent'
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className={`w-2 h-2 rounded-full mt-2 ${notification.unread ? 'animate-pulse' : 'opacity-30'}`}
                          style={{ 
                            backgroundColor: notification.unread ? colors.accent : colors.gray400
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: colors.gray900 }}>
                            {notification.message}
                          </p>
                          <p className="text-xs mt-1" style={{ color: colors.gray500 }}>
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="p-3">
                  <button 
                    className="w-full py-2 rounded-lg text-sm font-medium transition-colors"
                    style={{ 
                      color: colors.accent,
                      backgroundColor: `${colors.accent}10`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${colors.accent}20`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${colors.accent}10`
                    }}
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-3 ml-3 border-l" style={{ borderColor: colors.border }}>
            <div className="text-right hidden md:block">
              <div className="text-sm font-semibold" style={{ color: colors.gray900 }}>
                {getUserName()}
              </div>
              <div className="text-xs" style={{ color: colors.gray500 }}>
                Administrator
              </div>
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-lg transition-colors hover:bg-pink-50"
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                  style={{ 
                    background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentDark})`,
                    boxShadow: '0 4px 12px rgba(233, 75, 109, 0.2)'
                  }}
                >
                  {getUserInitial()}
                </div>
                <ChevronDown 
                  className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                  style={{ color: colors.gray500 }}
                />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div 
                  className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg z-50 overflow-hidden"
                  style={{
                    backgroundColor: colors.surface,
                    border: `1px solid ${colors.border}`
                  }}
                >
                  <div 
                    className="p-4 border-b"
                    style={{ borderColor: colors.borderLight }}
                  >
                    <div className="font-semibold" style={{ color: colors.gray900 }}>
                      {getUserName()}
                    </div>
                    <div className="text-sm mt-0.5" style={{ color: colors.gray500 }}>
                      {user?.email}
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <button 
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-pink-50"
                      style={{ color: colors.gray700 }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = colors.accent
                        e.currentTarget.style.backgroundColor = `${colors.accent}10`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = colors.gray700
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <User className="w-4 h-4" />
                      Profile Settings
                    </button>
                    
                    <button 
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-pink-50"
                      style={{ color: colors.gray700 }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = colors.accent
                        e.currentTarget.style.backgroundColor = `${colors.accent}10`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = colors.gray700
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <Settings className="w-4 h-4" />
                      Account Settings
                    </button>
                    
                    <div className="my-2 border-t" style={{ borderColor: colors.borderLight }}></div>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors"
                      style={{ 
                        color: colors.error,
                        backgroundColor: `${colors.error}10`
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = `${colors.error}20`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = `${colors.error}10`
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
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
