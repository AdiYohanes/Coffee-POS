"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary catches rendering errors in its child component tree.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div 
            role="alert" 
            className="flex flex-col items-center justify-center p-8 m-4 rounded-xl border border-red-900/50 bg-[#1C161A] text-red-200"
            aria-label="Component error notification"
          >
            <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm text-red-400/80 mb-6 text-center max-w-md">
              An error occurred while rendering this section. Please try refreshing the page.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors focus:ring-2 focus:ring-red-500 focus:outline-none"
              tabIndex={0}
              aria-label="Retry rendering"
            >
              <RefreshCcw className="w-4 h-4" />
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
