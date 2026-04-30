'use client';

import { useActionState } from 'react';
import { loginAction } from '@/actions/auth';
import { Loader2, Mail, Lock } from 'lucide-react';

const initialState = {
  success: false,
  error: '',
};

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome Back</h1>
        <p className="mt-2 text-sm text-gray-500">Sign in to your Coffee POS account</p>
      </div>

      <form action={formAction} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Mail className="w-5 h-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              placeholder="Email address"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Lock className="w-5 h-5 text-muted" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="block w-full pl-10 pr-3 py-3 bg-surface border border-border rounded-lg text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              placeholder="Password"
            />
          </div>
        </div>

        {state?.error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
            {state.error}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="group relative flex justify-center w-full px-4 py-3 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-amber-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Sign in'
            )}
          </button>
        </div>
      </form>

      <div className="text-center text-xs text-muted">
        <p>© 2026 Coffee POS System. All rights reserved.</p>
      </div>
    </div>
  );
}
