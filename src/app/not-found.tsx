import Link from 'next/link'

export const metadata = {
  title: '404 — Page Not Found | ThePayBureau',
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4" style={{ background: 'var(--mkt-bg)' }}>
      <div className="text-center max-w-md">
        <h1
          className="text-6xl font-bold font-[family-name:var(--font-display)] mb-4"
          style={{ color: 'var(--mkt-purple)' }}
        >
          404
        </h1>
        <h2
          className="text-2xl font-semibold font-[family-name:var(--font-inter)] mb-4"
          style={{ color: 'var(--mkt-text)' }}
        >
          Page not found
        </h2>
        <p
          className="text-[0.92rem] font-[family-name:var(--font-body)] mb-8"
          style={{ color: 'var(--mkt-text-2)' }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 font-[family-name:var(--font-inter)]"
            style={{ background: 'var(--mkt-purple)' }}
          >
            Go to Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition-colors duration-150 font-[family-name:var(--font-inter)]"
            style={{
              border: '1px solid var(--mkt-purple)',
              color: 'var(--mkt-purple)',
            }}
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
