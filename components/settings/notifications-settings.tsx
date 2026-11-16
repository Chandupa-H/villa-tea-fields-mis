'use client'

import React, { useState, useEffect } from 'react'
import {
  Bell, Mail, MessageSquare, Phone, Check, Edit2, Eye,
  RotateCcw, Search, Filter, Smartphone, CheckCircle2,
  Calendar, CreditCard, Users, ClipboardCheck, Sparkles, X, Clock
} from 'lucide-react'
import {
  NotificationItem, NotificationLog,
  INITIAL_NOTIFICATIONS, INITIAL_NOTIFICATION_LOGS
} from './mock-data'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Booking: <Calendar size={15} className="text-[#27877D]" />,
  Payment: <CreditCard size={15} className="text-amber-600" />,
  Guest: <Users size={15} className="text-blue-600" />,
  Operations: <ClipboardCheck size={15} className="text-purple-600" />
}

const LOG_STATUS_BADGES: Record<string, string> = {
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Failed: 'bg-rose-50 text-rose-700 border-rose-200'
}

interface NotificationsSettingsProps {
  notify: (msg: string) => void
}

export function NotificationsSettings({ notify }: NotificationsSettingsProps) {
  // Persistence for notifications
  const [items, setItems] = useState<NotificationItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vtf-settings-notifications')
      if (saved) {
        try { return JSON.parse(saved) } catch {}
      }
    }
    return INITIAL_NOTIFICATIONS
  })

  const [logs, setLogs] = useState<NotificationLog[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vtf-settings-notif-logs')
      if (saved) {
        try { return JSON.parse(saved) } catch {}
      }
    }
    return INITIAL_NOTIFICATION_LOGS
  })

  useEffect(() => {
    localStorage.setItem('vtf-settings-notifications', JSON.stringify(items))
  }, [items])

  useEffect(() => {
    localStorage.setItem('vtf-settings-notif-logs', JSON.stringify(logs))
  }, [logs])

  // Sub-navigation
  const [activeTab, setActiveTab] = useState<'triggers' | 'logs'>('triggers')
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Booking' | 'Payment' | 'Guest' | 'Operations'>('All')

  // Modals
  const [editingTemplate, setEditingTemplate] = useState<NotificationItem | null>(null)
  const [previewItem, setPreviewItem] = useState<{ item: NotificationItem; channel: 'email' | 'whatsapp' | 'sms' } | null>(null)

  // Edit form state
  const [subjectDraft, setSubjectDraft] = useState('')
  const [bodyDraft, setBodyDraft] = useState('')
  const [recipientsDraft, setRecipientsDraft] = useState<NotificationItem['recipients']>([])

  // Toggle master notification enabled
  const handleToggleMaster = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const next = !item.enabled
        notify(`"${item.title}" ${next ? 'enabled' : 'disabled'}.`)
        return { ...item, enabled: next }
      }
      return item
    }))
  }

  // Toggle specific channel
  const handleToggleChannel = (id: string, channel: 'email' | 'sms' | 'whatsapp') => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextState = !item.channels[channel]
        return {
          ...item,
          channels: {
            ...item.channels,
            [channel]: nextState
          }
        }
      }
      return item
    }))
  }

  // Open Template Editor
  const handleOpenEditTemplate = (item: NotificationItem) => {
    setEditingTemplate(item)
    setSubjectDraft(item.template.subject)
    setBodyDraft(item.template.body)
    setRecipientsDraft([...item.recipients])
  }

  // Save Template
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTemplate) return

    setItems(prev => prev.map(item => {
      if (item.id === editingTemplate.id) {
        return {
          ...item,
          recipients: recipientsDraft,
          template: {
            subject: subjectDraft,
            body: bodyDraft
          }
        }
      }
      return item
    }))

    notify(`Template for "${editingTemplate.title}" saved.`)
    setEditingTemplate(null)
  }

  // Save All
  const handleSaveAll = () => {
    localStorage.setItem('vtf-settings-notifications', JSON.stringify(items))
    notify('All notification dispatch preferences and communication channels saved.')
  }

  const filteredItems = items.filter(i => categoryFilter === 'All' || i.category === categoryFilter)

  return (
    <div className="space-y-6">
      {/* Top Header & Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E9EF]">
        <div>
          <h2 className="text-lg font-bold text-[#172B4D]">Notifications</h2>
          <p className="text-xs text-[#778196] mt-0.5">
            Configure automated alerts across Email, SMS & WhatsApp for reservations, billing, check-ins, and housekeeping.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#F2F4F8] rounded-lg">
            <button
              onClick={() => setActiveTab('triggers')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                activeTab === 'triggers'
                  ? 'bg-white text-[#172B4D] shadow-xs'
                  : 'text-[#778196] hover:text-[#172B4D]'
              }`}
            >
              Event Triggers ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-white text-[#172B4D] shadow-xs'
                  : 'text-[#778196] hover:text-[#172B4D]'
              }`}
            >
              Dispatch Logs ({logs.length})
            </button>
          </div>

          <button
            onClick={handleSaveAll}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#27877D] hover:bg-[#1E6E66] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Check size={14} />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>

      {/* ==============================================================
          TAB 1: EVENT TRIGGERS BY CATEGORY
          ============================================================== */}
      {activeTab === 'triggers' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['All', 'Booking', 'Payment', 'Guest', 'Operations'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#172B4D] text-white shadow-xs'
                    : 'bg-white border border-[#E5E9EF] text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat} {cat === 'All' ? `(${items.length})` : `(${items.filter(i => i.category === cat).length})`}
              </button>
            ))}
          </div>

          {/* Notification Cards List */}
          <div className="space-y-3">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className={`bg-white rounded-xl border p-4 shadow-xs transition-all ${
                  item.enabled ? 'border-[#E5E9EF]' : 'border-slate-200 opacity-60 bg-slate-50/70'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 mt-0.5 shrink-0">
                      {CATEGORY_ICONS[item.category]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded bg-slate-100 text-slate-600">
                          {item.category}
                        </span>
                        <h4 className="text-sm font-bold text-[#172B4D]">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-xs text-[#778196] mt-0.5">
                        {item.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[11px] text-[#778196]">Recipients:</span>
                        {item.recipients.map(r => (
                          <span
                            key={r}
                            className="px-1.5 py-0.2 rounded bg-[#172B4D]/5 text-[#172B4D] text-[10px] font-semibold border border-[#172B4D]/10"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Channel Toggles & Actions */}
                  <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E5E9EF]">
                    <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E9EF] p-1.5 rounded-lg text-xs">
                      {/* Email Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleChannel(item.id, 'email')}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                          item.channels.email
                            ? 'bg-[#172B4D] text-white'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="Toggle Email"
                      >
                        <Mail size={12} />
                        <span>Email</span>
                      </button>

                      {/* SMS Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleChannel(item.id, 'sms')}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                          item.channels.sms
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="Toggle SMS"
                      >
                        <MessageSquare size={12} />
                        <span>SMS</span>
                      </button>

                      {/* WhatsApp Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleChannel(item.id, 'whatsapp')}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                          item.channels.whatsapp
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="Toggle WhatsApp"
                      >
                        <Phone size={12} />
                        <span>WhatsApp</span>
                      </button>
                    </div>

                    {/* Template buttons */}
                    <button
                      onClick={() => handleOpenEditTemplate(item)}
                      className="p-1.5 text-slate-500 hover:text-[#27877D] hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                      title="Edit Message Template"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      onClick={() => setPreviewItem({ item, channel: item.channels.whatsapp ? 'whatsapp' : 'email' })}
                      className="p-1.5 text-slate-500 hover:text-[#172B4D] hover:bg-[#F0F4F8] rounded transition-colors cursor-pointer"
                      title="Preview Message"
                    >
                      <Eye size={16} />
                    </button>

                    {/* Master Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleMaster(item.id)}
                      className={`w-9 h-5 rounded-full transition-colors relative inline-flex items-center p-0.5 cursor-pointer ml-1 ${
                        item.enabled ? 'bg-[#27877D]' : 'bg-slate-300'
                      }`}
                      title={item.enabled ? 'Enabled' : 'Disabled'}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white transition-transform ${item.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 2: DISPATCH HISTORY LOGS
          ============================================================== */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-xl border border-[#E5E9EF] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E5E9EF] text-[#778196] font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-4">Log ID</th>
                  <th className="py-2.5 px-3">Recipient Address / Phone</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Event Trigger</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Dispatched Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E9EF]">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-[#F9FAFB]">
                    <td className="py-2.5 px-4 font-mono text-[11px] font-semibold text-[#172B4D]">
                      {log.id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#202939]">
                      {log.recipient}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-xs text-[#172B4D]">{log.channel}</span>
                    </td>
                    <td className="py-2.5 px-3 text-[#778196]">
                      {log.event}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${LOG_STATUS_BADGES[log.status]}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[11px] text-[#778196]">
                      {log.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: EDIT NOTIFICATION TEMPLATE
          ============================================================== */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#E5E9EF] animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9EF] mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#27877D] tracking-wider">
                  Template Customizer
                </span>
                <h3 className="text-base font-bold text-[#172B4D]">
                  {editingTemplate.title}
                </h3>
              </div>
              <button
                onClick={() => setEditingTemplate(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Email Subject Header</label>
                <input
                  type="text"
                  required
                  value={subjectDraft}
                  onChange={e => setSubjectDraft(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[#172B4D]">Message Content Body</label>
                  <span className="text-[10px] text-[#778196]">Supports SMS / WhatsApp formatting</span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={bodyDraft}
                  onChange={e => setBodyDraft(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#E5E9EF] rounded-lg text-[#202939] font-mono text-[11px]"
                />
              </div>

              {/* Dynamic Variables helper */}
              <div className="p-2.5 bg-[#F8FAFC] border border-[#E5E9EF] rounded-lg">
                <span className="font-semibold text-[11px] text-[#172B4D] block mb-1">
                  Insertable Dynamic Tags (Click to copy):
                </span>
                <div className="flex flex-wrap gap-1">
                  {['{guest_name}', '{room_name}', '{check_in}', '{check_out}', '{booking_id}', '{total_amount}'].map(tag => (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => setBodyDraft(prev => prev + ' ' + tag)}
                      className="px-1.5 py-0.5 rounded bg-white border border-[#E5E9EF] text-[10px] font-mono text-[#27877D] hover:bg-emerald-50 cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Role Checkboxes */}
              <div>
                <label className="block font-semibold text-[#172B4D] mb-1">Deliver Alert To:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Owner', 'Manager', 'Deputy Manager', 'Housekeeper', 'Guest'] as const).map(role => {
                    const isChecked = recipientsDraft.includes(role)
                    return (
                      <label
                        key={role}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer ${
                          isChecked ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setRecipientsDraft(recipientsDraft.filter(r => r !== role))
                            } else {
                              setRecipientsDraft([...recipientsDraft, role])
                            }
                          }}
                          className="rounded text-[#27877D] focus:ring-[#27877D]"
                        />
                        <span>{role}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E9EF]">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-3.5 py-1.5 border border-[#E5E9EF] rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#27877D] hover:bg-[#1E6E66] text-white rounded-lg font-semibold shadow-xs cursor-pointer"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: LIVE MESSAGE PREVIEW (EMAIL / WHATSAPP / SMS)
          ============================================================== */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#E5E9EF] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E9EF] mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#778196]">
                  Simulated Notification Dispatch
                </span>
                <h3 className="text-base font-bold text-[#172B4D]">
                  {previewItem.item.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Channel Switch in preview */}
            <div className="flex items-center gap-1.5 mb-4 p-1 bg-slate-100 rounded-lg text-xs">
              <button
                onClick={() => setPreviewItem({ ...previewItem, channel: 'whatsapp' })}
                className={`flex-1 py-1 rounded text-center font-semibold cursor-pointer ${
                  previewItem.channel === 'whatsapp' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                }`}
              >
                WhatsApp Chat
              </button>
              <button
                onClick={() => setPreviewItem({ ...previewItem, channel: 'email' })}
                className={`flex-1 py-1 rounded text-center font-semibold cursor-pointer ${
                  previewItem.channel === 'email' ? 'bg-[#172B4D] text-white' : 'text-slate-600'
                }`}
              >
                Email Client
              </button>
              <button
                onClick={() => setPreviewItem({ ...previewItem, channel: 'sms' })}
                className={`flex-1 py-1 rounded text-center font-semibold cursor-pointer ${
                  previewItem.channel === 'sms' ? 'bg-blue-600 text-white' : 'text-slate-600'
                }`}
              >
                SMS Text
              </button>
            </div>

            {/* Simulated Device Bubble */}
            {previewItem.channel === 'whatsapp' && (
              <div className="p-4 rounded-xl bg-[#ECE5DD] border border-[#D5CCC1] space-y-2">
                <div className="flex items-center gap-2 pb-2 border-b border-black/10 text-xs text-slate-700">
                  <div className="w-6 h-6 rounded-full bg-[#075E54] text-white flex items-center justify-center font-bold text-[10px]">
                    VT
                  </div>
                  <div>
                    <strong className="block text-[#075E54]">Villa Tea Fields Host</strong>
                    <span className="text-[10px] text-slate-500">Official Business Account</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg shadow-xs text-xs text-slate-800 leading-relaxed rounded-tl-none">
                  {previewItem.item.template.body
                    .replace('{guest_name}', 'Amelia Hart')
                    .replace('{room_name}', 'Planter\'s Vista Suite')
                    .replace('{check_in}', 'Nov 14, 2026')
                    .replace('{check_out}', 'Nov 17, 2026')
                    .replace('{booking_id}', 'VT-2481')
                    .replace('{total_amount}', 'LKR 68,400')
                  }
                  <div className="text-[10px] text-right text-slate-400 mt-1 flex items-center justify-end gap-1">
                    <span>10:42 AM</span>
                    <span className="text-emerald-500">✓✓</span>
                  </div>
                </div>
              </div>
            )}

            {previewItem.channel === 'email' && (
              <div className="p-4 rounded-xl bg-white border border-[#E5E9EF] shadow-xs space-y-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] space-y-1">
                  <div className="text-slate-500">From: <b>reservations@villateafields.lk</b></div>
                  <div className="text-slate-500">To: <b>amelia.hart@gmail.com</b></div>
                  <div className="font-bold text-[#172B4D] pt-1">
                    Subject: {previewItem.item.template.subject.replace('{booking_id}', 'VT-2481')}
                  </div>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-lg text-slate-800 leading-relaxed text-xs">
                  {previewItem.item.template.body
                    .replace('{guest_name}', 'Amelia Hart')
                    .replace('{room_name}', 'Planter\'s Vista Suite')
                    .replace('{check_in}', 'Nov 14, 2026')
                    .replace('{check_out}', 'Nov 17, 2026')
                    .replace('{booking_id}', 'VT-2481')
                    .replace('{total_amount}', 'LKR 68,400')
                  }
                </div>
              </div>
            )}

            {previewItem.channel === 'sms' && (
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 space-y-2 text-xs">
                <div className="text-[10px] font-mono text-center text-slate-400">
                  SMS Message · Sender: VILLA-TEA
                </div>
                <div className="p-3 bg-blue-600 text-white rounded-2xl rounded-tr-none text-xs leading-relaxed shadow-xs">
                  {previewItem.item.template.body
                    .replace('{guest_name}', 'Amelia Hart')
                    .replace('{room_name}', 'Planter\'s Vista Suite')
                    .replace('{check_in}', 'Nov 14, 2026')
                    .replace('{check_out}', 'Nov 17, 2026')
                    .replace('{booking_id}', 'VT-2481')
                    .replace('{total_amount}', 'LKR 68,400')
                  }
                </div>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-[#E5E9EF] flex justify-end">
              <button
                onClick={() => setPreviewItem(null)}
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
