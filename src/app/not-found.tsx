import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-[#401D6C] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Page not found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-[#401D6C] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5B2D99]"
          >
            Go to Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-[#401D6C] px-6 py-3 text-sm font-semibold text-[#401D6C] transition-colors hover:bg-[#F8F5FF]"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
