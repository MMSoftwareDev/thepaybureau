'use client'

import { useState, useEffect } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search,
  Bell,
  Settings,
  User,
  Plus,
  Command,
  HelpCircle,
  ChevronDown
} from 'lucide-react'

// ThePayBureau Brand Colors
const colors = {
  primary: '#401D6C',
  secondary: '#EC385D',
  accent: '#FF8073',
  lightBg: '#F8F4FF',
  success: '#22C55E',
  warning: '#F59E0B',
}

interface NavbarProps {
  user?: any
}

export default function Navbar({ user }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState(2)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      console.log('Search query:', searchQuery)
      // Handle search functionality
    }
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add_client':
        window.location.href = '/dashboard/clients/add'
        break
      default:
        console.log('Action:', action)
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-full mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          
          {/* Left Section - Search */}
          <div className="flex items-center flex-1 max-w-lg">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search clients, contracts, invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-gray-50 border-gray-200 focus:bg-white focus:border-gray-300 focus:ring-1 focus:ring-gray-300 rounded-lg text-sm"
              />
              {searchQuery && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Badge variant="outline" className="text-xs px-2 py-1 border-gray-300 text-gray-500">
                    <Command className="w-3 h-3 mr-1" />
                    ⏎
                  </Badge>
                </div>
              )}
            </form>
          </div>

          {/* Center Section - Quick Action */}
          <div className="hidden lg:flex items-center">
            <Button
              onClick={() => handleQuickAction('add_client')}
              className="text-white border-0 shadow-sm hover:shadow-md transition-all text-sm font-medium"
              style={{ backgroundColor: colors.primary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.secondary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </div>

          {/* Right Section - Notifications, Settings, User */}
          <div className="flex items-center space-x-3">
            
            {/* System Status - only on larger screens */}
            <div className="hidden xl:flex items-center">
              <Badge 
                variant="outline" 
                className="text-white border-0 text-xs font-medium"
                style={{ backgroundColor: colors.success }}
              >
                ● Online
              </Badge>
            </div>

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="relative p-2 hover:bg-gray-100 rounded-lg"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center text-white border-2 border-white"
                    style={{ backgroundColor: colors.secondary }}
                  >
                    {notifications}
                  </Badge>
                )}
              </Button>
            </div>

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </Button>

            {/* Help - hidden on mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg"
            >
              <HelpCircle className="w-5 h-5 text-gray-600" />
            </Button>

            {/* User Profile */}
            <div className="flex items-center space-x-3 pl-3 ml-3 border-l border-gray-200">
              <div className="text-right hidden md:block">
                <div className="text-sm font-medium text-gray-900">
                  {mounted ? (user?.user_metadata?.name || user?.email?.split('@')[0] || 'User') : 'User'}
                </div>
                <div className="text-xs text-gray-500">
                  Administrator
                </div>
              </div>
              
              <button className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg p-1 transition-colors">
                <div 
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                  style={{ backgroundColor: colors.primary }}
                >
                  {mounted ? (user?.user_metadata?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U') : 'U'}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 hidden md:block" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}