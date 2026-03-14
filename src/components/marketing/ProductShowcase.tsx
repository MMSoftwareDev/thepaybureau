import { SectionHeader } from './SectionHeader'
import { MockupWindow } from './MockupWindow'

/* ── Data for mockups ── */

const CLIENT_ROWS = [
  { name: 'Miller & Associates', freq: 'Monthly', employees: 24, nextPay: '28th Mar', status: 'On Track', sColor: '#188038' },
  { name: 'Brighton Care', freq: 'Weekly', employees: 156, nextPay: '14th Mar', status: 'Due Soon', sColor: '#F59E0B' },
  { name: 'Clearview Dental', freq: '4-Weekly', employees: 12, nextPay: '21st Mar', status: 'Processing', sColor: 'var(--mkt-purple-l)' },
]

const DEADLINE_GROUPS = [
  {
    day: 'Today',
    items: [{ time: '11:59 PM', task: 'FPS Submission — Brighton Care', urgency: 'NOW', uColor: '#D93025' }],
  },
  {
    day: 'Tomorrow',
    items: [
      { time: '11:59 PM', task: 'RTI Submission — Miller & Associates', urgency: 'DUE SOON', uColor: '#F59E0B' },
      { time: '11:59 PM', task: 'EPS Submission — Thompson Logistics', urgency: 'DUE SOON', uColor: '#F59E0B' },
    ],
  },
  {
    day: 'Thu 13 Mar',
    items: [{ time: 'All Day', task: 'Pension Declaration — Clearview Dental', urgency: 'SCHEDULED', uColor: 'var(--mkt-purple-l)' }],
  },
  {
    day: 'Fri 14 Mar',
    items: [{ time: '11:59 PM', task: 'FPS Submission — Johnson Engineering', urgency: 'ON TRACK', uColor: '#188038' }],
  },
]

const CHECKLIST_ITEMS = [
  { task: 'Collect timesheets and absence records', done: true },
  { task: 'Process starters (P45 / starter checklist)', done: true },
  { task: 'Process leavers (P45, final pay calculation)', done: true },
  { task: 'Calculate statutory payments (SSP, SMP, SPP)', done: false },
  { task: 'Run payroll calculation and review', done: false },
  { task: 'Submit FPS to HMRC', done: false },
  { task: 'Send payslips to employees', done: false },
  { task: 'Process pension contributions', done: false },
]

/* ── Component ── */

export function ProductShowcase() {
  return (
    <section style={{ background: 'var(--mkt-bg)' }}>
      <div className="max-w-[1200px] mx-auto px-5 py-20 md:py-28 space-y-20 md:space-y-28">
        {/* ── 1. Client Management ── */}
        <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center">
          <div className="md:w-[38%] text-center md:text-left">
            <SectionHeader
              eyebrow="Client Management"
              title="Every client, one view"
              description="Add clients in seconds. Set their payroll frequency, pay date, and pension details. The system auto-generates every deadline and checklist."
              className="mb-0"
            />
          </div>
          <div className="md:w-[62%]">
            <MockupWindow title="Client Management" className="hover-lift">
              <div className="p-5">
                {/* Search bar */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border"
                    style={{ borderColor: 'var(--mkt-border)', background: 'var(--mkt-bg-alt)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--mkt-text-3)" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                    <span className="text-sm" style={{ color: 'var(--mkt-text-3)' }}>Search clients...</span>
                  </div>
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-semibold"
                    style={{ background: 'var(--mkt-purple)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                    Add Client
                  </div>
                </div>
                {/* Client rows */}
                {CLIENT_ROWS.map((c) => (
                  <div key={c.name} className="flex items-center justify-between py-3.5 border-b last:border-b-0" style={{ borderColor: 'color-mix(in srgb, var(--mkt-border) 50%, transparent)' }}>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, var(--mkt-purple), var(--mkt-purple-l))' }}
                      >
                        {c.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--mkt-text)' }}>{c.name}</p>
                        <p className="text-xs" style={{ color: 'var(--mkt-text-3)' }}>{c.freq} &middot; {c.employees} employees</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs hidden sm:inline" style={{ color: 'var(--mkt-text-3)' }}>Next: {c.nextPay}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ color: c.sColor, background: `color-mix(in srgb, ${c.sColor} 10%, transparent)` }}>{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </MockupWindow>
          </div>
        </div>

        {/* Divider */}
        <div className="w-16 h-px mx-auto" style={{ background: 'var(--mkt-border)' }} />

        {/* ── 2. Deadline Tracker ── */}
        <div className="flex flex-col md:flex-row-reverse gap-10 md:gap-16 items-center">
          <div className="md:w-[38%] text-center md:text-left">
            <SectionHeader
              eyebrow="Deadline Tracking"
              title="HMRC deadlines, sorted"
              description="Every RTI, FPS, and EPS deadline auto-calculated from your pay dates. Colour-coded so you never miss a submission."
              className="mb-0"
            />
          </div>
          <div className="md:w-[62%]">
            <MockupWindow title="Upcoming Deadlines" className="hover-lift">
              <div className="p-5">
                {DEADLINE_GROUPS.map((group) => (
                  <div key={group.day} className="mb-4 last:mb-0">
                    <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--mkt-text-3)' }}>{group.day}</div>
                    {group.items.map((item) => (
                      <div
                        key={item.task}
                        className="flex items-center justify-between py-2.5 px-3 rounded-lg mb-1 last:mb-0"
                        style={{ background: 'var(--mkt-bg-alt)' }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.uColor }} />
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--mkt-text)' }}>{item.task}</p>
                            <p className="text-xs" style={{ color: 'var(--mkt-text-3)' }}>{item.time}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded hidden sm:inline" style={{ color: item.uColor, background: `color-mix(in srgb, ${item.uColor} 10%, transparent)` }}>{item.urgency}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </MockupWindow>
          </div>
        </div>

        {/* Divider */}
        <div className="w-16 h-px mx-auto" style={{ background: 'var(--mkt-border)' }} />

        {/* ── 3. Checklists ── */}
        <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center">
          <div className="md:w-[38%] text-center md:text-left">
            <SectionHeader
              eyebrow="Checklists"
              title="Tick off every step"
              description="Pre-built checklists for every payroll cycle. Monthly, weekly, 4-weekly — including year-end, new starters, and leavers."
              className="mb-0"
            />
          </div>
          <div className="md:w-[62%]">
            <MockupWindow title="Payroll Checklist — Miller & Associates" className="hover-lift">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--mkt-text-3)' }}>Monthly Payroll &bull; March 2026</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: 'var(--mkt-border)' }}>
                      <div className="h-full rounded-full" style={{ width: '37.5%', background: 'linear-gradient(90deg, var(--mkt-purple), var(--mkt-purple-l))' }} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: 'var(--mkt-purple-l)' }}>38%</span>
                  </div>
                </div>
                {CHECKLIST_ITEMS.map((item) => (
                  <div key={item.task} className="flex items-center gap-3 py-2.5 border-b last:border-b-0" style={{ borderColor: 'color-mix(in srgb, var(--mkt-border) 50%, transparent)' }}>
                    <div
                      className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0"
                      style={{
                        borderColor: item.done ? '#188038' : 'var(--mkt-border)',
                        background: item.done ? '#188038' : 'transparent',
                      }}
                    >
                      {item.done && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      )}
                    </div>
                    <span
                      className="text-sm"
                      style={{
                        color: item.done ? 'var(--mkt-text-3)' : 'var(--mkt-text)',
                        textDecoration: item.done ? 'line-through' : 'none',
                        fontFamily: 'var(--font-inter)',
                      }}
                    >
                      {item.task}
                    </span>
                  </div>
                ))}
              </div>
            </MockupWindow>
          </div>
        </div>
      </div>
    </section>
  )
}
