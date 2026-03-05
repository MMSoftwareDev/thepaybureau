'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center h-64 px-4">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
          An error occurred loading this page.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-lg bg-[#401D6C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5B2D99]"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
