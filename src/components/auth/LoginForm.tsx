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
    <div className="w-full max-w-md p-8 space-y-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Welcome Back</h1>
        <p className="mt-2 text-sm text-gray-400">Sign in to your POS account</p>
      </div>

      <form action={formAction} className="mt-8 space-y-6">
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Mail className="w-5 h-5 text-gray-500" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              placeholder="Email address"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Lock className="w-5 h-5 text-gray-500" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="block w-full pl-10 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              placeholder="Password"
            />
          </div>
        </div>

        {state?.error && (
          <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg">
            {state.error}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="group relative flex justify-center w-full px-4 py-3 text-sm font-semibold text-black bg-amber-500 rounded-xl hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Sign in'
            )}
          </button>
        </div>
      </form>

      <div className="text-center text-xs text-gray-500">
        <p>© 2024 Coffee POS System. All rights reserved.</p>
      </div>
    </div>
  );
}
