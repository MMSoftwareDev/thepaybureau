import Image from 'next/image'
import { APP_DOMAIN } from '@/lib/domains'

export function FinalCTA() {
  return (
    <section style={{ background: 'var(--mkt-bg)' }}>
      <div className="max-w-[1200px] mx-auto px-5 py-5 md:py-8">
        <div
          className="relative overflow-hidden rounded-2xl md:rounded-3xl flex flex-col items-center py-16 md:py-24 px-5"
          style={{ background: 'linear-gradient(135deg, #2A1145 0%, #401D6C 40%, #5B2D99 70%, #EC385D 100%)' }}
        >
          {/* Logo */}
          <div
            className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white flex items-center justify-center mb-8"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
          >
            <Image src="/logo.png" alt="ThePayBureau" width={56} height={56} className="object-contain w-10 h-10 md:w-14 md:h-14" />
          </div>

          {/* Headline — action-oriented */}
          <h2
            className="text-white font-bold text-[clamp(1.8rem,4vw,3rem)] leading-[1.1] tracking-tight text-center max-w-[560px] mb-4"
            style={{ fontFamily: 'var(--font-display), DM Serif Display, serif' }}
          >
            Stop chasing deadlines.{' '}
            <span className="text-white/80">Start managing them.</span>
          </h2>

          <p
            className="text-white/60 text-base text-center max-w-[420px] mb-8"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Set up in 60 seconds. Free forever for individuals.
          </p>

          {/* CTA */}
          <a
            href={`${APP_DOMAIN}/signup`}
            className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-white font-semibold text-[15px] transition-opacity duration-150 hover:opacity-90"
            style={{ color: '#401D6C', fontFamily: 'var(--font-inter)' }}
          >
            Get Started Free
          </a>

          {/* Risk reversal */}
          <p
            className="mt-4 text-xs text-white/40 text-center"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            No credit card required &bull; No lock-in &bull; Cancel anytime
          </p>
        </div>
      </div>
    </section>
  )
}
