'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowUpRight, CalendarDays, Calculator, Check, ChevronLeft, ChevronRight, History, Hotel, Moon, Pause, Pencil, Percent, Play, Plus, Sparkles, Tag, TrendingUp, X } from 'lucide-react'
import { ROOM_DATA, Role } from './reservations-view'

type PricingTab = 'Room rates' | 'Calendar' | 'Seasons' | 'Promotions' | 'Approvals' | 'History'
type DiscountType = 'Percentage' | 'Fixed amount'
type PromoChannel = 'All channels' | 'Direct only'
type RequestStatus = 'Pending' | 'Approved' | 'Rejected'
type BulkTarget = 'Weekday & weekend' | 'Weekday only' | 'Weekend only'
type ModalKind = 'season' | 'promotion' | 'bulk' | 'minstay'

interface RoomRate {
  room: string
  type: string
  capacity: number
  base: number
  weekend: number
  bookingCom: number
  airbnb: number
}

interface Season {
  id: string
  name: string
  start: string
  end: string
  adjustment: number
  active: boolean
}

interface Promotion {
  id: string
  code: string
  name: string
  discountType: DiscountType
  value: number
  start: string
  end: string
  minNights: number
  channel: PromoChannel
  used: number
  limit: number
  paused: boolean
  revenue: number
  discountGiven: number
}

interface RateRequest {
  id: string
  room: string
  current: number
  proposed: number
  start: string
  end: string
  reason: string
  requestedBy: string
  status: RequestStatus
}

interface RateOverride {
  id: string
  room: string
  start: string
  end: string
  rate: number
}

interface MinStayRule {
  id: string
  name: string
  start: string
  end: string
  minNights: number
  room: string
}

interface HistoryEntry {
  id: string
  at: string
  by: string
  action: string
  detail: string
}

interface PricingState {
  rates: RoomRate[]
  seasons: Season[]
  promotions: Promotion[]
  requests: RateRequest[]
  overrides: RateOverride[]
  minStays: MinStayRule[]
  history: HistoryEntry[]
}

const STORAGE_KEY = 'villa-tea-fields-pricing-v2'
const TODAY = '2026-11-14'
const ALL_ROOMS = 'All rooms'
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const OTA_UPLIFT = 1.15

const roundRate = (value: number) => Math.round(value / 100) * 100

const initialState: PricingState = {
  rates: ROOM_DATA.map((room, index) => ({
    room: room.name,
    type: room.type,
    capacity: room.capacity,
    base: room.rate,
    weekend: roundRate(room.rate * 1.1),
    bookingCom: index === 1 ? roundRate(room.rate * 0.95) : roundRate(room.rate * OTA_UPLIFT),
    airbnb: index === 3 ? room.rate : roundRate(room.rate * 1.12)
  })),
  seasons: [
    { id: 'SEA-1', name: 'Christmas & New Year', start: '2026-12-20', end: '2027-01-05', adjustment: 20, active: true },
    { id: 'SEA-2', name: 'Nuwara Eliya April Season', start: '2027-04-01', end: '2027-04-30', adjustment: 35, active: true },
    { id: 'SEA-3', name: 'Monsoon off-peak', start: '2027-06-01', end: '2027-08-31', adjustment: -15, active: true },
    { id: 'SEA-4', name: 'Esala Poya long weekend', start: '2027-07-17', end: '2027-07-20', adjustment: 10, active: false }
  ],
  promotions: [
    { id: 'PRO-1', code: 'TEACOUNTRY10', name: 'Tea Country, Your Way', discountType: 'Percentage', value: 10, start: '2026-11-01', end: '2026-12-15', minNights: 1, channel: 'Direct only', used: 14, limit: 50, paused: false, revenue: 512000, discountGiven: 56900 },
    { id: 'PRO-2', code: 'LONGSTAY15', name: 'Stay 4 nights, save 15%', discountType: 'Percentage', value: 15, start: '2026-10-01', end: '2027-03-31', minNights: 4, channel: 'All channels', used: 6, limit: 0, paused: false, revenue: 465000, discountGiven: 82000 },
    { id: 'PRO-3', code: 'WELCOME5000', name: 'First-time guest welcome', discountType: 'Fixed amount', value: 5000, start: '2026-11-01', end: '2027-01-31', minNights: 2, channel: 'Direct only', used: 3, limit: 25, paused: true, revenue: 121800, discountGiven: 15000 },
    { id: 'PRO-4', code: 'FESTIVE2026', name: 'Festive early bird', discountType: 'Percentage', value: 12, start: '2026-12-01', end: '2026-12-19', minNights: 2, channel: 'Direct only', used: 0, limit: 40, paused: false, revenue: 0, discountGiven: 0 },
    { id: 'PRO-5', code: 'MONSOON20', name: 'Monsoon escape', discountType: 'Percentage', value: 20, start: '2026-06-01', end: '2026-08-31', minNights: 2, channel: 'All channels', used: 22, limit: 30, paused: false, revenue: 798000, discountGiven: 199500 }
  ],
  requests: [
    { id: 'RCR-1', room: 'Room 01', current: 22800, proposed: 25000, start: '2026-11-27', end: '2026-11-29', reason: 'Weekend demand trending 18% higher than usual for late November.', requestedBy: 'AI Business Assistant', status: 'Pending' },
    { id: 'RCR-2', room: 'Room 03', current: 26000, proposed: 23500, start: '2026-11-17', end: '2026-11-19', reason: 'Mid-week gap with no bookings yet · last-minute fill rate.', requestedBy: 'Mira Jayasinghe (Manager)', status: 'Pending' }
  ],
  overrides: [],
  minStays: [
    { id: 'MIN-1', name: 'Christmas & New Year', start: '2026-12-23', end: '2027-01-02', minNights: 3, room: ALL_ROOMS },
    { id: 'MIN-2', name: 'April season weekends', start: '2027-04-10', end: '2027-04-16', minNights: 2, room: ALL_ROOMS }
  ],
  history: [
    { id: 'HIS-3', at: 'Nov 12, 2026, 10:05 AM', by: 'Anushka Senanayake (Owner)', action: 'Promotion created', detail: 'FESTIVE2026 · 12% off · Dec 01 – Dec 19' },
    { id: 'HIS-2', at: 'Nov 01, 2026, 09:00 AM', by: 'Anushka Senanayake (Owner)', action: 'Promotion created', detail: 'TEACOUNTRY10 · 10% off direct bookings' },
    { id: 'HIS-1', at: 'Oct 15, 2026, 04:30 PM', by: 'Anushka Senanayake (Owner)', action: 'Season added', detail: 'Christmas & New Year · +20% · Dec 20 – Jan 05' }
  ]
}

const emptyPromoForm = { code: '', name: '', discountType: 'Percentage' as DiscountType, value: 10, start: TODAY, end: '2026-12-31', minNights: 1, channel: 'Direct only' as PromoChannel, limit: 0 }

const money = (amount: number) => `LKR ${Math.round(amount || 0).toLocaleString('en-LK')}`
const compact = (amount: number) => `${(amount / 1000).toFixed(1)}k`
const shortDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const toIso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const addDays = (value: string, days: number) => { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate() + days); return toIso(date) }
const isWeekendNight = (value: string) => [5, 6].includes(new Date(`${value}T12:00:00`).getDay())
const promoStatus = (promo: Promotion) => promo.end < TODAY ? 'Expired' : promo.paused ? 'Paused' : promo.start > TODAY ? 'Scheduled' : promo.limit > 0 && promo.used >= promo.limit ? 'Limit reached' : 'Active'
const statusColor: Record<string, string> = { Active: 'paid', Scheduled: 'partial', Paused: 'partial', Expired: 'unpaid', 'Limit reached': 'unpaid', Approved: 'paid', Rejected: 'unpaid', Pending: 'partial' }
const parityStatus = (rate: RoomRate) => Math.min(rate.bookingCom, rate.airbnb) < rate.base ? 'Undercut' : Math.min(rate.bookingCom, rate.airbnb) === rate.base ? 'Parity' : 'Direct cheaper'

function Stat({ icon, label, value, change, note, tone }: { icon: React.ReactNode; label: string; value: string; change?: string; note: string; tone: string }) {
  return <article className="stat-card"><div className="stat-top"><span className={`stat-icon ${tone}`}>{icon}</span>{change && <span className="stat-change"><ArrowUpRight size={13} />{change}</span>}</div><p>{label}</p><div className="stat-value">{value}</div><small>{note}</small></article>
}

export function PricingPromotionsView({ role, notify }: { role: Role; notify: (message: string) => void }) {
  const [state, setState] = useState<PricingState>(initialState)
  const [loaded, setLoaded] = useState(false)
  const [tab, setTab] = useState<PricingTab>('Room rates')
  const [editingRoom, setEditingRoom] = useState<string | null>(null)
  const [rateDraft, setRateDraft] = useState({ base: 0, weekend: 0, bookingCom: 0, airbnb: 0 })
  const [modal, setModal] = useState<ModalKind | null>(null)
  const [seasonForm, setSeasonForm] = useState({ name: '', start: '2026-12-01', end: '2026-12-10', adjustment: 10 })
  const [promoForm, setPromoForm] = useState(emptyPromoForm)
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null)
  const [bulkForm, setBulkForm] = useState({ percent: 5, target: 'Weekday & weekend' as BulkTarget, room: ALL_ROOMS })
  const [minStayForm, setMinStayForm] = useState({ name: '', start: '2026-12-24', end: '2026-12-31', minNights: 2, room: ALL_ROOMS })
  const [calendarMonth, setCalendarMonth] = useState({ year: 2026, month: 10 })
  const [calendarRoom, setCalendarRoom] = useState(ROOM_DATA[0].name)
  const [quote, setQuote] = useState({ room: ROOM_DATA[0].name, checkIn: '2026-11-27', checkOut: '2026-11-30', code: '', channel: 'Direct only' as PromoChannel })

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) setState({ ...initialState, ...JSON.parse(stored) })
    } catch {
      setState(initialState)
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
  }, [state, loaded])

  const isOwner = role === 'Owner'
  const actor = `${role === 'Owner' ? 'Anushka Senanayake' : 'Staff'} (${role})`
  const pendingRequests = state.requests.filter(item => item.status === 'Pending')
  const activePromotions = state.promotions.filter(item => promoStatus(item) === 'Active')
  const averageRate = state.rates.reduce((sum, item) => sum + item.base, 0) / Math.max(1, state.rates.length)
  const nextSeason = [...state.seasons].filter(item => item.active && item.end >= TODAY).sort((a, b) => a.start.localeCompare(b.start))[0]
  const parityIssues = state.rates.filter(item => parityStatus(item) === 'Undercut')
  const promoRevenue = state.promotions.reduce((sum, item) => sum + item.revenue, 0)
  const promoDiscount = state.promotions.reduce((sum, item) => sum + item.discountGiven, 0)

  const entry = (action: string, detail: string): HistoryEntry => ({ id: `HIS-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }), by: actor, action, detail })
  const withHistory = (current: PricingState, action: string, detail: string) => [entry(action, detail), ...current.history]

  const nightlyRate = (room: string, date: string) => {
    const rate = state.rates.find(item => item.room === room)
    if (!rate) return { amount: 0, label: '', kind: 'standard' as const }
    const override = state.overrides.find(item => item.room === room && date >= item.start && date <= item.end)
    if (override) return { amount: override.rate, label: 'Approved date rate', kind: 'override' as const }
    const weekend = isWeekendNight(date)
    const season = state.seasons.find(item => item.active && date >= item.start && date <= item.end)
    const startRate = weekend ? rate.weekend : rate.base
    const amount = season ? Math.round(startRate * (1 + season.adjustment / 100)) : startRate
    const label = [weekend ? 'Weekend' : 'Weekday', season ? `${season.name} ${season.adjustment > 0 ? '+' : ''}${season.adjustment}%` : ''].filter(Boolean).join(' · ')
    return { amount, label, kind: season ? (season.adjustment > 0 ? 'peak' as const : 'offpeak' as const) : weekend ? 'weekend' as const : 'standard' as const }
  }

  const minStayFor = (room: string, date: string) => state.minStays.filter(rule => (rule.room === ALL_ROOMS || rule.room === room) && date >= rule.start && date <= rule.end).sort((a, b) => b.minNights - a.minNights)[0]

  const quoteResult = useMemo(() => {
    if (!quote.checkIn || !quote.checkOut || quote.checkOut <= quote.checkIn) return null
    const nights: { date: string; amount: number; label: string }[] = []
    for (let date = quote.checkIn; date < quote.checkOut && nights.length < 30; date = addDays(date, 1)) nights.push({ date, ...nightlyRate(quote.room, date) })
    const subtotal = nights.reduce((sum, item) => sum + item.amount, 0)
    const rule = minStayFor(quote.room, quote.checkIn)
    const minStayMessage = rule && nights.length < rule.minNights ? `Minimum stay of ${rule.minNights} nights required (${rule.name})` : ''
    const code = quote.code.trim().toUpperCase()
    const promo = code ? state.promotions.find(item => item.code === code) : undefined
    let discount = 0
    let promoMessage = ''
    if (code && !promo) promoMessage = 'Promo code not found'
    else if (promo) {
      const status = promoStatus(promo)
      if (status !== 'Active') promoMessage = `Promo is ${status.toLowerCase()}`
      else if (nights.length < promo.minNights) promoMessage = `Requires at least ${promo.minNights} nights`
      else if (promo.channel === 'Direct only' && quote.channel !== 'Direct only') promoMessage = 'Valid for direct bookings only'
      else {
        discount = promo.discountType === 'Percentage' ? Math.round(subtotal * promo.value / 100) : Math.min(subtotal, promo.value)
        promoMessage = `${promo.name} applied`
      }
    }
    return { nights, subtotal, discount, total: subtotal - discount, promoMessage, promoApplied: discount > 0, minStayMessage }
  }, [quote, state])

  const calendarDays = useMemo(() => {
    const first = new Date(calendarMonth.year, calendarMonth.month, 1, 12)
    const daysInMonth = new Date(calendarMonth.year, calendarMonth.month + 1, 0).getDate()
    const leading = (first.getDay() + 6) % 7
    const cells: ({ date: string; day: number } | null)[] = Array.from({ length: leading }, () => null)
    for (let day = 1; day <= daysInMonth; day++) cells.push({ date: toIso(new Date(calendarMonth.year, calendarMonth.month, day, 12)), day })
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [calendarMonth])
  const monthLabel = new Date(calendarMonth.year, calendarMonth.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const shiftMonth = (delta: number) => setCalendarMonth(current => { const date = new Date(current.year, current.month + delta, 1); return { year: date.getFullYear(), month: date.getMonth() } })

  const startEdit = (rate: RoomRate) => { setEditingRoom(rate.room); setRateDraft({ base: rate.base, weekend: rate.weekend, bookingCom: rate.bookingCom, airbnb: rate.airbnb }) }
  const saveRate = (room: string) => {
    if (Object.values(rateDraft).some(value => value <= 0)) { notify('Rates must be greater than zero'); return }
    const before = state.rates.find(item => item.room === room)
    setState(current => ({ ...current, rates: current.rates.map(item => item.room === room ? { ...item, ...rateDraft } : item), history: withHistory(current, 'Room rate updated', `${room} · weekday ${money(before?.base ?? 0)} → ${money(rateDraft.base)} · weekend ${money(before?.weekend ?? 0)} → ${money(rateDraft.weekend)}`) }))
    setEditingRoom(null)
    notify(`${room} rates updated`)
  }

  const fixParity = (rate: RoomRate) => {
    const target = roundRate(rate.base * OTA_UPLIFT)
    setState(current => ({ ...current, rates: current.rates.map(item => item.room === rate.room ? { ...item, bookingCom: Math.max(item.bookingCom, target), airbnb: Math.max(item.airbnb, target) } : item), history: withHistory(current, 'OTA rates adjusted', `${rate.room} · OTA rates raised to at least ${money(target)} to protect direct pricing`) }))
    notify(`${rate.room} OTA rates updated · direct is now cheapest`)
  }

  const applyBulk = () => {
    if (!bulkForm.percent || bulkForm.percent < -50 || bulkForm.percent > 100) { notify('Enter a change between -50% and 100%'); return }
    const factor = 1 + bulkForm.percent / 100
    const touchesWeekday = bulkForm.target !== 'Weekend only'
    const touchesWeekend = bulkForm.target !== 'Weekday only'
    const label = `${bulkForm.percent > 0 ? '+' : ''}${bulkForm.percent}% · ${bulkForm.target.toLowerCase()} · ${bulkForm.room === ALL_ROOMS ? 'all rooms' : bulkForm.room}`
    setState(current => ({
      ...current,
      rates: current.rates.map(item => bulkForm.room !== ALL_ROOMS && item.room !== bulkForm.room ? item : { ...item, base: touchesWeekday ? roundRate(item.base * factor) : item.base, weekend: touchesWeekend ? roundRate(item.weekend * factor) : item.weekend }),
      history: withHistory(current, 'Bulk rate update', label)
    }))
    setModal(null)
    setTab('Room rates')
    notify(`Rates updated ${label}`)
  }

  const toggleSeason = (season: Season) => setState(current => ({ ...current, seasons: current.seasons.map(item => item.id === season.id ? { ...item, active: !item.active } : item), history: withHistory(current, season.active ? 'Season disabled' : 'Season enabled', season.name) }))
  const removeSeason = (season: Season) => { setState(current => ({ ...current, seasons: current.seasons.filter(item => item.id !== season.id), history: withHistory(current, 'Season removed', season.name) })); notify('Season removed') }
  const addSeason = () => {
    if (!seasonForm.name.trim() || !seasonForm.start || seasonForm.end < seasonForm.start || seasonForm.adjustment === 0) { notify('Add a name, valid dates and a non-zero adjustment'); return }
    const name = seasonForm.name.trim()
    setState(current => ({ ...current, seasons: [...current.seasons, { id: `SEA-${Date.now()}`, ...seasonForm, name, active: true }], history: withHistory(current, 'Season added', `${name} · ${seasonForm.adjustment > 0 ? '+' : ''}${seasonForm.adjustment}% · ${shortDate(seasonForm.start)} – ${shortDate(seasonForm.end)}`) }))
    setModal(null)
    setSeasonForm({ name: '', start: '2026-12-01', end: '2026-12-10', adjustment: 10 })
    setTab('Seasons')
    notify('Seasonal rate added')
  }

  const addMinStay = () => {
    if (!minStayForm.name.trim() || !minStayForm.start || minStayForm.end < minStayForm.start || minStayForm.minNights < 2) { notify('Add a name, valid dates and at least 2 nights'); return }
    const name = minStayForm.name.trim()
    setState(current => ({ ...current, minStays: [...current.minStays, { id: `MIN-${Date.now()}`, ...minStayForm, name }], history: withHistory(current, 'Minimum stay rule added', `${name} · ${minStayForm.minNights} nights · ${minStayForm.room}`) }))
    setModal(null)
    setMinStayForm({ name: '', start: '2026-12-24', end: '2026-12-31', minNights: 2, room: ALL_ROOMS })
    setTab('Seasons')
    notify('Minimum stay rule added')
  }
  const removeMinStay = (rule: MinStayRule) => { setState(current => ({ ...current, minStays: current.minStays.filter(item => item.id !== rule.id), history: withHistory(current, 'Minimum stay rule removed', rule.name) })); notify('Minimum stay rule removed') }

  const togglePromotion = (promo: Promotion) => {
    setState(current => ({ ...current, promotions: current.promotions.map(item => item.id === promo.id ? { ...item, paused: !item.paused } : item), history: withHistory(current, promo.paused ? 'Promotion activated' : 'Promotion paused', promo.code) }))
    notify(promo.paused ? `${promo.code} activated` : `${promo.code} paused`)
  }
  const openNewPromotion = () => { setEditingPromoId(null); setPromoForm(emptyPromoForm); setModal('promotion') }
  const openEditPromotion = (promo: Promotion) => { setEditingPromoId(promo.id); setPromoForm({ code: promo.code, name: promo.name, discountType: promo.discountType, value: promo.value, start: promo.start, end: promo.end, minNights: promo.minNights, channel: promo.channel, limit: promo.limit }); setModal('promotion') }
  const savePromotion = () => {
    const code = promoForm.code.trim().toUpperCase().replace(/\s+/g, '')
    if (!code || !promoForm.name.trim() || promoForm.value <= 0 || promoForm.end < promoForm.start) { notify('Add a code, name, discount value and valid dates'); return }
    if (promoForm.discountType === 'Percentage' && promoForm.value > 50) { notify('Percentage discounts are capped at 50%'); return }
    if (state.promotions.some(item => item.code === code && item.id !== editingPromoId)) { notify('That promo code already exists'); return }
    const values = { ...promoForm, code, name: promoForm.name.trim() }
    const detail = `${code} · ${values.discountType === 'Percentage' ? `${values.value}%` : money(values.value)} off · ${shortDate(values.start)} – ${shortDate(values.end)}`
    if (editingPromoId) {
      setState(current => ({ ...current, promotions: current.promotions.map(item => item.id === editingPromoId ? { ...item, ...values } : item), history: withHistory(current, 'Promotion edited', detail) }))
      notify(`Promotion ${code} updated`)
    } else {
      setState(current => ({ ...current, promotions: [{ id: `PRO-${Date.now()}`, ...values, used: 0, paused: false, revenue: 0, discountGiven: 0 }, ...current.promotions], history: withHistory(current, 'Promotion created', detail) }))
      notify(`Promotion ${code} created`)
    }
    setModal(null)
    setEditingPromoId(null)
    setPromoForm(emptyPromoForm)
    setTab('Promotions')
  }

  const decideRequest = (request: RateRequest, status: RequestStatus) => {
    if (!isOwner) { notify('Only the owner can approve rate changes'); return }
    setState(current => ({
      ...current,
      requests: current.requests.map(item => item.id === request.id ? { ...item, status } : item),
      overrides: status === 'Approved' ? [...current.overrides, { id: `OVR-${Date.now()}`, room: request.room, start: request.start, end: request.end, rate: request.proposed }] : current.overrides,
      history: withHistory(current, status === 'Approved' ? 'Rate change approved' : 'Rate change rejected', `${request.room} · ${money(request.current)} → ${money(request.proposed)} · ${shortDate(request.start)} – ${shortDate(request.end)} · requested by ${request.requestedBy}`)
    }))
    notify(status === 'Approved' ? `${request.room} rate set to ${money(request.proposed)} for ${shortDate(request.start)} – ${shortDate(request.end)}` : 'Rate change rejected')
  }
  const removeOverride = (override: RateOverride) => { setState(current => ({ ...current, overrides: current.overrides.filter(item => item.id !== override.id), history: withHistory(current, 'Date rate removed', `${override.room} · ${shortDate(override.start)} – ${shortDate(override.end)}`) })); notify('Date rate removed · standard pricing restored') }

  const tabs: { name: PricingTab; count?: number }[] = [
    { name: 'Room rates', count: parityIssues.length || undefined },
    { name: 'Calendar' },
    { name: 'Seasons', count: state.seasons.filter(item => item.active).length },
    { name: 'Promotions', count: activePromotions.length },
    { name: 'Approvals', count: pendingRequests.length },
    { name: 'History' }
  ]

  const calendarTone: Record<string, string> = { override: 'bg-[#eaf3ec] border-[#a9c9b0]', peak: 'bg-[#fbf3e3] border-[#ecd6a8]', offpeak: 'bg-[#edf3f8] border-[#c3d5e6]', weekend: 'bg-white border-[#e3e8e1]', standard: 'bg-white border-[#eef1ec]' }
  const rateInput = (key: keyof typeof rateDraft) => <input type="number" min="1" className="w-[86px] h-7 border border-[#e3e8e1] rounded-md px-2 text-[10px]" value={rateDraft[key] || ''} onChange={event => setRateDraft({ ...rateDraft, [key]: Number(event.target.value) })} />

  return <>
    <div className="page-heading">
      <div><p className="eyebrow">BUSINESS MANAGEMENT</p><h1>Pricing & promotions</h1><p className="subheading">Set room rates, seasonal pricing and promo codes. Rates never change without owner approval.</p></div>
      <div className="heading-actions flex-wrap">
        {isOwner && <button className="button secondary" onClick={() => setModal('bulk')}><Percent size={15} /> Bulk update</button>}
        <button className="button secondary" onClick={() => setModal('season')}><CalendarDays size={15} /> Add season</button>
        <button className="button primary" onClick={openNewPromotion}><Plus size={16} /> New promotion</button>
      </div>
    </div>

    <div className="stats-grid">
      <Stat icon={<Hotel />} label="AVERAGE BASE RATE" value={money(averageRate)} note={`Across ${state.rates.length} rooms · per night`} tone="green" />
      <Stat icon={<Tag />} label="ACTIVE PROMOTIONS" value={String(activePromotions.length).padStart(2, '0')} note={`${money(promoRevenue)} booked via promo codes`} tone="sand" />
      <Stat icon={<Sparkles />} label="PENDING APPROVALS" value={String(pendingRequests.length).padStart(2, '0')} note="Rate change requests" tone="blue" />
      <Stat icon={<TrendingUp />} label="NEXT SEASON" value={nextSeason ? `${nextSeason.adjustment > 0 ? '+' : ''}${nextSeason.adjustment}%` : '—'} note={nextSeason ? `${nextSeason.name} · ${shortDate(nextSeason.start)}` : 'No upcoming seasons'} tone="purple" />
    </div>

    {parityIssues.length > 0 && <div className="card flex flex-wrap items-center gap-3 px-4 py-3 mb-4 text-[10px]" style={{ background: '#fdf8ef', borderColor: '#f0e2c6' }}>
      <span className="attention-icon amber"><AlertTriangle size={15} /></span>
      <span className="text-[#6b5530] flex-1"><strong>{parityIssues.map(item => item.room).join(', ')}</strong> {parityIssues.length > 1 ? 'are' : 'is'} cheaper on an OTA than on your direct website · guests may book through the platform and you pay commission.</span>
      <button className="text-button" onClick={() => setTab('Room rates')}>Review rates <ChevronRight size={14} /></button>
    </div>}

    <div className="finance-grid">
      <section className="card ledger-card min-w-0">
        <div className="segment-tabs overflow-x-auto">
          {tabs.map(item => <button key={item.name} className={tab === item.name ? 'selected' : ''} onClick={() => setTab(item.name)}>{item.name}{item.count !== undefined && <span>{item.count}</span>}</button>)}
        </div>

        {tab === 'Room rates' && <>
          <div className="table-wrap" style={{ minHeight: 0 }}>
            <table>
              <thead><tr><th>ROOM</th><th>WEEKDAY</th><th>WEEKEND</th><th>BOOKING.COM</th><th>AIRBNB</th><th>PARITY</th>{isOwner && <th />}</tr></thead>
              <tbody>
                {state.rates.map(rate => {
                  const editing = editingRoom === rate.room
                  const parity = parityStatus(rate)
                  return <tr key={rate.room}>
                    <td><strong>{rate.room}</strong><small className="table-sub">{rate.type} · {rate.capacity} guests</small></td>
                    <td>{editing ? rateInput('base') : <strong>{money(rate.base)}</strong>}</td>
                    <td>{editing ? rateInput('weekend') : <>{money(rate.weekend)}<small className="table-sub">+{Math.round((rate.weekend / Math.max(1, rate.base) - 1) * 100)}%</small></>}</td>
                    <td>{editing ? rateInput('bookingCom') : <span style={{ color: rate.bookingCom < rate.base ? '#9a6258' : undefined }}>{money(rate.bookingCom)}</span>}</td>
                    <td>{editing ? rateInput('airbnb') : <span style={{ color: rate.airbnb < rate.base ? '#9a6258' : undefined }}>{money(rate.airbnb)}</span>}</td>
                    <td>{parity === 'Undercut' ? isOwner && !editing ? <button className="verify-button" style={{ color: '#9a6258', background: '#fbf0ee', borderColor: '#f1dcd8' }} onClick={() => fixParity(rate)}>Fix parity</button> : <span className="payment-label unpaid">OTA cheaper</span> : <span className={`payment-label ${parity === 'Parity' ? 'partial' : 'paid'}`}>{parity}</span>}</td>
                    {isOwner && <td>{editing ? <div className="flex gap-1"><button className="verify-button" onClick={() => saveRate(rate.room)}>Save</button><button className="subtle-icon" aria-label="Cancel edit" onClick={() => setEditingRoom(null)}><X size={14} /></button></div> : <button className="text-button" onClick={() => startEdit(rate)}><Pencil size={12} /> Edit</button>}</td>}
                  </tr>
                })}
              </tbody>
            </table>
          </div>
          {state.overrides.length > 0 && <div className="mt-4">
            <p className="text-[9px] font-semibold text-[#8a938b] mb-2">APPROVED DATE-SPECIFIC RATES</p>
            {state.overrides.map(item => <div key={item.id} className="flex items-center gap-3 py-2 border-b border-[#f0f2ee] text-[10px]">
              <strong className="text-[#202922]">{item.room}</strong>
              <span className="text-[#687169]">{shortDate(item.start)} – {shortDate(item.end)}</span>
              <strong className="ml-auto text-[#355d40]">{money(item.rate)}</strong>
              {isOwner && <button className="subtle-icon" aria-label="Remove date rate" onClick={() => removeOverride(item)}><X size={14} /></button>}
            </div>)}
          </div>}
          <p className="muted-note text-[9px] mt-3">Weekend rates apply to Friday and Saturday nights. Seasonal adjustments are applied on top. OTA listed rates should stay above the direct rate (about +15% covers platform commission).</p>
        </>}

        {tab === 'Calendar' && <>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button className="subtle-icon" aria-label="Previous month" onClick={() => shiftMonth(-1)}><ChevronLeft size={16} /></button>
            <strong className="text-[12px] text-[#202922] min-w-[120px] text-center">{monthLabel}</strong>
            <button className="subtle-icon" aria-label="Next month" onClick={() => shiftMonth(1)}><ChevronRight size={16} /></button>
            <select className="period-select ml-auto" value={calendarRoom} onChange={event => setCalendarRoom(event.target.value)} aria-label="Room">{state.rates.map(rate => <option key={rate.room}>{rate.room}</option>)}</select>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[8px] font-semibold text-[#8a938b] mb-1">{WEEKDAYS.map(day => <span key={day} className="text-center">{day.toUpperCase()}</span>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, index) => {
              if (!cell) return <div key={`blank-${index}`} />
              const night = nightlyRate(calendarRoom, cell.date)
              const rule = minStayFor(calendarRoom, cell.date)
              const past = cell.date < TODAY
              return <div key={cell.date} title={`${shortDate(cell.date)} · ${money(night.amount)} · ${night.label}${rule ? ` · min ${rule.minNights} nights` : ''}`} className={`rounded-md border p-1.5 min-h-[54px] flex flex-col ${calendarTone[night.kind]}`} style={{ opacity: past ? 0.45 : 1, outline: cell.date === TODAY ? '2px solid #355d40' : undefined, outlineOffset: -1 }}>
                <span className="text-[8px] text-[#687169]">{cell.day}</span>
                <strong className="text-[10px] text-[#202922] mt-auto" style={{ fontWeight: night.kind === 'standard' ? 500 : 700 }}>{compact(night.amount)}</strong>
                {rule && <span className="text-[7px] text-[#8a6a2f] inline-flex items-center gap-0.5"><Moon size={8} />min {rule.minNights}</span>}
              </div>
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-3 text-[8px] text-[#687169]">
            {[['Weekday', 'bg-white border-[#eef1ec]'], ['Weekend', 'bg-white border-[#c9d1c7]'], ['Peak season', 'bg-[#fbf3e3] border-[#ecd6a8]'], ['Off-peak', 'bg-[#edf3f8] border-[#c3d5e6]'], ['Approved date rate', 'bg-[#eaf3ec] border-[#a9c9b0]']].map(([label, cls]) => <span key={label} className="inline-flex items-center gap-1.5"><i className={`inline-block w-3 h-3 rounded border ${cls}`} />{label}</span>)}
            <span className="inline-flex items-center gap-1"><Moon size={9} />Minimum stay</span>
          </div>
        </>}

        {tab === 'Seasons' && <div className="flex flex-col gap-3">
          {[...state.seasons].sort((a, b) => a.start.localeCompare(b.start)).map(season => {
            const past = season.end < TODAY
            return <article key={season.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-[#e9ece7] p-3 text-[10px]" style={{ opacity: season.active && !past ? 1 : 0.6 }}>
              <span className={`attention-icon ${season.adjustment > 0 ? 'amber' : 'blue'}`}><CalendarDays size={15} /></span>
              <div className="flex-1 min-w-[160px]">
                <strong className="block text-[11px] text-[#202922]">{season.name}</strong>
                <span className="block text-[#7d867e] mt-1">{shortDate(season.start)} – {shortDate(season.end)}{past ? ' · Ended' : season.active ? '' : ' · Disabled'}</span>
              </div>
              <strong className="text-[13px]" style={{ color: season.adjustment > 0 ? '#a17b40' : '#4a734e' }}>{season.adjustment > 0 ? '+' : ''}{season.adjustment}%</strong>
              {isOwner && <div className="flex gap-2">
                <button className="button secondary" onClick={() => toggleSeason(season)}>{season.active ? 'Disable' : 'Enable'}</button>
                <button className="subtle-icon" aria-label={`Remove ${season.name}`} onClick={() => removeSeason(season)}><X size={14} /></button>
              </div>}
            </article>
          })}
          {state.seasons.length === 0 && <p className="text-center text-[10px] text-[#8a938b] py-6">No seasonal rates yet.</p>}

          <div className="flex items-center justify-between mt-3">
            <p className="text-[9px] font-semibold text-[#8a938b] m-0">MINIMUM STAY RULES</p>
            {isOwner && <button className="text-button" onClick={() => setModal('minstay')}><Plus size={12} /> Add rule</button>}
          </div>
          {state.minStays.map(rule => <div key={rule.id} className="flex flex-wrap items-center gap-3 py-2 border-b border-[#f0f2ee] text-[10px]">
            <Moon size={14} className="text-[#a17b40]" />
            <span className="flex-1 min-w-[140px]"><strong className="text-[#202922]">{rule.name}</strong><small className="block text-[8px] text-[#939b94]">{shortDate(rule.start)} – {shortDate(rule.end)} · {rule.room}</small></span>
            <strong>{rule.minNights} nights min</strong>
            {isOwner && <button className="subtle-icon" aria-label={`Remove ${rule.name}`} onClick={() => removeMinStay(rule)}><X size={14} /></button>}
          </div>)}
          {state.minStays.length === 0 && <p className="text-[9px] text-[#8a938b]">No minimum stay rules.</p>}
        </div>}

        {tab === 'Promotions' && <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[['Revenue via promos', money(promoRevenue)], ['Discount given', money(promoDiscount)], ['Return per LKR 1 discount', `LKR ${(promoRevenue / Math.max(1, promoDiscount)).toFixed(1)}`]].map(([label, value]) => <div key={label} className="rounded-lg bg-[#f7f9f6] border border-[#eef1ec] px-3 py-2"><span className="block text-[8px] text-[#8a938b] font-semibold">{label.toUpperCase()}</span><strong className="block text-[12px] text-[#202922] mt-1">{value}</strong></div>)}
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>PROMO CODE</th><th>DISCOUNT</th><th>VALID</th><th>RULES</th><th>USAGE</th><th>PERFORMANCE</th><th>STATUS</th>{isOwner && <th />}</tr></thead>
              <tbody>
                {state.promotions.map(promo => {
                  const status = promoStatus(promo)
                  return <tr key={promo.id}>
                    <td><strong className="font-mono tracking-wide">{promo.code}</strong><small className="table-sub">{promo.name}</small></td>
                    <td><strong>{promo.discountType === 'Percentage' ? `${promo.value}%` : money(promo.value)}</strong></td>
                    <td>{shortDate(promo.start)}<small className="table-sub">to {shortDate(promo.end)}</small></td>
                    <td>{promo.channel}<small className="table-sub">Min {promo.minNights} night{promo.minNights > 1 ? 's' : ''}</small></td>
                    <td>{promo.used}{promo.limit > 0 ? ` / ${promo.limit}` : ''}<small className="table-sub">{promo.limit > 0 ? 'redemptions' : 'unlimited'}</small></td>
                    <td>{promo.revenue > 0 ? <>{money(promo.revenue)}<small className="table-sub">−{money(promo.discountGiven)} discount</small></> : <span className="text-[#939b94]">No bookings yet</span>}</td>
                    <td><span className={`payment-label ${statusColor[status]}`}>{status}</span></td>
                    {isOwner && <td><div className="flex gap-1">
                      {status !== 'Expired' && <button className="subtle-icon" aria-label={`Edit ${promo.code}`} onClick={() => openEditPromotion(promo)}><Pencil size={13} /></button>}
                      {status !== 'Expired' && <button className="subtle-icon" aria-label={promo.paused ? `Activate ${promo.code}` : `Pause ${promo.code}`} onClick={() => togglePromotion(promo)}>{promo.paused ? <Play size={14} /> : <Pause size={14} />}</button>}
                    </div></td>}
                  </tr>
                })}
              </tbody>
            </table>
          </div>
        </>}

        {tab === 'Approvals' && <div className="flex flex-col gap-3">
          {state.requests.map(request => {
            const change = Math.round((request.proposed / request.current - 1) * 1000) / 10
            const fromAi = request.requestedBy.startsWith('AI')
            return <article key={request.id} className="rounded-lg border border-[#e9ece7] p-3 text-[10px]">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`attention-icon ${fromAi ? 'blue' : 'amber'}`}>{fromAi ? <Sparkles size={15} /> : <TrendingUp size={15} />}</span>
                <div className="flex-1 min-w-[160px]">
                  <strong className="block text-[11px] text-[#202922]">{request.room} · {shortDate(request.start)} – {shortDate(request.end)}</strong>
                  <span className="block text-[8px] text-[#939b94] mt-1">Requested by {request.requestedBy}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#8a938b] line-through">{money(request.current)}</span>
                  <ChevronRight size={13} />
                  <strong className="text-[12px] text-[#202922]">{money(request.proposed)}</strong>
                  <span className="segment-pill" style={{ color: change > 0 ? '#4a734e' : '#9a6258' }}>{change > 0 ? '+' : ''}{change}%</span>
                </div>
              </div>
              <p className="text-[#687169] mt-2 mb-0">{request.reason}</p>
              <div className="flex justify-end gap-2 mt-2">
                {request.status === 'Pending' && isOwner ? <>
                  <button className="button secondary" onClick={() => decideRequest(request, 'Rejected')}>Reject</button>
                  <button className="button primary" onClick={() => decideRequest(request, 'Approved')}><Check size={14} /> Approve rate</button>
                </> : <span className={`payment-label ${statusColor[request.status]}`}>{request.status === 'Pending' ? 'Pending owner approval' : request.status}</span>}
              </div>
            </article>
          })}
          <p className="muted-note text-[9px]">Rate suggestions from the AI Business Assistant and staff are never applied automatically.</p>
        </div>}

        {tab === 'History' && <div className="flex flex-col">
          {state.history.map(item => <div key={item.id} className="flex gap-3 py-2.5 border-b border-[#f0f2ee] text-[10px]">
            <span className="attention-icon shrink-0" style={{ background: "#eef4ee", color: "#4a734e" }}><History size={14} /></span>
            <div className="flex-1 min-w-0">
              <strong className="block text-[#202922]">{item.action}</strong>
              <span className="block text-[#687169] mt-0.5">{item.detail}</span>
              <span className="block text-[8px] text-[#939b94] mt-1">{item.by} · {item.at}</span>
            </div>
          </div>)}
          {state.history.length === 0 && <p className="text-center text-[10px] text-[#8a938b] py-6">No pricing changes yet.</p>}
        </div>}
      </section>

      <aside className="card finance-side min-w-0 self-start">
        <div className="card-heading"><div><h2>Price calculator</h2><p>Preview a guest quote with current rules</p></div><Calculator size={17} /></div>
        <div className="form-grid">
          <label className="form-field wide">Room<select value={quote.room} onChange={event => setQuote({ ...quote, room: event.target.value })}>{state.rates.map(rate => <option key={rate.room} value={rate.room}>{rate.room} · {rate.type}</option>)}</select></label>
          <label className="form-field">Check in<input type="date" value={quote.checkIn} onChange={event => setQuote({ ...quote, checkIn: event.target.value })} /></label>
          <label className="form-field">Check out<input type="date" value={quote.checkOut} onChange={event => setQuote({ ...quote, checkOut: event.target.value })} /></label>
          <label className="form-field">Promo code<input placeholder="e.g. TEACOUNTRY10" value={quote.code} onChange={event => setQuote({ ...quote, code: event.target.value })} /></label>
          <label className="form-field">Channel<select value={quote.channel} onChange={event => setQuote({ ...quote, channel: event.target.value as PromoChannel })}><option value="Direct only">Direct booking</option><option value="All channels">OTA booking</option></select></label>
        </div>
        {quoteResult ? <div className="mt-4 text-[10px]">
          {quoteResult.minStayMessage && <div className="flex items-center gap-1.5 rounded-md bg-[#fbf0ee] text-[#9a6258] px-2 py-1.5 mb-2"><AlertTriangle size={12} />{quoteResult.minStayMessage}</div>}
          {quoteResult.nights.map(night => <div key={night.date} className="flex justify-between py-1.5 border-b border-[#f0f2ee]">
            <span><span className="text-[#202922]">{new Date(`${night.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span><small className="block text-[8px] text-[#939b94]">{night.label}</small></span>
            <span className="self-center">{money(night.amount)}</span>
          </div>)}
          <div className="flex justify-between pt-2"><span className="text-[#687169]">Subtotal · {quoteResult.nights.length} night{quoteResult.nights.length > 1 ? 's' : ''}</span><span>{money(quoteResult.subtotal)}</span></div>
          {quoteResult.promoMessage && <div className="flex justify-between pt-1"><span style={{ color: quoteResult.promoApplied ? '#4a734e' : '#9a6258' }}>{quoteResult.promoMessage}</span>{quoteResult.promoApplied && <span style={{ color: '#4a734e' }}>−{money(quoteResult.discount)}</span>}</div>}
          <div className="calc-result mt-3"><span>Guest pays</span><strong>{money(quoteResult.total)}</strong></div>
        </div> : <p className="text-[10px] text-[#9a6258] mt-4">Choose a check-out date after the check-in date.</p>}
      </aside>
    </div>

    {modal && <div className="modal-backdrop" role="presentation" onClick={event => { if (event.target === event.currentTarget) setModal(null) }}>
      <section className="modal max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="pricing-modal-title">
        <div className="modal-head"><div><p className="eyebrow">{modal === 'season' ? 'SEASONAL PRICING' : modal === 'bulk' ? 'ROOM RATES' : modal === 'minstay' ? 'STAY RULES' : 'PROMOTIONS'}</p><h2 id="pricing-modal-title">{modal === 'season' ? 'Add a season' : modal === 'bulk' ? 'Bulk rate update' : modal === 'minstay' ? 'Add minimum stay rule' : editingPromoId ? 'Edit promotion' : 'Create a promotion'}</h2></div><button className="icon-button" onClick={() => setModal(null)} aria-label="Close"><X size={18} /></button></div>

        {modal === 'season' && <>
          <p className="modal-copy">The adjustment is applied to every room&apos;s weekday and weekend rate between these dates. Use a negative value for off-peak discounts.</p>
          <div className="form-grid">
            <label className="form-field wide">Season name<input autoFocus placeholder="e.g. Vesak long weekend" value={seasonForm.name} onChange={event => setSeasonForm({ ...seasonForm, name: event.target.value })} /></label>
            <label className="form-field">Start date<input type="date" value={seasonForm.start} onChange={event => setSeasonForm({ ...seasonForm, start: event.target.value })} /></label>
            <label className="form-field">End date<input type="date" value={seasonForm.end} onChange={event => setSeasonForm({ ...seasonForm, end: event.target.value })} /></label>
            <label className="form-field wide">Rate adjustment (%)<input type="number" min="-50" max="100" value={seasonForm.adjustment} onChange={event => setSeasonForm({ ...seasonForm, adjustment: Number(event.target.value) })} /></label>
          </div>
          <div className="modal-footer"><button className="button secondary" onClick={() => setModal(null)}>Cancel</button><button className="button primary" onClick={addSeason}>Save season <ChevronRight size={15} /></button></div>
        </>}

        {modal === 'bulk' && <>
          <p className="modal-copy">Change several room rates at once. New rates are rounded to the nearest LKR 100 and logged in the pricing history.</p>
          <div className="form-grid">
            <label className="form-field">Change (%)<input autoFocus type="number" min="-50" max="100" value={bulkForm.percent} onChange={event => setBulkForm({ ...bulkForm, percent: Number(event.target.value) })} /></label>
            <label className="form-field">Apply to<select value={bulkForm.target} onChange={event => setBulkForm({ ...bulkForm, target: event.target.value as BulkTarget })}><option>Weekday & weekend</option><option>Weekday only</option><option>Weekend only</option></select></label>
            <label className="form-field wide">Rooms<select value={bulkForm.room} onChange={event => setBulkForm({ ...bulkForm, room: event.target.value })}><option>{ALL_ROOMS}</option>{state.rates.map(rate => <option key={rate.room}>{rate.room}</option>)}</select></label>
          </div>
          <div className="mt-3 rounded-lg bg-[#f7f9f6] border border-[#eef1ec] p-3 text-[9px]">
            {state.rates.filter(rate => bulkForm.room === ALL_ROOMS || rate.room === bulkForm.room).map(rate => {
              const factor = 1 + (bulkForm.percent || 0) / 100
              const nextBase = bulkForm.target !== 'Weekend only' ? roundRate(rate.base * factor) : rate.base
              const nextWeekend = bulkForm.target !== 'Weekday only' ? roundRate(rate.weekend * factor) : rate.weekend
              return <div key={rate.room} className="flex justify-between py-1"><span className="text-[#687169]">{rate.room}</span><span>{money(rate.base)} → <strong>{money(nextBase)}</strong> · {money(rate.weekend)} → <strong>{money(nextWeekend)}</strong></span></div>
            })}
          </div>
          <div className="modal-footer"><button className="button secondary" onClick={() => setModal(null)}>Cancel</button><button className="button primary" onClick={applyBulk}>Apply rates <ChevronRight size={15} /></button></div>
        </>}

        {modal === 'minstay' && <>
          <p className="modal-copy">Guests arriving between these dates must book at least this many nights.</p>
          <div className="form-grid">
            <label className="form-field wide">Rule name<input autoFocus placeholder="e.g. New Year weekend" value={minStayForm.name} onChange={event => setMinStayForm({ ...minStayForm, name: event.target.value })} /></label>
            <label className="form-field">Start date<input type="date" value={minStayForm.start} onChange={event => setMinStayForm({ ...minStayForm, start: event.target.value })} /></label>
            <label className="form-field">End date<input type="date" value={minStayForm.end} onChange={event => setMinStayForm({ ...minStayForm, end: event.target.value })} /></label>
            <label className="form-field">Minimum nights<input type="number" min="2" value={minStayForm.minNights} onChange={event => setMinStayForm({ ...minStayForm, minNights: Number(event.target.value) })} /></label>
            <label className="form-field">Rooms<select value={minStayForm.room} onChange={event => setMinStayForm({ ...minStayForm, room: event.target.value })}><option>{ALL_ROOMS}</option>{state.rates.map(rate => <option key={rate.room}>{rate.room}</option>)}</select></label>
          </div>
          <div className="modal-footer"><button className="button secondary" onClick={() => setModal(null)}>Cancel</button><button className="button primary" onClick={addMinStay}>Save rule <ChevronRight size={15} /></button></div>
        </>}

        {modal === 'promotion' && <>
          <p className="modal-copy">Guests enter the promo code when booking. Percentage discounts are capped at 50%.</p>
          <div className="form-grid">
            <label className="form-field">Promo code<input autoFocus placeholder="e.g. HIGHLAND15" value={promoForm.code} onChange={event => setPromoForm({ ...promoForm, code: event.target.value.toUpperCase() })} /></label>
            <label className="form-field">Name<input placeholder="e.g. Highland getaway" value={promoForm.name} onChange={event => setPromoForm({ ...promoForm, name: event.target.value })} /></label>
            <label className="form-field">Discount type<select value={promoForm.discountType} onChange={event => setPromoForm({ ...promoForm, discountType: event.target.value as DiscountType })}><option>Percentage</option><option>Fixed amount</option></select></label>
            <label className="form-field">{promoForm.discountType === 'Percentage' ? 'Discount (%)' : 'Discount (LKR)'}<input type="number" min="1" value={promoForm.value || ''} onChange={event => setPromoForm({ ...promoForm, value: Number(event.target.value) })} /></label>
            <label className="form-field">Valid from<input type="date" value={promoForm.start} onChange={event => setPromoForm({ ...promoForm, start: event.target.value })} /></label>
            <label className="form-field">Valid until<input type="date" value={promoForm.end} onChange={event => setPromoForm({ ...promoForm, end: event.target.value })} /></label>
            <label className="form-field">Minimum nights<input type="number" min="1" value={promoForm.minNights} onChange={event => setPromoForm({ ...promoForm, minNights: Math.max(1, Number(event.target.value)) })} /></label>
            <label className="form-field">Channel<select value={promoForm.channel} onChange={event => setPromoForm({ ...promoForm, channel: event.target.value as PromoChannel })}><option>Direct only</option><option>All channels</option></select></label>
            <label className="form-field wide">Usage limit (0 = unlimited)<input type="number" min="0" value={promoForm.limit} onChange={event => setPromoForm({ ...promoForm, limit: Math.max(0, Number(event.target.value)) })} /></label>
          </div>
          <div className="modal-footer"><button className="button secondary" onClick={() => setModal(null)}>Cancel</button><button className="button primary" onClick={savePromotion}>{editingPromoId ? 'Save changes' : 'Create promotion'} <ChevronRight size={15} /></button></div>
        </>}
      </section>
    </div>}
  </>
}
