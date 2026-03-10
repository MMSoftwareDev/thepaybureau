import { cn } from '@/lib/utils'

type Phase = 'v1' | 'v2' | 'v3' | 'fv'

interface TimelineNode {
  phase: Phase
  label: string
}

interface TimelineRowProps {
  node: TimelineNode
  leftContent: React.ReactNode
  rightContent: React.ReactNode
  isLast?: boolean
}

const nodeStyles: Record<Phase, string> = {
  v1: 'border-[#401D6C] text-[#401D6C]',
  v2: 'border-[#EC385D] text-[#EC385D]',
  v3: 'border-[#FF8073] text-[#b35d54]',
  fv: 'border-[#2B0F4E] text-[#2B0F4E]',
}

function TimelineRow({ node, leftContent, rightContent, isLast }: TimelineRowProps) {
  return (
    <div className={cn('grid grid-cols-[1fr_72px_1fr] items-start relative', !isLast && 'mb-14', 'max-[880px]:grid-cols-1 max-[880px]:gap-0 max-[880px]:mb-8')}>
      {/* Left panel */}
      <div className="pr-9 max-[880px]:pr-0 max-[880px]:pb-4">
        {leftContent}
      </div>

      {/* Node */}
      <div className="flex justify-center pt-6 relative z-[2] max-[880px]:hidden">
        <div
          className={cn(
            'w-14 h-14 rounded-full border-2 bg-white flex items-center justify-center text-[0.62rem] font-extrabold tracking-[0.06em] shadow-[0_2px_16px_rgba(0,0,0,0.08)] transition-[transform,box-shadow] duration-200 hover:scale-110 hover:shadow-[0_6px_24px_rgba(0,0,0,0.14)] select-none',
            nodeStyles[node.phase]
          )}
        >
          {node.label}
        </div>
      </div>

      {/* Right panel */}
      <div className="pl-9 max-[880px]:pl-0">
        {rightContent}
      </div>
    </div>
  )
}

interface TimelineLayoutProps {
  children: React.ReactNode
  className?: string
}

function TimelineLayout({ children, className }: TimelineLayoutProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Central spine */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 -translate-x-1/2 pointer-events-none z-0 max-[880px]:hidden" />
      {children}
    </div>
  )
}

export { TimelineLayout, TimelineRow }
