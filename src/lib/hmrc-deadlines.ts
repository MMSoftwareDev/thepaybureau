import {
  addMonths,
  subDays,
  getDay,
  lastDayOfMonth,
  setDate,
  isBefore,
  differenceInDays,
  startOfDay,
} from 'date-fns'

export type PayFrequency = 'weekly' | 'fortnightly' | 'four_weekly' | 'monthly'
export type PayrollStatus =
  | 'not_started'
  | 'in_progress'
  | 'complete'
  | 'overdue'
  | 'due_soon'

/**
 * Returns the HMRC tax month number (1-12).
 *
 * Tax month 1 = 6 Apr - 5 May
 * Tax month 2 = 6 May - 5 Jun
 * ...
 * Tax month 12 = 6 Mar - 5 Apr
 *
 * Logic: If the day >= 6, the tax month maps from the calendar month.
 * If the day < 6, it belongs to the previous calendar month's tax month.
 */
export function getTaxMonth(date: Date): number {
  const month = date.getMonth() // 0-based (0=Jan, 3=Apr)
  const day = date.getDate()

  // If day < 6, treat as previous calendar month
  const effectiveMonth = day >= 6 ? month : (month - 1 + 12) % 12

  // Tax month 1 starts in April (month index 3)
  // April(3)→1, May(4)→2, ..., Dec(11)→9, Jan(0)→10, Feb(1)→11, Mar(2)→12
  const taxMonth = ((effectiveMonth - 3 + 12) % 12) + 1
  return taxMonth
}

/**
 * Map a day name string to date-fns day number (0=Sunday, 1=Monday, ..., 6=Saturday).
 */
function dayNameToNumber(dayName: string): number {
  const map: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }
  return map[dayName.toLowerCase()]
}

/**
 * Find the last occurrence of a given weekday in a specific month/year.
 */
function getLastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const last = lastDayOfMonth(new Date(year, month, 1))
  const lastDay = getDay(last) // 0=Sun, 6=Sat
  let diff = lastDay - weekday
  if (diff < 0) diff += 7
  return subDays(last, diff)
}

/**
 * Calculate the next pay date that falls AFTER afterDate.
 *
 * - monthly with numeric payDay: The payDay-th of the next month after afterDate.
 *   If payDay > days in month, use last day of month.
 * - monthly with "last_monday", "last_friday", etc.: Find the last occurrence
 *   of that weekday in the next month after afterDate.
 * - weekly with day name: Next occurrence of that weekday after afterDate.
 * - fortnightly / four_weekly: Same as weekly (simplified for MVP).
 */
export function calculateNextPayDate(
  frequency: PayFrequency,
  payDay: string,
  afterDate: Date
): Date {
  const after = startOfDay(afterDate)

  if (frequency === 'monthly') {
    // Check for "last_xxx" pattern
    if (payDay.startsWith('last_')) {
      const dayName = payDay.replace('last_', '')
      const weekday = dayNameToNumber(dayName)

      // Try the current month first
      const currentMonthResult = getLastWeekdayOfMonth(
        after.getFullYear(),
        after.getMonth(),
        weekday
      )
      if (currentMonthResult.getTime() > after.getTime()) {
        return currentMonthResult
      }

      // Otherwise, try next month
      const nextMonth = addMonths(after, 1)
      return getLastWeekdayOfMonth(nextMonth.getFullYear(), nextMonth.getMonth(), weekday)
    }

    // Numeric payDay
    const numericDay = parseInt(payDay, 10)

    // Try current month first
    const currentMonthLast = lastDayOfMonth(new Date(after.getFullYear(), after.getMonth(), 1))
    const currentMonthDay = Math.min(numericDay, currentMonthLast.getDate())
    const currentMonthCandidate = setDate(
      new Date(after.getFullYear(), after.getMonth(), 1),
      currentMonthDay
    )

    if (startOfDay(currentMonthCandidate).getTime() > after.getTime()) {
      return startOfDay(currentMonthCandidate)
    }

    // Next month
    const nextMonth = addMonths(new Date(after.getFullYear(), after.getMonth(), 1), 1)
    const nextMonthLast = lastDayOfMonth(nextMonth)
    const nextMonthDay = Math.min(numericDay, nextMonthLast.getDate())
    return startOfDay(setDate(nextMonth, nextMonthDay))
  }

  // weekly, fortnightly, four_weekly — find next occurrence of that weekday after afterDate
  const targetWeekday = dayNameToNumber(payDay)
  const afterWeekday = getDay(after)

  let daysUntil = targetWeekday - afterWeekday
  if (daysUntil <= 0) {
    daysUntil += 7
  }

  const nextDate = new Date(after)
  nextDate.setDate(nextDate.getDate() + daysUntil)
  return startOfDay(nextDate)
}

/**
 * RTI FPS must be submitted on or before the pay date.
 * Returns the pay date itself.
 */
export function calculateRtiDueDate(payDate: Date): Date {
  return startOfDay(payDate)
}

/**
 * Given a tax month number (1-12), return the calendar month index (0-11)
 * and year of the month FOLLOWING that tax month.
 *
 * Tax month N spans from 6th of its start calendar month to 5th of the next.
 * The "following month" is the calendar month after the tax month ends.
 *
 * Tax month 1 = 6 Apr - 5 May → following month = June (index 5)
 * Tax month 9 = 6 Dec - 5 Jan → following month = February? No...
 *
 * Actually the spec says:
 *   Tax month 11 (6 Feb - 5 Mar) → following = March
 *   Tax month 12 (6 Mar - 5 Apr) → following = April
 *   Tax month 1 (6 Apr - 5 May) → following = May
 *   Tax month 9 (6 Dec - 5 Jan) → following = January
 *
 * Tax month N starts at calendar month (N + 3 - 1) % 12 = (N + 2) % 12
 *   N=1 → (3) % 12 = 3 (Apr) ✓
 *   N=9 → (11) % 12 = 11 (Dec) ✓
 *   N=12 → (14) % 12 = 2 (Mar) ✓
 *
 * Tax month N ends on 5th of calendar month ((N + 3) % 12)
 *   N=1 → 4 (May) → 5 May ✓
 *   N=9 → 0 (Jan) → 5 Jan ✓
 *   N=12 → 3 (Apr) → 5 Apr ✓
 *
 * "Following month" = the calendar month where the tax month ends:
 *   calendar month index = (N + 3) % 12
 *   N=11 → (14) % 12 = 2 (Mar) ✓
 *   N=12 → (15) % 12 = 3 (Apr) ✓
 *   N=1 → (4) % 12 = 4 (May) ✓
 *   N=9 → (12) % 12 = 0 (Jan) ✓
 */
function getFollowingMonthAfterTaxMonth(
  taxMonth: number,
  payDate: Date
): { year: number; month: number } {
  // The "following month" calendar month index
  const followingMonthIndex = (taxMonth + 3) % 12

  // Determine the year: If the following month index wraps around (is less than
  // the pay date's month), it's in the next year.
  let year = payDate.getFullYear()

  // For tax month 9 (Dec-Jan), 10 (Jan-Feb), 11 (Feb-Mar), 12 (Mar-Apr):
  // If the pay date is in December but the following month is January, year advances.
  // More precisely: if the following month index < the payDate's month index
  // AND the payDate is on or after the 6th (in the current tax month), the following
  // month is in the next calendar year.
  if (followingMonthIndex < payDate.getMonth()) {
    year += 1
  }
  // Edge case: payDate month = 0 (Jan) with day < 6 → tax month is 9 (Dec-Jan),
  // following month = 0 (Jan), same year.
  // followingMonthIndex (0) is NOT < payDate.getMonth() (0), so no year bump. Correct.

  // Edge case: payDate in Dec, day >= 6 → tax month 9, following = Jan next year.
  // followingMonthIndex (0) < payDate.getMonth() (11) → year + 1. Correct.

  return { year, month: followingMonthIndex }
}

/**
 * EPS is due by the 19th of the month following the tax month that contains the pay date.
 */
export function calculateEpsDueDate(payDate: Date): Date {
  const taxMonth = getTaxMonth(payDate)
  const { year, month } = getFollowingMonthAfterTaxMonth(taxMonth, payDate)
  return new Date(year, month, 19)
}

/**
 * PAYE payment due by 22nd of month following the tax month (electronic payment).
 * Same logic as EPS but 22nd instead of 19th.
 */
export function calculatePayePaymentDate(payDate: Date): Date {
  const taxMonth = getTaxMonth(payDate)
  const { year, month } = getFollowingMonthAfterTaxMonth(taxMonth, payDate)
  return new Date(year, month, 22)
}

/**
 * Calculate the period start and end dates for a given pay frequency and pay date.
 *
 * - monthly: periodStart = 1st of pay date's month, periodEnd = last day of pay date's month
 * - weekly: periodEnd = payDate, periodStart = payDate - 6 days
 * - fortnightly: periodEnd = payDate, periodStart = payDate - 13 days
 * - four_weekly: periodEnd = payDate, periodStart = payDate - 27 days
 */
export function calculatePeriodDates(
  frequency: PayFrequency,
  payDate: Date
): { periodStart: Date; periodEnd: Date } {
  const pd = startOfDay(payDate)

  if (frequency === 'monthly') {
    const periodStart = new Date(pd.getFullYear(), pd.getMonth(), 1)
    const periodEnd = lastDayOfMonth(pd)
    return { periodStart, periodEnd }
  }

  const daysBack: Record<string, number> = {
    weekly: 6,
    fortnightly: 13,
    four_weekly: 27,
  }

  const periodEnd = pd
  const periodStart = subDays(pd, daysBack[frequency])
  return { periodStart, periodEnd }
}

/**
 * Determine the status of a payroll run.
 *
 * - complete: all items done
 * - overdue: past pay date with incomplete items
 * - due_soon: within 5 days, nothing started
 * - in_progress: within 5 days with some items done, or some items done regardless
 * - not_started: otherwise
 */
export function getPayrollStatus(
  payDate: Date,
  totalItems: number,
  completedItems: number,
  today?: Date
): PayrollStatus {
  const todayNorm = startOfDay(today ?? new Date())
  const payDateNorm = startOfDay(payDate)

  // All items complete
  if (totalItems > 0 && completedItems === totalItems) {
    return 'complete'
  }

  // Past due date, not all complete
  if (isBefore(payDateNorm, todayNorm) && completedItems < totalItems) {
    return 'overdue'
  }

  const daysUntil = differenceInDays(payDateNorm, todayNorm)

  // Within 5 days, nothing done
  if (daysUntil <= 5 && completedItems === 0) {
    return 'due_soon'
  }

  // Within 5 days, some done
  if (daysUntil <= 5 && completedItems > 0) {
    return 'in_progress'
  }

  // Some items done (but more than 5 days away)
  if (completedItems > 0 && completedItems < totalItems) {
    return 'in_progress'
  }

  return 'not_started'
}
