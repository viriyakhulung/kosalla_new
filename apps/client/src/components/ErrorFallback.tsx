'use client';

import Link from 'next/link';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 p-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Oops! Something went wrong
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          We encountered an unexpected error. Our team has been notified and we're working to fix it.
        </p>

        {/* Error Details (Dev Only) */}
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-6 p-4 bg-gray-900 rounded-lg text-left overflow-auto max-h-40">
            <p className="text-xs text-red-400 font-mono break-words">
              {error.message}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {/* Retry Button */}
          <button
            onClick={onReset}
            className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </button>

          {/* Home Button */}
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Link>
        </div>

        {/* Support Info */}
        <p className="text-sm text-gray-500 mt-8">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
