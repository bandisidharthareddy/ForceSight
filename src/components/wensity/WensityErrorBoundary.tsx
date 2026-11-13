'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WensityErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[WensityErrorBoundary:${this.props.componentName || 'Block'}] Error:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="w-full rounded-2xl border border-red-500/30 bg-red-950/20 text-[#F5F2EB] p-6 sm:p-8 font-mono shadow-xl my-4 text-center flex flex-col items-center justify-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-red-200 uppercase tracking-tight font-display">
              Unable to load {this.props.componentName || 'UI Block'}
            </h3>
            <p className="text-xs text-red-300/70 max-w-md mx-auto mt-1">
              {this.state.error?.message || 'An unexpected rendering error occurred inside the photo arc.'}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-4 py-2 rounded-lg bg-red-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 hover:bg-red-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Retry Component</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function WensityBlockSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading hero section"
      className="w-full bg-[#0A0D14] py-16 sm:py-24 border-b border-white/10 animate-pulse font-mono"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        <div className="w-48 h-6 rounded-full bg-white/10" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-3">
            <div className="w-3/4 h-12 bg-white/10 rounded-xl" />
            <div className="w-1/2 h-12 bg-white/10 rounded-xl" />
          </div>
          <div className="lg:col-span-4 space-y-2">
            <div className="w-full h-4 bg-white/10 rounded" />
            <div className="w-5/6 h-4 bg-white/10 rounded" />
            <div className="w-32 h-10 bg-sky-500/20 rounded-full mt-4" />
          </div>
        </div>
        <div className="w-full h-80 bg-white/5 rounded-3xl border border-white/10" />
      </div>
      <span className="sr-only">Loading ForceSight Subsystem Showcase...</span>
    </div>
  );
}
