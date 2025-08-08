// src/components/layout/Sidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  Building2, 
  Users, 
  FileText, 
  BarChart3, 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  UserCheck,
  Clock,
  Shield,
  TrendingUp,
  Calendar,
  DollarSign,
  Archive,
  Plus
} from 'lucide-react'

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

// Brand Colors matching dashboard
const colors = {
  primary: '#5B3A8E',
  primaryDark: '#472D70',
  primaryLight: '#7B5CAE',
  accent: '#E94B6D',
  accentLight: '#FF6B8A',
  
  success: '#10B981',
  warning: '#F59E0B',
  
  gray50: '#FAFAFA',
  gray100: '#F4F4F5',
  gray200: '#E4E4E7',
  gray300: '#D4D4D8',
  gray400: '#A1A1AA',
  gray500: '#71717A',
  gray600: '#52525B',
  gray700: '#3F3F46',
  gray800: '#27272A',
  gray900: '#18181B',
  
  background: '#FAFBFC',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6'
}

// Navigation structure
const navigationSections = [
  {
    title: 'Overview',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        description: 'Overview & insights'
      }
    ]
  },
  {
    title: 'Client Management',
    items: [
      {
        name: 'Onboarding',
        href: '/onboarding',
        icon: UserCheck,
        description: 'New client setup'
      },
      {
        name: 'Clients',
        href: '/dashboard/clients',
        icon: Users,
        description: 'Manage your clients'
      }
    ]
  },
  {
    title: 'Payroll Operations',
    items: [
      {
        name: 'Payroll Overview',
        href: '/dashboard/payroll-overview',
        icon: Calendar,
        badge: 'Soon',
        description: 'Payroll tracking'
      },
      {
        name: 'Your Payrolls',
        href: '/dashboard/your-payrolls',
        icon: UserCheck,
        badge: 'Soon',
        description: 'Your assigned payrolls'
      },
      {
        name: 'Time Tracking',
        href: '/dashboard/timesheet',
        icon: Clock,
        badge: 'Soon',
        description: 'Track client time'
      }
    ]
  },
  {
    title: 'Business Management',
    items: [
      {
        name: 'Contracts',
        href: '/dashboard/contracts',
        icon: FileText,
        badge: 'Soon',
        description: 'Service agreements'
      },
      {
        name: 'Invoicing',
        href: '/dashboard/invoices',
        icon: DollarSign,
        badge: 'Soon',
        description: 'Billing & payments'
      }
    ]
  },
  {
    title: 'Compliance',
    items: [
      {
        name: 'HMRC Compliance',
        href: '/dashboard/compliance',
        icon: Shield,
        badge: 'Soon',
        description: 'RTI & regulations'
      },
      {
        name: 'Pension Compliance',
        href: '/dashboard/pension-compliance',
        icon: Archive,
        badge: 'Soon',
        description: 'Auto enrollment'
      }
    ]
  },
  {
    title: 'Reporting',
    items: [
      {
        name: 'Reports',
        href: '/dashboard/reports',
        icon: BarChart3,
        badge: 'Soon',
        description: 'Analytics & insights'
      },
      {
        name: 'Bureau Benchmarking',
        href: '/dashboard/benchmarking',
        icon: TrendingUp,
        badge: 'Soon',
        description: 'Industry comparisons'
      }
    ]
  }
]

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const toggleSection = (sectionTitle: string) => {
    const newCollapsedSections = new Set(collapsedSections)
    if (newCollapsedSections.has(sectionTitle)) {
      newCollapsedSections.delete(sectionTitle)
    } else {
      newCollapsedSections.add(sectionTitle)
    }
    setCollapsedSections(newCollapsedSections)
  }

  if (!mounted) {
    return (
      <div 
        className={`${collapsed ? 'w-20' : 'w-64'} transition-all duration-300`}
        style={{
          backgroundColor: colors.surface,
          borderRight: `1px solid ${colors.border}`
        }}
      />
    )
  }

  return (
    <div 
      className={`${collapsed ? 'w-20' : 'w-64'} transition-all duration-300 flex flex-col relative`}
      style={{
        backgroundColor: colors.surface,
        borderRight: `1px solid ${colors.border}`
      }}
    >
      {/* Sidebar Toggle Button */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-all hover:bg-gray-50"
          style={{ 
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`
          }}
        >
          <ChevronRight 
            className={`w-3 h-3 transition-transform ${collapsed ? '' : 'rotate-180'}`}
            style={{ color: colors.gray600 }}
          />
        </button>
      )}
      
      {/* Logo Section */}
      <div className="p-6" style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
        <div className="flex items-center gap-3">
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg relative"
            style={{ 
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
              boxShadow: '0 8px 16px rgba(91, 58, 142, 0.2)'
            }}
          >
            PB
            <span 
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 animate-pulse"
              style={{ 
                backgroundColor: colors.accent,
                borderColor: colors.surface
              }}
            />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold" style={{ color: colors.gray900 }}>
                ThePayBureau
              </h1>
              <p className="text-xs font-medium" style={{ color: colors.gray500 }}>
                Professional Payroll
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Add Button */}
      {!collapsed && (
        <div className="p-4" style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
          <button 
            onClick={() => router.push('/dashboard/clients/add')}
            className="w-full py-2.5 px-3 rounded-lg text-white font-semibold text-sm transition-all hover:shadow-lg flex items-center justify-center gap-2"
            style={{ 
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
            }}
          >
            <Plus className="w-4 h-4" />
            Quick Add Client
          </button>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navigationSections.map((section, sectionIndex) => {
          const isSectionCollapsed = collapsedSections.has(section.title)
          
          return (
            <div key={section.title} className={sectionIndex > 0 ? 'mt-4' : ''}>
              {/* Section Header */}
              {!collapsed && (
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors hover:bg-gray-50"
                  style={{ color: colors.gray400 }}
                >
                  {section.title}
                  <ChevronDown 
                    className={`w-3 h-3 transition-transform ${isSectionCollapsed ? '-rotate-90' : ''}`}
                  />
                </button>
              )}
              
              {/* Section Items */}
              <div className={isSectionCollapsed && !collapsed ? 'hidden' : 'space-y-1 mt-1'}>
                {section.items.map((item) => {
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
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative group
                          ${collapsed ? 'justify-center' : ''}
                          ${isActive ? 'font-semibold' : ''}
                          ${isDisabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'}
                        `}
                        style={{ 
                          backgroundColor: isActive ? 'rgba(91, 58, 142, 0.08)' : 'transparent',
                          color: isActive ? colors.primary : colors.gray700
                        }}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <div 
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                            style={{ backgroundColor: colors.primary }}
                          />
                        )}
                        
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        
                        {!collapsed && (
                          <>
                            <div className="flex-1 text-left">
                              <div className="text-sm">{item.name}</div>
                              {!collapsed && (
                                <div className="text-xs mt-0.5" style={{ color: colors.gray500 }}>
                                  {item.description}
                                </div>
                              )}
                            </div>
                            {item.badge && (
                              <span 
                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ 
                                  backgroundColor: item.badge === 'Soon' ? colors.gray100 : colors.accent,
                                  color: item.badge === 'Soon' ? colors.gray500 : 'white'
                                }}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                      
                      {/* Tooltip for collapsed state */}
                      {collapsed && hoveredItem === item.name && (
                        <div 
                          className="absolute left-full top-0 ml-3 px-3 py-2 rounded-lg shadow-lg z-50 whitespace-nowrap"
                          style={{
                            backgroundColor: colors.gray900,
                            color: 'white'
                          }}
                        >
                          <div className="text-sm font-medium">{item.name}</div>
                          <div className="text-xs opacity-80">{item.description}</div>
                          {item.badge && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-xs" 
                                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                              {item.badge}
                            </span>
                          )}
                          {/* Arrow */}
                          <div 
                            className="absolute right-full top-3 w-0 h-0"
                            style={{ 
                              borderTop: '4px solid transparent',
                              borderBottom: '4px solid transparent',
                              borderRight: `4px solid ${colors.gray900}`
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>
      
      {/* Bottom Status */}
      {!collapsed && (
        <div className="p-4" style={{ borderTop: `1px solid ${colors.borderLight}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs" style={{ color: colors.gray500 }}>
              <div 
                className="w-2 h-2 rounded-full mr-2 animate-pulse"
                style={{ backgroundColor: colors.success }}
              />
              All systems operational
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded" 
                  style={{ 
                    backgroundColor: colors.gray100,
                    color: colors.gray600
                  }}>
              v2.1
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
