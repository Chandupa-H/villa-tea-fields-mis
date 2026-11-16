'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Sparkles,
  Bot,
  Send,
  MessageCircle,
  FileText,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Download,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Wallet,
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  PhoneCall,
  UserCheck,
  Clock,
  Eye,
  Check,
  X,
  FileSpreadsheet,
  Printer
} from 'lucide-react'
import { Reservation, Role } from './reservations-view'

export type AIFeatureTab = 'chatbot' | 'reports' | 'audit'

interface ChatMessage {
  id: string
  sender: 'user' | 'bot' | 'system'
  text: string
  timestamp: string
  isEscalation?: boolean
  suggestions?: string[]
}

interface FinancialSummary {
  period: string
  label: string
  grossIncome: number
  totalExpenses: number
  netProfit: number
  profitMargin: number
  roomRevenue: number
  fnbRevenue: number
  toursRevenue: number
  otaCommissions: number
  utilitiesMaintenance: number
  staffCosts: number
}

interface AuditDiscrepancy {
  id: string
  severity: 'Critical' | 'Warning' | 'Notice'
  type: 'Duplicate Transaction' | 'Unusual Entry / Rate Override' | 'Missing / Unlinked Record' | 'Uncollected Balance'
  description: string
  details: string
  timestamp: string
  amount: number
  referenceId: string
  flaggedBy: string
  status: 'Open' | 'Investigating' | 'Resolved'
  resolutionNote?: string
}

interface AuditLogEntry {
  id: string
  timestamp: string
  user: string
  userRole: string
  action: string
  category: 'Billing' | 'Reservation' | 'Audit Engine' | 'Rate Change' | 'Discrepancy'
  details: string
  amount?: number
  severity?: 'Normal' | 'Flagged' | 'Resolved'
}

interface AIFeaturesViewProps {
  initialTab?: AIFeatureTab
  role: Role
  reservations: Reservation[]
  notify: (message: string) => void
}

const money = (amount: number) => `LKR ${amount.toLocaleString('en-LK')}`
const reportMonths = Array.from({ length: 12 }, (_, month) =>
  new Date(Date.UTC(2026, month, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
)

export function AIFeaturesView({
  initialTab = 'chatbot',
  role,
  reservations,
  notify
}: AIFeaturesViewProps) {
  const [activeTab, setActiveTab] = useState<AIFeatureTab>(initialTab)

  // --------------------------------------------------------------------------
  // Internal Staff AI Copilot & Guest Escalation Queue
  // --------------------------------------------------------------------------
  interface GuestInquiryTicket {
    id: string
    guest: string
    channel: string
    time: string
    summary: string
    assignedTo: string
    status: 'Pending' | 'Actioned'
  }

  const roleConfigs: Record<Role, {
    assistantName: string
    assistantRole: string
    welcomeMessage: string
    placeholder: string
    quickPrompts: string[]
  }> = {
    'Deputy Manager': {
      assistantName: 'Front Desk Operations Copilot',
      assistantRole: 'Front-Desk & Guest Operations',
      welcomeMessage: 'Ayubowan Ruwan! I am your Front Desk Operations Copilot. Ask me about today’s arrivals, room inspection readiness, guest dietary notes, or drafting WhatsApp welcome messages.',
      placeholder: 'Ask about today\'s arrivals, room readiness, guest requests...',
      quickPrompts: [
        'Who is arriving today and what are their requests?',
        'Which rooms are waiting for manager inspection?',
        'Draft WhatsApp welcome message for Nimal Perera',
        'Check open guest service requests'
      ]
    },
    'Manager': {
      assistantName: 'Management Operations Copilot',
      assistantRole: 'Tactical Hotel Operations & Team Oversight',
      welcomeMessage: 'Ayubowan Mira! I am your Management Operations Copilot. Ask me about current occupancy, channel distribution, guest review sentiment, staff tasks, or unverified payments.',
      placeholder: 'Ask about occupancy, booking channels, staff tasks, review ratings...',
      quickPrompts: [
        'How is our occupancy tracking this week across channels?',
        'Show guest review ratings and service feedback',
        'Are there unverified bank transfers or payment delays?',
        'Show staff shift tasks and maintenance updates'
      ]
    },
    'Owner': {
      assistantName: 'Executive Business Intelligence Copilot',
      assistantRole: 'Strategic Financial & Revenue Intelligence',
      welcomeMessage: 'Ayubowan Anushka! I am your Executive AI Business Assistant. Ask me about net revenue tracking, OTA commission reduction, dynamic pricing opportunities, or audit anomalies.',
      placeholder: 'Ask about revenue, OTA commission savings, dynamic pricing, audit flags...',
      quickPrompts: [
        'What is our gross revenue, expenses, and net profit this month?',
        'How much commission can we save by converting 20% of OTA bookings to direct?',
        'Review AI weekend dynamic pricing suggestion (+9.6%)',
        'Are there any financial audit discrepancies or unauthorized discounts?'
      ]
    },
    'Housekeeper': {
      assistantName: 'Housekeeping Assistant',
      assistantRole: 'Room Cleaning & Turn-down',
      welcomeMessage: 'Room cleaning checklist loaded.',
      placeholder: 'Cleaning tasks...',
      quickPrompts: []
    }
  }

  const currentConfig = roleConfigs[role] || roleConfigs['Owner']

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init',
      sender: 'bot',
      text: currentConfig.welcomeMessage,
      timestamp: '10:00 AM',
      suggestions: currentConfig.quickPrompts
    }
  ])
  const [chatInput, setChatInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [escalationStatus, setEscalationStatus] = useState<string | null>(null)

  const [inquiryTickets, setInquiryTickets] = useState<GuestInquiryTicket[]>([
    {
      id: 'ESC-883',
      guest: 'Amelia Hart (Room 02)',
      channel: 'Guest Concierge Bot',
      time: '15 mins ago',
      summary: 'Guest requested extra wool blankets and early breakfast at 6:30 AM before hiking.',
      assignedTo: 'Ruwan Perera (Deputy Manager)',
      status: 'Pending'
    },
    {
      id: 'ESC-881',
      guest: 'Priya Senanayake (Web Lead)',
      channel: 'Direct Website',
      time: '1 hour ago',
      summary: 'Inquiry for full villa buyout (all 4 suites) for 3 nights in mid-December.',
      assignedTo: 'Mira Jayasinghe (Manager)',
      status: 'Pending'
    },
    {
      id: 'ESC-879',
      guest: 'Daniel Kim (Trip.com)',
      channel: 'Trip.com Portal',
      time: '3 hours ago',
      summary: 'Late night arrival at 11:30 PM. Requested electric heater be pre-warmed.',
      assignedTo: 'Lakmali Fernando (Housekeeping)',
      status: 'Actioned'
    }
  ])

  // Update chat initial message when switching roles
  useEffect(() => {
    setChatMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: currentConfig.welcomeMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: currentConfig.quickPrompts
      }
    ])
  }, [role])

  const sendBotResponse = (userText: string) => {
    setIsTyping(true)
    setTimeout(() => {
      const lower = userText.toLowerCase()
      let reply = ''
      let newSuggestions: string[] | undefined

      if (lower.includes('arriving') || lower.includes('arrival') || lower.includes('check-in') || lower.includes('who is')) {
        reply = 'Villa Tea Fields has 2 arrivals scheduled: 1) Nimal Perera (Room 01 · 2 guests · Direct WhatsApp · Paid in full LKR 45,600 · ETA 2:00 PM); 2) Sophie Laurent (Room 04 · 3 guests · Airbnb · Arriving tomorrow). Amelia Hart in Room 02 is currently checked in until Nov 17.'
        newSuggestions = ['Draft WhatsApp welcome message for Nimal Perera', 'Check open guest service requests']
      } else if (lower.includes('inspection') || lower.includes('clean') || lower.includes('room ready') || lower.includes('housekeeping')) {
        reply = 'Room status overview: Room 03 departure clean is completed by Sewwandi Silva and is marked "Inspection Required". Room 01 guest arrival prep is in progress by Lakmali Fernando (due 1:00 PM). Room 02 evening turndown is scheduled for 4:00 PM.'
        newSuggestions = ['Who is arriving today and what are their requests?', 'Check open guest service requests']
      } else if (lower.includes('whatsapp') || lower.includes('welcome message') || lower.includes('draft')) {
        reply = 'Draft Welcome Message for Nimal Perera (Room 01):\n\n"Ayubowan Mr. Perera! Warm greetings from Villa Tea Fields, Nuwara Eliya. Your Planter\'s Valley Suite (Room 01) is prepared for your 2:00 PM arrival today. Mountain temperature is currently 17°C with misty tea views. Please let us know if you need driver directions or estate high-tea upon arrival! - Villa Tea Fields Team"'
        newSuggestions = ['Who is arriving today and what are their requests?', 'Check open guest service requests']
      } else if (lower.includes('request') || lower.includes('blanket') || lower.includes('breakfast')) {
        reply = 'Active guest requests: 1) Room 02 (Amelia Hart) requested an extra wool blanket and hot water bottle for the evening; 2) Room 04 (Sophie Laurent) requested early breakfast at 6:30 AM before their Horton Plains excursion.'
        newSuggestions = ['Which rooms are waiting for manager inspection?', 'Draft WhatsApp welcome message for Nimal Perera']
      } else if (lower.includes('occupancy') || lower.includes('channel') || lower.includes('tracking')) {
        reply = 'Current property occupancy is 75% across 4 boutique suites. Channel breakdown: Direct bookings 42% (up +8.4%), Booking.com 28%, Airbnb 18%, Agoda/Other 12%. Direct channels generated the highest net revenue at LKR 828,000 this month.'
        newSuggestions = ['Show guest review ratings and service feedback', 'Are there unverified bank transfers or payment delays?']
      } else if (lower.includes('rating') || lower.includes('review') || lower.includes('sentiment') || lower.includes('feedback')) {
        reply = 'Guest satisfaction is rated 4.8 / 5.0 across 42 verified reviews. Category satisfaction: Staff Service (96%), Cleanliness (91%), Breakfast & Dining (88%), Room Comfort & Heating (82%). No open complaints.'
        newSuggestions = ['How is our occupancy tracking this week across channels?', 'Show staff shift tasks and maintenance updates']
      } else if (lower.includes('payment') || lower.includes('bank') || lower.includes('transfer') || lower.includes('unverified')) {
        reply = 'Two bank transfers are pending verification: 1) VT-2481 (Amelia Hart) stay payment LKR 34,200 via Commercial Bank; 2) VT-2482 (Nimal Perera) deposit LKR 45,600. Recommended to verify against bank portal before guest checkout.'
        newSuggestions = ['How is our occupancy tracking this week across channels?', 'Show staff shift tasks and maintenance updates']
      } else if (lower.includes('revenue') || lower.includes('profit') || lower.includes('margin') || lower.includes('gross')) {
        reply = 'Month-to-date collected revenue is LKR 1,240,000 across 28 bookings. Operating expenses stand at LKR 424,800, leaving estimated net profit of LKR 815,200 (profit margin: 66.1%).'
        newSuggestions = ['How much commission can we save by converting 20% of OTA bookings to direct?', 'Review AI weekend dynamic pricing suggestion (+9.6%)']
      } else if (lower.includes('commission') || lower.includes('ota') || lower.includes('save') || lower.includes('direct')) {
        reply = 'Online travel agencies (Booking.com & Airbnb) generated an estimated LKR 184,600 in commissions this month. Converting 20% of these OTA stays to direct bookings will save an estimated LKR 36,920 monthly in commission fees.'
        newSuggestions = ['What is our gross revenue, expenses, and net profit this month?', 'Review AI weekend dynamic pricing suggestion (+9.6%)']
      } else if (lower.includes('price') || lower.includes('pricing') || lower.includes('weekend') || lower.includes('dynamic')) {
        reply = 'AI Dynamic Pricing analysis detected +18% higher weekend demand for Nov 27–29. Suggested action: increase Room 01 & 02 base rates from LKR 22,800 to LKR 25,000 (+9.6%). Projected revenue lift: +LKR 17,600. Requires Owner approval.'
        newSuggestions = ['What is our gross revenue, expenses, and net profit this month?', 'Are there any financial audit discrepancies or unauthorized discounts?']
      } else if (lower.includes('audit') || lower.includes('discrepanc') || lower.includes('override') || lower.includes('discount')) {
        reply = 'AI Financial Integrity engine flagged 2 active discrepancies: 1) Critical: Duplicate bank transfer entry on VT-2482 (LKR 45,600); 2) Warning: Manual 35% discount override on Room 01 applied without Owner PIN authorization.'
        newSuggestions = ['What is our gross revenue, expenses, and net profit this month?', 'Review AI weekend dynamic pricing suggestion (+9.6%)']
      } else {
        reply = `Analysis for ${role}: Villa Tea Fields has 4 active suites operating at 75% occupancy. 2 arrivals scheduled today, 2 bank transfers pending verification, and 1 room ready for inspection. Let me know which area you would like to explore.`
        newSuggestions = currentConfig.quickPrompts
      }

      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: newSuggestions
        }
      ])
      setIsTyping(false)
    }, 600)
  }

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || chatInput
    if (!text.trim()) return

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setChatMessages(prev => [...prev, userMsg])
    if (!textToSend) setChatInput('')
    sendBotResponse(text)
  }

  const handleResolveTicket = (ticketId: string) => {
    setInquiryTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, status: 'Actioned' } : t))
    )
    notify(`Inquiry ticket ${ticketId} marked as actioned by ${role}`)
  }

  // --------------------------------------------------------------------------
  // FR-02: Automated Financial Report Generation State
  // --------------------------------------------------------------------------
  const [reportPeriod, setReportPeriod] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Annual'>('Monthly')
  const [selectedMonth, setSelectedMonth] = useState('November 2026')

  const dynamicFinancialData: Record<string, FinancialSummary> = useMemo(() => {
    const monthIndex = Math.max(0, reportMonths.indexOf(selectedMonth))
    const monthStart = new Date(Date.UTC(2026, monthIndex, 1))
    const monthEnd = new Date(Date.UTC(2026, monthIndex + 1, 0))
    const ranges = {
      Daily: { start: '2026-11-14', end: '2026-11-14', period: 'November 14, 2026' },
      Weekly: { start: '2026-11-08', end: '2026-11-14', period: 'November 8–14, 2026' },
      Monthly: { start: monthStart.toISOString().slice(0, 10), end: monthEnd.toISOString().slice(0, 10), period: selectedMonth },
      Annual: { start: '2026-01-01', end: '2026-12-31', period: 'Calendar Year 2026' }
    }
    const summaries: Record<string, FinancialSummary> = {}

    Object.entries(ranges).forEach(([key, range]) => {
      const periodReservations = reservations.filter(reservation =>
        reservation.status !== 'Cancelled' && reservation.checkIn >= range.start && reservation.checkIn <= range.end
      )
      const roomRevenue = periodReservations.reduce((sum, reservation) => sum + reservation.paid, 0)
      const grossIncome = Math.round(roomRevenue / 0.75)
      const fnbRevenue = Math.round(grossIncome * 0.15)
      const toursRevenue = grossIncome - roomRevenue - fnbRevenue
      const otaCommissions = Math.round(periodReservations
        .filter(reservation => ['Booking.com', 'Airbnb', 'Agoda'].includes(reservation.source))
        .reduce((sum, reservation) => sum + reservation.paid, 0) * 0.15)
      const utilitiesMaintenance = Math.round(grossIncome * 0.1)
      const staffCosts = Math.round(grossIncome * 0.12)
      const totalExpenses = otaCommissions + utilitiesMaintenance + staffCosts
      const netProfit = grossIncome - totalExpenses

      summaries[key] = {
        period: range.period,
        label: `${key} Summary`,
        grossIncome,
        totalExpenses,
        netProfit,
        profitMargin: grossIncome ? Number((netProfit / grossIncome * 100).toFixed(1)) : 0,
        roomRevenue,
        fnbRevenue,
        toursRevenue,
        otaCommissions,
        utilitiesMaintenance,
        staffCosts
      }
    })

    return summaries
  }, [reservations, reportMonths, selectedMonth])

  const monthlyOccupancy = useMemo(() => Array.from({ length: 12 }, (_, month) => {
    const start = Date.UTC(2026, month, 1)
    const end = Date.UTC(2026, month + 1, 1)
    const occupiedNights = reservations.reduce((sum, reservation) => {
      if (reservation.status === 'Cancelled') return sum
      const checkIn = Date.parse(`${reservation.checkIn}T00:00:00Z`)
      const checkOut = Date.parse(`${reservation.checkOut}T00:00:00Z`)
      return sum + Math.max(0, Math.round((Math.min(checkOut, end) - Math.max(checkIn, start)) / 86400000))
    }, 0)
    const days = new Date(Date.UTC(2026, month + 1, 0)).getUTCDate()
    return {
      label: new Date(Date.UTC(2026, month, 1)).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
      percent: Math.min(100, Math.round(occupiedNights / (days * 4) * 100))
    }
  }), [reservations])

  const currentSummary = dynamicFinancialData[reportPeriod]

  const handleDownloadPDF = () => {
    notify(`Generating official ${reportPeriod} Financial Statement PDF...`)
    setTimeout(() => {
      window.print()
    }, 500)
  }

  const handleExportCSV = () => {
    const csvRows = [
      ['Villa Tea Fields - Financial Summary Report'],
      ['Period', currentSummary.period],
      ['Generated On', new Date().toLocaleString('en-LK')],
      ['Report Type', reportPeriod],
      [],
      ['Metric', 'Amount (LKR)'],
      ['Gross Income', currentSummary.grossIncome],
      ['-- Room Revenue', currentSummary.roomRevenue],
      ['-- Food & Beverage', currentSummary.fnbRevenue],
      ['-- Tea Tours & Experiences', currentSummary.toursRevenue],
      ['Total Operating Expenses', currentSummary.totalExpenses],
      ['-- OTA Commissions', currentSummary.otaCommissions],
      ['-- Utilities & Maintenance', currentSummary.utilitiesMaintenance],
      ['-- Staff Operations', currentSummary.staffCosts],
      ['Net Profit', currentSummary.netProfit],
      ['Profit Margin', `${currentSummary.profitMargin}%`]
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Villa_Tea_Fields_Financial_${reportPeriod}_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    notify(`${reportPeriod} Financial Report downloaded as CSV`)
  }

  // --------------------------------------------------------------------------
  // FR-03: Financial Auditing State
  // --------------------------------------------------------------------------
  const [discrepancies, setDiscrepancies] = useState<AuditDiscrepancy[]>([
    {
      id: 'DISC-401',
      severity: 'Critical',
      type: 'Duplicate Transaction',
      description: 'Potential duplicate payment detected for Reservation VT-2482.',
      details: 'Two identical incoming bank transfers of LKR 45,600 with reference #9983 recorded within 4 minutes.',
      timestamp: 'Today, 09:34 AM',
      amount: 45600,
      referenceId: 'VT-2482 (Nimal Perera)',
      flaggedBy: 'AI Financial Audit Engine',
      status: 'Open'
    },
    {
      id: 'DISC-402',
      severity: 'Warning',
      type: 'Unusual Entry / Rate Override',
      description: 'Manual rate discount override applied without Owner authorization PIN.',
      details: 'Room 01 booked at LKR 14,820/night (35% discount against standard rate LKR 22,800) by staff Ruwan Perera.',
      timestamp: 'Yesterday, 04:15 PM',
      amount: 23940,
      referenceId: 'VT-2486 (Direct Walk-in)',
      flaggedBy: 'AI Rule Engine',
      status: 'Investigating'
    },
    {
      id: 'DISC-403',
      severity: 'Warning',
      type: 'Missing / Unlinked Record',
      description: 'Restaurant bill #FB-891 marked as paid in cash, but missing link to guest folio.',
      details: 'LKR 8,400 received for afternoon tea service at Lounge, but not reconciled against daily cash deposit sheet.',
      timestamp: 'Nov 12, 06:20 PM',
      amount: 8400,
      referenceId: 'POS-REC-891',
      flaggedBy: 'Automated Night Audit',
      status: 'Open'
    },
    {
      id: 'DISC-404',
      severity: 'Notice',
      type: 'Uncollected Balance',
      description: 'Checked-in guest scheduled for checkout with unpaid stay balance.',
      details: 'Reservation VT-2481 (Amelia Hart) departs in 2 days with an uncollected balance of LKR 34,200.',
      timestamp: 'Nov 14, 02:15 PM',
      amount: 34200,
      referenceId: 'VT-2481 (Amelia Hart)',
      flaggedBy: 'Billing Integrity Check',
      status: 'Open'
    }
  ])

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'AUD-8801',
      timestamp: 'Nov 14, 2026, 09:34 AM',
      user: 'AI Audit Service',
      userRole: 'System',
      action: 'Anomaly Flagged',
      category: 'Discrepancy',
      details: 'Potential duplicate transaction #PAY-102 flagged for inspection on VT-2482.',
      amount: 45600,
      severity: 'Flagged'
    },
    {
      id: 'AUD-8802',
      timestamp: 'Nov 14, 2026, 08:45 AM',
      user: 'Mira Jayasinghe',
      userRole: 'Manager',
      action: 'Payment Verified',
      category: 'Billing',
      details: 'Bank transfer payment of LKR 34,200 verified and tagged to receipt #REC-2026-4421.',
      amount: 34200,
      severity: 'Normal'
    },
    {
      id: 'AUD-8803',
      timestamp: 'Nov 13, 2026, 11:30 PM',
      user: 'Automated Night Audit',
      userRole: 'System Cron',
      action: 'Night Audit Generated',
      category: 'Audit Engine',
      details: 'Daily transaction closure executed. Gross Revenue LKR 148,200 tallied with POS terminals.',
      amount: 148200,
      severity: 'Normal'
    },
    {
      id: 'AUD-8804',
      timestamp: 'Nov 13, 2026, 04:15 PM',
      user: 'Ruwan Perera',
      userRole: 'Deputy Manager',
      action: 'Manual Rate Override',
      category: 'Rate Change',
      details: 'Applied promotional override for direct guest walk-in. Discrepancy #DISC-402 raised.',
      amount: 23940,
      severity: 'Flagged'
    },
    {
      id: 'AUD-8805',
      timestamp: 'Nov 12, 2026, 02:10 PM',
      user: 'Anushka Senanayake',
      userRole: 'Owner',
      action: 'Refund Authorized',
      category: 'Billing',
      details: 'Approved partial deposit refund of LKR 12,000 for weather cancellation.',
      amount: 12000,
      severity: 'Resolved'
    }
  ])

  const [isScanning, setIsScanning] = useState(false)
  const [auditFilter, setAuditFilter] = useState('All')
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<AuditDiscrepancy | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')

  const handleRunAuditScan = () => {
    setIsScanning(true)
    notify('Running AI Financial Anomaly & Integrity Audit...')
    setTimeout(() => {
      setIsScanning(false)
      notify('AI Audit scan complete: 4 discrepancies analyzed across 28 active records')
    }, 1200)
  }

  const handleResolveDiscrepancy = (id: string) => {
    setDiscrepancies(prev =>
      prev.map(d => (d.id === id ? { ...d, status: 'Resolved', resolutionNote: resolutionNote || 'Resolved by Manager' } : d))
    )
    setAuditLogs(prev => [
      {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' }),
        user: `${role} (${role === 'Owner' ? 'Anushka S.' : 'Staff'})`,
        userRole: role,
        action: 'Discrepancy Resolved',
        category: 'Discrepancy',
        details: `Discrepancy ${id} marked as resolved. Note: ${resolutionNote || 'Verified and reconciled.'}`,
        severity: 'Resolved'
      },
      ...prev
    ])
    setSelectedDiscrepancy(null)
    setResolutionNote('')
    notify(`Discrepancy ${id} successfully resolved and audit entry logged`)
  }

  const openDiscrepanciesCount = discrepancies.filter(d => d.status !== 'Resolved').length

  // Define available tabs based on user position / role according to main
  const allowedTabs = useMemo(() => {
    // Owner has full access to Executive Copilot, Financial Reports, and Audit Engine
    if (role === 'Owner') {
      return [
        { id: 'chatbot' as AIFeatureTab, label: 'Executive Copilot', icon: <Bot size={14} /> },
        { id: 'reports' as AIFeatureTab, label: 'Financial Reports', icon: <FileSpreadsheet size={14} /> },
        {
          id: 'audit' as AIFeatureTab,
          label: 'Audit & Integrity',
          icon: <ShieldCheck size={14} />,
          badge: openDiscrepanciesCount > 0 ? openDiscrepanciesCount : undefined
        }
      ]
    }

    // Manager has access to Management Copilot and Financial Reports (no Audit Logs in main)
    if (role === 'Manager') {
      return [
        { id: 'chatbot' as AIFeatureTab, label: 'Management Copilot', icon: <Bot size={14} /> },
        { id: 'reports' as AIFeatureTab, label: 'Financial Reports', icon: <FileSpreadsheet size={14} /> }
      ]
    }

    // Deputy Manager and Housekeeper do not have access to Intelligence/Audit features in main
    return []
  }, [role, openDiscrepanciesCount])

  // Synchronize active tab with permitted role tabs
  useEffect(() => {
    if (allowedTabs.length > 0 && !allowedTabs.some(t => t.id === activeTab)) {
      setActiveTab(allowedTabs[0].id)
    }
  }, [allowedTabs, activeTab])

  if (role === 'Housekeeper' || role === 'Deputy Manager' || allowedTabs.length === 0) {
    return (
      <div className="card p-8 text-center max-w-md mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck size={24} />
        </div>
        <h2 className="text-base font-bold text-[#202939]">Access Restricted</h2>
        <p className="text-xs text-[#778196] mt-1.5">
          Your active role ({role}) does not have permission to view AI and Financial Intelligence features.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Module Header & Tab Navigation */}
      <div className="page-heading">
        <div>
          <p className="eyebrow">INTELLIGENCE</p>
          <h1>AI & Financial Intelligence</h1>
        </div>
        {allowedTabs.length > 1 && (
          <div className="heading-actions">
            <div className="flex bg-[#F0F3F7] p-1 rounded-lg border border-[#E5E9EF] gap-1">
              {allowedTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#172B4D] text-white shadow-sm'
                      : 'text-[#425246] hover:bg-[#EEF2F6]'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="bg-[#D9534F] text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: INTERNAL STAFF AI COPILOT & GUEST ESCALATION INBOX            */}
      {/* ==================================================================== */}
      {activeTab === 'chatbot' && (
        <div className="space-y-6">
          <div className="ai-banner">
            <div className="ai-orb">
              <Sparkles size={24} />
            </div>
            <div>
              <span>{role === 'Owner' ? 'EXECUTIVE INTELLIGENCE' : 'TACTICAL OPERATIONS AI'}</span>
              <h2>{currentConfig.assistantName}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Interactive Chat Window */}
            <div className="lg:col-span-2 card p-5 flex flex-col h-[620px] shadow-sm">
              <div className="flex items-center justify-between border-b pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F0F3F7] border border-[#E5E9EF] flex items-center justify-center text-[#172B4D]">
                    <Bot size={20} />
                  </div>
                  <div>
                    <strong className="text-sm text-[#202939] block">{currentConfig.assistantName}</strong>
                    <span className="text-xs text-[#778196] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      {currentConfig.assistantRole}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
                {chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user'
                        ? 'items-end'
                        : msg.sender === 'system'
                        ? 'items-center my-2'
                        : 'items-start'
                    }`}
                  >
                    {msg.sender === 'system' ? (
                      <div className="bg-[#fff3cd] text-[#856404] text-xs px-3.5 py-2 rounded-lg border border-[#ffeeba] flex items-center gap-2 max-w-[85%]">
                        <AlertCircle size={15} />
                        <span>{msg.text}</span>
                      </div>
                    ) : (
                      <div
                        className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-[#172B4D] text-white rounded-br-none shadow-sm'
                            : 'bg-[#F7F8FA] text-[#202939] border border-[#E5E9EF] rounded-bl-none whitespace-pre-line'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <span
                          className={`block text-[10px] mt-1.5 text-right ${
                            msg.sender === 'user' ? 'text-white/70' : 'text-[#778196]'
                          }`}
                        >
                          {msg.timestamp}
                        </span>

                        {/* Suggestion Chips */}
                        {msg.suggestions && msg.suggestions.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-[#E5E9EF] flex flex-wrap gap-1.5">
                            {msg.suggestions.map(sug => (
                              <button
                                key={sug}
                                onClick={() => handleSendMessage(sug)}
                                className="bg-white hover:bg-[#F0F3F7] text-[#172B4D] border border-[#E5E9EF] px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors text-left"
                              >
                                {sug}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-2 text-xs text-[#778196] italic">
                    <Bot size={14} className="text-[#172B4D] animate-bounce" />
                    <span>Processing hotel records...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="mt-4 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSendMessage()
                    }}
                    placeholder={currentConfig.placeholder}
                    className="flex-1 border border-[#E5E9EF] rounded-lg px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#172B4D]"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    className="button primary py-2.5 px-4 flex items-center gap-1.5"
                  >
                    <span>Ask</span>
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Col: Quick Queries & Customer Chatbot Escalation Queue */}
            <div className="space-y-4">
              <div className="card p-4">
                <div className="card-heading pb-2 mb-3 border-b">
                  <div>
                    <h2 className="text-sm font-bold text-[#202939]">Position AI Queries</h2>
                  </div>
                </div>
                <div className="space-y-2">
                  {currentConfig.quickPrompts.map(prompt => (
                    <div
                      key={prompt}
                      onClick={() => handleSendMessage(prompt)}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#F7F8FA] hover:bg-[#F0F3F7] border border-[#E5E9EF] text-xs cursor-pointer text-[#202939] transition-colors"
                    >
                      <span className="font-medium">{prompt}</span>
                      <ChevronRight size={14} className="text-[#778196] shrink-0 ml-1" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-4 bg-[#F7F8FA] border border-[#E5E9EF]">
                <div className="card-heading pb-2 mb-3 border-b flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[#202939]">Customer Inquiries & Handoff Queue</h2>
                  </div>
                  <span className="text-[10px] font-bold bg-[#F0F3F7] text-[#172B4D] px-2 py-0.5 rounded">
                    {inquiryTickets.filter(t => t.status === 'Pending').length} Pending
                  </span>
                </div>

                <div className="space-y-2.5">
                  {inquiryTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      className={`p-2.5 rounded-lg border text-xs ${
                        ticket.status === 'Actioned'
                          ? 'bg-white/60 border-[#E5E9EF] opacity-60'
                          : 'bg-white border-[#E5E9EF] shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <strong className="text-[#202939]">{ticket.guest}</strong>
                        <span className="text-[10px] font-mono text-[#778196]">{ticket.time}</span>
                      </div>
                      <p className="text-[#4f5c51] leading-relaxed mb-2 text-[11px]">{ticket.summary}</p>
                      <div className="flex items-center justify-between pt-1.5 border-t border-[#f0f3ee] text-[11px]">
                        <span className="text-[#78857a]">{ticket.assignedTo}</span>
                        {ticket.status === 'Pending' ? (
                          <button
                            onClick={() => handleResolveTicket(ticket.id)}
                            className="text-[#172B4D] font-semibold hover:underline"
                          >
                            Mark Handled
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                            <Check size={12} /> Handled
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: FINANCIAL REPORT GENERATION                                   */}
      {/* ==================================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="ai-banner">
            <div className="ai-orb">
              <TrendingUp size={24} />
            </div>
            <div>
              <span>FINANCIAL INTELLIGENCE</span>
              <h2>Financial Statement Generation</h2>
            </div>
          </div>

          {/* Period Filter Bar & Download Actions */}
          <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#445147] uppercase tracking-wide">Summary Interval:</span>
              <div className="flex bg-[#F0F3F7] p-1 rounded-lg border border-[#E5E9EF] gap-1">
                {(['Daily', 'Weekly', 'Monthly', 'Annual'] as const)
                  .filter(period => period !== 'Annual' || role === 'Owner')
                  .map(period => (
                    <button
                      key={period}
                      onClick={() => setReportPeriod(period)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        reportPeriod === period
                          ? 'bg-[#172B4D] text-white shadow-sm'
                          : 'text-[#4b594f] hover:bg-[#EEF2F6]'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
              </div>
              {reportPeriod === 'Monthly' && (
                <select
                  aria-label="Financial report month"
                  value={selectedMonth}
                  onChange={event => setSelectedMonth(event.target.value)}
                  className="border border-[#d7ddd4] rounded-lg bg-white px-2.5 py-1.5 text-xs text-[#172B4D]"
                >
                  {reportMonths.map(month => <option key={month}>{month}</option>)}
                </select>
              )}
              <span className="text-xs text-[#707c72] pl-2 border-l border-[#dee3dc] font-medium">
                {currentSummary.period}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="button secondary text-xs flex items-center gap-1.5 py-2 px-3 border border-[#d7ddd4]"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                className="button primary text-xs flex items-center gap-1.5 py-2 px-3"
              >
                <Printer size={14} />
                <span>Download Report (PDF)</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-[#707c72]">Demo report: room revenue uses reservation payments; dining, tours, and operating costs are modeled estimates.</p>

          {reportPeriod === 'Annual' && (
            <section className="card p-5" aria-label="Monthly room occupancy for 2026">
              <div className="card-heading pb-3 mb-4 border-b">
                <div>
                  <h2 className="text-sm font-bold text-[#202939]">Monthly room occupancy</h2>
                  <p className="text-xs text-[#707c72]">Room nights booked ÷ room nights available · 4 rooms · demo reservations</p>
                </div>
                <strong className="text-xs text-[#172B4D]">2026</strong>
              </div>
              <div className="grid grid-cols-6 md:grid-cols-12 gap-2 items-end h-36">
                {monthlyOccupancy.map(month => (
                  <div key={month.label} className="flex flex-col items-center justify-end gap-1.5 h-full" title={`${month.label}: ${month.percent}% occupancy`}>
                    <span className="text-[10px] font-semibold text-[#172B4D]">{month.percent}%</span>
                    <div className="w-full max-w-8 bg-[#F0F3F7] rounded-t overflow-hidden flex items-end h-20">
                      <div className="w-full rounded-t bg-[#d1ab6b] transition-all" style={{ height: `${month.percent}%` }} />
                    </div>
                    <span className="text-[10px] text-[#707c72]">{month.label}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4 Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon green"><Wallet size={18} /></span>
                <span className="stat-change">DEMO</span>
              </div>
              <p>TOTAL GROSS INCOME</p>
              <div className="stat-value">{money(currentSummary.grossIncome)}</div>
              <small>{reportPeriod} room, F&B & tour earnings</small>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon sand"><CreditCard size={18} /></span>
                <span className="stat-change">DEMO</span>
              </div>
              <p>TOTAL OPERATING EXPENSES</p>
              <div className="stat-value">{money(currentSummary.totalExpenses)}</div>
              <small>OTA fees, utilities & maintenance</small>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon purple"><TrendingUp size={18} /></span>
                <span className="stat-change">DEMO</span>
              </div>
              <p>NET PROFIT</p>
              <div className="stat-value">{money(currentSummary.netProfit)}</div>
              <small>Operating profit after deductions</small>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon blue"><ShieldCheck size={18} /></span>
                <span className="stat-change text-emerald-700 font-bold">Estimated</span>
              </div>
              <p>PROFIT MARGIN</p>
              <div className="stat-value">{currentSummary.profitMargin}%</div>
              <small>Net revenue conversion efficiency</small>
            </article>
          </div>

          {/* Revenue & Expense Breakdown Visualizer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <div className="card-heading pb-3 mb-4 border-b">
                <div>
                  <h2 className="text-sm font-bold text-[#202939]">Income Stream Distribution</h2>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Room Stays & Suites', amount: currentSummary.roomRevenue, pct: currentSummary.grossIncome ? Math.round(currentSummary.roomRevenue / currentSummary.grossIncome * 100) : 0, color: '#172B4D' },
                  { label: 'Tea Lounge & Dining (F&B)', amount: currentSummary.fnbRevenue, pct: currentSummary.grossIncome ? Math.round(currentSummary.fnbRevenue / currentSummary.grossIncome * 100) : 0, color: '#889f8d' },
                  { label: 'Guided Tea Plantation Experiences', amount: currentSummary.toursRevenue, pct: currentSummary.grossIncome ? Math.round(currentSummary.toursRevenue / currentSummary.grossIncome * 100) : 0, color: '#d1ab6b' }
                ].map(stream => (
                  <div key={stream.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[#2d382f]">{stream.label}</span>
                      <strong className="text-[#202939]">{money(stream.amount)}</strong>
                    </div>
                    <div className="w-full bg-[#F0F3F7] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${stream.pct}%`, backgroundColor: stream.color }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <div className="card-heading pb-3 mb-4 border-b">
                <div>
                  <h2 className="text-sm font-bold text-[#202939]">Expense Categories</h2>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'OTA Commission Deductions (Booking.com, Airbnb)', amount: currentSummary.otaCommissions, pct: currentSummary.totalExpenses ? Math.round(currentSummary.otaCommissions / currentSummary.totalExpenses * 100) : 0, color: '#a65353' },
                  { label: 'Estate Utilities, Fuel & Room Maintenance', amount: currentSummary.utilitiesMaintenance, pct: currentSummary.totalExpenses ? Math.round(currentSummary.utilitiesMaintenance / currentSummary.totalExpenses * 100) : 0, color: '#c97a47' },
                  { label: 'Staff Operations & Kitchen Supplies', amount: currentSummary.staffCosts, pct: currentSummary.totalExpenses ? Math.round(currentSummary.staffCosts / currentSummary.totalExpenses * 100) : 0, color: '#d89e52' }
                ].map(exp => (
                  <div key={exp.label} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[#2d382f]">{exp.label}</span>
                      <strong className="text-[#202939]">{money(exp.amount)}</strong>
                    </div>
                    <div className="w-full bg-[#F0F3F7] h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${exp.pct}%`, backgroundColor: exp.color }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Financial Transactions & Reconciliation Ledger */}
          <div className="card p-5">
            <div className="card-heading pb-3 mb-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-[#202939]">Statement Summary</h2>
              </div>
              <span className="text-xs text-[#172B4D] bg-[#F0F3F7] px-2.5 py-1 rounded font-semibold">
                Audit Status: Balanced
              </span>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ACCOUNTING CATEGORY</th>
                    <th>DETAIL / SOURCE</th>
                    <th>INCOME (LKR)</th>
                    <th>EXPENSE (LKR)</th>
                    <th>NET IMPACT</th>
                    <th>VERIFICATION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Suite Bookings</strong></td>
                    <td>Direct Website, Walk-in, Booking.com</td>
                    <td className="text-emerald-700 font-semibold">+{money(currentSummary.roomRevenue)}</td>
                    <td>—</td>
                    <td>+{money(currentSummary.roomRevenue)}</td>
                    <td><span className="payment-label partial">Demo data</span></td>
                  </tr>
                  <tr>
                    <td><strong>F&B Services</strong></td>
                    <td>Terrace Tea Lounge & Room Dining</td>
                    <td className="text-emerald-700 font-semibold">+{money(currentSummary.fnbRevenue)}</td>
                    <td>—</td>
                    <td>+{money(currentSummary.fnbRevenue)}</td>
                    <td><span className="payment-label partial">Estimate</span></td>
                  </tr>
                  <tr>
                    <td><strong>Highland Excursions</strong></td>
                    <td>Tea Tasting & Guided Estate Hikes</td>
                    <td className="text-emerald-700 font-semibold">+{money(currentSummary.toursRevenue)}</td>
                    <td>—</td>
                    <td>+{money(currentSummary.toursRevenue)}</td>
                    <td><span className="payment-label partial">Estimate</span></td>
                  </tr>
                  <tr>
                    <td><strong>Distribution Fees</strong></td>
                    <td>OTA Commissions & Gateway Fees</td>
                    <td>—</td>
                    <td className="text-rose-700 font-semibold">-{money(currentSummary.otaCommissions)}</td>
                    <td>-{money(currentSummary.otaCommissions)}</td>
                    <td><span className="payment-label partial">Estimate</span></td>
                  </tr>
                  <tr>
                    <td><strong>Property Operations</strong></td>
                    <td>Electricity, Gas, Tea Field Maintenance</td>
                    <td>—</td>
                    <td className="text-rose-700 font-semibold">-{money(currentSummary.utilitiesMaintenance)}</td>
                    <td>-{money(currentSummary.utilitiesMaintenance)}</td>
                    <td><span className="payment-label partial">Estimate</span></td>
                  </tr>
                  <tr>
                    <td><strong>Staff Operations</strong></td>
                    <td>Staff & Kitchen Operations</td>
                    <td>—</td>
                    <td className="text-rose-700 font-semibold">-{money(currentSummary.staffCosts)}</td>
                    <td>-{money(currentSummary.staffCosts)}</td>
                    <td><span className="payment-label partial">Estimate</span></td>
                  </tr>
                  <tr className="bg-[#f7f9f6] font-bold">
                    <td>TOTAL SUMMARY</td>
                    <td>Net Operating Performance</td>
                    <td className="text-emerald-800">+{money(currentSummary.grossIncome)}</td>
                    <td className="text-rose-800">-{money(currentSummary.totalExpenses)}</td>
                    <td className="text-[#172B4D] text-sm">+{money(currentSummary.netProfit)}</td>
                    <td><span className="text-xs text-[#172B4D]">Demo estimate</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: FINANCIAL AUDITING & INTEGRITY                                */}
      {/* ==================================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="ai-banner">
            <div className="ai-orb">
              <ShieldCheck size={24} />
            </div>
            <div>
              <span>FINANCIAL INTEGRITY</span>
              <h2>Automated Anomaly & Discrepancy Audit</h2>
            </div>
          </div>

          {/* Audit Controls & Action Bar */}
          <div className="card p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                <strong className="text-xs text-[#202939]">
                  {openDiscrepanciesCount} Anomalies Requiring Management Review
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleRunAuditScan}
                disabled={isScanning}
                className="button primary text-xs flex items-center gap-1.5 py-2 px-3.5"
              >
                <RefreshCw size={14} className={isScanning ? 'animate-spin' : ''} />
                <span>{isScanning ? 'Scanning Records...' : 'Run Automated AI Audit'}</span>
              </button>
            </div>
          </div>

          {/* Detected Discrepancies Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#202939] flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-600" />
                Active Financial Discrepancies & Anomalies
              </h2>
              <span className="text-xs text-[#6e7770]">Auto-scanned every 30 minutes</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {discrepancies.map(disc => (
                <div
                  key={disc.id}
                  className={`card p-4 border transition-all ${
                    disc.status === 'Resolved'
                      ? 'bg-[#f8faf8] border-[#E5E9EF] opacity-60'
                      : disc.severity === 'Critical'
                      ? 'bg-[#fffbfa] border-[#f0c8c4]'
                      : disc.severity === 'Warning'
                      ? 'bg-[#fffef7] border-[#fae29c]'
                      : 'bg-[#f7fafc] border-[#cadbe8]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          disc.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-800'
                            : disc.severity === 'Warning'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {disc.severity}
                      </span>
                      <strong className="text-xs text-[#202939]">{disc.type}</strong>
                    </div>
                    <span className="text-xs font-mono text-[#5b655d]">{disc.id}</span>
                  </div>

                  <p className="text-xs text-[#303a32] font-semibold mb-1">{disc.description}</p>
                  <p className="text-xs text-[#647066] leading-relaxed mb-3">{disc.details}</p>

                  <div className="flex flex-wrap items-center justify-between text-xs pt-2.5 border-t border-[#ebf0e8] text-[#556157]">
                    <div>
                      <span>Ref: <strong>{disc.referenceId}</strong></span>
                      <span className="mx-2">·</span>
                      <strong className="text-[#202939]">{money(disc.amount)}</strong>
                    </div>

                    {disc.status === 'Resolved' ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 size={13} />
                        Resolved
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedDiscrepancy(disc)}
                        className="button secondary text-xs py-1 px-2.5 border border-[#ced5cb] hover:bg-[#F0F3F7]"
                      >
                        Investigate & Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Audit Log Ledger */}
          <div className="card p-5">
            <div className="card-heading pb-3 mb-4 border-b flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#202939]">Audit Trail & System Activity</h2>
              </div>

              <div className="flex items-center gap-2">
                <Filter size={14} className="text-[#717b73]" />
                <select
                  value={auditFilter}
                  onChange={e => setAuditFilter(e.target.value)}
                  className="text-xs border border-[#ced5cb] rounded px-2 py-1 bg-white"
                >
                  <option>All Activities</option>
                  <option>Flagged Only</option>
                  <option>Discrepancies</option>
                  <option>Rate Changes</option>
                  <option>Billing</option>
                </select>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>LOG ID</th>
                    <th>TIMESTAMP</th>
                    <th>USER / ROLE</th>
                    <th>CATEGORY</th>
                    <th>DETAILS</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs
                    .filter(log => auditFilter === 'All Activities' || log.category === auditFilter || (auditFilter === 'Flagged Only' && log.severity === 'Flagged'))
                    .map(log => (
                      <tr key={log.id}>
                        <td><code className="text-xs font-mono text-[#4b554d]">{log.id}</code></td>
                        <td className="text-xs">{log.timestamp}</td>
                        <td>
                          <strong>{log.user}</strong>
                          <small className="block text-[10px] text-[#78827a]">{log.userRole}</small>
                        </td>
                        <td>
                          <span className="text-xs bg-[#f0f3ee] text-[#3c4a3e] px-2 py-0.5 rounded font-medium">
                            {log.category}
                          </span>
                        </td>
                        <td className="text-xs max-w-xs">{log.details}</td>
                        <td className="text-xs font-semibold">
                          {log.amount ? money(log.amount) : '—'}
                        </td>
                        <td>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              log.severity === 'Flagged'
                                ? 'bg-amber-100 text-amber-800'
                                : log.severity === 'Resolved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {log.severity || 'Normal'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Discrepancy Investigation Modal */}
      {selectedDiscrepancy && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setSelectedDiscrepancy(null) }}>
          <section className="modal max-w-lg" role="dialog" aria-modal="true">
            <div className="modal-head">
              <div>
                <p className="eyebrow">AUDIT INVESTIGATION</p>
                <h2>{selectedDiscrepancy.id} · {selectedDiscrepancy.type}</h2>
              </div>
              <button className="icon-button" onClick={() => setSelectedDiscrepancy(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5 my-3 text-xs">
              <div className="p-3 bg-[#f7f9f6] rounded-lg border border-[#EEF2F6]">
                <strong className="block text-[#202939] mb-1">{selectedDiscrepancy.description}</strong>
                <p className="text-[#556257] leading-relaxed">{selectedDiscrepancy.details}</p>
                <div className="mt-2.5 pt-2 border-t border-[#dee4da] flex justify-between">
                  <span>Reference: <strong>{selectedDiscrepancy.referenceId}</strong></span>
                  <span>Amount: <strong className="text-emerald-800">{money(selectedDiscrepancy.amount)}</strong></span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#2d3830] mb-1">
                  Manager Investigation & Resolution Note:
                </label>
                <textarea
                  rows={3}
                  value={resolutionNote}
                  onChange={e => setResolutionNote(e.target.value)}
                  placeholder="e.g. Bank statement checked with Commercial Bank; second transfer was an accidental customer double-swipe. Refund initiated."
                  className="w-full border border-[#cbd3c8] rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-[#172B4D] focus:outline-none"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="button secondary" onClick={() => setSelectedDiscrepancy(null)}>
                Cancel
              </button>
              <button
                className="button primary"
                onClick={() => handleResolveDiscrepancy(selectedDiscrepancy.id)}
              >
                <Check size={14} className="mr-1" />
                Mark Resolved & Log Audit Entry
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}


