'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { XIcon } from 'lucide-react'

const snackbarVariants = cva(
  'fixed z-50 w-full max-w-md p-4 rounded-lg shadow-lg transition-all duration-300 ease-in-out',
  {
    variants: {
      variant: {
        default: 'bg-background border border-border text-foreground',
        destructive: 'bg-destructive text-destructive-foreground border border-destructive/50',
        success: 'bg-green-500 text-white border border-green-600',
        warning: 'bg-yellow-500 text-black border border-yellow-600',
      },
      position: {
        'top-left': 'top-4 left-4',
        'top-right': 'top-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
        'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
      },
    },
    defaultVariants: {
      variant: 'default',
      position: 'bottom-right',
    },
  }
)

interface SnackbarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof snackbarVariants> {
  open: boolean
  onOpenChange: (open: boolean) => void
  action?: React.ReactNode
  onAction?: () => void
  duration?: number
  showCloseButton?: boolean
}

const Snackbar = React.forwardRef<HTMLDivElement, SnackbarProps>(
  (
    {
      className,
      variant,
      position,
      open,
      onOpenChange,
      action,
      onAction,
      duration = 5000,
      showCloseButton = true,
      children,
      ...props
    },
    ref
  ) => {
    const timerRef = React.useRef<NodeJS.Timeout | null>(null)

    const clearTimer = React.useCallback(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }, [])

    const startTimer = React.useCallback(() => {
      clearTimer()
      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          onOpenChange(false)
        }, duration)
      }
    }, [duration, onOpenChange, clearTimer])

    React.useEffect(() => {
      if (open) {
        startTimer()
      } else {
        clearTimer()
      }

      return () => clearTimer()
    }, [open, startTimer, clearTimer])

    const handleMouseEnter = () => {
      clearTimer()
    }

    const handleMouseLeave = () => {
      if (open) {
        startTimer()
      }
    }

    if (!open) return null

    return (
      <div
        ref={ref}
        className={cn(snackbarVariants({ variant, position }), className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="alert"
        aria-live="assertive"
        {...props}
      >
        <div className="flex items-start gap-2">
          <div className="flex-1 py-1">{children}</div>
          
          <div className="flex items-center gap-2">
            {action && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-sm font-medium"
                onClick={() => {
                  onAction?.()
                  onOpenChange(false)
                }}
              >
                {action}
              </Button>
            )}
            
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }
)
Snackbar.displayName = 'Snackbar'

export { Snackbar, snackbarVariants }
export type { SnackbarProps }