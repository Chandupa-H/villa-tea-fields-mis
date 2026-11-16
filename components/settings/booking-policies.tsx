'use client'

import React, { useState, useEffect } from 'react'
import {
  Clock, ShieldAlert, Calendar, RefreshCw, AlertTriangle,
  CheckCircle2, RotateCcw, X, Plus, Trash2, Info, Sparkles, Check
} from 'lucide-react'
import { BookingPoliciesState, INITIAL_BOOKING_POLICIES } from './mock-data'

const money = (amount: number) => `LKR ${amount.toLocaleString('en-LK')}`

interface BookingPoliciesProps {
  notify: (msg: string) => void
}

export function BookingPolicies({ notify }: BookingPoliciesProps) {
  // Persistence
  const [policies, setPolicies] = useState<BookingPoliciesState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vtf-settings-booking-policies')
      if (saved) {
        try { return JSON.parse(saved) } catch {}
      }
    }
    return INITIAL_BOOKING_POLICIES
  })

  // Local draft state for editing
  const [draft, setDraft] = useState<BookingPoliciesState>(policies)
  const [newBlackoutInput, setNewBlackoutInput] = useState('')
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  // Track dirty changes
  useEffect(() => {
    setIsDirty(JSON.stringify(draft) !== JSON.stringify(policies))
  }, [draft, policies])

  // Save changes
  const handleSave = () => {
    setPolicies(draft)
    localStorage.setItem('vtf-settings-booking-policies', JSON.stringify(draft))
    setIsDirty(false)
    notify('Booking policies updated and saved to property configuration.')
  }

  // Cancel changes
  const handleCancel = () => {
    setDraft(policies)
    setIsDirty(false)
    notify('Unsaved changes discarded.')
  }

  // Reset to default
  const handleConfirmReset = () => {
    setDraft(INITIAL_BOOKING_POLICIES)
    setPolicies(INITIAL_BOOKING_POLICIES)
    localStorage.setItem('vtf-settings-booking-policies', JSON.stringify(INITIAL_BOOKING_POLICIES))
    setIsDirty(false)
    setIsResetConfirmOpen(false)
    notify('Policies reset to standard Villa Tea Fields defaults.')
  }

  // Add blackout date
  const handleAddBlackout = () => {
    if (newBlackoutInput && !draft.blackoutDates.includes(newBlackoutInput)) {
      setDraft({
        ...draft,
        blackoutDates: [...draft.blackoutDates, newBlackoutInput]
      })
      setNewBlackoutInput('')
    }
  }

  // Remove blackout date
  const handleRemoveBlackout = (date: string) => {
    setDraft({
      ...draft,
      blackoutDates: draft.blackoutDates.filter(d => d !== date)
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E9EF]">
        <div>
          <h2 className="text-lg font-bold text-[#172B4D]">Booking Policies</h2>
          <p className="text-xs text-[#778196] mt-0.5">
            Configure check-in/out schedules, stay restrictions, cancellation grace periods and room turnover buffers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E9EF] bg-white text-[#778196] hover:text-[#172B4D] text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset to Default</span>
          </button>

          {isDirty && (
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E9EF] bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={!isDirty}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
              isDirty
                ? 'bg-[#27877D] hover:bg-[#1E6E66] text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Check size={14} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Grid of Policy Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ============================================================
            SECTION A: CHECK-IN AND CHECK-OUT
            ============================================================ */}
        <section className="bg-white rounded-xl border border-[#E5E9EF] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#E5E9EF]">
            <div className="p-1.5 rounded-lg bg-[#27877D]/10 text-[#27877D]">
              <Clock size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172B4D]">Section A: Check-in & Check-out</h3>
              <p className="text-[11px] text-[#778196]">Standard arrival and departure hours</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Standard Check-in Time</label>
              <input
                type="time"
                value={draft.checkInTime}
                onChange={e => setDraft({ ...draft, checkInTime: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E9EF] rounded-lg text-[#202939]"
              />
              <span className="text-[10px] text-[#778196]">Default: 14:00 (2:00 PM)</span>
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Standard Check-out Time</label>
              <input
                type="time"
                value={draft.checkOutTime}
                onChange={e => setDraft({ ...draft, checkOutTime: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E9EF] rounded-lg text-[#202939]"
              />
              <span className="text-[10px] text-[#778196]">Default: 11:00 (11:00 AM)</span>
            </div>
          </div>

          {/* Early Check-in Switch */}
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E9EF] space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <strong className="block text-[#172B4D]">Offer Early Check-in Option</strong>
                <span className="text-[11px] text-[#778196]">Allows guests to arrive from 10:00 AM if room is ready</span>
              </div>
              <button
                type="button"
                onClick={() => setDraft({ ...draft, earlyCheckInAllowed: !draft.earlyCheckInAllowed })}
                className={`w-9 h-5 rounded-full transition-colors relative inline-flex items-center p-0.5 cursor-pointer ${
                  draft.earlyCheckInAllowed ? 'bg-[#27877D]' : 'bg-slate-300'
                }`}
              >
                <span className={`w-4 h-4 rounded-full bg-white transition-transform ${draft.earlyCheckInAllowed ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            {draft.earlyCheckInAllowed && (
              <div className="pt-2 border-t border-[#E5E9EF] flex items-center justify-between">
                <span className="text-[#172B4D]">Additional Early Check-in Fee:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-semibold">LKR</span>
                  <input
                    type="number"
                    step="500"
                    value={draft.earlyCheckInFee}
                    onChange={e => setDraft({ ...draft, earlyCheckInFee: Number(e.target.value) })}
                    className="w-24 px-2 py-1 text-right bg-white border border-[#E5E9EF] rounded-md font-semibold text-[#172B4D]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Late Check-out Switch */}
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E9EF] space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <strong className="block text-[#172B4D]">Offer Late Check-out Option</strong>
                <span className="text-[11px] text-[#778196]">Allows departure up to 3:00 PM upon villa availability</span>
              </div>
              <button
                type="button"
                onClick={() => setDraft({ ...draft, lateCheckOutAllowed: !draft.lateCheckOutAllowed })}
                className={`w-9 h-5 rounded-full transition-colors relative inline-flex items-center p-0.5 cursor-pointer ${
                  draft.lateCheckOutAllowed ? 'bg-[#27877D]' : 'bg-slate-300'
                }`}
              >
                <span className={`w-4 h-4 rounded-full bg-white transition-transform ${draft.lateCheckOutAllowed ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            {draft.lateCheckOutAllowed && (
              <div className="pt-2 border-t border-[#E5E9EF] flex items-center justify-between">
                <span className="text-[#172B4D]">Additional Late Check-out Fee:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-semibold">LKR</span>
                  <input
                    type="number"
                    step="500"
                    value={draft.lateCheckOutFee}
                    onChange={e => setDraft({ ...draft, lateCheckOutFee: Number(e.target.value) })}
                    className="w-24 px-2 py-1 text-right bg-white border border-[#E5E9EF] rounded-md font-semibold text-[#172B4D]"
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ============================================================
            SECTION B: BOOKING RESTRICTIONS
            ============================================================ */}
        <section className="bg-white rounded-xl border border-[#E5E9EF] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#E5E9EF]">
            <div className="p-1.5 rounded-lg bg-[#172B4D]/10 text-[#172B4D]">
              <ShieldAlert size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172B4D]">Section B: Booking Restrictions</h3>
              <p className="text-[11px] text-[#778196]">Stay duration limits and confirmation requirements</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Minimum Stay (Nights)</label>
              <input
                type="number"
                min={1}
                max={14}
                value={draft.minStayNights}
                onChange={e => setDraft({ ...draft, minStayNights: Number(e.target.value) })}
                className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E9EF] rounded-lg text-[#202939]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Maximum Stay (Nights)</label>
              <input
                type="number"
                min={1}
                max={90}
                value={draft.maxStayNights}
                onChange={e => setDraft({ ...draft, maxStayNights: Number(e.target.value) })}
                className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E9EF] rounded-lg text-[#202939]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Max Advance Booking</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={30}
                  max={730}
                  value={draft.maxAdvanceBookingDays}
                  onChange={e => setDraft({ ...draft, maxAdvanceBookingDays: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
                <span className="text-[11px] text-slate-500 whitespace-nowrap">Days</span>
              </div>
            </div>
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Max Total Guests</label>
              <input
                type="number"
                min={1}
                max={15}
                value={draft.maxGuestOccupancy}
                onChange={e => setDraft({ ...draft, maxGuestOccupancy: Number(e.target.value) })}
                className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E9EF] rounded-lg text-[#202939]"
              />
            </div>
          </div>

          {/* Owner Approval Requirement */}
          <div className="flex items-center justify-between p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E9EF] text-xs">
            <div>
              <strong className="block text-[#172B4D]">Owner Approval Requirement</strong>
              <span className="text-[11px] text-[#778196]">Direct inquiries require owner sign-off before confirmation</span>
            </div>
            <button
              type="button"
              onClick={() => setDraft({ ...draft, requireApproval: !draft.requireApproval })}
              className={`w-9 h-5 rounded-full transition-colors relative inline-flex items-center p-0.5 cursor-pointer ${
                draft.requireApproval ? 'bg-[#27877D]' : 'bg-slate-300'
              }`}
            >
              <span className={`w-4 h-4 rounded-full bg-white transition-transform ${draft.requireApproval ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Date Restrictions / Blackout Dates */}
          <div>
            <label className="block font-semibold text-[#172B4D] text-xs mb-1">Blackout Dates (Closed for Bookings)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="date"
                value={newBlackoutInput}
                onChange={e => setNewBlackoutInput(e.target.value)}
                className="px-2.5 py-1 text-xs border border-[#E5E9EF] rounded-lg text-[#202939]"
              />
              <button
                type="button"
                onClick={handleAddBlackout}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[#172B4D] text-xs font-semibold rounded-lg cursor-pointer"
              >
                Add Date
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {draft.blackoutDates.map(d => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-rose-50 border border-rose-200 text-rose-800"
                >
                  <span>{d}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBlackout(d)}
                    className="hover:text-rose-950 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION C: CANCELLATION POLICIES
            ============================================================ */}
        <section className="bg-white rounded-xl border border-[#E5E9EF] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#E5E9EF]">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-700">
              <Calendar size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172B4D]">Section C: Cancellation Policies</h3>
              <p className="text-[11px] text-[#778196]">Tiered refund deadlines and cancellation charges</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Free Cancellation Window</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={draft.freeCancellationDays}
                  onChange={e => setDraft({ ...draft, freeCancellationDays: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
                <span className="text-[11px] text-slate-500 whitespace-nowrap">Days prior</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Late Cancellation Fee</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.cancellationFeePercent}
                  onChange={e => setDraft({ ...draft, cancellationFeePercent: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
                <span className="text-[11px] text-slate-500">%</span>
              </div>
            </div>
          </div>

          {/* Tiered Policy Preview Card */}
          <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E9EF] space-y-2 text-xs">
            <span className="font-semibold text-[#172B4D] block">Guest Facing Policy Summary:</span>
            <div className="space-y-1.5 text-[11px] text-[#778196]">
              <div className="flex items-center justify-between text-emerald-800">
                <span>• Prior to {draft.freeCancellationDays} days before arrival:</span>
                <strong className="text-emerald-700 font-semibold">100% Refund (Free Cancellation)</strong>
              </div>
              <div className="flex items-center justify-between text-amber-800">
                <span>• Within 3 – {draft.freeCancellationDays} days before arrival:</span>
                <strong className="text-amber-700 font-semibold">{draft.cancellationFeePercent}% Fee ({100 - draft.cancellationFeePercent}% Refund)</strong>
              </div>
              <div className="flex items-center justify-between text-rose-800">
                <span>• Less than 48 hours before check-in or No-Show:</span>
                <strong className="text-rose-700 font-semibold">Non-refundable (100% charged)</strong>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            SECTION D: ROOM TURNOVER & BUFFERS
            ============================================================ */}
        <section className="bg-white rounded-xl border border-[#E5E9EF] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#E5E9EF]">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-700">
              <RefreshCw size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172B4D]">Section D: Room Turnover & Buffers</h3>
              <p className="text-[11px] text-[#778196]">Housekeeping readiness and engineering inspection time</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-[#172B4D]">Cleaning Buffer Duration</label>
                <span className="font-bold text-[#27877D]">{draft.cleaningBufferHours} Hours</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.5"
                value={draft.cleaningBufferHours}
                onChange={e => setDraft({ ...draft, cleaningBufferHours: Number(e.target.value) })}
                className="w-full accent-[#27877D]"
              />
              <span className="text-[10px] text-[#778196]">Time allocated between 11:00 AM checkout and fresh arrival preparation.</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-[#172B4D]">Maintenance Buffer Duration</label>
                <span className="font-bold text-[#27877D]">{draft.maintenanceBufferHours} Hours</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="8.0"
                step="0.5"
                value={draft.maintenanceBufferHours}
                onChange={e => setDraft({ ...draft, maintenanceBufferHours: Number(e.target.value) })}
                className="w-full accent-[#27877D]"
              />
              <span className="text-[10px] text-[#778196]">Time allocated for plumbing, heater inspection or deep cleaning tickets.</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-[#172B4D]">Automatic Gap Between Reservations</label>
                <span className="font-bold text-[#27877D]">{draft.timeBetweenReservationsHours} Hours</span>
              </div>
              <input
                type="range"
                min="0"
                max="6.0"
                step="0.5"
                value={draft.timeBetweenReservationsHours}
                onChange={e => setDraft({ ...draft, timeBetweenReservationsHours: Number(e.target.value) })}
                className="w-full accent-[#27877D]"
              />
              <span className="text-[10px] text-[#778196]">Safety window automatically inserted into the booking calendar.</span>
            </div>
          </div>
        </section>

      </div>

      {/* ==============================================================
          RESET CONFIRMATION DIALOG
          ============================================================== */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-amber-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-base font-bold text-[#172B4D]">Reset to Defaults?</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed mb-4">
              This will reset check-in to 2:00 PM, check-out to 11:00 AM, minimum stay to 1 night, and cancellation grace period to 7 days.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3.5 py-1.5 border border-[#E5E9EF] rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Keep Current
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-3.5 py-1.5 bg-[#172B4D] hover:bg-[#0F1D34] text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
