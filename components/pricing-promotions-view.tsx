'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, CalendarDays, Calculator, Check, ChevronRight, Hotel, Pause, Pencil, Play, Plus, Sparkles, Tag, TrendingUp, X } from 'lucide-react'
import { ROOM_DATA, Role } from './reservations-view'

type PricingTab = 'Room rates' | 'Seasons' | 'Promotions' | 'Approvals'
type DiscountType = 'Percentage' | 'Fixed amount'
type PromoChannel = 'All channels' | 'Direct only'
type RequestStatus = 'Pending' | 'Approved' | 'Rejected'

interface RoomRate {
  room: string
  type: string
  capacity: number
  base: number
  weekend: number
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

interface PricingState {
  rates: RoomRate[]
  seasons: Season[]
  promotions: Promotion[]
  requests: RateRequest[]
  overrides: RateOverride[]
}

const STORAGE_KEY = 'villa-tea-fields-pricing'
const TODAY = '2026-11-14'

const initialState: PricingState = {
  rates: ROOM_DATA.map(room => ({ room: room.name, type: room.type, capacity: room.capacity, base: room.rate, weekend: Math.round(room.rate * 1.1 / 100) * 100 })),
  seasons: [
    { id: 'SEA-1', name: 'Christmas & New Year', start: '2026-12-20', end: '2027-01-05', adjustment: 20, active: true },
    { id: 'SEA-2', name: 'Nuwara Eliya April Season', start: '2027-04-01', end: '2027-04-30', adjustment: 35, active: true },
    { id: 'SEA-3', name: 'Monsoon off-peak', start: '2027-06-01', end: '2027-08-31', adjustment: -15, active: true },
    { id: 'SEA-4', name: 'Esala Poya long weekend', start: '2027-07-17', end: '2027-07-20', adjustment: 10, active: false }
  ],
  promotions: [
    { id: 'PRO-1', code: 'TEACOUNTRY10', name: 'Tea Country, Your Way', discountType: 'Percentage', value: 10, start: '2026-11-01', end: '2026-12-15', minNights: 1, channel: 'Direct only', used: 14, limit: 50, paused: false },
    { id: 'PRO-2', code: 'LONGSTAY15', name: 'Stay 4 nights, save 15%', discountType: 'Percentage', value: 15, start: '2026-10-01', end: '2027-03-31', minNights: 4, channel: 'All channels', used: 6, limit: 0, paused: false },
    { id: 'PRO-3', code: 'WELCOME5000', name: 'First-time guest welcome', discountType: 'Fixed amount', value: 5000, start: '2026-11-01', end: '2027-01-31', minNights: 2, channel: 'Direct only', used: 3, limit: 25, paused: true },
    { id: 'PRO-4', code: 'FESTIVE2026', name: 'Festive early bird', discountType: 'Percentage', value: 12, start: '2026-12-01', end: '2026-12-19', minNights: 2, channel: 'Direct only', used: 0, limit: 40, paused: false },
    { id: 'PRO-5', code: 'MONSOON20', name: 'Monsoon escape', discountType: 'Percentage', value: 20, start: '2026-06-01', end: '2026-08-31', minNights: 2, channel: 'All channels', used: 22, limit: 30, paused: false }
  ],
  requests: [
    { id: 'RCR-1', room: 'Room 01', current: 22800, proposed: 25000, start: '2026-11-27', end: '2026-11-29', reason: 'Weekend demand trending 18% higher than usual for late November.', requestedBy: 'AI Business Assistant', status: 'Pending' },
    { id: 'RCR-2', room: 'Room 03', current: 26000, proposed: 23500, start: '2026-11-17', end: '2026-11-19', reason: 'Mid-week gap with no bookings yet · last-minute fill rate.', requestedBy: 'Mira Jayasinghe (Manager)', status: 'Pending' }
  ],
  overrides: []
}

const money = (amount: number) => `LKR ${Math.round(amount || 0).toLocaleString('en-LK')}`
const shortDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const addDays = (value: string, days: number) => { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10) }
const isWeekendNight = (value: string) => [5, 6].includes(new Date(`${value}T12:00:00`).getDay())
const promoStatus = (promo: Promotion) => promo.end < TODAY ? 'Expired' : promo.paused ? 'Paused' : promo.start > TODAY ? 'Scheduled' : promo.limit > 0 && promo.used >= promo.limit ? 'Limit reached' : 'Active'
const statusColor: Record<string, string> = { Active: 'paid', Scheduled: 'partial', Paused: 'partial', Expired: 'unpaid', 'Limit reached': 'unpaid', Approved: 'paid', Rejected: 'unpaid', Pending: 'partial' }

function Stat({ icon, label, value, change, note, tone }: { icon: React.ReactNode; label: string; value: string; change?: string; note: string; tone: string }) {
  return <article className="stat-card"><div className="stat-top"><span className={`stat-icon ${tone}`}>{icon}</span>{change && <span className="stat-change"><ArrowUpRight size={13} />{change}</span>}</div><p>{label}</p><div className="stat-value">{value}</div><small>{note}</small></article>
}

export function PricingPromotionsView({ role, notify }: { role: Role; notify: (message: string) => void }) {
  const [state, setState] = useState<PricingState>(initialState)
  const [loaded, setLoaded] = useState(false)
  const [tab, setTab] = useState<PricingTab>('Room rates')
  const [editingRoom, setEditingRoom] = useState<string | null>(null)
  const [rateDraft, setRateDraft] = useState({ base: 0, weekend: 0 })
  const [modal, setModal] = useState<'season' | 'promotion' | null>(null)
  const [seasonForm, setSeasonForm] = useState({ name: '', start: '2026-12-01', end: '2026-12-10', adjustment: 10 })
  const [promoForm, setPromoForm] = useState({ code: '', name: '', discountType: 'Percentage' as DiscountType, value: 10, start: TODAY, end: '2026-12-31', minNights: 1, channel: 'Direct only' as PromoChannel, limit: 0 })
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
  const pendingRequests = state.requests.filter(item => item.status === 'Pending')
  const activePromotions = state.promotions.filter(item => promoStatus(item) === 'Active')
  const averageRate = state.rates.reduce((sum, item) => sum + item.base, 0) / Math.max(1, state.rates.length)
  const nextSeason = [...state.seasons].filter(item => item.active && item.end >= TODAY).sort((a, b) => a.start.localeCompare(b.start))[0]

  const nightlyRate = (room: string, date: string) => {
    const rate = state.rates.find(item => item.room === room)
    if (!rate) return { amount: 0, label: '' }
    const override = state.overrides.find(item => item.room === room && date >= item.start && date <= item.end)
    if (override) return { amount: override.rate, label: 'Approved rate' }
    const weekend = isWeekendNight(date)
    const season = state.seasons.find(item => item.active && date >= item.start && date <= item.end)
    const startRate = weekend ? rate.weekend : rate.base
    const amount = season ? Math.round(startRate * (1 + season.adjustment / 100)) : startRate
    return { amount, label: [weekend ? 'Weekend' : 'Weekday', season ? `${season.name} ${season.adjustment > 0 ? '+' : ''}${season.adjustment}%` : ''].filter(Boolean).join(' · ') }
  }

  const quoteResult = useMemo(() => {
    if (!quote.checkIn || !quote.checkOut || quote.checkOut <= quote.checkIn) return null
    const nights: { date: string; amount: number; label: string }[] = []
    for (let date = quote.checkIn; date < quote.checkOut && nights.length < 30; date = addDays(date, 1)) nights.push({ date, ...nightlyRate(quote.room, date) })
    const subtotal = nights.reduce((sum, item) => sum + item.amount, 0)
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
    return { nights, subtotal, discount, total: subtotal - discount, promoMessage, promoApplied: discount > 0 }
  }, [quote, state])

  const startEdit = (rate: RoomRate) => { setEditingRoom(rate.room); setRateDraft({ base: rate.base, weekend: rate.weekend }) }
  const saveRate = (room: string) => {
    if (rateDraft.base <= 0 || rateDraft.weekend <= 0) { notify('Rates must be greater than zero'); return }
    setState(current => ({ ...current, rates: current.rates.map(item => item.room === room ? { ...item, ...rateDraft } : item) }))
    setEditingRoom(null)
    notify(`${room} rates updated`)
  }

  const toggleSeason = (id: string) => setState(current => ({ ...current, seasons: current.seasons.map(item => item.id === id ? { ...item, active: !item.active } : item) }))
  const removeSeason = (id: string) => { setState(current => ({ ...current, seasons: current.seasons.filter(item => item.id !== id) })); notify('Season removed') }
  const addSeason = () => {
    if (!seasonForm.name.trim() || !seasonForm.start || seasonForm.end < seasonForm.start || seasonForm.adjustment === 0) { notify('Add a name, valid dates and a non-zero adjustment'); return }
    setState(current => ({ ...current, seasons: [...current.seasons, { id: `SEA-${Date.now()}`, ...seasonForm, name: seasonForm.name.trim(), active: true }] }))
    setModal(null)
    setSeasonForm({ name: '', start: '2026-12-01', end: '2026-12-10', adjustment: 10 })
    setTab('Seasons')
    notify('Seasonal rate added')
  }

  const togglePromotion = (id: string) => {
    const promo = state.promotions.find(item => item.id === id)
    setState(current => ({ ...current, promotions: current.promotions.map(item => item.id === id ? { ...item, paused: !item.paused } : item) }))
    if (promo) notify(promo.paused ? `${promo.code} activated` : `${promo.code} paused`)
  }
  const addPromotion = () => {
    const code = promoForm.code.trim().toUpperCase().replace(/\s+/g, '')
    if (!code || !promoForm.name.trim() || promoForm.value <= 0 || promoForm.end < promoForm.start) { notify('Add a code, name, discount value and valid dates'); return }
    if (promoForm.discountType === 'Percentage' && promoForm.value > 50) { notify('Percentage discounts are capped at 50%'); return }
    if (state.promotions.some(item => item.code === code)) { notify('That promo code already exists'); return }
    setState(current => ({ ...current, promotions: [{ id: `PRO-${Date.now()}`, ...promoForm, code, name: promoForm.name.trim(), used: 0, paused: false }, ...current.promotions] }))
    setModal(null)
    setPromoForm({ code: '', name: '', discountType: 'Percentage', value: 10, start: TODAY, end: '2026-12-31', minNights: 1, channel: 'Direct only', limit: 0 })
    setTab('Promotions')
    notify(`Promotion ${code} created`)
  }

  const decideRequest = (request: RateRequest, status: RequestStatus) => {
    if (!isOwner) { notify('Only the owner can approve rate changes'); return }
    setState(current => ({
      ...current,
      requests: current.requests.map(item => item.id === request.id ? { ...item, status } : item),
      overrides: status === 'Approved' ? [...current.overrides, { id: `OVR-${Date.now()}`, room: request.room, start: request.start, end: request.end, rate: request.proposed }] : current.overrides
    }))
    notify(status === 'Approved' ? `${request.room} rate set to ${money(request.proposed)} for ${shortDate(request.start)} – ${shortDate(request.end)}` : 'Rate change rejected')
  }
  const removeOverride = (id: string) => { setState(current => ({ ...current, overrides: current.overrides.filter(item => item.id !== id) })); notify('Date rate removed · standard pricing restored') }

  const tabs: { name: PricingTab; count: number }[] = [
    { name: 'Room rates', count: state.rates.length },
    { name: 'Seasons', count: state.seasons.filter(item => item.active).length },
    { name: 'Promotions', count: activePromotions.length },
    { name: 'Approvals', count: pendingRequests.length }
  ]

  return <>
    <div className="page-heading">
      <div><p className="eyebrow">BUSINESS MANAGEMENT</p><h1>Pricing & promotions</h1><p className="subheading">Set room rates, seasonal pricing and promo codes. Rates never change without owner approval.</p></div>
      <div className="heading-actions">
        <button className="button secondary" onClick={() => setModal('season')}><CalendarDays size={15} /> Add season</button>
        <button className="button primary" onClick={() => setModal('promotion')}><Plus size={16} /> New promotion</button>
      </div>
    </div>

    <div className="stats-grid">
      <Stat icon={<Hotel />} label="AVERAGE BASE RATE" value={money(averageRate)} note={`Across ${state.rates.length} rooms · per night`} tone="green" />
      <Stat icon={<Tag />} label="ACTIVE PROMOTIONS" value={String(activePromotions.length).padStart(2, '0')} note={`${activePromotions.reduce((sum, item) => sum + item.used, 0)} redemptions so far`} tone="sand" />
      <Stat icon={<Sparkles />} label="PENDING APPROVALS" value={String(pendingRequests.length).padStart(2, '0')} note="Rate change requests" tone="blue" />
      <Stat icon={<TrendingUp />} label="NEXT SEASON" value={nextSeason ? `${nextSeason.adjustment > 0 ? '+' : ''}${nextSeason.adjustment}%` : '—'} note={nextSeason ? `${nextSeason.name} · ${shortDate(nextSeason.start)}` : 'No upcoming seasons'} tone="purple" />
    </div>

    <div className="finance-grid">
      <section className="card ledger-card min-w-0">
        <div className="segment-tabs">
          {tabs.map(item => <button key={item.name} className={tab === item.name ? 'selected' : ''} onClick={() => setTab(item.name)}>{item.name} <span>{item.count}</span></button>)}
        </div>

        {tab === 'Room rates' && <>
          <div className="table-wrap">
            <table>
              <thead><tr><th>ROOM</th><th>CAPACITY</th><th>WEEKDAY RATE</th><th>WEEKEND RATE</th><th>WEEKEND UPLIFT</th>{isOwner && <th />}</tr></thead>
              <tbody>
                {state.rates.map(rate => {
                  const editing = editingRoom === rate.room
                  return <tr key={rate.room}>
                    <td><strong>{rate.room}</strong><small className="table-sub">{rate.type}</small></td>
                    <td>{rate.capacity} guests</td>
                    <td>{editing ? <input type="number" min="1" className="w-24 h-7 border border-[#e3e8e1] rounded-md px-2 text-[10px]" value={rateDraft.base || ''} onChange={event => setRateDraft({ ...rateDraft, base: Number(event.target.value) })} /> : <strong>{money(rate.base)}</strong>}</td>
                    <td>{editing ? <input type="number" min="1" className="w-24 h-7 border border-[#e3e8e1] rounded-md px-2 text-[10px]" value={rateDraft.weekend || ''} onChange={event => setRateDraft({ ...rateDraft, weekend: Number(event.target.value) })} /> : money(rate.weekend)}</td>
                    <td><span className="segment-pill">+{Math.round(((editing ? rateDraft.weekend : rate.weekend) / Math.max(1, editing ? rateDraft.base : rate.base) - 1) * 100)}%</span></td>
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
              {isOwner && <button className="subtle-icon" aria-label="Remove date rate" onClick={() => removeOverride(item.id)}><X size={14} /></button>}
            </div>)}
          </div>}
          <p className="muted-note text-[9px] mt-3">Weekend rates apply to Friday and Saturday nights. Seasonal adjustments are applied on top of these rates.</p>
        </>}

        {tab === 'Seasons' && <div className="flex flex-col gap-3">
          {[...state.seasons].sort((a, b) => a.start.localeCompare(b.start)).map(season => {
            const past = season.end < TODAY
            return <article key={season.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-[#e9ece7] p-3 text-[10px]" style={{ opacity: season.active && !past ? 1 : 0.6 }}>
              <span className={`attention-icon ${season.adjustment > 0 ? 'amber' : 'blue'}`}><CalendarDays size={15} /></span>
              <div className="flex-1 min-w-[160px]">
                <strong className="block text-[11px] text-[#202922]">{season.name}</strong>
                <span className="block text-[#7d867e] mt-1">{shortDate(season.start)} – {shortDate(season.end)}{past ? ' · Ended' : ''}</span>
              </div>
              <strong className="text-[13px]" style={{ color: season.adjustment > 0 ? '#a17b40' : '#4a734e' }}>{season.adjustment > 0 ? '+' : ''}{season.adjustment}%</strong>
              {isOwner && <div className="flex gap-2">
                <button className="button secondary" onClick={() => toggleSeason(season.id)}>{season.active ? 'Disable' : 'Enable'}</button>
                <button className="subtle-icon" aria-label={`Remove ${season.name}`} onClick={() => removeSeason(season.id)}><X size={14} /></button>
              </div>}
            </article>
          })}
          {state.seasons.length === 0 && <p className="text-center text-[10px] text-[#8a938b] py-8">No seasonal rates yet.</p>}
        </div>}

        {tab === 'Promotions' && <div className="table-wrap">
          <table>
            <thead><tr><th>PROMO CODE</th><th>DISCOUNT</th><th>VALID</th><th>RULES</th><th>USAGE</th><th>STATUS</th>{isOwner && <th />}</tr></thead>
            <tbody>
              {state.promotions.map(promo => {
                const status = promoStatus(promo)
                return <tr key={promo.id}>
                  <td><strong className="font-mono tracking-wide">{promo.code}</strong><small className="table-sub">{promo.name}</small></td>
                  <td><strong>{promo.discountType === 'Percentage' ? `${promo.value}%` : money(promo.value)}</strong></td>
                  <td>{shortDate(promo.start)}<small className="table-sub">to {shortDate(promo.end)}</small></td>
                  <td>{promo.channel}<small className="table-sub">Min {promo.minNights} night{promo.minNights > 1 ? 's' : ''}</small></td>
                  <td>{promo.used}{promo.limit > 0 ? ` / ${promo.limit}` : ''}<small className="table-sub">{promo.limit > 0 ? 'redemptions' : 'unlimited'}</small></td>
                  <td><span className={`payment-label ${statusColor[status]}`}>{status}</span></td>
                  {isOwner && <td>{status !== 'Expired' && <button className="subtle-icon" aria-label={promo.paused ? `Activate ${promo.code}` : `Pause ${promo.code}`} onClick={() => togglePromotion(promo.id)}>{promo.paused ? <Play size={14} /> : <Pause size={14} />}</button>}</td>}
                </tr>
              })}
            </tbody>
          </table>
        </div>}

        {tab === 'Approvals' && <div className="flex flex-col gap-3">
          {state.requests.map(request => {
            const change = Math.round((request.proposed / request.current - 1) * 1000) / 10
            return <article key={request.id} className="rounded-lg border border-[#e9ece7] p-3 text-[10px]">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`attention-icon ${request.requestedBy.startsWith('AI') ? 'blue' : 'amber'}`}>{request.requestedBy.startsWith('AI') ? <Sparkles size={15} /> : <TrendingUp size={15} />}</span>
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
      </section>

      <aside className="card finance-side min-w-0">
        <div className="card-heading"><div><h2>Price calculator</h2><p>Preview a guest quote with current rules</p></div><Calculator size={17} /></div>
        <div className="form-grid">
          <label className="form-field wide">Room<select value={quote.room} onChange={event => setQuote({ ...quote, room: event.target.value })}>{state.rates.map(rate => <option key={rate.room} value={rate.room}>{rate.room} · {rate.type}</option>)}</select></label>
          <label className="form-field">Check in<input type="date" value={quote.checkIn} onChange={event => setQuote({ ...quote, checkIn: event.target.value })} /></label>
          <label className="form-field">Check out<input type="date" value={quote.checkOut} onChange={event => setQuote({ ...quote, checkOut: event.target.value })} /></label>
          <label className="form-field">Promo code<input placeholder="e.g. TEACOUNTRY10" value={quote.code} onChange={event => setQuote({ ...quote, code: event.target.value })} /></label>
          <label className="form-field">Channel<select value={quote.channel} onChange={event => setQuote({ ...quote, channel: event.target.value as PromoChannel })}><option value="Direct only">Direct booking</option><option value="All channels">OTA booking</option></select></label>
        </div>
        {quoteResult ? <div className="mt-4 text-[10px]">
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
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="pricing-modal-title">
        <div className="modal-head"><div><p className="eyebrow">{modal === 'season' ? 'SEASONAL PRICING' : 'PROMOTIONS'}</p><h2 id="pricing-modal-title">{modal === 'season' ? 'Add a season' : 'Create a promotion'}</h2></div><button className="icon-button" onClick={() => setModal(null)} aria-label="Close"><X size={18} /></button></div>
        {modal === 'season' ? <>
          <p className="modal-copy">The adjustment is applied to every room&apos;s weekday and weekend rate between these dates. Use a negative value for off-peak discounts.</p>
          <div className="form-grid">
            <label className="form-field wide">Season name<input autoFocus placeholder="e.g. Vesak long weekend" value={seasonForm.name} onChange={event => setSeasonForm({ ...seasonForm, name: event.target.value })} /></label>
            <label className="form-field">Start date<input type="date" value={seasonForm.start} onChange={event => setSeasonForm({ ...seasonForm, start: event.target.value })} /></label>
            <label className="form-field">End date<input type="date" value={seasonForm.end} onChange={event => setSeasonForm({ ...seasonForm, end: event.target.value })} /></label>
            <label className="form-field wide">Rate adjustment (%)<input type="number" min="-50" max="100" value={seasonForm.adjustment} onChange={event => setSeasonForm({ ...seasonForm, adjustment: Number(event.target.value) })} /></label>
          </div>
          <div className="modal-footer"><button className="button secondary" onClick={() => setModal(null)}>Cancel</button><button className="button primary" onClick={addSeason}>Save season <ChevronRight size={15} /></button></div>
        </> : <>
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
          <div className="modal-footer"><button className="button secondary" onClick={() => setModal(null)}>Cancel</button><button className="button primary" onClick={addPromotion}>Create promotion <ChevronRight size={15} /></button></div>
        </>}
      </section>
    </div>}
  </>
}
