'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Plus, Search, Filter, Edit2, Trash2, Calendar,
  TrendingUp, Tag, Percent, Calculator, History, AlertTriangle,
  X, Check, DollarSign, Clock, ArrowRight, ShieldCheck
} from 'lucide-react'
import {
  PricingRule, PricingSeason, PricingHistoryLog,
  INITIAL_PRICING_RULES, INITIAL_SEASONS, INITIAL_PRICING_HISTORY,
  INITIAL_ROOMS, INITIAL_BOOKING_CONFIGURATIONS
} from './mock-data'

const money = (amount: number) => `LKR ${amount.toLocaleString('en-LK')}`

const STATUS_BADGES: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Upcoming: 'bg-blue-50 text-blue-700 border-blue-200',
  Expired: 'bg-slate-100 text-slate-600 border-slate-200'
}

const SEASON_TYPE_BADGES: Record<string, string> = {
  Peak: 'bg-amber-50 text-amber-800 border-amber-200',
  Normal: 'bg-blue-50 text-blue-700 border-blue-200',
  'Off-Peak': 'bg-emerald-50 text-emerald-700 border-emerald-200'
}

interface PricingSeasonsProps {
  notify: (msg: string) => void
}

export function PricingSeasons({ notify }: PricingSeasonsProps) {
  // Persistence
  const [rules, setRules] = useState<PricingRule[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vtf-settings-pricing-rules')
      if (saved) {
        try { return JSON.parse(saved) } catch {}
      }
    }
    return INITIAL_PRICING_RULES
  })

  const [seasons, setSeasons] = useState<PricingSeason[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vtf-settings-seasons')
      if (saved) {
        try { return JSON.parse(saved) } catch {}
      }
    }
    return INITIAL_SEASONS
  })

  const [history, setHistory] = useState<PricingHistoryLog[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vtf-settings-pricing-history')
      if (saved) {
        try { return JSON.parse(saved) } catch {}
      }
    }
    return INITIAL_PRICING_HISTORY
  })

  useEffect(() => {
    localStorage.setItem('vtf-settings-pricing-rules', JSON.stringify(rules))
  }, [rules])

  useEffect(() => {
    localStorage.setItem('vtf-settings-seasons', JSON.stringify(seasons))
  }, [seasons])

  useEffect(() => {
    localStorage.setItem('vtf-settings-pricing-history', JSON.stringify(history))
  }, [history])

  // Sub tabs: Rules, Seasons, History
  const [activeTab, setActiveTab] = useState<'rules' | 'seasons' | 'history'>('rules')

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [seasonFilter, setSeasonFilter] = useState('All')

  // Modals
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null)
  const [deletingRule, setDeletingRule] = useState<PricingRule | null>(null)

  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false)
  const [editingSeason, setEditingSeason] = useState<PricingSeason | null>(null)

  // Rule Form State
  const [ruleName, setRuleName] = useState('')
  const [ruleTarget, setRuleTarget] = useState('Room 01 · Single Tree Deluxe')
  const [ruleSeasonId, setRuleSeasonId] = useState('SEASON-REGULAR')
  const [ruleStart, setRuleStart] = useState('2026-12-01')
  const [ruleEnd, setRuleEnd] = useState('2026-12-31')
  const [ruleBasePrice, setRuleBasePrice] = useState(24000)
  const [ruleWeekendPrice, setRuleWeekendPrice] = useState(27000)
  const [ruleExtraGuest, setRuleExtraGuest] = useState(4500)
  const [ruleDiscount, setRuleDiscount] = useState(0)
  const [ruleStatus, setRuleStatus] = useState<PricingRule['status']>('Active')

  // Season Form State
  const [seasonName, setSeasonName] = useState('')
  const [seasonCode, setSeasonCode] = useState('')
  const [seasonType, setSeasonType] = useState<PricingSeason['type']>('Normal')
  const [seasonStart, setSeasonStart] = useState('2026-11-01')
  const [seasonEnd, setSeasonEnd] = useState('2026-12-15')
  const [seasonDesc, setSeasonDesc] = useState('')

  // Interactive Live Price Preview Calculator State
  const [calcRoom, setCalcRoom] = useState(rules[0]?.roomOrConfig || 'Room 01 · Single Tree Deluxe')
  const [calcNights, setCalcNights] = useState(3)
  const [calcWeekendNights, setCalcWeekendNights] = useState(1)
  const [calcExtraGuests, setCalcExtraGuests] = useState(0)

  // Open Add Rule
  const handleOpenAddRule = () => {
    setEditingRule(null)
    setRuleName('')
    setRuleTarget('Room 01 · Single Tree Deluxe')
    setRuleSeasonId(seasons[0]?.id || 'SEASON-REGULAR')
    setRuleStart('2026-12-01')
    setRuleEnd('2026-12-31')
    setRuleBasePrice(25000)
    setRuleWeekendPrice(28000)
    setRuleExtraGuest(4500)
    setRuleDiscount(0)
    setRuleStatus('Active')
    setIsRuleModalOpen(true)
  }

  // Open Edit Rule
  const handleOpenEditRule = (rule: PricingRule) => {
    setEditingRule(rule)
    setRuleName(rule.name)
    setRuleTarget(rule.roomOrConfig)
    setRuleSeasonId(rule.seasonId)
    setRuleStart(rule.startDate)
    setRuleEnd(rule.endDate)
    setRuleBasePrice(rule.basePrice)
    setRuleWeekendPrice(rule.weekendPrice)
    setRuleExtraGuest(rule.additionalGuestCharge)
    setRuleDiscount(rule.discountPercent)
    setRuleStatus(rule.status)
    setIsRuleModalOpen(true)
  }

  // Save Rule
  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ruleName.trim()) {
      notify('Please enter a pricing rule name.')
      return
    }

    if (editingRule) {
      const oldPrice = editingRule.basePrice
      setRules(prev => prev.map(r => r.id === editingRule.id ? {
        ...r,
        name: ruleName,
        roomOrConfig: ruleTarget,
        seasonId: ruleSeasonId,
        startDate: ruleStart,
        endDate: ruleEnd,
        basePrice: ruleBasePrice,
        weekendPrice: ruleWeekendPrice,
        additionalGuestCharge: ruleExtraGuest,
        discountPercent: ruleDiscount,
        status: ruleStatus
      } : r))

      // Append to audit history
      const newLog: PricingHistoryLog = {
        id: `PLOG-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        ruleName,
        changedBy: 'Anushka Senanayake (Owner)',
        oldPrice,
        newPrice: ruleBasePrice,
        reason: 'Rate revision via Pricing & Seasons settings'
      }
      setHistory(prev => [newLog, ...prev])
      notify(`Pricing rule "${ruleName}" updated successfully.`)
    } else {
      const newRule: PricingRule = {
        id: `RULE-${Date.now().toString().slice(-4)}`,
        name: ruleName,
        roomOrConfig: ruleTarget,
        seasonId: ruleSeasonId,
        startDate: ruleStart,
        endDate: ruleEnd,
        basePrice: ruleBasePrice,
        weekendPrice: ruleWeekendPrice,
        additionalGuestCharge: ruleExtraGuest,
        discountPercent: ruleDiscount,
        status: ruleStatus
      }
      setRules(prev => [...prev, newRule])

      const newLog: PricingHistoryLog = {
        id: `PLOG-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        ruleName,
        changedBy: 'Anushka Senanayake (Owner)',
        oldPrice: 0,
        newPrice: ruleBasePrice,
        reason: 'Initial pricing rule established'
      }
      setHistory(prev => [newLog, ...prev])
      notify(`New pricing rule "${ruleName}" created.`)
    }
    setIsRuleModalOpen(false)
  }

  // Delete Rule
  const handleConfirmDeleteRule = () => {
    if (!deletingRule) return
    setRules(prev => prev.filter(r => r.id !== deletingRule.id))
    notify(`Pricing rule "${deletingRule.name}" removed.`)
    setDeletingRule(null)
  }

  // Open Add Season
  const handleOpenAddSeason = () => {
    setEditingSeason(null)
    setSeasonName('')
    setSeasonCode(`SEASON-${Date.now().toString().slice(-3)}`)
    setSeasonType('Normal')
    setSeasonStart('2027-01-01')
    setSeasonEnd('2027-02-28')
    setSeasonDesc('')
    setIsSeasonModalOpen(true)
  }

  // Save Season
  const handleSaveSeason = (e: React.FormEvent) => {
    e.preventDefault()
    if (!seasonName.trim()) {
      notify('Please enter a season name.')
      return
    }

    if (editingSeason) {
      setSeasons(prev => prev.map(s => s.id === editingSeason.id ? {
        ...s,
        name: seasonName,
        code: seasonCode,
        type: seasonType,
        startDate: seasonStart,
        endDate: seasonEnd,
        description: seasonDesc
      } : s))
      notify(`Season "${seasonName}" updated.`)
    } else {
      const newSeason: PricingSeason = {
        id: `SEASON-${Date.now().toString().slice(-4)}`,
        name: seasonName,
        code: seasonCode,
        type: seasonType,
        startDate: seasonStart,
        endDate: seasonEnd,
        description: seasonDesc
      }
      setSeasons(prev => [...prev, newSeason])
      notify(`Season "${seasonName}" added.`)
    }
    setIsSeasonModalOpen(false)
  }

  // Filtered Rules
  const filteredRules = rules.filter(r => {
    const matchesQuery = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roomOrConfig.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter
    const matchesSeason = seasonFilter === 'All' || r.seasonId === seasonFilter
    return matchesQuery && matchesStatus && matchesSeason
  })

  // Price Preview Calculation
  const activeCalcRule = rules.find(r => r.roomOrConfig === calcRoom && r.status === 'Active') || rules[0]
  const calculationResult = useMemo(() => {
    if (!activeCalcRule) {
      return {
        weekdayNights: 0,
        baseCost: 0,
        weekendCost: 0,
        extraGuestCost: 0,
        gross: 0,
        discount: 0,
        total: 0
      }
    }
    const weekdayNights = Math.max(0, calcNights - calcWeekendNights)
    const baseCost = weekdayNights * activeCalcRule.basePrice
    const weekendCost = calcWeekendNights * activeCalcRule.weekendPrice
    const extraGuestCost = calcExtraGuests * activeCalcRule.additionalGuestCharge * calcNights
    const gross = baseCost + weekendCost + extraGuestCost
    const discount = (gross * activeCalcRule.discountPercent) / 100
    const total = gross - discount
    return {
      weekdayNights,
      baseCost,
      weekendCost,
      extraGuestCost,
      gross,
      discount,
      total
    }
  }, [activeCalcRule, calcNights, calcWeekendNights, calcExtraGuests])

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E9EF]">
        <div>
          <h2 className="text-lg font-bold text-[#172B4D]">Pricing & Seasons</h2>
          <p className="text-xs text-[#778196] mt-0.5">
            Configure seasonal rates, weekend premiums, extra guest supplements and discounts in LKR.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-[#F2F4F8] rounded-lg">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-white text-[#172B4D] shadow-xs'
                : 'text-[#778196] hover:text-[#172B4D]'
            }`}
          >
            Pricing Rules ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('seasons')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'seasons'
                ? 'bg-white text-[#172B4D] shadow-xs'
                : 'text-[#778196] hover:text-[#172B4D]'
            }`}
          >
            Seasons ({seasons.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-[#172B4D] shadow-xs'
                : 'text-[#778196] hover:text-[#172B4D]'
            }`}
          >
            Rate History ({history.length})
          </button>
        </div>
      </div>

      {/* ==============================================================
          TAB 1: PRICING RULES TABLE + LIVE PREVIEW CALCULATOR
          ============================================================== */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#778196]" />
                <input
                  type="text"
                  placeholder="Search rules by name or room..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E9EF] rounded-lg text-[#202939]"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Expired">Expired</option>
              </select>

              <select
                value={seasonFilter}
                onChange={e => setSeasonFilter(e.target.value)}
                className="hidden md:block px-2.5 py-1.5 text-xs bg-white border border-[#E5E9EF] rounded-lg text-[#202939]"
              >
                <option value="All">All Seasons</option>
                {seasons.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOpenAddRule}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#27877D] hover:bg-[#1E6E66] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Pricing Rule</span>
            </button>
          </div>

          {/* Pricing Rules Table */}
          <div className="bg-white rounded-xl border border-[#E5E9EF] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E5E9EF] text-[#778196] font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Rule Name</th>
                    <th className="py-3 px-3">Room / Configuration</th>
                    <th className="py-3 px-3">Season</th>
                    <th className="py-3 px-3">Valid Dates</th>
                    <th className="py-3 px-3">Base Rate (LKR)</th>
                    <th className="py-3 px-3">Weekend (LKR)</th>
                    <th className="py-3 px-3">Discount</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E9EF]">
                  {filteredRules.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-[#778196]">
                        No pricing rules match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRules.map(rule => {
                      const seasonObj = seasons.find(s => s.id === rule.seasonId)
                      return (
                        <tr key={rule.id} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="py-3 px-4 font-semibold text-[#172B4D]">
                            {rule.name}
                          </td>
                          <td className="py-3 px-3 text-[#202939] max-w-xs truncate">
                            {rule.roomOrConfig}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${seasonObj ? SEASON_TYPE_BADGES[seasonObj.type] : 'bg-slate-100'}`}>
                              {seasonObj?.name.split('·')[0] || 'Regular'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-[#778196] text-[11px] whitespace-nowrap">
                            {rule.startDate} – {rule.endDate}
                          </td>
                          <td className="py-3 px-3 font-semibold text-[#172B4D]">
                            {money(rule.basePrice)}
                          </td>
                          <td className="py-3 px-3 font-medium text-[#0F473E]">
                            {money(rule.weekendPrice)}
                          </td>
                          <td className="py-3 px-3">
                            {rule.discountPercent > 0 ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                {rule.discountPercent}% OFF
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_BADGES[rule.status]}`}>
                              {rule.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditRule(rule)}
                                className="p-1.5 text-[#778196] hover:text-[#27877D] hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                title="Edit Rule"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => setDeletingRule(rule)}
                                className="p-1.5 text-[#778196] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                title="Delete Rule"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ==========================================================
              INTERACTIVE PRICE PREVIEW SECTION (REQUIRED BY USER)
              ========================================================== */}
          <div className="p-5 bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] rounded-xl border border-[#E5E9EF] shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-[#27877D]/10 text-[#27877D]">
                <Calculator size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#172B4D]">
                  Live Booking Price Preview Calculator
                </h3>
                <p className="text-[11px] text-[#778196]">
                  Test rate calculation for mock reservations using active rules.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs mb-4">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Select Room/Config</label>
                <select
                  value={calcRoom}
                  onChange={e => setCalcRoom(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E5E9EF] rounded-lg text-[#202939]"
                >
                  {rules.map(r => (
                    <option key={r.id} value={r.roomOrConfig}>{r.roomOrConfig}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Total Nights</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={calcNights}
                  onChange={e => setCalcNights(Math.max(1, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Weekend Nights (Fri/Sat)</label>
                <input
                  type="number"
                  min={0}
                  max={calcNights}
                  value={calcWeekendNights}
                  onChange={e => setCalcWeekendNights(Math.min(calcNights, Math.max(0, Number(e.target.value))))}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Extra Guests (LKR {activeCalcRule?.additionalGuestCharge.toLocaleString()}/night)</label>
                <input
                  type="number"
                  min={0}
                  max={4}
                  value={calcExtraGuests}
                  onChange={e => setCalcExtraGuests(Math.max(0, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>
            </div>

            {/* Breakdown card */}
            <div className="p-3 bg-white rounded-lg border border-[#E5E9EF] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4 text-[#778196]">
                <span>
                  Weekday ({calculationResult.weekdayNights}n): <b className="text-[#172B4D]">{money(calculationResult.baseCost)}</b>
                </span>
                <span>•</span>
                <span>
                  Weekend ({calcWeekendNights}n): <b className="text-[#172B4D]">{money(calculationResult.weekendCost)}</b>
                </span>
                {calcExtraGuests > 0 && (
                  <>
                    <span>•</span>
                    <span>
                      Extra Guests: <b className="text-[#172B4D]">{money(calculationResult.extraGuestCost)}</b>
                    </span>
                  </>
                )}
                {calculationResult.discount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">
                      Discount ({activeCalcRule?.discountPercent}%): -{money(calculationResult.discount)}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[#778196]">Total Estimated:</span>
                <span className="text-base font-bold text-[#27877D]">
                  {money(calculationResult.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 2: SEASONS MANAGEMENT
          ============================================================== */}
      {activeTab === 'seasons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#778196]">
              Define highland holiday periods, monsoon green season discounts, and festive race week rate bands.
            </p>
            <button
              onClick={handleOpenAddSeason}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#172B4D] hover:bg-[#0F1D34] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>Create New Season</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {seasons.map(s => (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-[#E5E9EF] p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${SEASON_TYPE_BADGES[s.type]}`}>
                      {s.type} Season
                    </span>
                    <span className="text-[11px] font-mono text-[#778196]">{s.code}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#172B4D] mb-1">
                    {s.name}
                  </h3>
                  <p className="text-xs text-[#778196] mb-3 leading-relaxed">
                    {s.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E5E9EF] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#778196]">
                    <Calendar size={13} />
                    <span>{s.startDate} – {s.endDate}</span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingSeason(s)
                      setSeasonName(s.name)
                      setSeasonCode(s.code)
                      setSeasonType(s.type)
                      setSeasonStart(s.startDate)
                      setSeasonEnd(s.endDate)
                      setSeasonDesc(s.description)
                      setIsSeasonModalOpen(true)
                    }}
                    className="text-[#27877D] hover:underline font-semibold cursor-pointer"
                  >
                    Edit Season
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 3: PRICING HISTORY LOGS
          ============================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E5E9EF] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E5E9EF] text-[#778196] font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-3">Rule Affected</th>
                    <th className="py-3 px-3">Changed By</th>
                    <th className="py-3 px-3">Old Rate</th>
                    <th className="py-3 px-3">New Rate</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E9EF]">
                  {history.map(log => (
                    <tr key={log.id} className="hover:bg-[#F9FAFB]">
                      <td className="py-3 px-4 font-mono text-[11px] text-[#778196]">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#172B4D]">
                        {log.ruleName}
                      </td>
                      <td className="py-3 px-3 text-[#202939]">
                        {log.changedBy}
                      </td>
                      <td className="py-3 px-3 text-slate-500 line-through">
                        {log.oldPrice > 0 ? money(log.oldPrice) : 'New'}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#27877D]">
                        {money(log.newPrice)}
                      </td>
                      <td className="py-3 px-4 text-[#778196]">
                        {log.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: ADD / EDIT PRICING RULE
          ============================================================== */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E5E9EF] my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9EF] mb-4">
              <h3 className="text-base font-bold text-[#172B4D]">
                {editingRule ? 'Edit Pricing Rule' : 'Add New Pricing Rule'}
              </h3>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Pricing Rule Name *</label>
                <input
                  type="text"
                  required
                  value={ruleName}
                  onChange={e => setRuleName(e.target.value)}
                  placeholder="e.g. Standard Deluxe Rate · Q1 2027"
                  className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Applies to Room/Config</label>
                  <select
                    value={ruleTarget}
                    onChange={e => setRuleTarget(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  >
                    <optgroup label="Physical Rooms">
                      {INITIAL_ROOMS.map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Booking Configurations">
                      {INITIAL_BOOKING_CONFIGURATIONS.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Season</label>
                  <select
                    value={ruleSeasonId}
                    onChange={e => setRuleSeasonId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  >
                    {seasons.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={ruleStart}
                    onChange={e => setRuleStart(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={ruleEnd}
                    onChange={e => setRuleEnd(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Base Price (LKR) *</label>
                  <input
                    type="number"
                    min={1000}
                    step={500}
                    required
                    value={ruleBasePrice}
                    onChange={e => setRuleBasePrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Weekend Price (LKR)</label>
                  <input
                    type="number"
                    min={1000}
                    step={500}
                    value={ruleWeekendPrice}
                    onChange={e => setRuleWeekendPrice(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Extra Guest (LKR)</label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={ruleExtraGuest}
                    onChange={e => setRuleExtraGuest(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Discount (% Off)</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={ruleDiscount}
                    onChange={e => setRuleDiscount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Status</label>
                  <select
                    value={ruleStatus}
                    onChange={e => setRuleStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  >
                    <option value="Active">Active</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E9EF]">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-3.5 py-1.5 border border-[#E5E9EF] rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#27877D] hover:bg-[#1E6E66] text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  {editingRule ? 'Update Rule' : 'Save Pricing Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: ADD / EDIT SEASON
          ============================================================== */}
      {isSeasonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E5E9EF] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9EF] mb-4">
              <h3 className="text-base font-bold text-[#172B4D]">
                {editingSeason ? 'Edit Season' : 'Create Season'}
              </h3>
              <button
                onClick={() => setIsSeasonModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSeason} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Season Name *</label>
                <input
                  type="text"
                  required
                  value={seasonName}
                  onChange={e => setSeasonName(e.target.value)}
                  placeholder="e.g. April Festive Horse Racing Season"
                  className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Season Code</label>
                  <input
                    type="text"
                    value={seasonCode}
                    onChange={e => setSeasonCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Pricing Band Type</label>
                  <select
                    value={seasonType}
                    onChange={e => setSeasonType(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  >
                    <option value="Peak">Peak (+Premium)</option>
                    <option value="Normal">Normal Standard</option>
                    <option value="Off-Peak">Off-Peak (Promotional)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={seasonStart}
                    onChange={e => setSeasonStart(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={seasonEnd}
                    onChange={e => setSeasonEnd(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={seasonDesc}
                  onChange={e => setSeasonDesc(e.target.value)}
                  placeholder="Notes on expected weather, event calendar, or guest demand..."
                  className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E9EF]">
                <button
                  type="button"
                  onClick={() => setIsSeasonModalOpen(false)}
                  className="px-3.5 py-1.5 border border-[#E5E9EF] rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#172B4D] hover:bg-[#0F1D34] text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Save Season
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: DELETE CONFIRMATION
          ============================================================== */}
      {deletingRule && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-rose-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-50 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-base font-bold text-[#172B4D]">Delete Pricing Rule</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed mb-4">
              Are you sure you want to delete <strong>{deletingRule.name}</strong>? Rates will revert to default seasonal baselines.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingRule(null)}
                className="px-3.5 py-1.5 border border-[#E5E9EF] rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteRule}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
              >
                Delete Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
