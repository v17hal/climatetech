import { cn } from '@/utils/cn'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  trend?: number
  icon: ReactNode
  iconBg?: string
  suffix?: string
  className?: string
}

export function StatCard({
  title,
  value,
  trend,
  icon,
  iconBg = 'bg-[#40BBB9]/15',
  suffix,
  className,
}: StatCardProps) {
  const positive = trend !== undefined && trend >= 0

  return (
    <div
      className={cn(
        'bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-[#06192C] mt-1">
            {value}
            {suffix && <span className="text-sm font-semibold text-gray-400 ml-1">{suffix}</span>}
          </p>
        </div>
        <div className={cn('p-3 rounded-xl', iconBg)}>{icon}</div>
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
              positive
                ? 'bg-[#98CF59]/15 text-[#4a7a1e]'
                : 'bg-red-100 text-red-600'
            )}
          >
            {positive ? (
              <TrendingUp size={11} />
            ) : (
              <TrendingDown size={11} />
            )}
            {Math.abs(trend).toFixed(1)}%
          </span>
          <span className="text-xs text-gray-400">vs last month</span>
        </div>
      )}
    </div>
  )
}
