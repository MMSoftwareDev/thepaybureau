// src/app/page.tsx — Marketing landing page
import Link from 'next/link'

const GRAIN_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`

const FEATURES = [
  {
    icon: '📋',
    title: 'Payroll-Specific Checklists',
    desc: 'Pre-built for monthly, weekly, 4-weekly payrolls. Year-end, new starters, leavers — all ready to use.',
  },
  {
    icon: '🔔',
    title: 'HMRC Deadline Intelligence',
    desc: 'Never miss RTI, FPS, EPS deadlines. Auto-calculates based on pay dates and frequencies.',
  },
  {
    icon: '👥',
    title: 'Client Dashboard',
    desc: "See every client's status instantly. Know who's done, in progress, or needs attention.",
  },
  {
    icon: '📊',
    title: 'Manager Reports',
    desc: 'Export professional status reports. Show your efficiency and never miss a deadline.',
  },
  {
    icon: '✅',
    title: 'Auto-Enrolment Tracking',
    desc: 'Track postponement dates, opt-outs, and re-enrolment cycles for every client.',
  },
  {
    icon: '📝',
    title: 'Client Notes',
    desc: "Special pay arrangements, director's NI, irregular patterns — all documented in one place.",
  },
]

const PAIN_POINTS = [
  { icon: '😱', text: "That panic when you can't remember if you submitted RTI for Smith & Co" },
  { icon: '🔥', text: 'Your manager asking for an update whilst you scramble through 15 spreadsheets' },
  { icon: '😰', text: "3am wake-ups wondering if you missed someone's payroll" },
  { icon: '📱', text: 'Getting client calls asking where their payslips are' },
  { icon: '🏃‍♀️', text: 'Racing against HMRC deadlines with no clear overview' },
  { icon: '😵', text: 'Spending hours updating multiple spreadsheets for the same information' },
]

const NEW_REALITY = [
  {
    title: 'Monday Morning',
    subtitle: "See all week's payrolls at a glance",
    desc: 'Know exactly what needs doing and when',
  },
  {
    title: 'Client Calls',
    subtitle: 'Answer their questions in seconds',
    desc: 'Look professional with instant access to their status',
  },
  {
    title: 'Manager Update',
    subtitle: 'Show professional dashboard',
    desc: 'Get complimented on your organisation',
  },
  {
    title: 'Year-End Chaos',
    subtitle: 'Everything already tracked and ready',
    desc: "Whilst others panic, you're already done",
  },
]

const STEPS = [
  { time: '0-30 seconds', title: 'Instant Access to Your Dashboard', desc: 'Clean, professional interface ready to use. No complex setup or training needed.' },
  { time: '30-45 seconds', title: 'Add Your First Client', desc: 'Enter client name, payroll frequency, next pay date. System auto-generates all deadlines.' },
  { time: '45-60 seconds', title: "See Tomorrow's Deadlines", desc: 'Immediately see what needs doing. Start checking off tasks. Feel organised instantly.' },
  { time: 'Next day', title: 'Import All Your Clients', desc: 'Bulk import from your spreadsheet. Watch your entire workload become manageable.' },
]

const TESTIMONIALS = [
  {
    quote: 'Last month, my manager asked for a status update during a client call. I pulled up my dashboard and had the answer in 5 seconds. She was amazed.',
    name: 'Jane Davies',
    detail: '47 clients, Birmingham Bureau',
    initials: 'JD',
  },
  {
    quote: 'Used to wake up at night worrying about RTI deadlines. Now I check my dashboard once in the morning and I\'m done. My stress levels have dropped massively.',
    name: 'Michael Singh',
    detail: '32 clients, London',
    initials: 'MS',
  },
  {
    quote: "Bureau owner asked how I manage 68 clients without missing deadlines. Showed him this tool. Now the whole bureau is switching over and I'm getting the credit!",
    name: 'Rachel Thompson',
    detail: '68 clients, Manchester',
    initials: 'RT',
  },
]

const DASHBOARD_ROWS = [
  { client: 'Miller & Associates', status: 'OVERDUE', statusColor: '#EF4444', due: 'Yesterday!' },
  { client: 'Brighton Care', status: 'DUE SOON', statusColor: '#F59E0B', due: 'Tomorrow' },
  { client: 'Clearview Dental', status: 'PROCESSING', statusColor: '#6366F1', due: 'Today' },
  { client: 'Johnson Engineering', status: 'COMPLETE', statusColor: '#10B981', due: 'Done ✓' },
  { client: 'Thompson Logistics', status: 'ON TRACK', statusColor: '#10B981', due: '31st Jan' },
]

export default function LandingPage() {
  return (
    <div style={{ fontFamily: 'var(--font-body), system-ui, sans-serif', color: '#1a1a2e' }}>
      <style>{`
        .landing-hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .landing-nav-actions { display: flex; align-items: center; gap: 12px; }
        .landing-nav-login { display: inline-block; }
        @media (max-width: 768px) {
          .landing-hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .landing-nav-login { display: none; }
        }
      `}</style>
      {/* ═══ NAVBAR ═══ */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(16px)',
          background: 'rgba(255,255,255,0.88)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #401D6C, #5B2D99)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" width={20} height={20}>
                <path d="M4 4h6v6H4V4z" fill="rgba(255,255,255,0.9)" />
                <path d="M14 4h6v6h-6V4z" fill="rgba(255,255,255,0.5)" />
                <path d="M4 14h6v6H4v-6z" fill="rgba(255,255,255,0.5)" />
                <path d="M14 14h6v6h-6v-6z" fill="rgba(255,255,255,0.3)" />
              </svg>
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#1a1a2e' }}>
              ThePayBureau
            </span>
          </div>
          <div className="landing-nav-actions">
            <Link
              href="/login"
              className="landing-nav-login"
              style={{ fontSize: '0.88rem', fontWeight: 600, color: '#401D6C', textDecoration: 'none', padding: '8px 16px', borderRadius: 8 }}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#fff',
                textDecoration: 'none',
                padding: '10px 22px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #401D6C, #5B2D99)',
              }}
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ SOCIAL PROOF BAR ═══ */}
      <div style={{ background: '#F3F0FF', borderBottom: '1px solid #E9E4F5', padding: '10px 24px', textAlign: 'center', fontSize: '0.82rem', color: '#5B2D99', fontWeight: 500 }}>
        Average setup time: 58 seconds &nbsp;|&nbsp; Zero missed deadlines reported last month &nbsp;|&nbsp; Join 500+ bureau specialists this month
      </div>

      {/* ═══ HERO ═══ */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #fff 0%, #F8F5FF 100%)',
          padding: '80px 24px 60px',
        }}
      >
        <div className="landing-hero-grid" style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Left — copy */}
          <div>
            <div style={{ display: 'inline-block', background: '#F3F0FF', borderRadius: 20, padding: '6px 16px', fontSize: '0.82rem', fontWeight: 600, color: '#5B2D99', marginBottom: 20 }}>
              For Bureau Owners & Specialists
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display), Georgia, serif',
                fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
                lineHeight: 1.15,
                fontWeight: 800,
                color: '#1a1a2e',
                margin: '0 0 24px 0',
              }}
            >
              Never Miss Another{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #5B2D99, #D64C8A)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Payroll Deadline
              </span>
            </h1>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: '#555', maxWidth: 480, margin: '0 0 12px 0' }}>
              &ldquo;My manager asked what system I was using because I haven&apos;t missed a deadline in 3 months. Best career move ever.&rdquo;
            </p>
            <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: 28 }}>
              — Sarah Mitchell, Manchester Bureau (42 clients)
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'grid', gap: 10 }}>
              {[
                'Never miss another HMRC deadline',
                'See all your payrolls in one dashboard',
                'Impress your manager with your organisation',
                'Set up in 60 seconds (seriously)',
                'Free forever for individuals',
              ].map((item) => (
                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.95rem', color: '#333' }}>
                  <span style={{ color: '#10B981', fontSize: '1.1rem' }}>&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #401D6C, #5B2D99)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 24px rgba(91,45,153,0.25)',
              }}
            >
              Start Organising My Payrolls Now
            </Link>
          </div>

          {/* Right — dashboard preview */}
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
              border: '1px solid #eee',
              overflow: 'hidden',
            }}
          >
            {/* Header bar */}
            <div style={{ background: '#F8F5FF', padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a1a2e' }}>Payroll Status Dashboard</span>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#10B981', background: '#ECFDF5', padding: '3px 10px', borderRadius: 10 }}>Live</span>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid #eee' }}>
              {[
                { n: '12', label: 'Complete', color: '#10B981' },
                { n: '3', label: 'In Progress', color: '#6366F1' },
                { n: '2', label: 'Due Soon', color: '#F59E0B' },
                { n: '1', label: 'Overdue', color: '#EF4444' },
              ].map((s) => (
                <div key={s.label} style={{ padding: '14px 16px', textAlign: 'center', borderRight: '1px solid #eee' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.n}</div>
                  <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', padding: '10px 20px', fontSize: '0.7rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #eee' }}>
                <span>Client</span>
                <span>Status</span>
                <span style={{ textAlign: 'right' }}>Due</span>
              </div>
              {DASHBOARD_ROWS.map((row) => (
                <div key={row.client} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', padding: '12px 20px', fontSize: '0.85rem', borderBottom: '1px solid #f5f5f5', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#1a1a2e' }}>{row.client}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: row.statusColor, background: `${row.statusColor}12`, padding: '3px 10px', borderRadius: 6 }}>{row.status}</span>
                  <span style={{ fontSize: '0.82rem', color: '#666', textAlign: 'right' }}>{row.due}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* ═══ PAIN POINTS ═══ */}
      <section style={{ background: '#FAFAFA', padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>The Daily Struggle</p>
          <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>
            Sound Familiar?
          </h2>
          <p style={{ color: '#777', fontSize: '1rem', marginBottom: 48 }}>Every payroll specialist knows these moments of panic...</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {PAIN_POINTS.map((p) => (
              <div
                key={p.text}
                style={{
                  background: '#fff',
                  border: '1px solid #eee',
                  borderRadius: 12,
                  padding: '24px 20px',
                  textAlign: 'left',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>{p.icon}</span>
                <span style={{ fontSize: '0.9rem', color: '#444', lineHeight: 1.5 }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ NEW REALITY ═══ */}
      <section style={{ background: '#fff', padding: '80px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#5B2D99', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Your New Reality</p>
          <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>
            This Could Be Your Day Instead
          </h2>
          <p style={{ color: '#777', fontSize: '1rem', marginBottom: 48 }}>How organised payroll specialists work</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {NEW_REALITY.map((item) => (
              <div
                key={item.title}
                style={{
                  background: '#F8F5FF',
                  borderRadius: 12,
                  padding: '28px 24px',
                  textAlign: 'left',
                }}
              >
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#5B2D99', marginBottom: 8 }}>{item.title}</h3>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>{item.subtitle}</p>
                <p style={{ fontSize: '0.82rem', color: '#777' }}>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Recognition callout */}
          <div
            style={{
              marginTop: 48,
              background: 'linear-gradient(135deg, #401D6C, #5B2D99)',
              borderRadius: 16,
              padding: '40px 32px',
              color: '#fff',
            }}
          >
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 12 }}>
              When Your Manager Sees How Organised You Are...
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.75)', maxWidth: 560, margin: '0 auto 28px', lineHeight: 1.6 }}>
              They&apos;ll want the whole bureau on this system. When that happens, you&apos;ll be recognised as the one who brought positive change.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, maxWidth: 700, margin: '0 auto' }}>
              {[
                { icon: '🏆', text: 'Be seen as a problem-solver' },
                { icon: '📈', text: 'Stand out at performance reviews' },
                { icon: '👀', text: 'Get noticed by senior management' },
                { icon: '🎯', text: 'Handle more clients with less stress' },
              ].map((b) => (
                <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{b.icon}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section style={{ background: '#FAFAFA', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#5B2D99', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Built for Payroll Specialists</p>
          <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>
            Everything You Actually Need
          </h2>
          <p style={{ color: '#777', fontSize: '0.95rem', marginBottom: 48 }}>
            Auto-reminds you about: RTI submissions, P45s, P60s, Auto-enrolment, Re-enrolment, Holiday pay calculations
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  background: '#fff',
                  border: '1px solid #eee',
                  borderRadius: 14,
                  padding: '28px 24px',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: 12 }}>{f.icon}</span>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: '0.88rem', color: '#666', lineHeight: 1.55 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section style={{ background: '#fff', padding: '80px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#5B2D99', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Quick Start</p>
          <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>
            What Happens After You Sign Up
          </h2>
          <p style={{ color: '#777', fontSize: '1rem', marginBottom: 48 }}>Be organised in literally 60 seconds</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                style={{
                  display: 'flex',
                  gap: 24,
                  textAlign: 'left',
                  padding: '28px 0',
                  borderBottom: i < STEPS.length - 1 ? '1px solid #eee' : 'none',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #401D6C, #5B2D99)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1rem',
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#5B2D99', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{step.time}</p>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>{step.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#666', lineHeight: 1.55 }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section style={{ background: '#F8F5FF', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#5B2D99', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Real Stories</p>
          <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, color: '#1a1a2e', marginBottom: 8 }}>
            From Chaos to Control
          </h2>
          <p style={{ color: '#777', fontSize: '1rem', marginBottom: 48 }}>How payroll specialists transformed their work life</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                style={{
                  background: '#fff',
                  borderRadius: 14,
                  padding: '28px 24px',
                  textAlign: 'left',
                  border: '1px solid #eee',
                }}
              >
                <div style={{ fontSize: '2rem', color: '#D4BFF0', marginBottom: 12 }}>&ldquo;</div>
                <p style={{ fontSize: '0.9rem', color: '#444', lineHeight: 1.6, marginBottom: 20 }}>{t.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #5B2D99, #D64C8A)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1a1a2e' }}>{t.name}</p>
                    <p style={{ fontSize: '0.78rem', color: '#888' }}>{t.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #2A1145, #401D6C)',
          padding: '80px 24px',
          textAlign: 'center',
        }}
      >
        {/* Grain */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.1,
            mixBlendMode: 'overlay',
            backgroundImage: GRAIN_TEXTURE,
            backgroundSize: '128px 128px',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 800, color: '#fff', marginBottom: 12 }}>
            Ready to Impress Your Manager?
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', marginBottom: 32, lineHeight: 1.6 }}>
            Join 500+ specialists who&apos;ve already transformed their payroll management
          </p>
          <Link
            href="/signup"
            style={{
              display: 'inline-block',
              padding: '16px 36px',
              borderRadius: 12,
              background: '#fff',
              color: '#401D6C',
              fontSize: '1.05rem',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            }}
          >
            Start Organising My Payrolls Now
          </Link>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginTop: 20 }}>
            60-second setup &nbsp;&bull;&nbsp; No credit card &nbsp;&bull;&nbsp; Free forever for individuals &nbsp;&bull;&nbsp; Professional email required
          </p>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ background: '#1a1a2e', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}>
          <Link href="/terms" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Terms</Link>
          <Link href="/privacy" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Privacy</Link>
          <Link href="/login" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Log in</Link>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>
          &copy; {new Date().getFullYear()} ThePayBureau. Built by payroll specialists, for payroll specialists.
        </p>
      </footer>
    </div>
  )
}
