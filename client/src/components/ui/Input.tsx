import { cn } from '@/utils/cn'
import { type InputHTMLAttributes, forwardRef } from 'react'
import type { ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
  rightIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-semibold text-[#06192C]/70 uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#40BBB9]">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-[#F4F8F6] border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#06192C] placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-[#40BBB9]/40 focus:border-[#40BBB9]',
              'transition-all duration-150',
              icon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-400 focus:ring-red-200',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
