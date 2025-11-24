"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UniversalForceRefreshFix() {
  const router = useRouter();
  
  useEffect(() => {
    // Global click handler for ALL navigation
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Intercept ALL navigation elements
      const linkElement = target.closest('a[href]');
      const buttonWithHref = target.closest('button[data-href]');
      const forceRefreshElement = target.closest('[data-force-refresh]');
      
      const isNavigation = linkElement || buttonWithHref || forceRefreshElement;
      if (isNavigation && linkElement) {
        const href = linkElement.getAttribute('href') || '';
        
        // Skip external links and anchors
        if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
          // Special handling for dashboard navigation to prevent the removeChild error
          if (href.includes('/dashboard/')) {
            event.preventDefault();
            // Only log in development environment
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 Universal navigation forcing refresh to:', href);
            }
            window.location.href = href;
          }
        }
      }
    };
    
    // Also intercept router.push globally for dashboard routes
    const originalPush = router.push;
    router.push = (href: string, options?: any) => {
      if (typeof href === 'string' && href.includes('/dashboard/') && !href.startsWith('http')) {
        // Only log in development environment
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Router.push intercepted, forcing refresh:', href);
        }
        window.location.href = href;
        return;
      }
      return originalPush(href, options);
    };
    
    // Use capture phase to intercept before other handlers
    document.addEventListener('click', handleClick, true);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
      // Restore original router.push if component unmounts
      router.push = originalPush;
    };
  }, [router]);
  
  return null;
}