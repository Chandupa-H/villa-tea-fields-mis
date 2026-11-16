'use client'

import React, { useState } from 'react'
import { Role } from './reservations-view'
import { ArrowRight, Lock, Mail, Zap } from 'lucide-react'

interface LoginScreenProps {
  onLogin: (role: Role, user: { name: string; email: string }) => void
  onBypass: (role?: Role) => void
}

export function LoginScreen({ onLogin, onBypass }: LoginScreenProps) {
  const [email, setEmail] = useState('admin@villateafields.lk')
  const [password, setPassword] = useState('password123')
  const [role, setRole] = useState<Role>('Owner')
  const [error, setError] = useState('')

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.')
      return
    }

    const name = role === 'Owner'
      ? 'Anushka Senanayake'
      : role === 'Manager'
      ? 'Mira Jayasinghe'
      : role === 'Deputy Manager'
      ? 'Ruwan Perera'
      : 'Sewwandi Silva'

    onLogin(role, { name, email })
  }

  return (
    <div className="min-h-screen w-full bg-[#F7F8FA] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-[#E5E9EF] p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <img
            src="/icon.svg"
            alt="Villa Tea Fields Logo"
            className="w-12 h-12 mx-auto mb-3"
          />
          <h1 className="text-xl font-bold text-[#172B4D]">Villa Tea Fields</h1>
          <p className="text-sm text-[#778196] mt-1">Hotel Management System</p>
        </div>

        {/* Prototype Bypass Button (Prominent & Simple) */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => onBypass('Owner')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#27877D] hover:bg-[#1E6E66] text-white font-medium text-sm transition-colors cursor-pointer shadow-xs"
          >
            <Zap size={16} />
            <span>Bypass to Dashboard (Prototype)</span>
            <ArrowRight size={16} />
          </button>
          <p className="text-[11px] text-center text-[#778196] mt-1.5">
            Skip login and directly enter the dashboard for testing.
          </p>
        </div>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E5E9EF]" />
          </div>
          <span className="relative bg-white px-3 text-xs text-[#778196] font-medium uppercase">
            or sign in
          </span>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        {/* Simple Login Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#778196]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@villateafields.lk"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5E9EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27877D] focus:border-transparent text-[#202939]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#778196]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5E9EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27877D] focus:border-transparent text-[#202939]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172B4D] mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-3 py-2 text-sm bg-white border border-[#E5E9EF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#27877D] focus:border-transparent text-[#202939]"
            >
              <option value="Owner">Owner</option>
              <option value="Manager">Manager</option>
              <option value="Deputy Manager">Deputy Manager</option>
              <option value="Housekeeper">Housekeeper</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#172B4D] hover:bg-[#0F1D34] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
