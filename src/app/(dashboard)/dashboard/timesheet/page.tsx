'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import {
  Clock,
  Timer,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Save,
  Plus
} from 'lucide-react'

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const weekDates = ['24 Feb', '25 Feb', '26 Feb', '27 Feb', '28 Feb']

const timesheetData = [
  { client: 'Acme Corporation Ltd', hours: [4.0, 3.5, 4.0, 2.0, 3.0], billable: true },
  { client: 'TechStart Industries', hours: [2.0, 1.5, 0, 2.5, 1.0], billable: true },
  { client: 'Regional Health Trust', hours: [0, 2.0, 3.0, 1.5, 0], billable: true },
  { client: 'Greenfield Estates', hours: [1.0, 0, 0.5, 1.0, 0.5], billable: true },
  { client: 'Internal Admin', hours: [1.0, 0.5, 0.5, 1.0, 1.5], billable: false },
]

const summaryStats = [
  { title: 'Total Hours This Week', value: '32.5', icon: Clock, color: '#401D6C', subtitle: 'Target: 37.5' },
  { title: 'Billable Hours', value: '28.0', icon: Timer, color: '#10B981', subtitle: '86% of total' },
  { title: 'Utilization Rate', value: '86%', icon: BarChart3, color: '#EC385D', subtitle: 'Above target (80%)' },
]

export default function TimesheetPage() {
  const [mounted, setMounted] = useState(false)
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null)
  const [localData, setLocalData] = useState(timesheetData)
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-36 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const getRowTotal = (hours: number[]) => hours.reduce((sum, h) => sum + h, 0)
  const getColumnTotal = (colIndex: number) => localData.reduce((sum, row) => sum + row.hours[colIndex], 0)
  const grandTotal = localData.reduce((sum, row) => sum + getRowTotal(row.hours), 0)
  const billableTotal = localData.filter(r => r.billable).reduce((sum, row) => sum + getRowTotal(row.hours), 0)

  const handleCellUpdate = (rowIndex: number, colIndex: number, value: string) => {
    const num = parseFloat(value) || 0
    const newData = [...localData]
    newData[rowIndex] = { ...newData[rowIndex], hours: [...newData[rowIndex].hours] }
    newData[rowIndex].hours[colIndex] = num
    setLocalData(newData)
    setEditingCell(null)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 transition-colors duration-300" style={{ color: colors.text.primary }}>
            Time Tracking
          </h1>
          <p className="text-lg transition-colors duration-300" style={{ color: colors.text.secondary }}>
            Log and manage your weekly hours
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-semibold transition-all duration-300"
            style={{ borderColor: colors.borderElevated, color: colors.text.secondary, backgroundColor: colors.glass.surface }}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous Week
          </Button>
          <Badge
            className="text-sm font-bold px-4 py-2 rounded-xl border-0"
            style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
          >
            24 Feb - 28 Feb 2026
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-semibold transition-all duration-300"
            style={{ borderColor: colors.borderElevated, color: colors.text.secondary, backgroundColor: colors.glass.surface }}
          >
            Next Week
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryStats.map((stat, index) => (
          <Card
            key={index}
            className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] group"
            style={{
              backgroundColor: colors.glass.card,
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: `1px solid ${colors.borderElevated}`,
              boxShadow: isDark ? `0 10px 30px ${colors.shadow.medium}` : `0 10px 25px ${colors.shadow.light}`
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold mb-2 transition-colors duration-300" style={{ color: colors.text.secondary }}>
                    {stat.title}
                  </p>
                  <p className="text-4xl font-bold mb-1 transition-colors duration-300" style={{ color: colors.text.primary }}>
                    {stat.value}
                  </p>
                  <p className="text-xs font-medium" style={{ color: colors.text.muted }}>{stat.subtitle}</p>
                </div>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${stat.color}20`, boxShadow: `0 8px 25px ${stat.color}30` }}
                >
                  <stat.icon className="w-8 h-8" style={{ color: stat.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timesheet Grid */}
      <Card
        className="border-0 shadow-xl transition-all duration-300"
        style={{
          backgroundColor: colors.glass.card,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: `1px solid ${colors.borderElevated}`,
          boxShadow: isDark ? `0 15px 35px ${colors.shadow.medium}` : `0 10px 25px ${colors.shadow.light}`
        }}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold transition-colors duration-300" style={{ color: colors.text.primary }}>
              Weekly Timesheet
            </CardTitle>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl font-semibold transition-all duration-300"
                style={{ borderColor: colors.borderElevated, color: colors.text.secondary, backgroundColor: colors.glass.surface }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Row
              </Button>
              <Button
                size="sm"
                className="rounded-xl font-semibold text-white transition-all duration-300 border-0"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  boxShadow: `0 8px 25px ${colors.primary}30`
                }}
              >
                <Save className="w-4 h-4 mr-1" />
                Save Timesheet
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.borderElevated}` }}>
                  <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: colors.text.muted, minWidth: '200px' }}>
                    Client / Task
                  </th>
                  {weekDays.map((day, i) => (
                    <th key={day} className="text-center py-4 px-3 text-xs font-bold uppercase tracking-wider" style={{ color: colors.text.muted, minWidth: '90px' }}>
                      <div>{day}</div>
                      <div className="text-xs font-medium mt-1" style={{ color: colors.text.muted }}>{weekDates[i]}</div>
                    </th>
                  ))}
                  <th className="text-center py-4 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: colors.text.muted }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {localData.map((row, rowIndex) => (
                  <tr key={rowIndex} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold" style={{ color: colors.text.primary }}>{row.client}</span>
                        {!row.billable && (
                          <Badge className="text-xs font-medium px-2 py-0.5 rounded-full border-0" style={{ backgroundColor: `${colors.text.muted}20`, color: colors.text.muted }}>
                            Non-billable
                          </Badge>
                        )}
                      </div>
                    </td>
                    {row.hours.map((hours, colIndex) => (
                      <td key={colIndex} className="py-3 px-3 text-center">
                        {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="24"
                            defaultValue={hours}
                            autoFocus
                            onBlur={(e) => handleCellUpdate(rowIndex, colIndex, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCellUpdate(rowIndex, colIndex, (e.target as HTMLInputElement).value)
                              if (e.key === 'Escape') setEditingCell(null)
                            }}
                            className="w-16 text-center py-1.5 rounded-lg text-sm font-semibold focus:outline-none"
                            style={{
                              backgroundColor: colors.glass.surface,
                              color: colors.text.primary,
                              border: `2px solid ${colors.primary}`
                            }}
                          />
                        ) : (
                          <button
                            onClick={() => setEditingCell({ row: rowIndex, col: colIndex })}
                            className="w-16 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
                            style={{
                              backgroundColor: hours > 0 ? `${colors.primary}10` : 'transparent',
                              color: hours > 0 ? colors.text.primary : colors.text.muted,
                              border: `1px solid ${hours > 0 ? colors.borderElevated : 'transparent'}`
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.glass.surfaceHover
                              e.currentTarget.style.borderColor = colors.primary
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = hours > 0 ? `${colors.primary}10` : 'transparent'
                              e.currentTarget.style.borderColor = hours > 0 ? colors.borderElevated : 'transparent'
                            }}
                          >
                            {hours > 0 ? hours.toFixed(1) : '-'}
                          </button>
                        )}
                      </td>
                    ))}
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm font-bold" style={{ color: colors.text.primary }}>
                        {getRowTotal(row.hours).toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
                {/* Totals Row */}
                <tr style={{ borderTop: `2px solid ${colors.borderElevated}` }}>
                  <td className="py-4 px-4">
                    <span className="text-sm font-bold" style={{ color: colors.text.primary }}>Daily Totals</span>
                  </td>
                  {weekDays.map((_, colIndex) => (
                    <td key={colIndex} className="py-4 px-3 text-center">
                      <span className="text-sm font-bold" style={{ color: colors.primary }}>
                        {getColumnTotal(colIndex).toFixed(1)}
                      </span>
                    </td>
                  ))}
                  <td className="py-4 px-4 text-center">
                    <Badge
                      className="text-sm font-bold px-3 py-1 rounded-full border-0"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                        color: 'white',
                        boxShadow: `0 4px 15px ${colors.primary}30`
                      }}
                    >
                      {grandTotal.toFixed(1)}
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Utilization Bar */}
          <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: `${colors.text.muted}08` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold" style={{ color: colors.text.secondary }}>
                Weekly Utilization
              </span>
              <span className="text-sm font-bold" style={{ color: colors.text.primary }}>
                {billableTotal.toFixed(1)} / {grandTotal.toFixed(1)} hours billable ({((billableTotal / grandTotal) * 100).toFixed(0)}%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: `${colors.text.muted}20` }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(billableTotal / 37.5) * 100}%`,
                  background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
