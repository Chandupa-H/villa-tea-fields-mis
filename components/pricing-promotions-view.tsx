'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Check, ChevronDown, ChevronRight, MessageCircle, MoreHorizontal, Pause, Play, Plus, Trash2, TrendingUp, Users, Wallet, X } from 'lucide-react'
import { Role } from './reservations-view'

type Period = 'This week' | 'This month' | 'Last month' | 'This year'
type CampaignAudience = 'All guests' | 'Repeat guests' | 'First-time guests' | 'Local guests' | 'International guests'
type CampaignChannel = 'Direct booking' | 'All channels'

interface ChannelRow {
  channel: string
  bookings: number
  gross: number
  commissionRate: number
}

interface PeriodData {
  rows: ChannelRow[]
  directShare: number
  commissionPaid: number
  directChange: string
  repeatGuests: string
  repeatChange: string
  guestProfiles: number
  rating: string
  reviews: number
}

interface Campaign {
  id: string
  name: string
  audience: CampaignAudience
  channel: CampaignChannel
  offer: number
  start: string
  end: string
  paused: boolean
}

const STORAGE_KEY = 'villa-tea-fields-campaigns'
const TODAY = '2026-11-14'
const PERIODS: Period[] = ['This week', 'This month', 'Last month', 'This year']
const AUDIENCES: CampaignAudience[] = ['All guests', 'Repeat guests', 'First-time guests', 'Local guests', 'International guests']

const PERIOD_DATA: Record<Period, PeriodData> = {
  'This week': {
    rows: [
      { channel: 'Direct · Website', bookings: 3, gross: 118000, commissionRate: 0 },
      { channel: 'WhatsApp & phone', bookings: 2, gross: 76000, commissionRate: 0 },
      { channel: 'Booking.com', bookings: 2, gross: 98000, commissionRate: 0.15 },
      { channel: 'Airbnb', bookings: 1, gross: 45600, commissionRate: 0.15 },
      { channel: 'Agoda & other', bookings: 1, gross: 39000, commissionRate: 0.15 }
    ],
    directShare: 38, commissionPaid: 28400, directChange: '5.1%', repeatGuests: '33%', repeatChange: '1.2%', guestProfiles: 186, rating: '4.9', reviews: 6
  },
  'This month': {
    rows: [
      { channel: 'Direct · Website', bookings: 12, gross: 486000, commissionRate: 0 },
      { channel: 'WhatsApp & phone', bookings: 9, gross: 342000, commissionRate: 0 },
      { channel: 'Booking.com', bookings: 8, gross: 392000, commissionRate: 0.15 },
      { channel: 'Airbnb', bookings: 5, gross: 224000, commissionRate: 0.15 },
      { channel: 'Agoda & other', bookings: 4, gross: 182000, commissionRate: 0.15 }
    ],
    directShare: 42, commissionPaid: 184600, directChange: '8.4%', repeatGuests: '32%', repeatChange: '4.2%', guestProfiles: 186, rating: '4.8', reviews: 42
  },
  'Last month': {
    rows: [
      { channel: 'Direct · Website', bookings: 10, gross: 402000, commissionRate: 0 },
      { channel: 'WhatsApp & phone', bookings: 7, gross: 268000, commissionRate: 0 },
      { channel: 'Booking.com', bookings: 10, gross: 476000, commissionRate: 0.15 },
      { channel: 'Airbnb', bookings: 6, gross: 262000, commissionRate: 0.15 },
      { channel: 'Agoda & other', bookings: 5, gross: 214000, commissionRate: 0.15 }
    ],
    directShare: 36, commissionPaid: 213000, directChange: '3.6%', repeatGuests: '28%', repeatChange: '2.1%', guestProfiles: 171, rating: '4.7', reviews: 38
  },
  'This year': {
    rows: [
      { channel: 'Direct · Website', bookings: 118, gross: 4820000, commissionRate: 0 },
      { channel: 'WhatsApp & phone', bookings: 84, gross: 3290000, commissionRate: 0 },
      { channel: 'Booking.com', bookings: 102, gross: 4950000, commissionRate: 0.15 },
      { channel: 'Airbnb', bookings: 61, gross: 2710000, commissionRate: 0.15 },
      { channel: 'Agoda & other', bookings: 43, gross: 1880000, commissionRate: 0.15 }
    ],
    directShare: 40, commissionPaid: 1985000, directChange: '11.8%', repeatGuests: '30%', repeatChange: '6.5%', guestProfiles: 186, rating: '4.8', reviews: 312
  }
}

const initialCampaigns: Campaign[] = [
  { id: 'CMP-1', name: 'Tea Country, Your Way', audience: 'Repeat guests', channel: 'Direct booking', offer: 10, start: '2026-11-01', end: '2026-12-15', paused: false },
  { id: 'CMP-2', name: 'Festive Highland Escape', audience: 'All guests', channel: 'Direct booking', offer: 12, start: '2026-12-01', end: '2026-12-31', paused: false },
  { id: 'CMP-3', name: 'Monsoon Retreat', audience: 'Local guests', channel: 'All channels', offer: 20, start: '2026-06-01', end: '2026-08-31', paused: false }
]

const emptyForm = { name: '', audience: 'All guests' as CampaignAudience, channel: 'Direct booking' as CampaignChannel, offer: 10, start: TODAY, end: '2026-12-31' }

const money = (amount: number) => `LKR ${Math.round(amount || 0).toLocaleString('en-LK')}`
const compactMoney = (amount: number) => amount >= 1000000 ? `LKR ${(amount / 1000000).toFixed(2)}M` : `LKR ${Math.floor(amount / 1000)}k`
const shortDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
const campaignStatus = (campaign: Campaign) => campaign.end < TODAY ? 'Ended' : campaign.paused ? 'Paused' : campaign.start > TODAY ? 'Scheduled' : 'Active'

function Stat({ icon, label, value, change, note, tone }: { icon: React.ReactNode; label: string; value: string; change?: string; note: string; tone: string }) {
  return <article className="stat-card"><div className="stat-top"><span className={`stat-icon ${tone}`}>{icon}</span>{change && <span className="stat-change"><ArrowUpRight size={13} />{change}</span>}</div><p>{label}</p><div className="stat-value">{value}</div><small>{note}</small></article>
}

export function PricingPromotionsView({ role, notify }: { role: Role; notify: (message: string) => void }) {
  const [period, setPeriod] = useState<Period>('This month')
  const [periodOpen, setPeriodOpen] = useState(false)
  const [percent, setPercent] = useState(20)
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [loaded, setLoaded] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const periodRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) setCampaigns(JSON.parse(stored))
    } catch {
      setCampaigns(initialCampaigns)
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns)) } catch {}
  }, [campaigns, loaded])

  useEffect(() => {
    if (!periodOpen && !menuId) return
    const close = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (periodOpen && periodRef.current && !periodRef.current.contains(target)) setPeriodOpen(false)
      if (menuId && !target.closest('[data-campaign-menu]')) setMenuId(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [periodOpen, menuId])

  const canManage = role === 'Owner' || role === 'Manager'
  const data = PERIOD_DATA[period]
  const rows = data.rows.map(row => ({ ...row, commission: Math.round(row.gross * row.commissionRate) }))
  const directShare = data.directShare
  const totalCommission = data.commissionPaid
  const maxGross = Math.max(1, ...rows.map(row => row.gross))
  const savings = Math.round(totalCommission * percent / 100)
  const periodNote = period === 'This year' ? 'Year to date' : period
  const savingsLabel = period === 'This week' ? 'Potential weekly savings' : period === 'This year' ? 'Potential yearly savings' : 'Potential monthly savings'

  const visibleCampaigns = showAll ? [...campaigns].sort((a, b) => b.start.localeCompare(a.start)) : campaigns.filter(item => campaignStatus(item) === 'Active')

  const choosePeriod = (value: Period) => { setPeriod(value); setPeriodOpen(false) }

  const createCampaign = () => {
    if (!form.name.trim() || form.offer <= 0 || form.offer > 50 || !form.start || form.end < form.start) { notify('Add a name, an offer between 1–50% and valid dates'); return }
    const campaign: Campaign = { id: `CMP-${Date.now()}`, ...form, name: form.name.trim(), paused: false }
    setCampaigns(current => [campaign, ...current])
    setShowCreate(false)
    setForm(emptyForm)
    if (campaignStatus(campaign) !== 'Active') setShowAll(true)
    notify(`Campaign "${campaign.name}" created`)
  }

  const togglePause = (campaign: Campaign) => {
    setCampaigns(current => current.map(item => item.id === campaign.id ? { ...item, paused: !item.paused } : item))
    setMenuId(null)
    if (!campaign.paused && !showAll) setShowAll(true)
    notify(campaign.paused ? `${campaign.name} resumed` : `${campaign.name} paused`)
  }

  const removeCampaign = (campaign: Campaign) => {
    setCampaigns(current => current.filter(item => item.id !== campaign.id))
    setMenuId(null)
    notify(`${campaign.name} removed`)
  }

  return <>
    <div className="page-heading">
      <div><p className="eyebrow">BUSINESS MANAGEMENT</p><h1>Pricing & Promotions</h1><p className="subheading">Build guest relationships and grow direct bookings.</p></div>
      {canManage && <button className="button primary" onClick={() => setShowCreate(true)}><Plus size={16} /> New campaign</button>}
    </div>

    <div className="stats-grid">
      <Stat icon={<TrendingUp />} label="DIRECT BOOKINGS" value={`${directShare}%`} change={data.directChange} note={period === 'This week' ? 'vs. last week' : period === 'This year' ? 'vs. last year' : period === 'Last month' ? 'vs. October' : 'vs. last month'} tone="green" />
      <Stat icon={<Users />} label="REPEAT GUESTS" value={data.repeatGuests} change={data.repeatChange} note={`${data.guestProfiles} guest profiles`} tone="sand" />
      <Stat icon={<Wallet />} label="COMMISSION PAID" value={compactMoney(totalCommission)} note={`${periodNote} · estimated`} tone="blue" />
      <Stat icon={<MessageCircle />} label="GUEST RATING" value={`${data.rating} / 5`} note={`Across ${data.reviews} reviews`} tone="purple" />
    </div>

    <div className="marketing-grid">
      <section className="card channel-analysis">
        <div className="card-heading">
          <div><h2>Channel performance</h2><p>Compare bookings, gross revenue and commission</p></div>
          <div className="relative" ref={periodRef}>
            <button className="button secondary" onClick={() => setPeriodOpen(!periodOpen)} aria-haspopup="listbox" aria-expanded={periodOpen}>{period} <ChevronDown size={14} /></button>
            {periodOpen && <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-[#e9ece7] bg-white py-1 shadow-lg" role="listbox">
              {PERIODS.map(item => <button key={item} role="option" aria-selected={item === period} className="flex w-full items-center justify-between px-3 py-2 text-left text-[10px] text-[#465048] hover:bg-[#f7f8f5]" onClick={() => choosePeriod(item)}>{item}{item === period && <Check size={12} className="text-[#355d40]" />}</button>)}
            </div>}
          </div>
        </div>
        {rows.map((row, index) => <div className="channel-row" key={row.channel}>
          <span className="channel-rank">0{index + 1}</span>
          <strong>{row.channel}</strong>
          <div className="channel-bar"><i style={{ width: `${Math.round(row.gross / maxGross * 84)}%` }} /></div>
          <span>{row.bookings} bookings</span>
          <strong>{money(row.gross)}</strong>
          <span className="commission-value">{money(row.commission)}</span>
        </div>)}
      </section>

      <aside className="card savings-calculator">
        <div className="calc-icon"><TrendingUp size={18} /></div>
        <p className="eyebrow">REVENUE CALCULATOR</p>
        <h2>What if more guests booked direct?</h2>
        <p>Estimate the commission savings by shifting bookings to direct channels.</p>
        <label className="calc-slider-label">Convert <strong>{percent}%</strong> of OTA bookings</label>
        <input className="savings-slider" type="range" min="0" max="50" value={percent} onChange={event => setPercent(Number(event.target.value))} />
        <div className="calc-result"><span>{savingsLabel}</span><strong>{money(savings)}</strong></div>
        <small className="muted-note">Estimated based on {period.toLowerCase()} channel mix.</small>
      </aside>
    </div>

    <section className="card campaign-card">
      <div className="card-heading">
        <div><h2>{showAll ? 'All campaigns' : 'Active campaigns'}</h2><p>{showAll ? 'Active, scheduled, paused and past campaigns' : 'Active promotional offers and campaigns'}</p></div>
        <button className="text-button" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show active only' : 'View all'} <ChevronRight size={14} /></button>
      </div>
      {visibleCampaigns.map(campaign => {
        const status = campaignStatus(campaign)
        return <div className="campaign-row" key={campaign.id} style={{ opacity: status === 'Active' || status === 'Scheduled' ? 1 : 0.65 }}>
          <div className="campaign-symbol">✳</div>
          <div><strong>{campaign.name}</strong><span>{campaign.audience} · {campaign.channel} · {campaign.offer}% offer</span></div>
          <span className="campaign-status">{status} · {shortDate(campaign.start)} – {shortDate(campaign.end)}</span>
          <div className="relative" data-campaign-menu>
            <button className="subtle-icon" onClick={() => setMenuId(menuId === campaign.id ? null : campaign.id)} aria-label={`${campaign.name} options`}><MoreHorizontal size={17} /></button>
            {menuId === campaign.id && <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-[#e9ece7] bg-white py-1 shadow-lg">
              {status !== 'Ended' && canManage && <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-[#465048] hover:bg-[#f7f8f5]" onClick={() => togglePause(campaign)}>{campaign.paused ? <><Play size={12} /> Resume</> : <><Pause size={12} /> Pause</>}</button>}
              {canManage && <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] text-[#9a6258] hover:bg-[#fbf0ee]" onClick={() => removeCampaign(campaign)}><Trash2 size={12} /> Remove</button>}
              {!canManage && <span className="block px-3 py-2 text-[10px] text-[#8a938b]">View only</span>}
            </div>}
          </div>
        </div>
      })}
      {visibleCampaigns.length === 0 && <p className="text-center text-[10px] text-[#8a938b] py-6">{showAll ? 'No campaigns yet.' : 'No active campaigns right now.'}</p>}
    </section>

    {showCreate && <div className="modal-backdrop" role="presentation" onClick={event => { if (event.target === event.currentTarget) setShowCreate(false) }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="campaign-title">
        <div className="modal-head"><div><p className="eyebrow">NEW CAMPAIGN</p><h2 id="campaign-title">Create a campaign</h2></div><button className="icon-button" onClick={() => setShowCreate(false)} aria-label="Close"><X size={18} /></button></div>
        <p className="modal-copy">Promotional offers help shift bookings to direct channels and reduce platform commission.</p>
        <div className="form-grid">
          <label className="form-field wide">Campaign name<input autoFocus placeholder="e.g. Highland Weekend Getaway" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
          <label className="form-field">Audience<select value={form.audience} onChange={event => setForm({ ...form, audience: event.target.value as CampaignAudience })}>{AUDIENCES.map(item => <option key={item}>{item}</option>)}</select></label>
          <label className="form-field">Channel<select value={form.channel} onChange={event => setForm({ ...form, channel: event.target.value as CampaignChannel })}><option>Direct booking</option><option>All channels</option></select></label>
          <label className="form-field">Offer (%)<input type="number" min="1" max="50" value={form.offer || ''} onChange={event => setForm({ ...form, offer: Number(event.target.value) })} /></label>
          <label className="form-field">Start date<input type="date" value={form.start} onChange={event => setForm({ ...form, start: event.target.value })} /></label>
          <label className="form-field wide">End date<input type="date" value={form.end} onChange={event => setForm({ ...form, end: event.target.value })} /></label>
        </div>
        <div className="modal-footer"><button className="button secondary" onClick={() => setShowCreate(false)}>Cancel</button><button className="button primary" onClick={createCampaign}>Create campaign <ChevronRight size={15} /></button></div>
      </section>
    </div>}
  </>
}
