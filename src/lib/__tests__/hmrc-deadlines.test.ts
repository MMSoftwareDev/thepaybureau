import {
  getTaxMonth,
  calculateNextPayDate,
  calculateRtiDueDate,
  calculateEpsDueDate,
  calculatePayePaymentDate,
  calculatePeriodDates,
  getPayrollStatus,
} from '../hmrc-deadlines'

describe('HMRC Deadline Engine', () => {
  describe('getTaxMonth', () => {
    test('April 10 is tax month 1', () => {
      expect(getTaxMonth(new Date(2026, 3, 10))).toBe(1) // Apr=3
    })
    test('April 5 is tax month 12 (before 6th)', () => {
      expect(getTaxMonth(new Date(2026, 3, 5))).toBe(12)
    })
    test('March 20 is tax month 12', () => {
      expect(getTaxMonth(new Date(2026, 2, 20))).toBe(12)
    })
    test('January 15 is tax month 10', () => {
      expect(getTaxMonth(new Date(2026, 0, 15))).toBe(10)
    })
    test('May 6 is tax month 2', () => {
      expect(getTaxMonth(new Date(2026, 4, 6))).toBe(2)
    })
    test('June 30 is tax month 3', () => {
      expect(getTaxMonth(new Date(2026, 5, 30))).toBe(3)
    })
    test('April 6 is tax month 1', () => {
      expect(getTaxMonth(new Date(2026, 3, 6))).toBe(1)
    })
    test('May 5 is tax month 1 (before 6th, so still April tax month)', () => {
      expect(getTaxMonth(new Date(2026, 4, 5))).toBe(1)
    })
    test('December 25 is tax month 9', () => {
      expect(getTaxMonth(new Date(2026, 11, 25))).toBe(9)
    })
    test('January 5 is tax month 9 (before 6th, belongs to Dec)', () => {
      expect(getTaxMonth(new Date(2026, 0, 5))).toBe(9)
    })
    test('February 6 is tax month 11', () => {
      expect(getTaxMonth(new Date(2026, 1, 6))).toBe(11)
    })
    test('July 15 is tax month 4', () => {
      expect(getTaxMonth(new Date(2026, 6, 15))).toBe(4)
    })
  })

  describe('calculateRtiDueDate', () => {
    test('RTI due date equals pay date', () => {
      const payDate = new Date(2026, 1, 28) // Feb 28
      expect(calculateRtiDueDate(payDate).getTime()).toBe(
        new Date(2026, 1, 28, 0, 0, 0, 0).getTime()
      )
    })
    test('RTI due date for mid-month pay date', () => {
      const payDate = new Date(2026, 5, 15)
      expect(calculateRtiDueDate(payDate).getTime()).toBe(
        new Date(2026, 5, 15, 0, 0, 0, 0).getTime()
      )
    })
  })

  describe('calculateEpsDueDate', () => {
    test('Feb 20 pay date -> EPS due Mar 19', () => {
      const result = calculateEpsDueDate(new Date(2026, 1, 20))
      expect(result.getFullYear()).toBe(2026)
      expect(result.getMonth()).toBe(2) // March
      expect(result.getDate()).toBe(19)
    })
    test('Mar 20 pay date -> EPS due Apr 19', () => {
      const result = calculateEpsDueDate(new Date(2026, 2, 20))
      expect(result.getFullYear()).toBe(2026)
      expect(result.getMonth()).toBe(3) // April
      expect(result.getDate()).toBe(19)
    })
    test('Apr 10 pay date -> EPS due May 19', () => {
      const result = calculateEpsDueDate(new Date(2026, 3, 10))
      expect(result.getFullYear()).toBe(2026)
      expect(result.getMonth()).toBe(4) // May
      expect(result.getDate()).toBe(19)
    })
    test('Dec 28 pay date -> EPS due Jan 19 next year', () => {
      const result = calculateEpsDueDate(new Date(2026, 11, 28))
      expect(result.getFullYear()).toBe(2027)
      expect(result.getMonth()).toBe(0) // January
      expect(result.getDate()).toBe(19)
    })
    test('Jan 15 pay date -> EPS due Feb 19', () => {
      const result = calculateEpsDueDate(new Date(2026, 0, 15))
      expect(result.getFullYear()).toBe(2026)
      expect(result.getMonth()).toBe(1) // February
      expect(result.getDate()).toBe(19)
    })
    test('Nov 20 pay date -> EPS due Dec 19', () => {
      const result = calculateEpsDueDate(new Date(2026, 10, 20))
      expect(result.getFullYear()).toBe(2026)
      expect(result.getMonth()).toBe(11) // December
      expect(result.getDate()).toBe(19)
    })
  })

  describe('calculatePayePaymentDate', () => {
    test('Feb 20 pay date -> PAYE due Mar 22', () => {
      const result = calculatePayePaymentDate(new Date(2026, 1, 20))
      expect(result.getMonth()).toBe(2)
      expect(result.getDate()).toBe(22)
    })
    test('Dec 28 pay date -> PAYE due Jan 22 next year', () => {
      const result = calculatePayePaymentDate(new Date(2026, 11, 28))
      expect(result.getFullYear()).toBe(2027)
      expect(result.getMonth()).toBe(0)
      expect(result.getDate()).toBe(22)
    })
    test('Apr 10 pay date -> PAYE due May 22', () => {
      const result = calculatePayePaymentDate(new Date(2026, 3, 10))
      expect(result.getFullYear()).toBe(2026)
      expect(result.getMonth()).toBe(4)
      expect(result.getDate()).toBe(22)
    })
  })

  describe('calculateNextPayDate', () => {
    test('monthly with day 28 after Jan 15 -> Feb 28', () => {
      const result = calculateNextPayDate('monthly', '28', new Date(2026, 0, 15))
      expect(result.getMonth()).toBe(0) // Jan 28 is after Jan 15
      expect(result.getDate()).toBe(28)
    })
    test('monthly with day 28 after Jan 28 -> Feb 28', () => {
      const result = calculateNextPayDate('monthly', '28', new Date(2026, 0, 28))
      expect(result.getMonth()).toBe(1) // Feb
      expect(result.getDate()).toBe(28)
    })
    test('monthly with day 31 in Feb -> last day of Feb', () => {
      const result = calculateNextPayDate('monthly', '31', new Date(2026, 0, 31))
      // After Jan 31, next "31st" is Feb which only has 28 days
      expect(result.getMonth()).toBe(1)
      expect(result.getDate()).toBe(28)
    })
    test('monthly with last_friday after Jan 1 -> last Friday of Jan', () => {
      const result = calculateNextPayDate('monthly', 'last_friday', new Date(2026, 0, 1))
      expect(result.getMonth()).toBe(0) // Jan
      expect(result.getDay()).toBe(5) // Friday
      // Last Friday of Jan 2026 is Jan 30
      expect(result.getDate()).toBe(30)
    })
    test('monthly with last_friday after Jan 30 -> last Friday of Feb', () => {
      const result = calculateNextPayDate('monthly', 'last_friday', new Date(2026, 0, 30))
      // Jan 30 is the last Friday of Jan, so we need after that
      expect(result.getMonth()).toBe(1) // Feb
      expect(result.getDay()).toBe(5) // Friday
      // Last Friday of Feb 2026 is Feb 27
      expect(result.getDate()).toBe(27)
    })
    test('monthly with last_monday after Mar 1 -> last Monday of Mar', () => {
      const result = calculateNextPayDate('monthly', 'last_monday', new Date(2026, 2, 1))
      expect(result.getMonth()).toBe(2) // March
      expect(result.getDay()).toBe(1) // Monday
      // Last Monday of March 2026 is Mar 30
      expect(result.getDate()).toBe(30)
    })
    test('weekly with friday after Monday Feb 2 -> Friday Feb 6', () => {
      const result = calculateNextPayDate('weekly', 'friday', new Date(2026, 1, 2))
      expect(result.getDay()).toBe(5) // Friday
      expect(result.getDate()).toBe(6)
    })
    test('weekly with friday after Friday Feb 6 -> Friday Feb 13', () => {
      const result = calculateNextPayDate('weekly', 'friday', new Date(2026, 1, 6))
      expect(result.getDay()).toBe(5) // Friday
      expect(result.getDate()).toBe(13)
    })
    test('weekly with monday after Sunday Feb 1 -> Monday Feb 2', () => {
      const result = calculateNextPayDate('weekly', 'monday', new Date(2026, 1, 1))
      expect(result.getDay()).toBe(1) // Monday
      expect(result.getDate()).toBe(2)
    })
    test('fortnightly with friday after Monday Feb 2 -> Friday Feb 6', () => {
      const result = calculateNextPayDate('fortnightly', 'friday', new Date(2026, 1, 2))
      expect(result.getDay()).toBe(5) // Friday
      expect(result.getDate()).toBe(6)
    })
    test('four_weekly with friday after Monday Feb 2 -> Friday Feb 6', () => {
      const result = calculateNextPayDate('four_weekly', 'friday', new Date(2026, 1, 2))
      expect(result.getDay()).toBe(5) // Friday
      expect(result.getDate()).toBe(6)
    })
  })

  describe('calculatePeriodDates', () => {
    test('monthly period covers full month', () => {
      const { periodStart, periodEnd } = calculatePeriodDates(
        'monthly',
        new Date(2026, 1, 28)
      )
      expect(periodStart.getDate()).toBe(1)
      expect(periodStart.getMonth()).toBe(1)
      expect(periodEnd.getDate()).toBe(28) // Feb has 28 days in 2026
      expect(periodEnd.getMonth()).toBe(1)
    })
    test('monthly period for March', () => {
      const { periodStart, periodEnd } = calculatePeriodDates(
        'monthly',
        new Date(2026, 2, 15)
      )
      expect(periodStart.getDate()).toBe(1)
      expect(periodStart.getMonth()).toBe(2)
      expect(periodEnd.getDate()).toBe(31)
      expect(periodEnd.getMonth()).toBe(2)
    })
    test('weekly period is 7 days', () => {
      const { periodStart, periodEnd } = calculatePeriodDates(
        'weekly',
        new Date(2026, 1, 13)
      )
      expect(periodEnd.getDate()).toBe(13)
      expect(periodStart.getDate()).toBe(7) // 13 - 6
    })
    test('fortnightly period is 14 days', () => {
      const { periodStart, periodEnd } = calculatePeriodDates(
        'fortnightly',
        new Date(2026, 1, 27)
      )
      expect(periodEnd.getDate()).toBe(27)
      expect(periodStart.getDate()).toBe(14) // 27 - 13
    })
    test('four_weekly period is 28 days', () => {
      const { periodStart, periodEnd } = calculatePeriodDates(
        'four_weekly',
        new Date(2026, 1, 28)
      )
      expect(periodEnd.getMonth()).toBe(1) // Feb
      expect(periodEnd.getDate()).toBe(28)
      expect(periodStart.getMonth()).toBe(1) // Feb
      expect(periodStart.getDate()).toBe(1) // 28 - 27 = 1
    })
  })

  describe('getPayrollStatus', () => {
    const today = new Date(2026, 1, 25) // Feb 25

    test('all items complete -> complete', () => {
      expect(getPayrollStatus(new Date(2026, 1, 28), 5, 5, today)).toBe('complete')
    })
    test('past due date, incomplete -> overdue', () => {
      expect(getPayrollStatus(new Date(2026, 1, 20), 5, 3, today)).toBe('overdue')
    })
    test('within 5 days, nothing done -> due_soon', () => {
      expect(getPayrollStatus(new Date(2026, 1, 28), 5, 0, today)).toBe('due_soon')
    })
    test('within 5 days, some done -> in_progress', () => {
      expect(getPayrollStatus(new Date(2026, 1, 28), 5, 3, today)).toBe('in_progress')
    })
    test('far future, nothing done -> not_started', () => {
      expect(getPayrollStatus(new Date(2026, 2, 28), 5, 0, today)).toBe('not_started')
    })
    test('far future, some done -> in_progress', () => {
      expect(getPayrollStatus(new Date(2026, 2, 28), 5, 2, today)).toBe('in_progress')
    })
    test('pay date is today, nothing done -> due_soon', () => {
      expect(getPayrollStatus(new Date(2026, 1, 25), 5, 0, today)).toBe('due_soon')
    })
    test('pay date is today, some done -> in_progress', () => {
      expect(getPayrollStatus(new Date(2026, 1, 25), 5, 3, today)).toBe('in_progress')
    })
    test('pay date is today, all done -> complete', () => {
      expect(getPayrollStatus(new Date(2026, 1, 25), 5, 5, today)).toBe('complete')
    })
    test('exactly 5 days away, nothing done -> due_soon', () => {
      expect(getPayrollStatus(new Date(2026, 2, 2), 5, 0, today)).toBe('due_soon')
    })
    test('6 days away, nothing done -> not_started', () => {
      expect(getPayrollStatus(new Date(2026, 2, 3), 5, 0, today)).toBe('not_started')
    })
  })
})
