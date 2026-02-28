// src/components/layout/Sidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
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
  Search,
  Plus
} from 'lucide-react'

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

// Updated navigation structure based on your project
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
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

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
        className={`${collapsed ? 'w-20' : 'w-80'} h-screen relative transition-all duration-300`}
        style={{
          backgroundColor: colors.surface,
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="animate-pulse p-6">
          <div 
            className="h-12 rounded-2xl mb-6 shadow-sm"
            style={{ backgroundColor: colors.glass.surface }}
          />
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`h-screen transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-80'
      } flex flex-col relative shadow-2xl`}
      style={{
        backgroundColor: colors.surface,
        backdropFilter: 'blur(20px)',
        borderRight: `1px solid ${colors.borderElevated}`
      }}
    >
      {/* Header */}
      <div className="px-6 py-6 relative z-10">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center">
            {/* Logo */}
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-xl transition-all duration-300"
              style={{ 
                backgroundColor: colors.primary,
                backgroundImage: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                boxShadow: `0 10px 25px ${colors.primary}30`
              }}
            >
              <Building2 className="w-6 h-6 text-white relative z-10" />
            </div>
            {!collapsed && (
              <div className="ml-4">
                <h1 
                  className="text-xl font-bold"
                  style={{ color: colors.text.primary }}
                >
                  ThePayBureau
                </h1>
                <p className="text-sm font-medium" style={{ color: colors.text.muted }}>
                  Professional Payroll
                </p>
              </div>
            )}
          </div>
          
          {!collapsed && onToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-10 w-10 p-0 rounded-xl transition-all duration-200"
              style={{
                color: colors.text.muted,
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.glass.surfaceHover
                e.currentTarget.style.color = colors.text.primary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = colors.text.muted
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {/* Add Client Quick Action */}
        {!collapsed && (
          <div className="mt-6">
            <Button 
              onClick={() => router.push('/dashboard/clients/add')}
              className="w-full text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              style={{ 
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                boxShadow: `0 8px 25px ${colors.primary}30`
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </div>
        )}
        
        {/* Floating Toggle Button for Collapsed State */}
        {collapsed && onToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="absolute -right-4 top-8 h-8 w-8 p-0 rounded-full z-20 transition-all duration-200 hover:scale-110 border shadow-xl"
            style={{ 
              backgroundColor: colors.surface,
              backdropFilter: 'blur(10px)',
              color: colors.text.muted,
              borderColor: colors.borderElevated,
              boxShadow: `0 8px 25px ${colors.primary}15`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = colors.text.primary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = colors.text.muted
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 py-2 overflow-y-auto relative z-10">
        <nav className="px-4">
          {navigationSections.map((section, sectionIndex) => {
            const isSectionCollapsed = collapsedSections.has(section.title)
            
            return (
              <div key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
                {/* Collapsible Section Header */}
                {!collapsed && (
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-3 py-2 mb-3 rounded-lg transition-all duration-200 group"
                    style={{ backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.glass.surfaceHover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <h3 
                      className="text-xs font-bold uppercase tracking-wider transition-colors duration-300"
                      style={{ color: colors.text.muted }}
                    >
                      {section.title}
                    </h3>
                    {isSectionCollapsed ? (
                      <ChevronRight className="w-3 h-3 transition-colors duration-300" style={{ color: colors.text.muted }} />
                    ) : (
                      <ChevronDown className="w-3 h-3 transition-colors duration-300" style={{ color: colors.text.muted }} />
                    )}
                  </button>
                )}
                
                {/* Section Items */}
                {(!collapsed && !isSectionCollapsed) && section.items.map((item) => {
                  const isActive = isActiveRoute(item.href)
                  const Icon = item.icon
                  const isDisabled = item.badge === 'Soon'
                  
                  return (
                    <div
                      key={item.name}
                      className="relative mb-1"
                      onMouseEnter={() => setHoveredItem(item.name)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <button
                        onClick={() => handleNavigation(item.href, item.badge)}
                        disabled={isDisabled}
                        className={`
                          w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden
                          ${isActive 
                            ? 'text-white shadow-xl transform scale-[1.02]' 
                            : isDisabled
                            ? 'cursor-not-allowed'
                            : 'hover:shadow-lg hover:scale-[1.01]'
                          }
                        `}
                        style={{
                          backgroundColor: isActive 
                            ? colors.primary
                            : 'transparent',
                          backgroundImage: isActive 
                            ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                            : 'none',
                          color: isActive 
                            ? 'white' 
                            : isDisabled 
                            ? colors.text.muted 
                            : colors.text.secondary,
                          boxShadow: isActive ? `0 10px 25px ${colors.primary}30` : 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive && !isDisabled) {
                            e.currentTarget.style.backgroundColor = colors.glass.surfaceHover
                            e.currentTarget.style.color = colors.text.primary
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive && !isDisabled) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.color = colors.text.secondary
                          }
                        }}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0 mr-3 transition-colors duration-200" />
                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between">
                            <span className="truncate font-semibold">{item.name}</span>
                            {item.badge && item.badge !== 'Soon' && (
                              <Badge 
                                className="ml-2 h-6 px-3 text-xs font-bold text-white border-0 rounded-full shadow-sm"
                                style={{ 
                                  backgroundColor: colors.secondary,
                                  boxShadow: `0 4px 15px ${colors.secondary}30`
                                }}
                              >
                                {item.badge}
                              </Badge>
                            )}
                            {item.badge === 'Soon' && (
                              <Badge 
                                variant="outline" 
                                className="ml-2 h-6 px-3 text-xs font-medium rounded-full"
                                style={{ 
                                  color: colors.text.muted,
                                  borderColor: colors.border,
                                  backgroundColor: colors.glass.surfaceActive
                                }}
                              >
                                Soon
                              </Badge>
                            )}
                          </div>
                          <div className={`text-xs mt-1 truncate font-medium ${
                            isActive ? 'text-white/80' : 'opacity-70'
                          }`}>
                            {item.description}
                          </div>
                        </div>
                        
                        {/* Active indicator */}
                        {isActive && (
                          <div 
                            className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1.5 h-8 rounded-r-full shadow-sm"
                            style={{ backgroundColor: colors.accent }}
                          />
                        )}
                      </button>
                    </div>
                  )
                })}

                {/* Collapsed state icons */}
                {collapsed && section.items.map((item) => {
                  const isActive = isActiveRoute(item.href)
                  const Icon = item.icon
                  const isDisabled = item.badge === 'Soon'
                  
                  return (
                    <div
                      key={item.name}
                      className="relative mb-1"
                      onMouseEnter={() => setHoveredItem(item.name)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <button
                        onClick={() => handleNavigation(item.href, item.badge)}
                        disabled={isDisabled}
                        className={`
                          w-full flex items-center justify-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden
                          ${isActive 
                            ? 'text-white shadow-xl transform scale-[1.02]' 
                            : isDisabled
                            ? 'cursor-not-allowed'
                            : 'hover:shadow-lg hover:scale-[1.01]'
                          }
                        `}
                        style={{
                          backgroundColor: isActive 
                            ? colors.primary
                            : 'transparent',
                          backgroundImage: isActive 
                            ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`
                            : 'none',
                          color: isActive 
                            ? 'white' 
                            : isDisabled 
                            ? colors.text.muted 
                            : colors.text.secondary,
                          boxShadow: isActive ? `0 10px 25px ${colors.primary}30` : 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive && !isDisabled) {
                            e.currentTarget.style.backgroundColor = colors.glass.surfaceHover
                            e.currentTarget.style.color = colors.text.primary
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive && !isDisabled) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                            e.currentTarget.style.color = colors.text.secondary
                          }
                        }}
                      >
                        <Icon className="w-5 h-5 transition-colors duration-200" />
                        
                        {/* Active indicator for collapsed */}
                        {isActive && (
                          <div 
                            className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1.5 h-8 rounded-r-full shadow-sm"
                            style={{ backgroundColor: colors.accent }}
                          />
                        )}
                      </button>
                      
                      {/* Enhanced Tooltip for collapsed state */}
                      {hoveredItem === item.name && (
                        <div 
                          className="absolute left-full top-0 ml-3 px-4 py-3 text-white text-sm rounded-xl shadow-2xl z-50 whitespace-nowrap transition-all duration-200"
                          style={{
                            backgroundColor: colors.text.primary,
                            backdropFilter: 'blur(10px)',
                            boxShadow: `0 20px 40px ${colors.primary}40`
                          }}
                        >
                          <div className="font-semibold">{item.name}</div>
                          <div className="text-xs text-white/70 mt-1 font-medium">{item.description}</div>
                          {item.badge && (
                            <Badge 
                              variant="outline" 
                              className="mt-2 text-xs text-white/60 border-white/30"
                              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                            >
                              {item.badge}
                            </Badge>
                          )}
                          {/* Arrow */}
                          <div 
                            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 w-3 h-3 rotate-45"
                            style={{ 
                              backgroundColor: colors.text.primary
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Bottom Status */}
      <div className="p-4 relative z-10">
        {!collapsed && (
          <div 
            className="flex items-center justify-between mt-6 pt-4 rounded-xl p-3 transition-all duration-300"
            style={{
              borderTop: `1px solid ${colors.borderElevated}`,
              backgroundColor: colors.glass.surfaceHover,
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center text-xs font-medium" 
                 style={{ color: colors.text.muted }}>
              <div 
                className="w-2.5 h-2.5 rounded-full mr-2 shadow-sm animate-pulse"
                style={{ backgroundColor: colors.success }}
              />
              All systems operational
            </div>
            <Badge 
              variant="outline" 
              className="text-xs font-medium shadow-sm"
              style={{ 
                color: colors.text.muted,
                borderColor: colors.border,
                backgroundColor: colors.glass.surfaceActive
              }}
            >
              v2.1
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}