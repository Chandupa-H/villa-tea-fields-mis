'use client'

import React, { useState, useEffect } from 'react'
import {
  HeartHandshake, Mail, MessageSquare, Phone, Search, Filter,
  Check, X, Edit2, Eye, Plus, Send, AlertCircle, Sparkles,
  Users, CheckCircle2, RotateCcw, Calendar, ShieldCheck
} from 'lucide-react'
import {
  GuestConsentRecord, MarketingCampaign,
  INITIAL_GUEST_CONSENTS, INITIAL_CAMPAIGNS
} from './mock-data'

const CONSENT_STATUS_BADGES: Record<string, string> = {
  Consented: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Not Consented': 'bg-slate-100 text-slate-600 border-slate-200',
  Withdrawn: 'bg-rose-50 text-rose-700 border-rose-200'
}

const CAMPAIGN_STATUS_BADGES: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  Scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  Sent: 'bg-emerald-50 text-emerald-700 border-emerald-200'
}

interface MarketingConsentProps {
  notify: (msg: string) => void
}

export function MarketingConsent({ notify }: MarketingConsentProps) {
  // Persistence for Guest Consents
  const [consents, setConsents] = useState<GuestConsentRecord[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vtf-settings-guest-consents')
      if (saved) {
        try { return JSON.parse(saved) } catch {}
      }
    }
    return INITIAL_GUEST_CONSENTS
  })

  // Persistence for Marketing Campaigns
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vtf-settings-campaigns')
      if (saved) {
        try { return JSON.parse(saved) } catch {}
      }
    }
    return INITIAL_CAMPAIGNS
  })

  useEffect(() => {
    localStorage.setItem('vtf-settings-guest-consents', JSON.stringify(consents))
  }, [consents])

  useEffect(() => {
    localStorage.setItem('vtf-settings-campaigns', JSON.stringify(campaigns))
  }, [campaigns])

  // Sub-navigation
  const [activeTab, setActiveTab] = useState<'consents' | 'campaigns'>('consents')

  // Search & Filters for Consents
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [channelFilter, setChannelFilter] = useState<'All' | 'Email' | 'SMS' | 'WhatsApp'>('All')

  // Modals
  const [editingConsent, setEditingConsent] = useState<GuestConsentRecord | null>(null)
  const [viewingConsent, setViewingConsent] = useState<GuestConsentRecord | null>(null)

  // Campaign Modals
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false)
  const [previewCampaign, setPreviewCampaign] = useState<MarketingCampaign | null>(null)

  // Campaign Form State
  const [campName, setCampName] = useState('')
  const [campDesc, setCampDesc] = useState('')
  const [campChannel, setCampChannel] = useState<'Email' | 'SMS' | 'WhatsApp'>('Email')
  const [campAudience, setCampAudience] = useState('All Consented Guests')
  const [campContent, setCampContent] = useState('')
  const [campDate, setCampDate] = useState('2026-11-25 10:00')

  // Metrics
  const totalCount = consents.length
  const consentedCount = consents.filter(c => c.status === 'Consented').length
  const withdrawnCount = consents.filter(c => c.status === 'Withdrawn').length
  const notConsentedCount = consents.filter(c => c.status === 'Not Consented').length
  const emailConsentedCount = consents.filter(c => c.emailConsent).length
  const whatsappConsentedCount = consents.filter(c => c.whatsappConsent).length

  // Save edited consent
  const handleSaveConsent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingConsent) return

    setConsents(prev => prev.map(c => c.id === editingConsent.id ? editingConsent : c))
    notify(`Consent preferences updated for ${editingConsent.guestName}.`)
    setEditingConsent(null)
  }

  // Quick toggle consent status
  const handleQuickStatusChange = (id: string, newStatus: GuestConsentRecord['status']) => {
    setConsents(prev => prev.map(c => {
      if (c.id === id) {
        notify(`Consent status for ${c.guestName} changed to ${newStatus}.`)
        return {
          ...c,
          status: newStatus,
          emailConsent: newStatus === 'Consented' ? c.emailConsent : false,
          smsConsent: newStatus === 'Consented' ? c.smsConsent : false,
          whatsappConsent: newStatus === 'Consented' ? c.whatsappConsent : false
        }
      }
      return c
    }))
  }

  // Open Create Campaign
  const handleOpenAddCampaign = () => {
    setCampName('')
    setCampDesc('')
    setCampChannel('Email')
    setCampAudience('All Consented Guests')
    setCampContent('Experience misty mornings and fresh Ceylon tea in Nuwara Eliya. Book directly to enjoy 15% off and complimentary breakfast.')
    setCampDate('2026-11-25 10:00')
    setIsCampaignModalOpen(true)
  }

  // Save Campaign
  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault()
    if (!campName.trim()) {
      notify('Please enter a campaign title.')
      return
    }

    const newCampaign: MarketingCampaign = {
      id: `CAMP-${Date.now().toString().slice(-4)}`,
      name: campName,
      description: campDesc,
      channel: campChannel,
      targetAudience: campAudience,
      status: 'Scheduled',
      recipientCount: consentedCount,
      scheduledDate: campDate,
      content: campContent
    }

    setCampaigns(prev => [newCampaign, ...prev])
    notify(`Campaign "${campName}" scheduled (Demo Mode).`)
    setIsCampaignModalOpen(false)
  }

  // Filtered consents
  const filteredConsents = consents.filter(c => {
    const matchesQuery = c.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter
    const matchesChannel = channelFilter === 'All'
      ? true
      : channelFilter === 'Email'
      ? c.emailConsent
      : channelFilter === 'SMS'
      ? c.smsConsent
      : c.whatsappConsent
    return matchesQuery && matchesStatus && matchesChannel
  })

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E9EF]">
        <div>
          <h2 className="text-lg font-bold text-[#172B4D]">Marketing Consent</h2>
          <p className="text-xs text-[#778196] mt-0.5">
            Maintain guest opt-in compliance across channels and coordinate targeted Ceylon estate promotions.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-[#F2F4F8] rounded-lg">
          <button
            onClick={() => setActiveTab('consents')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
              activeTab === 'consents'
                ? 'bg-white text-[#172B4D] shadow-xs'
                : 'text-[#778196] hover:text-[#172B4D]'
            }`}
          >
            Consent Registry ({consents.length})
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
              activeTab === 'campaigns'
                ? 'bg-white text-[#172B4D] shadow-xs'
                : 'text-[#778196] hover:text-[#172B4D]'
            }`}
          >
            Promotional Campaigns ({campaigns.length})
          </button>
        </div>
      </div>

      {/* ==============================================================
          METRIC STATS OVERVIEW CARDS
          ============================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-[#E5E9EF] shadow-xs">
          <div className="flex items-center justify-between text-[#778196] text-xs mb-1">
            <span>Total Consented</span>
            <span className="p-1 rounded bg-emerald-50 text-emerald-700"><CheckCircle2 size={13} /></span>
          </div>
          <strong className="text-xl font-bold text-[#172B4D]">{consentedCount}</strong>
          <span className="text-[11px] text-[#27877D] block mt-0.5 font-medium">
            {Math.round((consentedCount / (totalCount || 1)) * 100)}% of registered guests
          </span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-[#E5E9EF] shadow-xs">
          <div className="flex items-center justify-between text-[#778196] text-xs mb-1">
            <span>Consent Withdrawn</span>
            <span className="p-1 rounded bg-rose-50 text-rose-700"><X size={13} /></span>
          </div>
          <strong className="text-xl font-bold text-[#172B4D]">{withdrawnCount}</strong>
          <span className="text-[11px] text-[#778196] block mt-0.5">
            Opted out of all campaigns
          </span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-[#E5E9EF] shadow-xs">
          <div className="flex items-center justify-between text-[#778196] text-xs mb-1">
            <span>Not Consented</span>
            <span className="p-1 rounded bg-slate-100 text-slate-600"><AlertCircle size={13} /></span>
          </div>
          <strong className="text-xl font-bold text-[#172B4D]">{notConsentedCount}</strong>
          <span className="text-[11px] text-[#778196] block mt-0.5">
            Pending guest response
          </span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-[#E5E9EF] shadow-xs">
          <div className="flex items-center justify-between text-[#778196] text-xs mb-1">
            <span>Active WhatsApp Reach</span>
            <span className="p-1 rounded bg-emerald-50 text-emerald-700"><Phone size={13} /></span>
          </div>
          <strong className="text-xl font-bold text-[#0F473E]">{whatsappConsentedCount}</strong>
          <span className="text-[11px] text-[#27877D] block mt-0.5 font-medium">
            High-engagement direct channel
          </span>
        </div>
      </div>

      {/* ==============================================================
          TAB 1: GUEST CONSENT REGISTRY TABLE
          ============================================================== */}
      {activeTab === 'consents' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#778196]" />
                <input
                  type="text"
                  placeholder="Search guest by name, email or phone..."
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
                <option value="Consented">Consented</option>
                <option value="Not Consented">Not Consented</option>
                <option value="Withdrawn">Withdrawn</option>
              </select>

              <select
                value={channelFilter}
                onChange={e => setChannelFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-white border border-[#E5E9EF] rounded-lg text-[#202939]"
              >
                <option value="All">All Channels</option>
                <option value="Email">Email Opt-in Only</option>
                <option value="SMS">SMS Opt-in Only</option>
                <option value="WhatsApp">WhatsApp Opt-in Only</option>
              </select>
            </div>
          </div>

          {/* Consents Table */}
          <div className="bg-white rounded-xl border border-[#E5E9EF] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E5E9EF] text-[#778196] font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Guest Name</th>
                    <th className="py-3 px-3">Contact Channels</th>
                    <th className="py-3 px-3 text-center">Email</th>
                    <th className="py-3 px-3 text-center">SMS</th>
                    <th className="py-3 px-3 text-center">WhatsApp</th>
                    <th className="py-3 px-3">Consent Date</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E9EF]">
                  {filteredConsents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#778196]">
                        No guest consent records found for the active criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredConsents.map(consent => (
                      <tr key={consent.id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3 px-4">
                          <strong className="block text-[#172B4D] font-semibold text-xs">
                            {consent.guestName}
                          </strong>
                          <span className="text-[11px] text-[#778196]">
                            Ref: {consent.id}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[#202939] block text-xs">{consent.email}</span>
                          <span className="text-[11px] text-[#778196]">{consent.phone}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {consent.emailConsent ? (
                            <span className="inline-flex p-1 rounded-full bg-emerald-50 text-emerald-600">
                              <Check size={14} />
                            </span>
                          ) : (
                            <span className="inline-flex p-1 rounded-full bg-slate-100 text-slate-400">
                              <X size={14} />
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {consent.smsConsent ? (
                            <span className="inline-flex p-1 rounded-full bg-blue-50 text-blue-600">
                              <Check size={14} />
                            </span>
                          ) : (
                            <span className="inline-flex p-1 rounded-full bg-slate-100 text-slate-400">
                              <X size={14} />
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {consent.whatsappConsent ? (
                            <span className="inline-flex p-1 rounded-full bg-emerald-50 text-emerald-600">
                              <Check size={14} />
                            </span>
                          ) : (
                            <span className="inline-flex p-1 rounded-full bg-slate-100 text-slate-400">
                              <X size={14} />
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-[#778196]">
                          {consent.consentDate}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${CONSENT_STATUS_BADGES[consent.status]}`}>
                            {consent.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setViewingConsent(consent)}
                              className="p-1.5 text-slate-500 hover:text-[#172B4D] hover:bg-[#F0F4F8] rounded transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye size={15} />
                            </button>
                            <button
                              onClick={() => setEditingConsent({ ...consent })}
                              className="p-1.5 text-slate-500 hover:text-[#27877D] hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                              title="Edit Consent"
                            >
                              <Edit2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 2: MARKETING CAMPAIGNS (FRONTEND SIMULATOR)
          ============================================================== */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                <Sparkles size={16} />
              </span>
              <div>
                <strong className="text-amber-900 block font-bold">
                  Frontend Campaign Sandbox (Demo Mode)
                </strong>
                <span className="text-amber-700">
                  Allows creating and scheduling guest promotional offers. No live emails or SMS are sent.
                </span>
              </div>
            </div>

            <button
              onClick={handleOpenAddCampaign}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#172B4D] hover:bg-[#0F1D34] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus size={14} />
              <span>Create Campaign</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {campaigns.map(camp => (
              <div
                key={camp.id}
                className="bg-white rounded-xl border border-[#E5E9EF] p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${CAMPAIGN_STATUS_BADGES[camp.status]}`}>
                      {camp.status}
                    </span>
                    <span className="text-[11px] font-semibold text-[#27877D] flex items-center gap-1">
                      {camp.channel === 'Email' ? <Mail size={12} /> : camp.channel === 'WhatsApp' ? <Phone size={12} /> : <MessageSquare size={12} />}
                      {camp.channel}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#172B4D] mb-1">
                    {camp.name}
                  </h3>
                  <p className="text-xs text-[#778196] leading-relaxed mb-3">
                    {camp.description}
                  </p>

                  <div className="p-2.5 bg-[#F8FAFC] border border-[#E5E9EF] rounded-lg text-xs space-y-1 mb-3">
                    <div className="flex justify-between text-[#778196]">
                      <span>Target Audience:</span>
                      <strong className="text-[#172B4D] truncate max-w-36">{camp.targetAudience}</strong>
                    </div>
                    <div className="flex justify-between text-[#778196]">
                      <span>Recipients:</span>
                      <strong className="text-[#172B4D]">{camp.recipientCount} guests</strong>
                    </div>
                    <div className="flex justify-between text-[#778196]">
                      <span>Scheduled:</span>
                      <span className="font-mono text-[10px]">{camp.scheduledDate}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E5E9EF] flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">Demo Active</span>
                  <button
                    onClick={() => setPreviewCampaign(camp)}
                    className="inline-flex items-center gap-1 text-[#27877D] hover:underline font-semibold cursor-pointer"
                  >
                    <Eye size={13} />
                    <span>Preview Message</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: EDIT GUEST CONSENT
          ============================================================== */}
      {editingConsent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E5E9EF] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9EF] mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#27877D]">
                  Consent Compliance Editor
                </span>
                <h3 className="text-base font-bold text-[#172B4D]">
                  {editingConsent.guestName}
                </h3>
              </div>
              <button
                onClick={() => setEditingConsent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConsent} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Overall Consent Status</label>
                <select
                  value={editingConsent.status}
                  onChange={e => setEditingConsent({ ...editingConsent, status: e.target.value as any })}
                  className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                >
                  <option value="Consented">Consented (Opted In)</option>
                  <option value="Not Consented">Not Consented (No explicit agreement)</option>
                  <option value="Withdrawn">Withdrawn (Opted Out / Unsubscribed)</option>
                </select>
              </div>

              <div className="space-y-2 p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E9EF]">
                <span className="font-semibold text-[#172B4D] block mb-1">Permitted Communication Channels:</span>
                
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <span className="text-[#172B4D]">Promotional Email Newsletter</span>
                  <input
                    type="checkbox"
                    checked={editingConsent.emailConsent}
                    onChange={e => setEditingConsent({ ...editingConsent, emailConsent: e.target.checked })}
                    className="rounded text-[#27877D] focus:ring-[#27877D]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1">
                  <span className="text-[#172B4D]">SMS Flash Discounts</span>
                  <input
                    type="checkbox"
                    checked={editingConsent.smsConsent}
                    onChange={e => setEditingConsent({ ...editingConsent, smsConsent: e.target.checked })}
                    className="rounded text-[#27877D] focus:ring-[#27877D]"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer py-1">
                  <span className="text-[#172B4D]">WhatsApp High Tea & Seasonal Vouchers</span>
                  <input
                    type="checkbox"
                    checked={editingConsent.whatsappConsent}
                    onChange={e => setEditingConsent({ ...editingConsent, whatsappConsent: e.target.checked })}
                    className="rounded text-[#27877D] focus:ring-[#27877D]"
                  />
                </label>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Audit Notes / Reason</label>
                <textarea
                  rows={2}
                  value={editingConsent.notes || ''}
                  onChange={e => setEditingConsent({ ...editingConsent, notes: e.target.value })}
                  placeholder="Record origin of consent (e.g. check-in card, booking portal)..."
                  className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E9EF]">
                <button
                  type="button"
                  onClick={() => setEditingConsent(null)}
                  className="px-3.5 py-1.5 border border-[#E5E9EF] rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#27877D] hover:bg-[#1E6E66] text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Update Consent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: VIEW CONSENT DETAILS
          ============================================================== */}
      {viewingConsent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[#E5E9EF] animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-[#E5E9EF] mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#778196]">
                  Guest Consent Record
                </span>
                <h3 className="text-base font-bold text-[#172B4D]">
                  {viewingConsent.guestName}
                </h3>
              </div>
              <button
                onClick={() => setViewingConsent(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E5E9EF] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#778196]">Email:</span>
                  <span className="font-semibold text-[#172B4D]">{viewingConsent.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#778196]">Phone:</span>
                  <span className="text-[#172B4D]">{viewingConsent.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#778196]">Recorded Date:</span>
                  <span className="font-mono text-[#172B4D]">{viewingConsent.consentDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#778196]">Status:</span>
                  <span className={`inline-block px-2 py-0.2 rounded-full text-[10px] font-semibold border ${CONSENT_STATUS_BADGES[viewingConsent.status]}`}>
                    {viewingConsent.status}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-[#172B4D] block mb-1">Channel Status:</span>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
                  <div className={`p-2 rounded border ${viewingConsent.emailConsent ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                    Email: <b>{viewingConsent.emailConsent ? 'Opt-In' : 'No'}</b>
                  </div>
                  <div className={`p-2 rounded border ${viewingConsent.smsConsent ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                    SMS: <b>{viewingConsent.smsConsent ? 'Opt-In' : 'No'}</b>
                  </div>
                  <div className={`p-2 rounded border ${viewingConsent.whatsappConsent ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                    WhatsApp: <b>{viewingConsent.whatsappConsent ? 'Opt-In' : 'No'}</b>
                  </div>
                </div>
              </div>

              {viewingConsent.notes && (
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-[#778196] text-[11px]">
                  <b>Audit Note:</b> {viewingConsent.notes}
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-[#E5E9EF] flex justify-end">
              <button
                onClick={() => setViewingConsent(null)}
                className="px-4 py-1.5 bg-[#172B4D] text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: CREATE MARKETING CAMPAIGN
          ============================================================== */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E5E9EF] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9EF] mb-4">
              <h3 className="text-base font-bold text-[#172B4D]">
                Create Guest Promotional Campaign
              </h3>
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  value={campName}
                  onChange={e => setCampName(e.target.value)}
                  placeholder="e.g. December Highland Tea Harvest Special"
                  className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Campaign Objective</label>
                <input
                  type="text"
                  value={campDesc}
                  onChange={e => setCampDesc(e.target.value)}
                  placeholder="e.g. Direct booking promotion with free high tea"
                  className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Dispatch Channel</label>
                  <select
                    value={campChannel}
                    onChange={e => setCampChannel(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  >
                    <option value="Email">Email Newsletter</option>
                    <option value="WhatsApp">WhatsApp Message</option>
                    <option value="SMS">SMS Text</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#172B4D] mb-1">Target Audience</label>
                  <select
                    value={campAudience}
                    onChange={e => setCampAudience(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                  >
                    <option value="All Consented Guests">All Consented Guests</option>
                    <option value="Repeat Guests Only">Repeat Guests Only</option>
                    <option value="Sri Lankan Residents">Sri Lankan Residents</option>
                    <option value="Winter Season Inquiries">Winter Inquiries</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Message Body</label>
                <textarea
                  rows={3}
                  required
                  value={campContent}
                  onChange={e => setCampContent(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E9EF]">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-3.5 py-1.5 border border-[#E5E9EF] rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#172B4D] hover:bg-[#0F1D34] text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Schedule Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: CAMPAIGN PREVIEW
          ============================================================== */}
      {previewCampaign && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E5E9EF] animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-[#E5E9EF] mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#27877D]">
                  Campaign Preview · {previewCampaign.channel}
                </span>
                <h3 className="text-base font-bold text-[#172B4D]">
                  {previewCampaign.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewCampaign(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed space-y-2">
              <div className="text-[11px] font-semibold text-[#172B4D] pb-1 border-b border-slate-200">
                Audience: {previewCampaign.targetAudience} ({previewCampaign.recipientCount} eligible guests)
              </div>
              <p>{previewCampaign.content}</p>
              <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                Sent from: Villa Tea Fields Marketing Desk, Nuwara Eliya
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5E9EF] flex justify-end">
              <button
                onClick={() => setPreviewCampaign(null)}
                className="px-4 py-1.5 bg-[#172B4D] text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
