'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { XIcon } from 'lucide-react'

const chipVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success:
          'border-transparent bg-green-500 text-white hover:bg-green-500/80',
        warning:
          'border-transparent bg-yellow-500 text-black hover:bg-yellow-500/80',
        info:
          'border-transparent bg-blue-500 text-white hover:bg-blue-500/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface ChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {
  onClose?: () => void
  closable?: boolean
}

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({ className, variant, onClose, closable = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('group relative', className)}
        {...props}
      >
        <div className={cn(chipVariants({ variant }), 'flex items-center gap-1')}>
          {children}
          {closable && (
            <button
              onClick={onClose}
              className="ml-1 rounded-full opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="Remove"
            >
              <XIcon className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    )
  }
)
Chip.displayName = 'Chip'

export { Chip, chipVariants }