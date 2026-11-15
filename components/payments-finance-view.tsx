'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Bell, Check, ChevronRight, CreditCard, Download, Paperclip, Pencil, Plus, Printer, Receipt, RotateCcw, Search, TrendingDown, TrendingUp, Wallet, X } from 'lucide-react'
import { PaymentRecord, Reservation, ReservationAuditLog, Role } from './reservations-view'

type ExpenseCategory = 'Utilities' | 'Staff salaries' | 'Supplies' | 'Maintenance' | 'Food & breakfast' | 'Marketing' | 'Other'
type VerificationStatus = 'Verified' | 'Pending verification'
type RefundStatus = 'Pending' | 'Approved' | 'Rejected'
type FinanceTab = 'Transactions' | 'Outstanding' | 'Expenses' | 'Payouts' | 'Refunds'
type Period = 'This month' | 'Last 7 days' | 'Last month' | 'All time' | 'Custom'

interface Expense {
  id: string
  date: string
  category: ExpenseCategory
  description: string
  amount: number
  paidTo: string
  receiptName?: string
}

interface RefundRequest {
  id: string
  reservationId: string
  guest: string
  amount: number
  reason: string
  requestedBy: string
  requestedAt: string
  status: RefundStatus
}

interface Payout {
  id: string
  channel: string
  period: string
  reservations: string
  expected: number
  received: number | null
  receivedOn?: string
  resolved?: boolean
}

interface FinanceState {
  verifiedIds: string[]
  expenses: Expense[]
  refunds: RefundRequest[]
  payouts: Payout[]
  budgets: Record<ExpenseCategory, number>
}

interface Transaction extends PaymentRecord {
  reservationId: string
  guest: string
  guestEmail: string
  room: string
  source: string
  verification: VerificationStatus
}

const STORAGE_KEY = 'villa-tea-fields-finance-v2'
const TODAY = '2026-11-14'
const EXPENSE_CATEGORIES: ExpenseCategory[] = ['Utilities', 'Staff salaries', 'Supplies', 'Maintenance', 'Food & breakfast', 'Marketing', 'Other']
const PAYMENT_METHODS = ['Bank Transfer', 'Credit Card', 'Cash', 'Online Gateway'] as const
const COMMISSION_RATES: Record<string, number> = { 'Booking.com': 0.15, Airbnb: 0.15, Agoda: 0.15, 'Trip.com': 0.15 }
const REVENUE_COLOR = '#3d7f47'
const EXPENSE_COLOR = '#b8862a'
const MONTH_HISTORY = [
  { month: 'Jun', revenue: 820000, expenses: 265000 },
  { month: 'Jul', revenue: 905000, expenses: 281000 },
  { month: 'Aug', revenue: 1010000, expenses: 298000 },
  { month: 'Sep', revenue: 870000, expenses: 276000 },
  { month: 'Oct', revenue: 1120000, expenses: 312000 }
]

const emptyExpenseForm = { date: TODAY, category: 'Supplies' as ExpenseCategory, description: '', amount: 0, paidTo: '', receiptName: '' }

const initialState: FinanceState = {
  verifiedIds: ['PAY-102'],
  expenses: [
    { id: 'EXP-195', date: '2026-10-28', category: 'Staff salaries', description: 'Housekeeping staff · October balance', amount: 92000, paidTo: 'Staff payroll' },
    { id: 'EXP-196', date: '2026-10-21', category: 'Marketing', description: 'Facebook & Instagram ads · October', amount: 15000, paidTo: 'Meta Ads' },
    { id: 'EXP-201', date: '2026-11-02', category: 'Staff salaries', description: 'Housekeeping staff · November advance', amount: 85000, paidTo: 'Staff payroll' },
    { id: 'EXP-202', date: '2026-11-05', category: 'Utilities', description: 'CEB electricity bill · October', amount: 28400, paidTo: 'Ceylon Electricity Board', receiptName: 'ceb-oct-2026.pdf' },
    { id: 'EXP-203', date: '2026-11-07', category: 'Food & breakfast', description: 'Breakfast groceries · week 1', amount: 18650, paidTo: 'Keells Nuwara Eliya', receiptName: 'keells-bill-1107.jpg' },
    { id: 'EXP-204', date: '2026-11-09', category: 'Maintenance', description: 'Room 04 bathroom tap repair', amount: 6500, paidTo: 'Local plumber' },
    { id: 'EXP-205', date: '2026-11-11', category: 'Supplies', description: 'Guest amenities & linen restock', amount: 22300, paidTo: 'Hotel Supplies Lanka' },
    { id: 'EXP-206', date: '2026-11-12', category: 'Utilities', description: 'Water board & internet', amount: 9800, paidTo: 'NWSDB / SLT' }
  ],
  refunds: [
    { id: 'REF-301', reservationId: 'VT-2470', guest: 'Hiroshi Tanaka', amount: 12000, reason: 'Weather cancellation · landslide warning on route', requestedBy: 'Mira Jayasinghe (Manager)', requestedAt: '2026-11-13', status: 'Pending' },
    { id: 'REF-302', reservationId: 'VT-2464', guest: 'Emma Wilson', amount: 8500, reason: 'Early checkout · family emergency', requestedBy: 'Ruwan Perera (Deputy Manager)', requestedAt: '2026-11-09', status: 'Approved' }
  ],
  payouts: [
    { id: 'PO-501', channel: 'Booking.com', period: 'Nov 01 – Nov 15', reservations: 'VT-2481, VT-2485', expected: 96900, received: 96900, receivedOn: '2026-11-11' },
    { id: 'PO-502', channel: 'Airbnb', period: 'Nov 01 – Nov 15', reservations: 'VT-2483', expected: 47600, received: 44200, receivedOn: '2026-11-10' },
    { id: 'PO-503', channel: 'Agoda', period: 'Nov 01 – Nov 15', reservations: 'VT-2487', expected: 33150, received: null },
    { id: 'PO-504', channel: 'Trip.com', period: 'Nov 01 – Nov 15', reservations: 'VT-2488', expected: 38760, received: null }
  ],
  budgets: { Utilities: 40000, 'Staff salaries': 180000, Supplies: 20000, Maintenance: 15000, 'Food & breakfast': 45000, Marketing: 20000, Other: 10000 }
}

const money = (amount: number) => `LKR ${Math.round(amount || 0).toLocaleString('en-LK')}`
const compact = (amount: number) => amount >= 1000000 ? `${(amount / 1000000).toFixed(1)}M` : `${Math.round(amount / 1000)}k`
const shortDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const commissionRate = (source: string) => COMMISSION_RATES[source] ?? 0
const isActive = (item: Reservation) => item.status !== 'Cancelled'
const escapeHtml = (value?: string) => (value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] as string))

function periodRange(period: Period, custom: { from: string; to: string }) {
  if (period === 'This month') return { from: '2026-11-01', to: '2026-11-30' }
  if (period === 'Last 7 days') return { from: '2026-11-08', to: TODAY }
  if (period === 'Last month') return { from: '2026-10-01', to: '2026-10-31' }
  if (period === 'Custom') return custom
  return { from: '0000-01-01', to: '9999-12-31' }
}

function Stat({ icon, label, value, change, note, tone }: { icon: React.ReactNode; label: string; value: string; change?: string; note: string; tone: string }) {
  return <article className="stat-card"><div className="stat-top"><span className={`stat-icon ${tone}`}>{icon}</span>{change && <span className="stat-change"><ArrowUpRight size={13} />{change}</span>}</div><p>{label}</p><div className="stat-value">{value}</div><small>{note}</small></article>
}

function RevenueExpenseChart({ data }: { data: { month: string; revenue: number; expenses: number }[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...data.flatMap(item => [item.revenue, item.expenses]), 1)
  const top = Math.ceil(max / 250000) * 250000
  const ticks = [top, top * 0.5, 0]
  return <div>
    <div className="flex gap-4 text-[9px] text-[#687169] mb-3">
      <span className="inline-flex items-center gap-1.5"><i className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: REVENUE_COLOR }} />Revenue collected</span>
      <span className="inline-flex items-center gap-1.5"><i className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: EXPENSE_COLOR }} />Operating expenses</span>
    </div>
    <div className="flex gap-2">
      <div className="flex flex-col justify-between h-40 text-[8px] text-[#939b94] text-right w-8 shrink-0">{ticks.map(tick => <span key={tick}>{compact(tick)}</span>)}</div>
      <div className="relative flex-1 h-40">
        {ticks.map((tick, index) => <div key={tick} className="absolute left-0 right-0 border-t border-[#eef1ec]" style={{ top: `${index * 50}%` }} />)}
        <div className="absolute inset-0 flex items-end justify-around">
          {data.map((item, index) => <div key={item.month} className="relative h-full flex items-end justify-center gap-[2px] px-2 cursor-default" style={{ flex: 1 }} onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)}>
            {hover === index && <div className="absolute inset-x-1 inset-y-0 rounded-md bg-[#f3f6f2]" />}
            <i className="relative block w-3.5 rounded-t-[4px]" style={{ height: `${item.revenue / top * 100}%`, background: REVENUE_COLOR }} />
            <i className="relative block w-3.5 rounded-t-[4px]" style={{ height: `${item.expenses / top * 100}%`, background: EXPENSE_COLOR }} />
            {hover === index && <div className="absolute z-10 bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[#e9ece7] bg-white px-2.5 py-2 text-[9px] shadow-lg">
              <strong className="block text-[#202922] mb-1">{item.month} 2026</strong>
              <span className="flex items-center gap-1.5 text-[#687169]"><i className="inline-block w-2 h-2 rounded-sm" style={{ background: REVENUE_COLOR }} />Revenue <strong className="ml-auto pl-3 text-[#202922]">{money(item.revenue)}</strong></span>
              <span className="flex items-center gap-1.5 text-[#687169]"><i className="inline-block w-2 h-2 rounded-sm" style={{ background: EXPENSE_COLOR }} />Expenses <strong className="ml-auto pl-3 text-[#202922]">{money(item.expenses)}</strong></span>
              <span className="flex text-[#687169] mt-1 pt-1 border-t border-[#f0f2ee]">Net <strong className="ml-auto pl-3 text-[#202922]">{money(item.revenue - item.expenses)}</strong></span>
            </div>}
          </div>)}
        </div>
      </div>
    </div>
    <div className="flex gap-2 mt-2">
      <div className="w-8 shrink-0" />
      <div className="flex flex-1 justify-around text-center">{data.map(item => <div key={item.month} style={{ flex: 1 }}><span className="block text-[8px] font-semibold text-[#687169]">{item.month.toUpperCase()}</span><span className="block text-[8px] text-[#939b94]">net {compact(item.revenue - item.expenses)}</span></div>)}</div>
    </div>
  </div>
}

export function PaymentsFinanceView({ reservations, onUpdateReservations, role, notify }: { reservations: Reservation[]; onUpdateReservations: (updater: (prev: Reservation[]) => Reservation[]) => void; role: Role; notify: (message: string) => void }) {
  const [state, setState] = useState<FinanceState>(initialState)
  const [loaded, setLoaded] = useState(false)
  const [tab, setTab] = useState<FinanceTab>('Transactions')
  const [period, setPeriod] = useState<Period>('This month')
  const [customRange, setCustomRange] = useState({ from: '2026-11-01', to: TODAY })
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('All methods')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [showExpense, setShowExpense] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm)
  const [invoice, setInvoice] = useState<Transaction | null>(null)
  const [payoutDrafts, setPayoutDrafts] = useState<Record<string, number>>({})
  const [editingBudgets, setEditingBudgets] = useState(false)
  const [shiftPercent, setShiftPercent] = useState(20)

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
  const range = periodRange(period, customRange)
  const inRange = (date: string) => date >= range.from && date <= range.to

  const transactions = useMemo<Transaction[]>(() => reservations.flatMap(item => (item.payments ?? []).map(payment => {
    const needsVerification = payment.method === 'Bank Transfer' && !payment.isRefund
    const verification: VerificationStatus = !needsVerification || state.verifiedIds.includes(payment.id) ? 'Verified' : 'Pending verification'
    return { ...payment, reservationId: item.id, guest: item.guest, guestEmail: item.guestEmail, room: item.room, source: item.source, verification }
  })).sort((a, b) => b.date.localeCompare(a.date)), [reservations, state.verifiedIds])

  const periodTransactions = transactions.filter(row => inRange(row.date))
  const filteredTransactions = periodTransactions.filter(row =>
    (methodFilter === 'All methods' || row.method === methodFilter) &&
    (statusFilter === 'All statuses' || row.verification === statusFilter) &&
    `${row.id} ${row.reservationId} ${row.guest} ${row.receiptNumber} ${row.reference ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )
  const periodExpenses = state.expenses.filter(item => inRange(item.date)).sort((a, b) => b.date.localeCompare(a.date))
  const periodReservations = reservations.filter(item => isActive(item) && inRange(item.checkIn))

  const sumPayments = (rows: Transaction[]) => rows.reduce((sum, row) => sum + (row.isRefund ? -row.amount : row.amount), 0)
  const collected = sumPayments(periodTransactions)
  const pendingVerification = transactions.filter(row => row.verification === 'Pending verification')
  const pendingAmount = pendingVerification.reduce((sum, row) => sum + row.amount, 0)
  const outstandingList = reservations.filter(item => isActive(item) && item.total - item.paid > 0).sort((a, b) => a.checkIn.localeCompare(b.checkIn))
  const outstanding = outstandingList.reduce((sum, item) => sum + (item.total - item.paid), 0)
  const commission = periodReservations.reduce((sum, item) => sum + item.total * commissionRate(item.source), 0)
  const totalExpenses = periodExpenses.reduce((sum, item) => sum + item.amount, 0)
  const approvedRefunds = state.refunds.filter(item => item.status === 'Approved' && inRange(item.requestedAt)).reduce((sum, item) => sum + item.amount, 0)
  const netProfit = collected - commission - totalExpenses - approvedRefunds
  const pendingRefunds = state.refunds.filter(item => item.status === 'Pending')
  const potentialSavings = Math.round(commission * shiftPercent / 100)
  const periodLabel = period === 'Custom' ? `${shortDate(range.from)} – ${shortDate(range.to)}` : period

  const payoutStatus = (payout: Payout) => payout.received === null ? 'Pending' : payout.received === payout.expected ? 'Matched' : payout.resolved ? 'Resolved' : 'Discrepancy'
  const payoutIssues = state.payouts.filter(item => payoutStatus(item) === 'Discrepancy')

  const channelBreakdown = useMemo(() => {
    const groups = new Map<string, { bookings: number; gross: number; commission: number }>()
    periodReservations.forEach(item => {
      const key = item.source.startsWith('Direct') ? 'Direct' : item.source
      const current = groups.get(key) ?? { bookings: 0, gross: 0, commission: 0 }
      groups.set(key, { bookings: current.bookings + 1, gross: current.gross + item.total, commission: current.commission + item.total * commissionRate(item.source) })
    })
    return Array.from(groups.entries()).map(([channel, values]) => ({ channel, ...values })).sort((a, b) => b.gross - a.gross)
  }, [periodReservations])

  const methodBreakdown = PAYMENT_METHODS.map(method => {
    const rows = periodTransactions.filter(row => row.method === method)
    return { method, count: rows.length, amount: sumPayments(rows) }
  }).filter(item => item.count > 0).sort((a, b) => b.amount - a.amount)
  const methodMax = Math.max(1, ...methodBreakdown.map(item => item.amount))

  const novemberExpenses = state.expenses.filter(item => item.date.startsWith('2026-11'))
  const budgetRows = EXPENSE_CATEGORIES.map(category => ({ category, budget: state.budgets[category] ?? 0, actual: novemberExpenses.filter(item => item.category === category).reduce((sum, item) => sum + item.amount, 0) })).filter(item => item.budget > 0 || item.actual > 0)
  const totalBudget = budgetRows.reduce((sum, item) => sum + item.budget, 0)
  const totalActual = budgetRows.reduce((sum, item) => sum + item.actual, 0)

  const chartData = [...MONTH_HISTORY, { month: 'Nov', revenue: sumPayments(transactions.filter(row => row.date.startsWith('2026-11'))), expenses: novemberExpenses.reduce((sum, item) => sum + item.amount, 0) }]

  const buildLog = (action: string, note: string): ReservationAuditLog => ({
    id: `LOG-${Date.now()}`,
    timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
    action,
    performedBy: `${role} (${role === 'Owner' ? 'Anushka S.' : 'Staff'})`,
    note
  })

  const verifyPayment = (paymentId: string, reservationId: string) => {
    if (!isOwner) { notify('Only the owner can verify payments'); return }
    setState(current => ({ ...current, verifiedIds: [...current.verifiedIds, paymentId] }))
    onUpdateReservations(prev => prev.map(item => item.id !== reservationId ? item : { ...item, history: [buildLog('Payment Verified', `Bank transfer ${paymentId} verified by owner.`), ...(item.history || [])] }))
    notify(`Payment ${paymentId} verified · balance updated`)
  }

  const sendReminder = (reservation: Reservation) => {
    const sentAt = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    onUpdateReservations(prev => prev.map(item => item.id !== reservation.id ? item : { ...item, reminderSent: true, reminderSentAt: sentAt, history: [buildLog('Payment Reminder', `Balance reminder of ${money(item.total - item.paid)} sent to ${item.guestEmail}.`), ...(item.history || [])] }))
    notify(`Payment reminder sent to ${reservation.guest}`)
  }

  const openNewExpense = () => { setEditingExpenseId(null); setExpenseForm(emptyExpenseForm); setShowExpense(true) }
  const openEditExpense = (expense: Expense) => { setEditingExpenseId(expense.id); setExpenseForm({ date: expense.date, category: expense.category, description: expense.description, amount: expense.amount, paidTo: expense.paidTo === '—' ? '' : expense.paidTo, receiptName: expense.receiptName ?? '' }); setShowExpense(true) }
  const closeExpense = () => { setShowExpense(false); setEditingExpenseId(null); setExpenseForm(emptyExpenseForm) }

  const saveExpense = () => {
    if (!expenseForm.description.trim() || expenseForm.amount <= 0 || !expenseForm.date) { notify('Add a description, date and a valid amount'); return }
    const values = { date: expenseForm.date, category: expenseForm.category, description: expenseForm.description.trim(), amount: expenseForm.amount, paidTo: expenseForm.paidTo.trim() || '—', receiptName: expenseForm.receiptName || undefined }
    if (editingExpenseId) {
      setState(current => ({ ...current, expenses: current.expenses.map(item => item.id === editingExpenseId ? { ...item, ...values } : item) }))
      notify('Expense updated')
    } else {
      setState(current => ({ ...current, expenses: [{ id: `EXP-${Date.now().toString().slice(-5)}`, ...values }, ...current.expenses] }))
      notify(`Expense recorded · ${money(values.amount)}`)
    }
    closeExpense()
    setTab('Expenses')
  }

  const removeExpense = (id: string) => {
    setState(current => ({ ...current, expenses: current.expenses.filter(item => item.id !== id) }))
    notify('Expense removed')
  }

  const decideRefund = (id: string, status: RefundStatus) => {
    if (!isOwner) { notify('Only the owner can approve refunds'); return }
    setState(current => ({ ...current, refunds: current.refunds.map(item => item.id === id ? { ...item, status } : item) }))
    notify(status === 'Approved' ? 'Refund approved · guest will be notified' : 'Refund request rejected')
  }

  const markPayoutReceived = (payout: Payout) => {
    const amount = payoutDrafts[payout.id] ?? payout.expected
    if (!amount || amount <= 0) { notify('Enter the amount received'); return }
    setState(current => ({ ...current, payouts: current.payouts.map(item => item.id === payout.id ? { ...item, received: amount, receivedOn: TODAY } : item) }))
    notify(amount === payout.expected ? `${payout.channel} payout matched` : `${payout.channel} payout recorded · ${money(payout.expected - amount)} short`)
  }

  const resolvePayout = (payout: Payout) => {
    setState(current => ({ ...current, payouts: current.payouts.map(item => item.id === payout.id ? { ...item, resolved: true } : item) }))
    notify(`${payout.channel} discrepancy marked as resolved`)
  }

  const updateBudget = (category: ExpenseCategory, value: number) => setState(current => ({ ...current, budgets: { ...current.budgets, [category]: Math.max(0, value) } }))

  const printInvoice = (row: Transaction) => {
    const win = window.open('', '_blank', 'width=720,height=900')
    if (!win) { notify('Allow pop-ups to print the invoice'); return }
    const line = (label: string, value: string) => `<tr><td style="padding:6px 0;color:#687169">${label}</td><td style="padding:6px 0;text-align:right">${escapeHtml(value)}</td></tr>`
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(row.receiptNumber)}</title></head><body style="font-family:Georgia,serif;color:#202922;max-width:560px;margin:40px auto;padding:0 24px">
      <h1 style="font-weight:500;margin:0">Villa Tea Fields</h1>
      <p style="font-family:system-ui;font-size:12px;color:#687169;margin:4px 0 28px">Nuwara Eliya, Sri Lanka</p>
      <h2 style="font-family:system-ui;font-size:14px;letter-spacing:.08em;margin:0 0 4px">${row.isRefund ? 'REFUND RECEIPT' : 'PAYMENT RECEIPT'}</h2>
      <p style="font-family:system-ui;font-size:12px;color:#687169;margin:0 0 20px">${escapeHtml(row.receiptNumber)} · ${shortDate(row.date)}</p>
      <table style="width:100%;border-collapse:collapse;font-family:system-ui;font-size:13px">
        ${line('Guest', row.guest)}${line('Email', row.guestEmail)}${line('Reservation', `${row.reservationId} · ${row.room}`)}${line('Payment method', row.method)}${row.reference ? line('Reference', row.reference) : ''}${line('Payment ID', row.id)}
        <tr><td style="padding:14px 0 0;border-top:1px solid #e9ece7;font-weight:600">${row.isRefund ? 'Amount refunded' : 'Amount received'}</td><td style="padding:14px 0 0;border-top:1px solid #e9ece7;text-align:right;font-weight:600;font-size:16px">${money(row.amount)}</td></tr>
      </table>
      <p style="font-family:system-ui;font-size:11px;color:#939b94;margin-top:40px">Thank you for staying with Villa Tea Fields.</p>
      <script>window.onload=function(){window.print()}</script></body></html>`)
    win.document.close()
  }

  const exportCsv = () => {
    const rows = [['Payment ID', 'Reservation', 'Guest', 'Date', 'Method', 'Receipt', 'Reference', 'Amount (LKR)', 'Status'], ...filteredTransactions.map(row => [row.id, row.reservationId, row.guest, row.date, row.method, row.receiptNumber, row.reference ?? '', String(row.isRefund ? -row.amount : row.amount), row.verification])]
    const csv = rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'villa-tea-fields-transactions.csv'
    link.click()
    URL.revokeObjectURL(url)
    notify('Transactions exported as CSV')
  }

  const tabs: { name: FinanceTab; count: number }[] = [
    { name: 'Transactions', count: periodTransactions.length },
    { name: 'Outstanding', count: outstandingList.length },
    { name: 'Expenses', count: periodExpenses.length },
    { name: 'Payouts', count: state.payouts.filter(item => ['Pending', 'Discrepancy'].includes(payoutStatus(item))).length },
    { name: 'Refunds', count: pendingRefunds.length }
  ]

  return <>
    <div className="page-heading">
      <div><p className="eyebrow">BUSINESS MANAGEMENT</p><h1>Payments & finance</h1><p className="subheading">A clear picture of revenue, payments, expenses and what is still due.</p></div>
      <div className="heading-actions flex-wrap">
        <select className="period-select" value={period} onChange={event => setPeriod(event.target.value as Period)} aria-label="Reporting period"><option>This month</option><option>Last 7 days</option><option>Last month</option><option>All time</option><option>Custom</option></select>
        {period === 'Custom' && <>
          <input type="date" className="period-select" aria-label="From date" value={customRange.from} onChange={event => setCustomRange({ ...customRange, from: event.target.value })} />
          <input type="date" className="period-select" aria-label="To date" value={customRange.to} onChange={event => setCustomRange({ ...customRange, to: event.target.value })} />
        </>}
        <button className="button secondary" onClick={exportCsv}><Download size={15} /> Export</button>
        <button className="button primary" onClick={openNewExpense}><Plus size={16} /> Record expense</button>
      </div>
    </div>

    <div className="stats-grid finance-stats">
      <Stat icon={<Wallet />} label="PAYMENTS COLLECTED" value={money(collected)} change={period === 'This month' ? '8.2%' : undefined} note={`${periodTransactions.length} payments · ${periodLabel}`} tone="green" />
      <Stat icon={<CreditCard />} label="OUTSTANDING" value={money(outstanding)} note={`${outstandingList.length} active bookings with a balance`} tone="sand" />
      <Stat icon={<Receipt />} label="EXPENSES & FEES" value={money(totalExpenses + commission)} note={`Expenses ${money(totalExpenses)} · Commission ${money(commission)}`} tone="blue" />
      <Stat icon={netProfit >= 0 ? <TrendingUp /> : <TrendingDown />} label="NET PROFIT" value={money(netProfit)} note={`After fees, expenses & refunds · ${periodLabel}`} tone="purple" />
    </div>

    {(pendingVerification.length > 0 || pendingRefunds.length > 0 || payoutIssues.length > 0) && <div className="card flex flex-wrap items-center gap-3 px-4 py-3 mb-4 text-[10px]" style={{ background: '#fdf8ef', borderColor: '#f0e2c6' }}>
      <span className="attention-icon amber"><Bell size={15} /></span>
      <span className="text-[#6b5530] flex-1">
        {[
          pendingVerification.length > 0 && `${pendingVerification.length} bank transfer${pendingVerification.length > 1 ? 's' : ''} (${money(pendingAmount)}) awaiting verification`,
          pendingRefunds.length > 0 && `${pendingRefunds.length} refund request${pendingRefunds.length > 1 ? 's' : ''} need owner approval`,
          payoutIssues.length > 0 && `${payoutIssues.length} OTA payout${payoutIssues.length > 1 ? 's' : ''} with a discrepancy`
        ].filter(Boolean).join(' · ')}
      </span>
      <button className="text-button" onClick={() => {
        if (pendingVerification.length > 0) { setTab('Transactions'); setStatusFilter('Pending verification'); setPeriod('All time') }
        else if (pendingRefunds.length > 0) setTab('Refunds')
        else setTab('Payouts')
      }}>Review now <ChevronRight size={14} /></button>
    </div>}

    <div className="finance-grid">
      <div className="flex flex-col gap-4 min-w-0">
        <section className="card ledger-card min-w-0">
          <div className="segment-tabs overflow-x-auto">
            {tabs.map(item => <button key={item.name} className={tab === item.name ? 'selected' : ''} onClick={() => setTab(item.name)}>{item.name} <span>{item.count}</span></button>)}
          </div>

          {tab === 'Transactions' && <>
            <div className="flex flex-wrap gap-2 mb-3">
              <label className="table-search flex-1 min-w-[180px]"><Search size={16} /><input placeholder="Search by guest, reservation, receipt..." value={search} onChange={event => setSearch(event.target.value)} /></label>
              <select className="period-select" value={methodFilter} onChange={event => setMethodFilter(event.target.value)}><option>All methods</option>{PAYMENT_METHODS.map(method => <option key={method}>{method}</option>)}</select>
              <select className="period-select" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option>All statuses</option><option>Verified</option><option>Pending verification</option></select>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>RECEIPT</th><th>GUEST</th><th>DATE</th><th>METHOD</th><th>AMOUNT</th><th>STATUS</th></tr></thead>
                <tbody>
                  {filteredTransactions.map(row => <tr key={row.id}>
                    <td><button className="text-button" onClick={() => setInvoice(row)}><Receipt size={12} /> {row.receiptNumber}</button><small className="table-sub">{row.id} · {row.reservationId}</small></td>
                    <td>{row.guest}<small className="table-sub">{row.reference || row.source}</small></td>
                    <td>{shortDate(row.date)}</td>
                    <td>{row.method}</td>
                    <td className={row.isRefund ? '' : 'money-in'} style={row.isRefund ? { color: '#9a6258', fontWeight: 600 } : undefined}>{row.isRefund ? '−' : '+'}{money(row.amount)}</td>
                    <td>{row.verification === 'Verified' ? <span className="payment-label paid">Verified</span> : isOwner ? <button className="verify-button" onClick={() => verifyPayment(row.id, row.reservationId)}>Verify payment</button> : <span className="payment-label partial">Pending verification</span>}</td>
                  </tr>)}
                  {filteredTransactions.length === 0 && <tr><td colSpan={6} className="text-center text-[#8a938b] py-8">No transactions for {periodLabel.toLowerCase()} with these filters.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>Showing <strong>{filteredTransactions.length}</strong> of {periodTransactions.length} payments</span><span>Total <strong>{money(sumPayments(filteredTransactions))}</strong></span></div>
          </>}

          {tab === 'Outstanding' && <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>RESERVATION</th><th>CHECK IN</th><th>BOOKING VALUE</th><th>PAID</th><th>BALANCE DUE</th><th /></tr></thead>
                <tbody>
                  {outstandingList.map(item => {
                    const due = item.total - item.paid
                    const progress = Math.round(item.paid / item.total * 100)
                    return <tr key={item.id}>
                      <td><strong>{item.guest}</strong><small className="table-sub">{item.id} · {item.room} · {item.status}</small></td>
                      <td>{shortDate(item.checkIn)}</td>
                      <td>{money(item.total)}</td>
                      <td><span>{money(item.paid)}</span><div className="mt-1 h-1 w-20 rounded-full bg-[#eef2ec] overflow-hidden"><i className="block h-full bg-[#557b56]" style={{ width: `${progress}%` }} /></div></td>
                      <td><span className={`payment-label ${item.paid === 0 ? 'unpaid' : 'partial'}`} style={{ fontSize: 10 }}>{money(due)}</span></td>
                      <td>{item.reminderSent ? <span className="text-[8px] text-[#8a938b] inline-flex items-center gap-1"><Check size={11} /> Reminder sent{item.reminderSentAt ? ` · ${item.reminderSentAt}` : ''}</span> : <button className="verify-button" onClick={() => sendReminder(item)}>Send reminder</button>}</td>
                    </tr>
                  })}
                  {outstandingList.length === 0 && <tr><td colSpan={6} className="text-center text-[#8a938b] py-8">All active bookings are fully paid.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span><strong>{outstandingList.length}</strong> bookings with a balance</span><span>Total due <strong>{money(outstanding)}</strong></span></div>
          </>}

          {tab === 'Expenses' && <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>EXPENSE</th><th>CATEGORY</th><th>DATE</th><th>PAID TO</th><th>AMOUNT</th>{isOwner && <th />}</tr></thead>
                <tbody>
                  {periodExpenses.map(item => <tr key={item.id}>
                    <td><strong>{item.description}</strong><small className="table-sub inline-flex items-center gap-1">{item.id}{item.receiptName && <><Paperclip size={10} />{item.receiptName}</>}</small></td>
                    <td><span className="segment-pill">{item.category}</span></td>
                    <td>{shortDate(item.date)}</td>
                    <td>{item.paidTo}</td>
                    <td style={{ color: '#9a6258', fontWeight: 600 }}>−{money(item.amount)}</td>
                    {isOwner && <td><div className="flex gap-1"><button className="subtle-icon" aria-label={`Edit ${item.description}`} onClick={() => openEditExpense(item)}><Pencil size={13} /></button><button className="subtle-icon" aria-label={`Remove ${item.description}`} onClick={() => removeExpense(item.id)}><X size={14} /></button></div></td>}
                  </tr>)}
                  {periodExpenses.length === 0 && <tr><td colSpan={6} className="text-center text-[#8a938b] py-8">No expenses recorded for {periodLabel.toLowerCase()}.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span><strong>{periodExpenses.length}</strong> expenses · {periodLabel}</span><span>Total <strong>{money(totalExpenses)}</strong></span></div>
          </>}

          {tab === 'Payouts' && <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>CHANNEL</th><th>RESERVATIONS</th><th>EXPECTED</th><th>RECEIVED</th><th>DIFFERENCE</th><th>STATUS</th></tr></thead>
                <tbody>
                  {state.payouts.map(payout => {
                    const status = payoutStatus(payout)
                    const difference = payout.received === null ? null : payout.received - payout.expected
                    return <tr key={payout.id}>
                      <td><strong>{payout.channel}</strong><small className="table-sub">{payout.period}</small></td>
                      <td>{payout.reservations}</td>
                      <td>{money(payout.expected)}<small className="table-sub">After 15% commission</small></td>
                      <td>{payout.received === null ? isOwner ? <input type="number" min="1" className="w-24 h-7 border border-[#e3e8e1] rounded-md px-2 text-[10px]" placeholder={String(payout.expected)} value={payoutDrafts[payout.id] ?? ''} onChange={event => setPayoutDrafts({ ...payoutDrafts, [payout.id]: Number(event.target.value) })} /> : '—' : <>{money(payout.received)}<small className="table-sub">{payout.receivedOn ? shortDate(payout.receivedOn) : ''}</small></>}</td>
                      <td>{difference === null ? '—' : difference === 0 ? <span className="payment-label paid">LKR 0</span> : <span className="payment-label unpaid">{difference < 0 ? '−' : '+'}{money(Math.abs(difference))}</span>}</td>
                      <td>{status === 'Pending' ? isOwner ? <button className="verify-button" onClick={() => markPayoutReceived(payout)}>Mark received</button> : <span className="payment-label partial">Pending</span> : status === 'Discrepancy' && isOwner ? <button className="verify-button" style={{ color: '#9a6258', background: '#fbf0ee', borderColor: '#f1dcd8' }} onClick={() => resolvePayout(payout)}>Mark resolved</button> : <span className={`payment-label ${status === 'Discrepancy' ? 'unpaid' : 'paid'}`}>{status}</span>}</td>
                    </tr>
                  })}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>Expected <strong>{money(state.payouts.reduce((sum, item) => sum + item.expected, 0))}</strong></span><span>Received <strong>{money(state.payouts.reduce((sum, item) => sum + (item.received ?? 0), 0))}</strong></span></div>
          </>}

          {tab === 'Refunds' && <div className="flex flex-col gap-3">
            {state.refunds.map(item => <article key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-[#e9ece7] p-3 text-[10px]">
              <span className="attention-icon rose"><RotateCcw size={15} /></span>
              <div className="flex-1 min-w-[180px]">
                <strong className="block text-[11px] text-[#202922]">{item.guest} · {item.reservationId} · {money(item.amount)}</strong>
                <span className="block text-[#7d867e] mt-1">{item.reason}</span>
                <span className="block text-[8px] text-[#939b94] mt-1">Requested by {item.requestedBy} · {shortDate(item.requestedAt)}</span>
              </div>
              {item.status === 'Pending' && isOwner ? <div className="flex gap-2">
                <button className="button secondary" onClick={() => decideRefund(item.id, 'Rejected')}>Reject</button>
                <button className="button primary" onClick={() => decideRefund(item.id, 'Approved')}>Approve refund</button>
              </div> : <span className={`payment-label ${item.status === 'Approved' ? 'paid' : item.status === 'Rejected' ? 'unpaid' : 'partial'}`}>{item.status === 'Pending' ? 'Pending owner approval' : item.status}</span>}
            </article>)}
            <p className="muted-note text-[9px]">Refunds are requested from the reservation screen and require owner approval before being paid out.</p>
          </div>}
        </section>

        <section className="card ledger-card">
          <div className="card-heading"><div><h2>Revenue vs. expenses</h2><p>Last 6 months · November is month to date</p></div></div>
          <RevenueExpenseChart data={chartData} />
        </section>
      </div>

      <aside className="flex flex-col gap-4 min-w-0">
        <section className="card finance-side">
          <div className="card-heading"><div><h2>Profit & loss</h2><p>{periodLabel}</p></div></div>
          {[
            ['Payments collected', collected, 'in'],
            ['OTA commission (est.)', -commission, 'out'],
            ['Operating expenses', -totalExpenses, 'out'],
            ['Refunds approved', -approvedRefunds, 'out']
          ].map(([label, value, kind]) => <div key={String(label)} className="flex justify-between py-2 border-b border-[#f0f2ee] text-[10px]"><span className="text-[#687169]">{label}</span><strong style={{ color: kind === 'in' ? '#4a734e' : '#9a6258' }}>{Number(value) < 0 ? '−' : ''}{money(Math.abs(Number(value)))}</strong></div>)}
          <div className="flex justify-between pt-3 text-[11px]"><strong>Net profit</strong><strong style={{ color: netProfit >= 0 ? '#355d40' : '#9a6258' }}>{money(netProfit)}</strong></div>
        </section>

        <section className="card finance-side">
          <div className="card-heading"><div><h2>Budget vs. actual</h2><p>November 2026 · operating expenses</p></div>{isOwner && <button className="text-button" onClick={() => setEditingBudgets(!editingBudgets)}>{editingBudgets ? <><Check size={12} /> Done</> : <><Pencil size={12} /> Edit</>}</button>}</div>
          {budgetRows.map(item => {
            const over = item.budget > 0 && item.actual > item.budget
            const percent = item.budget > 0 ? Math.min(100, Math.round(item.actual / item.budget * 100)) : 100
            return <div key={item.category} className="mb-2.5 text-[9px]">
              <div className="flex items-center justify-between mb-1 gap-2">
                <span className="text-[#687169]">{item.category}</span>
                {editingBudgets ? <input type="number" min="0" className="w-20 h-6 border border-[#e3e8e1] rounded-md px-1.5 text-[9px]" value={item.budget || ''} onChange={event => updateBudget(item.category, Number(event.target.value))} aria-label={`${item.category} budget`} /> : <span><strong className="text-[#202922]">{money(item.actual)}</strong> <span className="text-[#939b94]">/ {money(item.budget)}</span></span>}
              </div>
              <div className="h-1.5 rounded-full bg-[#eef2ec] overflow-hidden"><i className="block h-full rounded-full" style={{ width: `${percent}%`, background: over ? '#b4574a' : '#3d7f47' }} /></div>
              {over && <span className="block mt-1 text-[8px] text-[#9a6258]">Over budget by {money(item.actual - item.budget)}</span>}
            </div>
          })}
          <div className="flex justify-between pt-2 mt-1 border-t border-[#f0f2ee] text-[10px]"><span className="text-[#687169]">Total</span><span><strong>{money(totalActual)}</strong> <span className="text-[#939b94]">/ {money(totalBudget)}</span></span></div>
        </section>

        <section className="card finance-side">
          <div className="card-heading"><div><h2>Payment methods</h2><p>{periodLabel} · collected</p></div></div>
          {methodBreakdown.map(item => <div key={item.method} className="mb-2.5 text-[9px]">
            <div className="flex justify-between mb-1"><span className="text-[#687169]">{item.method} <span className="text-[#939b94]">· {item.count}</span></span><strong className="text-[#202922]">{money(item.amount)}</strong></div>
            <div className="h-1.5 rounded-full bg-[#eef2ec] overflow-hidden"><i className="block h-full rounded-full" style={{ width: `${Math.round(item.amount / methodMax * 100)}%`, background: REVENUE_COLOR }} /></div>
          </div>)}
          {methodBreakdown.length === 0 && <p className="text-[9px] text-[#8a938b]">No payments in this period.</p>}
        </section>

        <section className="card finance-side">
          <div className="card-heading"><div><h2>Commission by channel</h2><p>{periodLabel} · by check-in date</p></div></div>
          {channelBreakdown.map(item => <div key={item.channel} className="flex justify-between py-2 border-b border-[#f0f2ee] text-[10px]">
            <span><strong className="block text-[#202922]">{item.channel}</strong><small className="text-[8px] text-[#939b94]">{item.bookings} booking{item.bookings > 1 ? 's' : ''} · {money(item.gross)}</small></span>
            <span className="commission-value self-center" style={{ color: item.commission > 0 ? '#9a6258' : '#4a734e' }}>{item.commission > 0 ? `−${money(item.commission)}` : 'No fee'}</span>
          </div>)}
          {channelBreakdown.length === 0 && <p className="text-[9px] text-[#8a938b]">No bookings in this period.</p>}
          <label className="slider-label mt-4">Shift OTA bookings to direct <strong>{shiftPercent}%</strong></label>
          <input className="savings-slider" type="range" min="0" max="50" value={shiftPercent} onChange={event => setShiftPercent(Number(event.target.value))} />
          <p className="savings-note">Potential commission saved: <strong>{money(potentialSavings)}</strong></p>
        </section>
      </aside>
    </div>

    {showExpense && <div className="modal-backdrop" role="presentation" onClick={event => { if (event.target === event.currentTarget) closeExpense() }}>
      <section className="modal max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="expense-title">
        <div className="modal-head"><div><p className="eyebrow">FINANCE</p><h2 id="expense-title">{editingExpenseId ? 'Edit expense' : 'Record an expense'}</h2></div><button className="icon-button" onClick={closeExpense} aria-label="Close"><X size={18} /></button></div>
        <p className="modal-copy">Expenses are deducted from collected payments in the profit & loss summary.</p>
        <div className="form-grid">
          <label className="form-field wide">Description<input autoFocus placeholder="e.g. Breakfast groceries · week 2" value={expenseForm.description} onChange={event => setExpenseForm({ ...expenseForm, description: event.target.value })} /></label>
          <label className="form-field">Category<select value={expenseForm.category} onChange={event => setExpenseForm({ ...expenseForm, category: event.target.value as ExpenseCategory })}>{EXPENSE_CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></label>
          <label className="form-field">Amount (LKR)<input type="number" min="1" value={expenseForm.amount || ''} onChange={event => setExpenseForm({ ...expenseForm, amount: Number(event.target.value) })} /></label>
          <label className="form-field">Date<input type="date" value={expenseForm.date} onChange={event => setExpenseForm({ ...expenseForm, date: event.target.value })} /></label>
          <label className="form-field">Paid to<input placeholder="Supplier or payee" value={expenseForm.paidTo} onChange={event => setExpenseForm({ ...expenseForm, paidTo: event.target.value })} /></label>
          <div className="form-field wide">
            Receipt (optional)
            <div className="flex items-center gap-2">
              <label className="button secondary cursor-pointer"><Paperclip size={14} /> {expenseForm.receiptName ? 'Replace file' : 'Attach file'}<input type="file" accept="image/*,.pdf" className="hidden" onChange={event => setExpenseForm({ ...expenseForm, receiptName: event.target.files?.[0]?.name ?? expenseForm.receiptName })} /></label>
              {expenseForm.receiptName && <span className="inline-flex items-center gap-1 text-[9px] text-[#687169]">{expenseForm.receiptName}<button className="subtle-icon" aria-label="Remove receipt" onClick={() => setExpenseForm({ ...expenseForm, receiptName: '' })}><X size={12} /></button></span>}
            </div>
          </div>
        </div>
        <div className="modal-footer"><button className="button secondary" onClick={closeExpense}>Cancel</button><button className="button primary" onClick={saveExpense}>{editingExpenseId ? 'Save changes' : 'Save expense'} <ChevronRight size={15} /></button></div>
      </section>
    </div>}

    {invoice && <div className="modal-backdrop" role="presentation" onClick={event => { if (event.target === event.currentTarget) setInvoice(null) }}>
      <section className="modal max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="invoice-title">
        <div className="modal-head"><div><p className="eyebrow">{invoice.isRefund ? 'REFUND RECEIPT' : 'PAYMENT RECEIPT'}</p><h2 id="invoice-title">{invoice.receiptNumber}</h2></div><button className="icon-button" onClick={() => setInvoice(null)} aria-label="Close"><X size={18} /></button></div>
        <p className="modal-copy">Villa Tea Fields · Nuwara Eliya, Sri Lanka · {shortDate(invoice.date)}</p>
        <div className="text-[10px]">
          {[
            ['Guest', invoice.guest],
            ['Email', invoice.guestEmail || '—'],
            ['Reservation', `${invoice.reservationId} · ${invoice.room}`],
            ['Payment method', invoice.method],
            ['Reference', invoice.reference || '—'],
            ['Payment ID', invoice.id],
            ['Status', invoice.verification]
          ].map(([label, value]) => <div key={label} className="flex justify-between py-2 border-b border-[#f0f2ee]"><span className="text-[#687169]">{label}</span><span className="text-[#202922]">{value}</span></div>)}
          <div className="flex justify-between pt-3 text-[12px]"><strong>{invoice.isRefund ? 'Amount refunded' : 'Amount received'}</strong><strong>{money(invoice.amount)}</strong></div>
        </div>
        <div className="modal-footer"><button className="button secondary" onClick={() => setInvoice(null)}>Close</button><button className="button primary" onClick={() => printInvoice(invoice)}><Printer size={15} /> Print receipt</button></div>
      </section>
    </div>}
  </>
}
