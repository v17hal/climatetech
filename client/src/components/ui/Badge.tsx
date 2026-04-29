import { cn } from '@/utils/cn'
import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'green' | 'cyan' | 'blue' | 'orange' | 'red' | 'gray'
  className?: string
}

const variants = {
  green: 'bg-[#98CF59]/15 text-[#4a7a1e]',
  cyan: 'bg-[#40BBB9]/15 text-[#1e7a79]',
  blue: 'bg-[#336599]/15 text-[#336599]',
  orange: 'bg-orange-100 text-orange-700',
  red: 'bg-red-100 text-red-700',
  gray: 'bg-gray-100 text-gray-600',
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
