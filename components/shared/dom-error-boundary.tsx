"use client";

import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class DomErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's the specific removeChild error
    if (error.message?.includes('removeChild') || error.name === 'NotFoundError') {
      // Only log in development environment
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔧 DOM Error caught by boundary, recovering...', error.message);
      }
      return { hasError: true, error };
    }
    
    // Let other errors bubble up
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only log in development environment
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 DOM Error Boundary caught error:', error, errorInfo);
    }
    
    // Auto-recovery after a brief delay
    setTimeout(() => {
      this.setState({ hasError: false });
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ DOM Error Boundary recovered');
      }
    }, 100);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-foreground">Loading...</div>
        </div>
      );
    }
    return this.props.children;
  }
}