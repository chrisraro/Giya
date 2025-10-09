'use client'

import * as React from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface BreadcrumbProps extends React.ComponentProps<'nav'> {
  children: React.ReactNode
  separator?: React.ReactNode
}

interface BreadcrumbItemProps extends React.ComponentProps<'li'> {
  children: React.ReactNode
  href?: string
  isCurrent?: boolean
}

interface BreadcrumbLinkProps extends React.ComponentProps<typeof Link> {
  children: React.ReactNode
  isCurrent?: boolean
}

const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ children, separator, className, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        aria-label="breadcrumb"
        className={cn('flex items-center text-sm', className)}
        {...props}
      >
        <ol className="flex flex-wrap items-center gap-1.5 break-words text-muted-foreground sm:gap-2.5">
          {React.Children.map(children, (child, index) => {
            if (!React.isValidElement(child)) return child
            
            // Add separator between items except for the last one
            const isLast = index === React.Children.count(children) - 1
            return (
              <>
                {React.cloneElement(child as React.ReactElement<any>, {
                  separator: isLast ? null : separator || <ChevronRight className="h-4 w-4" />,
                })}
              </>
            )
          })}
        </ol>
      </nav>
    )
  }
)
Breadcrumb.displayName = 'Breadcrumb'

const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentProps<'ol'>>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn(
        'flex flex-wrap items-center gap-1.5 break-words text-muted-foreground sm:gap-2.5',
        className
      )}
      {...props}
    />
  )
)
BreadcrumbList.displayName = 'BreadcrumbList'

const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ children, href, isCurrent, className, ...props }, ref) => {
    return (
      <li
        ref={ref}
        className={cn('inline-flex items-center gap-1.5', className)}
        {...props}
      >
        {href && !isCurrent ? (
          <BreadcrumbLink href={href}>{children}</BreadcrumbLink>
        ) : (
          <span 
            className={cn(
              'font-normal text-foreground', 
              isCurrent && 'font-semibold'
            )}
          >
            {children}
          </span>
        )}
      </li>
    )
  }
)
BreadcrumbItem.displayName = 'BreadcrumbItem'

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  BreadcrumbLinkProps
>(({ children, isCurrent, className, ...props }, ref) => {
  return (
    <Link
      ref={ref}
      aria-current={isCurrent ? 'page' : undefined}
      className={cn(
        'transition-colors hover:text-foreground',
        isCurrent && 'pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </Link>
  )
})
BreadcrumbLink.displayName = 'BreadcrumbLink'

const BreadcrumbSeparator = React.forwardRef<
  SVGSVGElement,
  React.ComponentProps<typeof ChevronRight>
>(({ className, ...props }, ref) => (
  <ChevronRight
    ref={ref}
    className={cn('h-4 w-4', className)}
    {...props}
  />
))
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator'

const BreadcrumbEllipsis = React.forwardRef<
  HTMLSpanElement,
  React.ComponentProps<'span'>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="presentation"
    aria-hidden="true"
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <span className="text-sm">...</span>
    <span className="sr-only">More</span>
  </span>
))
BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis'

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}