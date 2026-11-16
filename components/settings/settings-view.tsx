'use client'

import React, { useState } from 'react'
import {
  ChevronRight, Hotel, BedDouble, TrendingUp, Calendar,
  CreditCard, Bell, Users, HeartHandshake, ShieldCheck,
  Check, Save, Sparkles, MapPin, Globe, Phone, Mail
} from 'lucide-react'
import { RoomConfigurations } from './room-configurations'
import { PricingSeasons } from './pricing-seasons'
import { BookingPolicies } from './booking-policies'
import { PaymentsDeposits } from './payments-deposits'
import { NotificationsSettings } from './notifications-settings'
import { UsersRoles } from './users-roles'
import { MarketingConsent } from './marketing-consent'

const SETTINGS_TABS = [
  { id: 'hotel', label: 'Hotel information', icon: Hotel },
  { id: 'rooms', label: 'Room configurations', icon: BedDouble },
  { id: 'pricing', label: 'Pricing & seasons', icon: TrendingUp },
  { id: 'policies', label: 'Booking policies', icon: Calendar },
  { id: 'payments', label: 'Payments & deposits', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'users', label: 'Users & roles', icon: Users },
  { id: 'marketing', label: 'Marketing consent', icon: HeartHandshake }
] as const

interface SettingsViewProps {
  notify: (message: string) => void
}

export function SettingsView({ notify }: SettingsViewProps) {
  const [selectedTab, setSelectedTab] = useState<number>(0)

  // Hotel info state
  const [propertyName, setPropertyName] = useState('Villa Tea Fields')
  const [location, setLocation] = useState('Pedro Estate Road, Nuwara Eliya, Sri Lanka')
  const [propertyType, setPropertyType] = useState('Boutique Tea Estate Villa')
  const [currency, setCurrency] = useState('LKR · Sri Lankan Rupee')
  const [checkInPolicy, setCheckInPolicy] = useState('Check-in: 2:00 PM · Check-out: 11:00 AM')
  const [contactEmail, setContactEmail] = useState('stay@villateafields.lk')
  const [contactPhone, setContactPhone] = useState('+94 52 222 4589')
  const [websiteUrl, setWebsiteUrl] = useState('https://villateafields.lk')

  const handleSaveHotelInfo = (e: React.FormEvent) => {
    e.preventDefault()
    notify('Property identity & hotel information saved.')
  }

  return (
    <div className="space-y-4">
      {/* Page Title & Eyebrow */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Settings</h1>
          <p className="subheading">
            Configure your property policies, room inventory, pricing rules, payment systems, and staff permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold hidden sm:inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            MIS v2.4 Online
          </span>
        </div>
      </div>

      {/* Main Settings Layout (Sidebar Navigation + Active Panel) */}
      <div className="settings-layout">
        {/* Left Submenu Navigation */}
        <nav className="card settings-menu" aria-label="Settings sections">
          {SETTINGS_TABS.map((tab, index) => {
            const Icon = tab.icon
            const isSelected = selectedTab === index
            return (
              <button
                type="button"
                className={isSelected ? 'selected' : ''}
                key={tab.id}
                onClick={() => setSelectedTab(index)}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} className={isSelected ? 'text-[#27877D]' : 'text-[#778196]'} />
                  <span className="text-xs">{tab.label}</span>
                </div>
                <ChevronRight
                  size={14}
                  className={`transition-transform ${isSelected ? 'translate-x-0.5 text-[#27877D]' : 'text-slate-300'}`}
                />
              </button>
            )
          })}
        </nav>

        {/* Right Content Panel */}
        <section className="card settings-panel min-w-0">
          {/* TAB 0: Hotel Information */}
          {selectedTab === 0 && (
            <div className="space-y-5">
              <div className="card-heading pb-3 border-b border-[#E5E9EF]">
                <div>
                  <h2 className="text-base font-bold text-[#172B4D]">Hotel Information</h2>
                  <p className="text-xs text-[#778196]">
                    Core property profile displayed across booking engines, guest vouchers, and invoices.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveHotelInfo} className="space-y-4 text-xs">
                <div className="settings-fields">
                  <label className="form-field">
                    <span>Property Name</span>
                    <input
                      type="text"
                      value={propertyName}
                      onChange={e => setPropertyName(e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span>Property Type</span>
                    <select
                      value={propertyType}
                      onChange={e => setPropertyType(e.target.value)}
                    >
                      <option value="Boutique Tea Estate Villa">Boutique Tea Estate Villa</option>
                      <option value="Luxury Heritage Bungalow">Luxury Heritage Bungalow</option>
                      <option value="Eco Resort & Tea Plantation">Eco Resort & Tea Plantation</option>
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Physical Location</span>
                    <input
                      type="text"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span>Accounting & Operating Currency</span>
                    <select
                      value={currency}
                      onChange={e => setCurrency(e.target.value)}
                    >
                      <option value="LKR · Sri Lankan Rupee">LKR · Sri Lankan Rupee (Default)</option>
                      <option value="USD · US Dollar">USD · US Dollar</option>
                      <option value="EUR · Euro">EUR · Euro</option>
                      <option value="GBP · British Pound">GBP · British Pound</option>
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Official Reservations Email</span>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span>Front Desk / WhatsApp Phone</span>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={e => setContactPhone(e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span>Website Domain</span>
                    <input
                      type="text"
                      value={websiteUrl}
                      onChange={e => setWebsiteUrl(e.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span>Standard Operating Schedule</span>
                    <input
                      type="text"
                      value={checkInPolicy}
                      onChange={e => setCheckInPolicy(e.target.value)}
                    />
                  </label>

                  <div className="setting-note">
                    <ShieldCheck size={16} className="text-[#27877D] shrink-0 mt-0.5" />
                    <span>
                      Policies such as advance deposits, security bonds and cancellation terms are configurable in their dedicated tabs.
                      All rates and transactions across the Villa Tea Fields HMIS are reconciled in Sri Lankan Rupees (LKR).
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E5E9EF] flex justify-end">
                  <button
                    type="submit"
                    className="button primary inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check size={14} />
                    <span>Save Hotel Information</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 1: Room Configurations */}
          {selectedTab === 1 && (
            <RoomConfigurations notify={notify} />
          )}

          {/* TAB 2: Pricing & Seasons */}
          {selectedTab === 2 && (
            <PricingSeasons notify={notify} />
          )}

          {/* TAB 3: Booking Policies */}
          {selectedTab === 3 && (
            <BookingPolicies notify={notify} />
          )}

          {/* TAB 4: Payments & Deposits */}
          {selectedTab === 4 && (
            <PaymentsDeposits notify={notify} />
          )}

          {/* TAB 5: Notifications */}
          {selectedTab === 5 && (
            <NotificationsSettings notify={notify} />
          )}

          {/* TAB 6: Users & Roles */}
          {selectedTab === 6 && (
            <UsersRoles notify={notify} />
          )}

          {/* TAB 7: Marketing Consent */}
          {selectedTab === 7 && (
            <MarketingConsent notify={notify} />
          )}
        </section>
      </div>
    </div>
  )
}
