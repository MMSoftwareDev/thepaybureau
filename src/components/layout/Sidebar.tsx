'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClientSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Building2, 
  Users, 
  FileText, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Bell, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
  Calendar,
  CreditCard,
  Shield,
  Archive,
  Headphones,
  Search,
  Plus,
  UserCheck,
  TrendingUp
} from 'lucide-react'

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

// Clean, focused navigation structure
const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Overview & insights'
  },
  {
    name: 'Clients',
    href: '/dashboard/clients',
    icon: Users,
    description: 'Manage your clients'
  },
  {
    name: 'Onboarding',
    href: '/dashboard/onboarding',
    icon: UserCheck,
    badge: '2',
    description: 'Client setup process'
  },
  {
    name: 'Contracts',
    href: '/dashboard/contracts',
    icon: FileText,
    badge: 'Soon',
    description: 'Service agreements'
  },
  {
    name: 'Invoices',
    href: '/dashboard/invoices',
    icon: DollarSign,
    badge: 'Soon',
    description: 'Billing & payments'
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: BarChart3,
    badge: 'Soon',
    description: 'Analytics & insights'
  },
  {
    name: 'Compliance',
    href: '/dashboard/compliance',
    icon: Shield,
    badge: 'Soon',
    description: 'HMRC & regulations'
  },
  {
    name: 'Pension Compliance',
    href: '/dashboard/pension-compliance',
    icon: Archive,
    badge: 'Soon',
    description: 'Auto enrollment & TPR'
  },
  {
    name: 'Bureau Benchmarking',
    href: '/dashboard/benchmarking',
    icon: TrendingUp,
    badge: 'Soon',
    description: 'Industry performance data'
  }
]

const quickActions = [
  { name: 'Add Client', icon: Plus, action: 'add-client' }
]

const bottomItems = [
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
  {
    name: 'Support',
    href: '/dashboard/support',
    icon: Headphones,
  }
]

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientSupabaseClient()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const handleNavigation = (href: string, badge?: string) => {
    if (badge === 'Soon') {
      return // Do nothing for coming soon items
    }
    router.push(href)
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-client':
        router.push('/dashboard/clients/add')
        break
      case 'quick-invoice':
        // Handle quick invoice action
        break
    }
  }

  const filteredItems = navigationItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!mounted) {
    return (
      <div className={`${collapsed ? 'w-16' : 'w-72'} h-screen bg-white border-r border-gray-200`}>
        <div className="animate-pulse p-4">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-72'
      } flex flex-col relative`}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: '#401D6C' }}>
              <Building2 className="w-5 h-5 text-white relative z-10" />
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            </div>
            {!collapsed && (
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">ThePayBureau</h1>
                <p className="text-xs text-gray-500 font-medium">Professional Payroll</p>
              </div>
            )}
          </div>
          
          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 h-8 w-8 p-0 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {collapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="absolute -right-3 top-5 bg-white border border-gray-200 shadow-sm text-gray-400 hover:text-gray-600 h-7 w-7 p-0 rounded-full z-10"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        )}

        {/* Search - only when expanded */}
        {!collapsed && (
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions - only when expanded */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.action}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(action.action)}
                  className="flex-1 h-8 text-xs font-medium border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                >
                  <Icon className="w-3.5 h-3.5 mr-1.5" />
                  {action.name}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 py-3 overflow-y-auto">
        <nav className="px-2">
          {filteredItems.map((item) => {
            const isActive = isActiveRoute(item.href)
            const Icon = item.icon
            const isDisabled = item.badge === 'Soon'
            
            return (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <button
                  onClick={() => handleNavigation(item.href, item.badge)}
                  disabled={isDisabled}
                  className={`
                    w-full flex items-center px-3 py-2.5 mb-0.5 rounded-lg text-sm font-medium transition-all duration-200 group
                    ${isActive 
                      ? 'text-white shadow-sm' 
                      : isDisabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                  style={{
                    backgroundColor: isActive ? '#401D6C' : 'transparent'
                  }}
                >
                  <div className={`flex items-center ${collapsed ? '' : 'w-full'}`}>
                    <Icon className={`w-5 h-5 flex-shrink-0 ${collapsed ? '' : 'mr-3'} ${isActive ? 'text-white' : isDisabled ? 'text-gray-400' : 'text-gray-500 group-hover:text-gray-700'}`} />
                    {!collapsed && (
                      <>
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <span className="truncate">{item.name}</span>
                            {item.badge && item.badge !== 'Soon' && (
                              <Badge 
                                variant="secondary" 
                                className="ml-2 h-5 px-2 text-xs text-white border-0"
                                style={{ backgroundColor: '#EC385D' }}
                              >
                                {item.badge}
                              </Badge>
                            )}
                            {item.badge === 'Soon' && (
                              <Badge 
                                variant="outline" 
                                className="ml-2 h-5 px-2 text-xs text-gray-400 border-gray-200 bg-gray-50"
                              >
                                Soon
                              </Badge>
                            )}
                          </div>
                          <div className={`text-xs mt-0.5 truncate ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                            {item.description}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 rounded-r-full opacity-80" style={{ backgroundColor: '#FF8073' }} />
                  )}
                </button>
                
                {/* Tooltip for collapsed state */}
                {collapsed && hoveredItem === item.name && (
                  <div className="absolute left-full top-0 ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 whitespace-nowrap">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-300 mt-0.5">{item.description}</div>
                    {item.badge && (
                      <Badge variant="outline" className="mt-1 text-xs border-gray-600 text-gray-300">
                        {item.badge}
                      </Badge>
                    )}
                    {/* Arrow */}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Bottom section */}
      <div className="p-2 border-t border-gray-100">
        {bottomItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={`
                w-full flex items-center px-3 py-2.5 mb-0.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <Icon className={`w-5 h-5 ${collapsed ? '' : 'mr-3'} flex-shrink-0`} />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </button>
          )
        })}
        
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut className={`w-5 h-5 ${collapsed ? '' : 'mr-3'} flex-shrink-0`} />
          {!collapsed && <span className="truncate">Sign out</span>}
        </button>
        
        {/* Status indicator */}
        {!collapsed && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center text-xs text-gray-500">
              <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#22C55E' }}></div>
              All systems operational
            </div>
            <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">
              v2.1
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}