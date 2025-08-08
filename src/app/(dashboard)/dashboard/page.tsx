// src/app/(dashboard)/dashboard/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { 
  Building2, 
  Users, 
  FileText, 
  Plus, 
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Hash,
  Shield,
  AlertTriangle,
  MoreVertical,
  Download,
  Sparkles,
  X,
  Command,
  Calendar,
  BarChart3,
  CreditCard,
  UserPlus,
  FileSearch,
  PlayCircle
} from 'lucide-react'

// Brand Colors
const colors = {
  primary: '#5B3A8E',
  primaryDark: '#472D70',
  primaryLight: '#7B5CAE',
  accent: '#E94B6D',
  accentLight: '#FF6B8A',
  accentMuted: '#FFA599',
  
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
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

// Sample data
const dashboardData = {
  revenue: 45847,
  revenueChange: 12.5,
  clients: 247,
  clientsChange: 8,
  payslips: 8432,
  payslipsChange: 15.3,
  avgPricePerPayslip: 5.50,
  avgPricePerPayslipChange: 2.1,
  avgFeePerPayroll: 87.70,
  avgFeePerPayrollChange: 3.5,
  accuracyScore: 97.8,
  accuracyScoreChange: 1.2,
  sparklineRevenue: [20, 24, 22, 28, 26, 30, 28, 34, 32, 38, 36, 42, 40, 45],
  sparklineClients: [200, 205, 210, 215, 220, 225, 230, 235, 240, 245, 247],
  sparklinePayslips: [7200, 7400, 7600, 7500, 7800, 8000, 8100, 8200, 8300, 8432],
  sparklineAvgPrice: [5.20, 5.25, 5.30, 5.35, 5.40, 5.45, 5.48, 5.50],
  sparklineAvgFee: [82, 83, 84, 85, 86, 86.5, 87, 87.70],
  sparklineAccuracy: [96.2, 96.5, 96.8, 97.0, 97.2, 97.4, 97.6, 97.8],
  
  recentActivity: [
    { id: 1, type: 'client', title: 'Acme Corp onboarded', time: '2 minutes ago', status: 'success' },
    { id: 2, type: 'payroll', title: 'Payroll run completed for TechStart', time: '15 minutes ago', status: 'success' },
    { id: 3, type: 'alert', title: 'Contract renewal needed - Regional Health', time: '1 hour ago', status: 'warning' },
    { id: 4, type: 'invoice', title: 'Invoice #1234 sent to BuildCo', time: '2 hours ago', status: 'success' }
  ]
}

// Command Palette Component
const CommandPalette = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])
  
  const commands = [
    { icon: Plus, title: 'Add New Client', desc: 'Create a new client profile', shortcut: '⌘N' },
    { icon: BarChart3, title: 'Generate Report', desc: 'Create monthly payroll report', shortcut: null },
    { icon: Search, title: 'Search Clients', desc: 'Find specific client records', shortcut: null },
    { icon: PlayCircle, title: 'Process Payroll', desc: 'Start a new payroll run', shortcut: '⌘P' }
  ]
  
  const filteredCommands = commands.filter(cmd => 
    cmd.title.toLowerCase().includes(search.toLowerCase()) ||
    cmd.desc.toLowerCase().includes(search.toLowerCase())
  )
  
  if (!isOpen) return null
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={onClose}
      />
      
      {/* Command Palette */}
      <div 
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] max-w-[90vw] z-[9999] rounded-2xl shadow-2xl border"
        style={{ 
          backgroundColor: colors.surface,
          borderColor: colors.border,
          animation: 'slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div className="p-5 border-b" style={{ borderColor: colors.border }}>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for clients, actions, or help..."
            className="w-full px-4 py-3 rounded-lg text-sm outline-none"
            style={{ 
              backgroundColor: colors.gray50,
              border: `1px solid ${colors.border}`,
              color: colors.gray900
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
            }}
          />
        </div>
        
        <div className="max-h-[400px] overflow-y-auto p-2">
          {filteredCommands.map((cmd, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-gray-50"
              onClick={onClose}
            >
              <div 
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{ backgroundColor: colors.gray100 }}
              >
                <cmd.icon className="w-4 h-4" style={{ color: colors.gray600 }} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: colors.gray900 }}>
                  {cmd.title}
                </div>
                <div className="text-xs" style={{ color: colors.gray500 }}>
                  {cmd.desc}
                </div>
              </div>
              {cmd.shortcut && (
                <span 
                  className="px-2 py-1 rounded text-xs font-semibold"
                  style={{ 
                    backgroundColor: colors.gray100,
                    color: colors.gray600
                  }}
                >
                  {cmd.shortcut}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

// AI Assistant Component
const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false)
  
  const suggestions = [
    'Analyze revenue trends',
    'Suggest client optimizations',
    'Forecast next month',
    'Find inefficiencies'
  ]
  
  return (
    <div className="fixed bottom-6 right-6 z-[1000]">
      {/* AI Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full text-white shadow-lg transition-all hover:scale-105 relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
          boxShadow: '0 8px 24px rgba(91, 58, 142, 0.3)'
        }}
      >
        <Shield className="w-6 h-6 relative z-10" />
        <div 
          className="absolute inset-0 animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)'
          }}
        />
      </button>
      
      {/* AI Chat */}
      {isOpen && (
        <div 
          className="absolute bottom-16 right-0 w-[380px] h-[500px] rounded-2xl shadow-xl border flex flex-col"
          style={{ 
            backgroundColor: colors.surface,
            borderColor: colors.border
          }}
        >
          <div 
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: colors.border }}
          >
            <span className="text-sm font-semibold" style={{ color: colors.gray900 }}>
              AI Assistant
            </span>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 flex flex-wrap gap-2">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                className="px-3 py-2 rounded-full text-xs transition-all hover:text-white"
                style={{ 
                  backgroundColor: colors.gray50,
                  border: `1px solid ${colors.border}`,
                  color: colors.gray700
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary
                  e.currentTarget.style.borderColor = colors.primary
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.gray50
                  e.currentTarget.style.borderColor = colors.border
                  e.currentTarget.style.color = colors.gray700
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Sparkline Component
const Sparkline = ({ data, color, className = '' }: { data: number[]; color: string; className?: string }) => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 80
  const height = 32
  
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(' ')
  
  const areaPoints = `0,${height} ${points} ${width},${height}`
  
  return (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%' }}>
      <polygon 
        points={areaPoints} 
        fill={color}
        opacity="0.1"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Enhanced Metric Card
const MetricCard = ({ icon: Icon, label, sublabel, value, change, sparklineData, primary = false }: {
  icon: any;
  label: string;
  sublabel: string;
  value: string | number;
  change: number;
  sparklineData: number[];
  primary?: boolean;
}) => {
  const isPositive = change > 0
  const TrendIcon = isPositive ? TrendingUp : TrendingDown
  
  return (
    <div 
      className="relative rounded-xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer overflow-hidden group"
      style={{
        backgroundColor: colors.surface,
        border: primary ? `2px solid ${colors.border}` : `1px solid ${colors.border}`
      }}
    >
      {/* Top gradient bar on hover */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ 
          background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent})`
        }}
      />
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Icon className="w-4 h-4" style={{ color: colors.gray600 }} />
            <div className="text-sm font-semibold" style={{ color: colors.gray900 }}>
              {label}
            </div>
          </div>
          <div className="text-xs" style={{ color: colors.gray500 }}>
            {sublabel}
          </div>
        </div>
        <button className="p-1 rounded hover:bg-gray-50 transition-colors opacity-0 group-hover:opacity-100">
          <MoreVertical className="w-4 h-4" style={{ color: colors.gray400 }} />
        </button>
      </div>
      
      <div className="text-3xl font-bold mb-4" style={{ color: colors.gray900 }}>
        {value}
      </div>
      
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          <TrendIcon className="w-4 h-4" />
          <span>{isPositive ? '+' : ''}{change}%</span>
          <span className="text-xs font-normal" style={{ color: colors.gray500 }}>
            vs last month
          </span>
        </div>
        <div className="w-20 h-8">
          <Sparkline 
            data={sparklineData} 
            color={isPositive ? colors.success : colors.error}
          />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('allactivity')
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Command Palette */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />
      
      {/* AI Assistant */}
      <AIAssistant />
      
      {/* Dashboard Content */}
      <div className="p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: colors.gray900 }}>
              Dashboard Overview
            </h1>
            <p className="text-base" style={{ color: colors.gray500 }}>
              Welcome back! Your payroll operations are running smoothly.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:bg-gray-50"
              style={{ 
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                color: colors.gray700
              }}
            >
              <Calendar className="w-4 h-4" />
              Last 30 days
              <ChevronDown className="w-4 h-4" />
            </button>
            
            <button 
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all hover:bg-gray-50"
              style={{ 
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                color: colors.gray700
              }}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
        
        {/* AI Insights Bar */}
        <div 
          className="relative rounded-xl p-5 mb-8 text-white overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`
          }}
        >
          {/* Pattern overlay */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
          />
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium opacity-90 mb-1">
                <Sparkles className="w-4 h-4" />
                AI Insight
              </div>
              <div className="text-base font-semibold">
                Your revenue has grown 23% this quarter. Consider expanding your team to maintain service quality.
              </div>
            </div>
            <button 
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/30"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}
            >
              View Analysis
            </button>
          </div>
        </div>
        
        {/* Primary Metrics */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <MetricCard
            icon={DollarSign}
            label="Total Revenue"
            sublabel="Current month earnings"
            value={`£${dashboardData.revenue.toLocaleString()}`}
            change={dashboardData.revenueChange}
            sparklineData={dashboardData.sparklineRevenue}
            primary={true}
          />
          <MetricCard
            icon={Users}
            label="Active Clients"
            sublabel="Currently managed"
            value={dashboardData.clients}
            change={dashboardData.clientsChange}
            sparklineData={dashboardData.sparklineClients}
            primary={true}
          />
          <MetricCard
            icon={FileText}
            label="Payslips Processed"
            sublabel="This month"
            value={dashboardData.payslips.toLocaleString()}
            change={dashboardData.payslipsChange}
            sparklineData={dashboardData.sparklinePayslips}
            primary={true}
          />
          <MetricCard
            icon={CreditCard}
            label="Price per Payslip"
            sublabel="Average charge"
            value={`£${dashboardData.avgPricePerPayslip.toFixed(2)}`}
            change={dashboardData.avgPricePerPayslipChange}
            sparklineData={dashboardData.sparklineAvgPrice}
            primary={true}
          />
          <MetricCard
            icon={BarChart3}
            label="Fee per Payroll Run"
            sublabel="Average earnings"
            value={`£${dashboardData.avgFeePerPayroll.toFixed(2)}`}
            change={dashboardData.avgFeePerPayrollChange}
            sparklineData={dashboardData.sparklineAvgFee}
            primary={true}
          />
          <MetricCard
            icon={Shield}
            label="Payroll Accuracy"
            sublabel="Error-free rate"
            value={`${dashboardData.accuracyScore}%`}
            change={dashboardData.accuracyScoreChange}
            sparklineData={dashboardData.sparklineAccuracy}
            primary={true}
          />
        </div>
        
        {/* Activity Section */}
        <div 
          className="rounded-xl overflow-hidden"
          style={{ 
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`
          }}
        >
          <div 
            className="flex items-center justify-between p-5 border-b"
            style={{ borderColor: colors.border }}
          >
            <div className="flex items-center gap-6">
              <div className="flex gap-6">
                {['All Activity', 'Payrolls', 'Clients', 'Alerts'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase().replace(' ', ''))}
                    className={`text-sm font-medium pb-5 -mb-5 relative transition-colors ${
                      activeTab === tab.toLowerCase().replace(' ', '') 
                        ? '' 
                        : 'hover:text-gray-700'
                    }`}
                    style={{ 
                      color: activeTab === tab.toLowerCase().replace(' ', '') 
                        ? colors.gray900 
                        : colors.gray500
                    }}
                  >
                    {tab}
                    {activeTab === tab.toLowerCase().replace(' ', '') && (
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: colors.primary }}
                      />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.success }} />
                <span className="text-xs font-semibold" style={{ color: colors.success }}>Live</span>
              </div>
            </div>
            
            <button 
              className="text-sm font-medium transition-colors hover:text-purple-700"
              style={{ color: colors.primary }}
            >
              View all →
            </button>
          </div>
          
          <div className="p-4 space-y-2">
            {dashboardData.recentActivity.map((activity) => (
              <div 
                key={activity.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: colors.gray100 }}
                >
                  {activity.type === 'client' && <UserPlus className="w-5 h-5" style={{ color: colors.success }} />}
                  {activity.type === 'payroll' && <PlayCircle className="w-5 h-5" style={{ color: colors.info }} />}
                  {activity.type === 'alert' && <AlertTriangle className="w-5 h-5" style={{ color: colors.warning }} />}
                  {activity.type === 'invoice' && <CreditCard className="w-5 h-5" style={{ color: colors.primary }} />}
                </div>
                
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: colors.gray900 }}>
                    {activity.title}
                  </p>
                  <p className="text-xs" style={{ color: colors.gray500 }}>
                    {activity.time}
                  </p>
                </div>
                
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{ 
                    backgroundColor: activity.status === 'success' ? `${colors.success}20` : `${colors.warning}20`,
                    color: activity.status === 'success' ? colors.success : colors.warning
                  }}
                >
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
