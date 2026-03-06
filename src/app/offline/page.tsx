import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Offline',
}

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-6">📡</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          You&apos;re offline
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          It looks like you&apos;ve lost your internet connection. Please check your connection and try again.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-[#401D6C] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5B2D99]"
        >
          Try again
        </a>
      </div>
    </div>
  )
}
