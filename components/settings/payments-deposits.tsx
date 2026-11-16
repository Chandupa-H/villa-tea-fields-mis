'use client'

import React, { useState, useEffect } from 'react'
import {
  CreditCard, Wallet, ShieldCheck, ArrowRight, Check,
  AlertCircle, Building, DollarSign, Clock, Search, Filter,
  Settings, CheckCircle2, RotateCcw, X, Edit2
} from 'lucide-react'
import {
  PaymentMethodConfig, PaymentTransactionRecord,
  INITIAL_PAYMENT_METHODS, INITIAL_PAYMENT_TRANSACTIONS
} from './mock-data'

const money = (amount: number) => `LKR ${amount.toLocaleString('en-LK')}`

const METHOD_STATUS_BADGES: Record<string, string> = {
  Enabled: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Disabled: 'bg-slate-100 text-slate-500 border-slate-200',
  'Demo Mode': 'bg-amber-50 text-amber-700 border-amber-200'
}

const TXN_STATUS_BADGES: Record<string, string> = {
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Pending Verification': 'bg-amber-50 text-amber-700 border-amber-200',
  Refunded: 'bg-rose-50 text-rose-700 border-rose-200'
}

interface PaymentsDepositsProps {
  notify: (msg: string) => void
}

export function PaymentsDeposits({ notify }: PaymentsDepositsProps) {
  // Persistence for payment methods
  const [methods, setMethods] = useState<PaymentMethodConfig[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vtf-settings-payment-methods')
      if (saved) {
        try { return JSON.parse(saved) } catch {}
      }
    }
    return INITIAL_PAYMENT_METHODS
  })

  // Advance Payments Config
  const [advanceType, setAdvanceType] = useState<'percentage' | 'fixed'>('percentage')
  const [advanceValue, setAdvanceValue] = useState(50)
  const [advanceDeadlineHours, setAdvanceDeadlineHours] = useState(48)

  // Security Deposit Config
  const [depositAmount, setDepositAmount] = useState(15000)
  const [depositType, setDepositType] = useState<'per_stay' | 'per_room'>('per_stay')
  const [depositRefundable, setDepositRefundable] = useState(true)
  const [depositCollection, setDepositCollection] = useState('Credit Card Pre-authorization or Cash upon Check-in')

  // Refund Policy Config
  const [refundEligibility, setRefundEligibility] = useState('Eligible if cancelled 7+ days prior to arrival')
  const [refundPercentage, setRefundPercentage] = useState(80)
  const [refundProcessingDays, setRefundProcessingDays] = useState(5)
  const [requireOwnerApproval, setRequireOwnerApproval] = useState(true)

  // Transactions list
  const [transactions, setTransactions] = useState<PaymentTransactionRecord[]>(INITIAL_PAYMENT_TRANSACTIONS)
  const [txnSearch, setTxnSearch] = useState('')
  const [txnMethodFilter, setTxnMethodFilter] = useState('All')
  const [txnStatusFilter, setTxnStatusFilter] = useState('All')

  // Modal for editing payment method details
  const [editingMethod, setEditingMethod] = useState<PaymentMethodConfig | null>(null)

  useEffect(() => {
    localStorage.setItem('vtf-settings-payment-methods', JSON.stringify(methods))
  }, [methods])

  // Toggle method active switch
  const handleToggleMethod = (id: string) => {
    setMethods(prev => prev.map(m => {
      if (m.id === id) {
        const nextEnabled = !m.enabled
        const nextStatus = nextEnabled ? (m.id === 'cash' ? 'Demo Mode' : 'Enabled') : 'Disabled'
        notify(`${m.name} is now ${nextStatus}.`)
        return { ...m, enabled: nextEnabled, status: nextStatus }
      }
      return m
    }))
  }

  // Save changes
  const handleSaveAll = () => {
    localStorage.setItem('vtf-settings-payment-methods', JSON.stringify(methods))
    notify('Payment configurations, deposit rules & refund parameters saved.')
  }

  // Filtered transactions
  const filteredTxns = transactions.filter(t => {
    const matchesQuery = t.guestName.toLowerCase().includes(txnSearch.toLowerCase()) ||
      t.bookingRef.toLowerCase().includes(txnSearch.toLowerCase()) ||
      t.id.toLowerCase().includes(txnSearch.toLowerCase())
    const matchesMethod = txnMethodFilter === 'All' || t.method === txnMethodFilter
    const matchesStatus = txnStatusFilter === 'All' || t.status === txnStatusFilter
    return matchesQuery && matchesMethod && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Top Header & Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E9EF]">
        <div>
          <h2 className="text-lg font-bold text-[#172B4D]">Payments & Deposits</h2>
          <p className="text-xs text-[#778196] mt-0.5">
            Configure payment gateways, advance deposit thresholds, security guarantee and refund approvals in LKR.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#27877D] hover:bg-[#1E6E66] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Check size={14} />
          <span>Save Payment Settings</span>
        </button>
      </div>

      {/* ==============================================================
          SECTION A: PAYMENT METHODS CARDS
          ============================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#172B4D]">Section A: Payment Methods</h3>
            <p className="text-xs text-[#778196]">Enable or switch operational modes for guest payment channels.</p>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            Frontend Mock Sandbox
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {methods.map(method => (
            <div
              key={method.id}
              className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                method.enabled ? 'border-[#E5E9EF]' : 'border-slate-200 opacity-70 bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${METHOD_STATUS_BADGES[method.status]}`}>
                    {method.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleMethod(method.id)}
                    className={`w-9 h-5 rounded-full transition-colors relative inline-flex items-center p-0.5 cursor-pointer ${
                      method.enabled ? 'bg-[#27877D]' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white transition-transform ${method.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>

                <h4 className="text-sm font-bold text-[#172B4D] mb-0.5">{method.name}</h4>
                <p className="text-[11px] font-medium text-[#27877D] mb-2">{method.provider}</p>
                <p className="text-xs text-[#778196] leading-relaxed mb-3">{method.description}</p>
              </div>

              <div className="pt-2 border-t border-[#E5E9EF] flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#778196]">Currency: <b>LKR</b></span>
                <button
                  onClick={() => setEditingMethod(method)}
                  className="inline-flex items-center gap-1 text-[#172B4D] hover:text-[#27877D] font-semibold cursor-pointer"
                >
                  <Edit2 size={12} />
                  <span>Configure</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==============================================================
          SECTIONS B, C, D: ADVANCE PAYMENTS, DEPOSITS & REFUNDS
          ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* SECTION B: ADVANCE PAYMENTS */}
        <div className="bg-white rounded-xl border border-[#E5E9EF] p-5 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E5E9EF]">
            <div className="p-1.5 rounded-lg bg-[#27877D]/10 text-[#27877D]">
              <Wallet size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172B4D]">Section B: Advance Payments</h3>
              <p className="text-[11px] text-[#778196]">Required guarantee deposit</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Advance Payment Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdvanceType('percentage')}
                  className={`py-1.5 rounded-lg border text-center font-semibold cursor-pointer ${
                    advanceType === 'percentage'
                      ? 'bg-[#27877D] text-white border-[#27877D]'
                      : 'bg-[#F8FAFC] text-slate-600 border-[#E5E9EF]'
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => setAdvanceType('fixed')}
                  className={`py-1.5 rounded-lg border text-center font-semibold cursor-pointer ${
                    advanceType === 'fixed'
                      ? 'bg-[#27877D] text-white border-[#27877D]'
                      : 'bg-[#F8FAFC] text-slate-600 border-[#E5E9EF]'
                  }`}
                >
                  Fixed (LKR)
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">
                Advance Value {advanceType === 'percentage' ? '(%)' : '(LKR)'}
              </label>
              <input
                type="number"
                min={advanceType === 'percentage' ? 10 : 5000}
                max={advanceType === 'percentage' ? 100 : 200000}
                step={advanceType === 'percentage' ? 5 : 5000}
                value={advanceValue}
                onChange={e => setAdvanceValue(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E9EF] rounded-lg text-[#202939]"
              />
              <span className="text-[10px] text-[#778196]">
                {advanceType === 'percentage' ? '50% recommended for boutique villas' : 'Fixed amount deducted from total folio'}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Payment Submission Deadline</label>
              <select
                value={advanceDeadlineHours}
                onChange={e => setAdvanceDeadlineHours(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E9EF] rounded-lg text-[#202939]"
              >
                <option value={24}>24 Hours from booking</option>
                <option value={48}>48 Hours from booking (Standard)</option>
                <option value={72}>72 Hours from booking</option>
                <option value={168}>7 Days before arrival</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION C: SECURITY DEPOSITS */}
        <div className="bg-white rounded-xl border border-[#E5E9EF] p-5 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E5E9EF]">
            <div className="p-1.5 rounded-lg bg-[#172B4D]/10 text-[#172B4D]">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172B4D]">Section C: Security Deposits</h3>
              <p className="text-[11px] text-[#778196]">Incidental & damage guarantee</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Deposit Amount (LKR)</label>
              <input
                type="number"
                min={0}
                step={2500}
                value={depositAmount}
                onChange={e => setDepositAmount(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E9EF] rounded-lg text-[#202939]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Application Scope</label>
              <select
                value={depositType}
                onChange={e => setDepositType(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E9EF] rounded-lg text-[#202939]"
              >
                <option value="per_stay">Per Reservation / Stay (Standard)</option>
                <option value="per_room">Per Room / Night</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Refundability Status</label>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC] border border-[#E5E9EF]">
                <span className="text-[#172B4D] font-medium">100% Refundable upon inspection</span>
                <input
                  type="checkbox"
                  checked={depositRefundable}
                  onChange={e => setDepositRefundable(e.target.checked)}
                  className="rounded text-[#27877D] focus:ring-[#27877D]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Collection Requirement</label>
              <input
                type="text"
                value={depositCollection}
                onChange={e => setDepositCollection(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E9EF] rounded-lg text-[#202939]"
              />
            </div>
          </div>
        </div>

        {/* SECTION D: REFUND POLICIES */}
        <div className="bg-white rounded-xl border border-[#E5E9EF] p-5 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E5E9EF]">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-700">
              <RotateCcw size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172B4D]">Section D: Refund Policies</h3>
              <p className="text-[11px] text-[#778196]">Processing times & owner reviews</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#172B4D] mb-1">Eligibility Criteria</label>
              <input
                type="text"
                value={refundEligibility}
                onChange={e => setRefundEligibility(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E9EF] rounded-lg text-[#202939]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Standard Refund %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={refundPercentage}
                  onChange={e => setRefundPercentage(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Turnaround Days</label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={refundProcessingDays}
                  onChange={e => setRefundProcessingDays(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-[#F8FAFC] border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-[#172B4D]">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireOwnerApproval}
                  onChange={e => setRequireOwnerApproval(e.target.checked)}
                  className="mt-0.5 rounded text-[#27877D] focus:ring-[#27877D]"
                />
                <div>
                  <strong className="block text-[11px] font-bold text-[#172B4D]">
                    Mandatory Owner Approval
                  </strong>
                  <span className="text-[10px] text-[#778196]">
                    Managers cannot disburse bank refunds without Anushka Senanayake&apos;s authorization.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

      </div>

      {/* ==============================================================
          SECTION E: PAYMENT HISTORY (MOCK TRANSACTIONS IN LKR)
          ============================================================== */}
      <section className="bg-white rounded-xl border border-[#E5E9EF] shadow-xs overflow-hidden space-y-3 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#172B4D]">Section E: Payment Transaction Records</h3>
            <p className="text-xs text-[#778196]">Recent payments and verified bank transfer slips (Amounts in LKR).</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#778196]" />
              <input
                type="text"
                placeholder="Search guest or TXN..."
                value={txnSearch}
                onChange={e => setTxnSearch(e.target.value)}
                className="pl-8 pr-2.5 py-1 text-xs border border-[#E5E9EF] rounded-lg text-[#202939]"
              />
            </div>

            <select
              value={txnMethodFilter}
              onChange={e => setTxnMethodFilter(e.target.value)}
              className="px-2 py-1 text-xs border border-[#E5E9EF] rounded-lg text-[#202939]"
            >
              <option value="All">All Methods</option>
              <option value="PayHere">PayHere</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
            </select>

            <select
              value={txnStatusFilter}
              onChange={e => setTxnStatusFilter(e.target.value)}
              className="px-2 py-1 text-xs border border-[#E5E9EF] rounded-lg text-[#202939]"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending Verification">Pending</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E5E9EF] text-[#778196] font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Transaction ID</th>
                <th className="py-2.5 px-3">Guest Name</th>
                <th className="py-2.5 px-3">Booking Ref</th>
                <th className="py-2.5 px-3">Amount (LKR)</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9EF]">
              {filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#778196]">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredTxns.map(txn => (
                  <tr key={txn.id} className="hover:bg-[#F9FAFB]">
                    <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-[#172B4D]">
                      {txn.id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#202939]">
                      {txn.guestName}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-[#778196]">
                      {txn.bookingRef}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#172B4D]">
                      {money(txn.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-[#202939]">
                      {txn.method}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${TXN_STATUS_BADGES[txn.status]}`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-[11px] text-[#778196]">
                      {txn.date}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ==============================================================
          MODAL: CONFIGURE PAYMENT METHOD
          ============================================================== */}
      {editingMethod && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E5E9EF] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9EF] mb-4">
              <h3 className="text-base font-bold text-[#172B4D]">
                Configure {editingMethod.name}
              </h3>
              <button
                onClick={() => setEditingMethod(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-4">
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E9EF] space-y-1.5">
                <span className="font-semibold text-[#172B4D] block">Current Integration Parameters:</span>
                {Object.entries(editingMethod.details).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-[11px]">
                    <span className="text-[#778196] capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <strong className="text-[#172B4D] font-mono">{value}</strong>
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Operational Mode</label>
                <select
                  value={editingMethod.status}
                  onChange={e => {
                    const newStatus = e.target.value as any
                    setEditingMethod({
                      ...editingMethod,
                      status: newStatus,
                      enabled: newStatus !== 'Disabled'
                    })
                  }}
                  className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                >
                  <option value="Enabled">Enabled (Live)</option>
                  <option value="Demo Mode">Demo Mode (Sandbox)</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Guest Instructions / Display Note</label>
                <textarea
                  rows={2}
                  value={editingMethod.description}
                  onChange={e => setEditingMethod({ ...editingMethod, description: e.target.value })}
                  className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E9EF]">
              <button
                onClick={() => setEditingMethod(null)}
                className="px-3.5 py-1.5 border border-[#E5E9EF] rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setMethods(methods.map(m => m.id === editingMethod.id ? editingMethod : m))
                  notify(`Updated ${editingMethod.name} settings.`)
                  setEditingMethod(null)
                }}
                className="px-4 py-1.5 bg-[#27877D] hover:bg-[#1E6E66] text-white rounded-lg font-semibold cursor-pointer"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
