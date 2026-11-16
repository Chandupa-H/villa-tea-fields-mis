import { Role } from '../reservations-view'

export interface RoomItem {
  id: string
  name: string
  number: string
  type: 'Deluxe King' | 'Superior Queen' | 'Heritage Suite' | 'Executive Family Suite'
  description: string
  maxAdults: number
  maxChildren: number
  facilities: string[]
  status: 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance' | 'Inactive'
  active: boolean
  image: string
}

export interface BookingConfiguration {
  id: string
  name: string
  code: string
  description: string
  roomIds: string[]
  maxGuests: number
  basePriceMultiplier: number
  active: boolean
}

export interface PricingSeason {
  id: string
  name: string
  code: string
  type: 'Normal' | 'Peak' | 'Off-Peak'
  startDate: string
  endDate: string
  description: string
}

export interface PricingRule {
  id: string
  name: string
  roomOrConfig: string
  seasonId: string
  startDate: string
  endDate: string
  basePrice: number
  weekendPrice: number
  additionalGuestCharge: number
  discountPercent: number
  status: 'Active' | 'Upcoming' | 'Expired'
}

export interface PricingHistoryLog {
  id: string
  timestamp: string
  ruleName: string
  changedBy: string
  oldPrice: number
  newPrice: number
  reason: string
}

export interface BookingPoliciesState {
  checkInTime: string
  checkOutTime: string
  earlyCheckInAllowed: boolean
  earlyCheckInFee: number
  lateCheckOutAllowed: boolean
  lateCheckOutFee: number
  minStayNights: number
  maxStayNights: number
  maxAdvanceBookingDays: number
  maxGuestOccupancy: number
  requireApproval: boolean
  blackoutDates: string[]
  freeCancellationDays: number
  cancellationFeePercent: number
  refundPercent: number
  cleaningBufferHours: number
  maintenanceBufferHours: number
  timeBetweenReservationsHours: number
}

export interface PaymentMethodConfig {
  id: 'payhere' | 'bank_transfer' | 'cash'
  name: string
  provider: string
  enabled: boolean
  status: 'Enabled' | 'Disabled' | 'Demo Mode'
  description: string
  details: Record<string, string>
}

export interface PaymentTransactionRecord {
  id: string
  guestName: string
  bookingRef: string
  amount: number
  method: 'PayHere' | 'Bank Transfer' | 'Cash'
  status: 'Completed' | 'Pending Verification' | 'Refunded'
  date: string
}

export interface NotificationItem {
  id: string
  category: 'Booking' | 'Payment' | 'Guest' | 'Operations'
  title: string
  description: string
  enabled: boolean
  channels: {
    email: boolean
    sms: boolean
    whatsapp: boolean
  }
  recipients: ('Owner' | 'Manager' | 'Deputy Manager' | 'Housekeeper' | 'Guest')[]
  template: {
    subject: string
    body: string
  }
}

export interface NotificationLog {
  id: string
  recipient: string
  channel: 'Email' | 'SMS' | 'WhatsApp'
  event: string
  timestamp: string
  status: 'Delivered' | 'Pending' | 'Failed'
}

export interface StaffUser {
  id: string
  name: string
  email: string
  phone: string
  role: 'Owner' | 'Villa Manager' | 'Assistant Manager' | 'Housekeeping Staff' | 'External Accountant'
  status: 'Active' | 'Inactive' | 'Suspended'
  lastLogin: string
  avatar: string
}

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete'

export interface RolePermissions {
  [moduleName: string]: {
    [roleName: string]: {
      view: boolean
      create: boolean
      edit: boolean
      delete: boolean
    }
  }
}

export interface GuestConsentRecord {
  id: string
  guestName: string
  email: string
  phone: string
  emailConsent: boolean
  smsConsent: boolean
  whatsappConsent: boolean
  consentDate: string
  status: 'Consented' | 'Not Consented' | 'Withdrawn'
  notes?: string
}

export interface MarketingCampaign {
  id: string
  name: string
  description: string
  channel: 'Email' | 'SMS' | 'WhatsApp'
  targetAudience: string
  status: 'Draft' | 'Scheduled' | 'Sent'
  recipientCount: number
  scheduledDate: string
  content: string
}

/* ====================================================================
   INITIAL MOCK DATA MATCHING VILLA TEA FIELDS (NUWARA ELIYA)
   ==================================================================== */

export const INITIAL_ROOMS: RoomItem[] = [
  {
    id: 'ROOM-01',
    name: 'Room 01 · Single Tree Deluxe',
    number: '101',
    type: 'Deluxe King',
    description: 'Ground floor room with garden views and direct verandah access to the tea bushes.',
    maxAdults: 2,
    maxChildren: 1,
    facilities: ['King Bed', 'Mountain View', 'En-suite Bathroom', 'Tea Station', 'Free Wi-Fi', 'Room Heater'],
    status: 'Available',
    active: true,
    image: 'photo-1611892440504-42a792e24d32'
  },
  {
    id: 'ROOM-02',
    name: 'Room 02 · Planter\'s Vista Suite',
    number: '102',
    type: 'Heritage Suite',
    description: 'Premier suite featuring colonial high ceilings, working fireplace and panoramic mist valley vistas.',
    maxAdults: 2,
    maxChildren: 1,
    facilities: ['King Bed', 'Wood Fireplace', 'Private Verandah', 'Luxury Bathtub', 'Artisan Ceylon Tea Bar', 'Smart TV'],
    status: 'Occupied',
    active: true,
    image: 'photo-1616594039964-ae9021a400a0'
  },
  {
    id: 'ROOM-03',
    name: 'Room 03 · Highland Heritage',
    number: '103',
    type: 'Superior Queen',
    description: 'Tranquil room with hand-carved mahogany queen bed and serene pine forest perspective.',
    maxAdults: 2,
    maxChildren: 0,
    facilities: ['Queen Bed', 'Forest View', 'En-suite Rain Shower', 'Handcrafted Writing Desk', 'High-Speed Wi-Fi'],
    status: 'Available',
    active: true,
    image: 'photo-1618221195710-dd6b41faaea6'
  },
  {
    id: 'ROOM-04',
    name: 'Room 04 · Pedro Valley Master Suite',
    number: '104',
    type: 'Executive Family Suite',
    description: 'Spacious upper wing duplex suite suitable for small families or luxury romantic escapes.',
    maxAdults: 3,
    maxChildren: 2,
    facilities: ['King Bed + Daybed', 'Panoramic Tea Plantation View', 'Dual Fireplace', 'Jacuzzi Tub', 'Private Dining Balcony'],
    status: 'Available',
    active: true,
    image: 'photo-1616486338812-3dadae4b4ace'
  }
]

export const INITIAL_BOOKING_CONFIGURATIONS: BookingConfiguration[] = [
  {
    id: 'CONFIG-01',
    name: 'Entire Villa Buyout (All 4 Bedrooms)',
    code: 'FULL-VILLA',
    description: 'Exclusive private access to all four bedrooms, central drawing room, dining salon, and private garden estate.',
    roomIds: ['ROOM-01', 'ROOM-02', 'ROOM-03', 'ROOM-04'],
    maxGuests: 10,
    basePriceMultiplier: 3.8,
    active: true
  },
  {
    id: 'CONFIG-02',
    name: 'Ground Floor Plantation Wing',
    code: 'WING-LOWER',
    description: 'Rooms 01 and 02 with private garden terrace access, ideal for two couples traveling together.',
    roomIds: ['ROOM-01', 'ROOM-02'],
    maxGuests: 5,
    basePriceMultiplier: 1.9,
    active: true
  },
  {
    id: 'CONFIG-03',
    name: 'Upper Highland Vista Wing',
    code: 'WING-UPPER',
    description: 'Rooms 03 and 04 on the upper level with elevated panoramic valley views.',
    roomIds: ['ROOM-03', 'ROOM-04'],
    maxGuests: 5,
    basePriceMultiplier: 1.95,
    active: true
  },
  {
    id: 'CONFIG-04',
    name: 'Master Suites Combo',
    code: 'SUITES-DUO',
    description: 'Combination of our two premier heritage suites (Planter\'s Vista and Pedro Valley Suite).',
    roomIds: ['ROOM-02', 'ROOM-04'],
    maxGuests: 6,
    basePriceMultiplier: 2.1,
    active: true
  },
  {
    id: 'CONFIG-05',
    name: 'Individual Room Reservations',
    code: 'INDIVIDUAL',
    description: 'Standard booking of standalone private bedrooms with shared salon and verandahs.',
    roomIds: ['ROOM-01', 'ROOM-02', 'ROOM-03', 'ROOM-04'],
    maxGuests: 3,
    basePriceMultiplier: 1.0,
    active: true
  },
  {
    id: 'CONFIG-06',
    name: 'Family Quad Retreat',
    code: 'FAMILY-TRIO',
    description: 'Three bedrooms (Room 01, 03 and 04) reserved together for extended family retreats.',
    roomIds: ['ROOM-01', 'ROOM-03', 'ROOM-04'],
    maxGuests: 8,
    basePriceMultiplier: 2.85,
    active: true
  }
]

export const INITIAL_SEASONS: PricingSeason[] = [
  {
    id: 'SEASON-PEAK-WINTER',
    name: 'Winter Festive & Nuwara Eliya Season',
    code: 'PEAK-DEC-JAN',
    type: 'Peak',
    startDate: '2026-12-15',
    endDate: '2027-01-15',
    description: 'High season for winter holiday travellers and cooler misty weather.'
  },
  {
    id: 'SEASON-REGULAR',
    name: 'Highland Regular Season',
    code: 'REGULAR-SPRING',
    type: 'Normal',
    startDate: '2026-01-16',
    endDate: '2026-04-09',
    description: 'Pleasant weather and stable international tourist arrivals.'
  },
  {
    id: 'SEASON-APRIL-FEST',
    name: 'April Spring Horse Racing Season',
    code: 'PEAK-APRIL',
    type: 'Peak',
    startDate: '2026-04-10',
    endDate: '2026-04-25',
    description: 'Annual festive season in Nuwara Eliya with premium demand.'
  },
  {
    id: 'SEASON-MONSOON',
    name: 'Monsoon Green Season',
    code: 'OFFPEAK-MONSOON',
    type: 'Off-Peak',
    startDate: '2026-05-01',
    endDate: '2026-06-30',
    description: 'Lush greenery, cozy rainfall stays, and special direct booking promotions.'
  }
]

export const INITIAL_PRICING_RULES: PricingRule[] = [
  {
    id: 'RULE-01',
    name: 'Standard Deluxe Rate · Nov 2026',
    roomOrConfig: 'Room 01 · Single Tree Deluxe',
    seasonId: 'SEASON-REGULAR',
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    basePrice: 22800,
    weekendPrice: 25000,
    additionalGuestCharge: 4500,
    discountPercent: 0,
    status: 'Active'
  },
  {
    id: 'RULE-02',
    name: 'Planter\'s Vista Heritage Rate',
    roomOrConfig: 'Room 02 · Planter\'s Vista Suite',
    seasonId: 'SEASON-REGULAR',
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    basePrice: 26000,
    weekendPrice: 29000,
    additionalGuestCharge: 5000,
    discountPercent: 5,
    status: 'Active'
  },
  {
    id: 'RULE-03',
    name: 'Pedro Valley Master Luxury Rate',
    roomOrConfig: 'Room 04 · Pedro Valley Master Suite',
    seasonId: 'SEASON-REGULAR',
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    basePrice: 28000,
    weekendPrice: 32000,
    additionalGuestCharge: 5500,
    discountPercent: 0,
    status: 'Active'
  },
  {
    id: 'RULE-04',
    name: 'Full Villa Buyout Festive Peak Rate',
    roomOrConfig: 'Entire Villa Buyout (All 4 Bedrooms)',
    seasonId: 'SEASON-PEAK-WINTER',
    startDate: '2026-12-15',
    endDate: '2027-01-15',
    basePrice: 105000,
    weekendPrice: 120000,
    additionalGuestCharge: 6000,
    discountPercent: 0,
    status: 'Upcoming'
  },
  {
    id: 'RULE-05',
    name: 'Highland Heritage Midweek Special',
    roomOrConfig: 'Room 03 · Highland Heritage',
    seasonId: 'SEASON-REGULAR',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    basePrice: 21000,
    weekendPrice: 23500,
    additionalGuestCharge: 4000,
    discountPercent: 10,
    status: 'Expired'
  }
]

export const INITIAL_PRICING_HISTORY: PricingHistoryLog[] = [
  {
    id: 'PLOG-01',
    timestamp: '2026-11-12 14:30',
    ruleName: 'Standard Deluxe Rate',
    changedBy: 'Anushka Senanayake (Owner)',
    oldPrice: 21500,
    newPrice: 22800,
    reason: 'Seasonal adjustment based on Q4 highland occupancy trend'
  },
  {
    id: 'PLOG-02',
    timestamp: '2026-11-05 09:15',
    ruleName: 'Full Villa Buyout Festive Peak Rate',
    changedBy: 'Mira Jayasinghe (Manager)',
    oldPrice: 98000,
    newPrice: 105000,
    reason: 'Early bird festive demand benchmark against Pedro Valley peers'
  },
  {
    id: 'PLOG-03',
    timestamp: '2026-10-20 16:45',
    ruleName: 'Planter\'s Vista Heritage Rate',
    changedBy: 'Anushka Senanayake (Owner)',
    oldPrice: 25000,
    newPrice: 26000,
    reason: 'Upgraded en-suite amenities and artisan tea bar'
  }
]

export const INITIAL_BOOKING_POLICIES: BookingPoliciesState = {
  checkInTime: '14:00',
  checkOutTime: '11:00',
  earlyCheckInAllowed: true,
  earlyCheckInFee: 4000,
  lateCheckOutAllowed: true,
  lateCheckOutFee: 5000,
  minStayNights: 1,
  maxStayNights: 30,
  maxAdvanceBookingDays: 365,
  maxGuestOccupancy: 10,
  requireApproval: true,
  blackoutDates: ['2026-12-24', '2026-12-25', '2026-12-31'],
  freeCancellationDays: 7,
  cancellationFeePercent: 20,
  refundPercent: 80,
  cleaningBufferHours: 2.5,
  maintenanceBufferHours: 4.0,
  timeBetweenReservationsHours: 3.0
}

export const INITIAL_PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'payhere',
    name: 'PayHere Online Gateway',
    provider: 'PayHere LK (Visa, MasterCard, Amex, Genie, FriMi)',
    enabled: true,
    status: 'Enabled',
    description: 'Instant credit card and local digital wallet processing in LKR with automated callback receipts.',
    details: {
      merchantId: 'VTF-10294-LK',
      currency: 'LKR',
      mode: 'Production Sandbox',
      feePayer: 'Property absorbs (2.69% + LKR 30)'
    }
  },
  {
    id: 'bank_transfer',
    name: 'Direct Bank Transfer',
    provider: 'Commercial Bank of Ceylon / Sampath Bank',
    enabled: true,
    status: 'Enabled',
    description: 'Manual verification of guest payment slips uploaded via WhatsApp or Web Portal before confirmation.',
    details: {
      bankName: 'Commercial Bank of Ceylon',
      accountNumber: '8004928172',
      accountName: 'Villa Tea Fields Pvt Ltd',
      branch: 'Nuwara Eliya City Branch',
      swiftCode: 'CCEYLKX'
    }
  },
  {
    id: 'cash',
    name: 'Cash on Arrival',
    provider: 'Front Desk Terminal',
    enabled: true,
    status: 'Demo Mode',
    description: 'Direct payment at the villa during check-in. Subject to advance deposit requirement.',
    details: {
      acceptedCurrencies: 'LKR, USD, EUR, GBP',
      depositRequired: '50% advance bank guarantee'
    }
  }
]

export const INITIAL_PAYMENT_TRANSACTIONS: PaymentTransactionRecord[] = [
  {
    id: 'TXN-9021',
    guestName: 'Amelia Hart',
    bookingRef: 'VT-2481',
    amount: 34200,
    method: 'PayHere',
    status: 'Completed',
    date: '2026-11-10 09:30'
  },
  {
    id: 'TXN-9022',
    guestName: 'Nimal Perera',
    bookingRef: 'VT-2482',
    amount: 45600,
    method: 'Bank Transfer',
    status: 'Completed',
    date: '2026-11-12 11:20'
  },
  {
    id: 'TXN-9023',
    guestName: 'Sophie Laurent',
    bookingRef: 'VT-2483',
    amount: 56000,
    method: 'PayHere',
    status: 'Completed',
    date: '2026-11-08 16:10'
  },
  {
    id: 'TXN-9024',
    guestName: 'Kavindi Silva',
    bookingRef: 'VT-2484',
    amount: 26000,
    method: 'Bank Transfer',
    status: 'Pending Verification',
    date: '2026-11-14 14:05'
  },
  {
    id: 'TXN-9025',
    guestName: 'Daniel Kim',
    bookingRef: 'VT-2488',
    amount: 22800,
    method: 'Cash',
    status: 'Pending Verification',
    date: '2026-11-14 18:20'
  },
  {
    id: 'TXN-9018',
    guestName: 'Liam Taylor',
    bookingRef: 'VT-2470',
    amount: 14000,
    method: 'PayHere',
    status: 'Refunded',
    date: '2026-11-02 10:15'
  }
]

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'NOTIF-01',
    category: 'Booking',
    title: 'New Booking Created',
    description: 'Sent immediately when a reservation is placed via website or OTA channel.',
    enabled: true,
    channels: { email: true, sms: true, whatsapp: true },
    recipients: ['Owner', 'Manager', 'Guest'],
    template: {
      subject: 'Reservation Confirmed at Villa Tea Fields · Ref #{booking_id}',
      body: 'Dear {guest_name}, thank you for choosing Villa Tea Fields. Your booking for {room_name} from {check_in} to {check_out} is received. Total: {total_amount}. We look forward to hosting you in misty Nuwara Eliya.'
    }
  },
  {
    id: 'NOTIF-02',
    category: 'Booking',
    title: 'Booking Confirmation',
    description: 'Triggered when the owner approves a pending reservation or advance payment is verified.',
    enabled: true,
    channels: { email: true, sms: false, whatsapp: true },
    recipients: ['Guest', 'Manager'],
    template: {
      subject: 'Official Confirmation & Highland Arrival Guide · #{booking_id}',
      body: 'Hello {guest_name}, your reservation at Villa Tea Fields is officially approved! Check-in starts at 2:00 PM on {check_in}. Contact our villa host on WhatsApp for driving directions along Pedro Estate Road.'
    }
  },
  {
    id: 'NOTIF-03',
    category: 'Booking',
    title: 'Booking Cancellation',
    description: 'Sent when a booking is cancelled by guest or villa management.',
    enabled: true,
    channels: { email: true, sms: true, whatsapp: false },
    recipients: ['Owner', 'Manager', 'Guest'],
    template: {
      subject: 'Booking Cancellation Notice · #{booking_id}',
      body: 'Dear {guest_name}, your booking #{booking_id} has been cancelled in accordance with our cancellation policies. Any applicable refund of {refund_amount} will be processed within 5 business days.'
    }
  },
  {
    id: 'NOTIF-04',
    category: 'Booking',
    title: 'Booking Modification',
    description: 'Sent when dates, guests, or room allocation changes.',
    enabled: true,
    channels: { email: true, sms: false, whatsapp: true },
    recipients: ['Manager', 'Guest'],
    template: {
      subject: 'Updated Reservation Details · #{booking_id}',
      body: 'Your reservation #{booking_id} at Villa Tea Fields has been updated. New dates: {check_in} to {check_out}. Please review your revised folio attached.'
    }
  },
  {
    id: 'NOTIF-05',
    category: 'Payment',
    title: 'Payment Received',
    description: 'Dispatched upon online payment success or bank transfer validation.',
    enabled: true,
    channels: { email: true, sms: true, whatsapp: true },
    recipients: ['Owner', 'Manager', 'Guest'],
    template: {
      subject: 'Payment Receipt · Villa Tea Fields #{receipt_id}',
      body: 'Thank you {guest_name}. We have acknowledged your payment of {amount} via {payment_method} for reservation #{booking_id}. Remaining balance: {remaining_balance}.'
    }
  },
  {
    id: 'NOTIF-06',
    category: 'Payment',
    title: 'Payment Pending Reminder',
    description: 'Automated alert sent 24h prior to advance payment deadline.',
    enabled: true,
    channels: { email: true, sms: false, whatsapp: true },
    recipients: ['Guest', 'Manager'],
    template: {
      subject: 'Advance Payment Reminder for Villa Tea Fields #{booking_id}',
      body: 'Friendly reminder: To hold your room reservation #{booking_id}, please submit the 50% advance deposit by {deadline}. You may pay online or reply with your bank transfer slip.'
    }
  },
  {
    id: 'NOTIF-07',
    category: 'Payment',
    title: 'Refund Processed',
    description: 'Sent when an approved refund has been dispatched.',
    enabled: true,
    channels: { email: true, sms: false, whatsapp: false },
    recipients: ['Guest', 'Owner'],
    template: {
      subject: 'Refund Confirmation · Villa Tea Fields',
      body: 'A refund of {refund_amount} has been initiated to your original payment method for booking #{booking_id}. Bank reference: {ref_number}.'
    }
  },
  {
    id: 'NOTIF-08',
    category: 'Guest',
    title: 'Upcoming Check-in (24h Pre-arrival)',
    description: 'Sent 24 hours prior to guest arrival with directions, weather, and tea menu.',
    enabled: true,
    channels: { email: true, sms: false, whatsapp: true },
    recipients: ['Guest'],
    template: {
      subject: 'We are preparing for your arrival tomorrow at Villa Tea Fields',
      body: 'Ayubowan {guest_name}! Nuwara Eliya is currently 17°C misty. We look forward to welcoming you tomorrow around {arrival_time}. Let us know if you need early check-in or Sri Lankan tea upon arrival.'
    }
  },
  {
    id: 'NOTIF-09',
    category: 'Guest',
    title: 'Upcoming Check-out Reminder',
    description: 'Sent on departure morning with checkout checklist and feedback link.',
    enabled: true,
    channels: { email: true, sms: false, whatsapp: true },
    recipients: ['Guest'],
    template: {
      subject: 'Departure Notice & Thank You · Villa Tea Fields',
      body: 'We hope you enjoyed your tea estate stay. Check-out is by 11:00 AM. Our team is available to assist with luggage and fresh Ceylon tea gifts at the reception desk.'
    }
  },
  {
    id: 'NOTIF-10',
    category: 'Operations',
    title: 'Room Cleaning Required',
    description: 'Triggered upon checkout or housekeeping scheduling.',
    enabled: true,
    channels: { email: false, sms: true, whatsapp: true },
    recipients: ['Housekeeper', 'Deputy Manager'],
    template: {
      subject: 'Housekeeping Alert: {room_name} Ready for Cleaning',
      body: 'Departure clean assigned for {room_name}. Inspection required before {due_time} for next arrival.'
    }
  },
  {
    id: 'NOTIF-11',
    category: 'Operations',
    title: 'Maintenance Required',
    description: 'Alert sent when a repair or inspection task is logged.',
    enabled: true,
    channels: { email: true, sms: true, whatsapp: true },
    recipients: ['Manager', 'Deputy Manager'],
    template: {
      subject: 'Maintenance Ticket: {room_name} - {issue_title}',
      body: 'New maintenance request logged for {room_name}: {issue_description}. Priority: {priority}. Assigned to villa engineering.'
    }
  },
  {
    id: 'NOTIF-12',
    category: 'Operations',
    title: 'Staff Task Assigned',
    description: 'Dispatched to relevant staff when a shift duty is created.',
    enabled: true,
    channels: { email: false, sms: false, whatsapp: true },
    recipients: ['Housekeeper', 'Deputy Manager'],
    template: {
      subject: 'New Shift Task Assigned',
      body: 'You have been assigned a new task: "{task_title}" due at {due_time}. Check your Villa MIS dashboard for full checklist.'
    }
  },
  {
    id: 'NOTIF-13',
    category: 'Operations',
    title: 'Task Deadline Approaching',
    description: 'Sent 30 minutes before cleaning or breakfast prep deadline.',
    enabled: true,
    channels: { email: false, sms: true, whatsapp: false },
    recipients: ['Manager', 'Housekeeper'],
    template: {
      subject: 'Task Deadline Warning: {task_title}',
      body: 'Task "{task_title}" for {room_name} is due in 30 minutes. Guest arrival estimated at {arrival_time}.'
    }
  }
]

export const INITIAL_NOTIFICATION_LOGS: NotificationLog[] = [
  {
    id: 'NLOG-501',
    recipient: 'amelia.hart@gmail.com',
    channel: 'Email',
    event: 'New Booking Created',
    timestamp: '2026-11-10 09:31',
    status: 'Delivered'
  },
  {
    id: 'NLOG-502',
    recipient: '+94 77 765 4321',
    channel: 'WhatsApp',
    event: 'Payment Received',
    timestamp: '2026-11-12 11:21',
    status: 'Delivered'
  },
  {
    id: 'NLOG-503',
    recipient: 'sewwandi.s@villateafields.lk',
    channel: 'SMS',
    event: 'Room Cleaning Required',
    timestamp: '2026-11-14 11:05',
    status: 'Delivered'
  },
  {
    id: 'NLOG-504',
    recipient: 'kavindi.silva@outlook.com',
    channel: 'WhatsApp',
    event: 'Payment Pending Reminder',
    timestamp: '2026-11-14 15:00',
    status: 'Delivered'
  },
  {
    id: 'NLOG-505',
    recipient: '+33 6 12 34 56 78',
    channel: 'SMS',
    event: 'Upcoming Check-in (24h Pre-arrival)',
    timestamp: '2026-11-14 14:00',
    status: 'Pending'
  }
]

export const INITIAL_STAFF_USERS: StaffUser[] = [
  {
    id: 'USER-01',
    name: 'Anushka Senanayake',
    email: 'anushka.s@villateafields.lk',
    phone: '+94 77 220 1199',
    role: 'Owner',
    status: 'Active',
    lastLogin: 'Today, 08:30 AM',
    avatar: 'AS'
  },
  {
    id: 'USER-02',
    name: 'Mira Jayasinghe',
    email: 'mira.j@villateafields.lk',
    phone: '+94 71 445 8822',
    role: 'Villa Manager',
    status: 'Active',
    lastLogin: 'Today, 09:15 AM',
    avatar: 'MJ'
  },
  {
    id: 'USER-03',
    name: 'Ruwan Perera',
    email: 'ruwan.p@villateafields.lk',
    phone: '+94 77 889 0011',
    role: 'Assistant Manager',
    status: 'Active',
    lastLogin: 'Yesterday, 06:40 PM',
    avatar: 'RP'
  },
  {
    id: 'USER-04',
    name: 'Sewwandi Silva',
    email: 'sewwandi.s@villateafields.lk',
    phone: '+94 72 334 5566',
    role: 'Housekeeping Staff',
    status: 'Active',
    lastLogin: 'Today, 07:10 AM',
    avatar: 'SS'
  },
  {
    id: 'USER-05',
    name: 'Chaminda Wickramasinghe',
    email: 'c.wickrama@auditpartners.lk',
    phone: '+94 11 234 5678',
    role: 'External Accountant',
    status: 'Inactive',
    lastLogin: 'Nov 02, 2026',
    avatar: 'CW'
  }
]

export const SYSTEM_MODULES = [
  'Dashboard',
  'Reservations',
  'Room Management',
  'Guest Management',
  'Finance',
  'Staff Management',
  'Reports',
  'Settings'
] as const

export const SYSTEM_ROLES = [
  'Owner',
  'Villa Manager',
  'Assistant Manager',
  'Housekeeping Staff',
  'External Accountant'
] as const

export const INITIAL_PERMISSIONS: RolePermissions = {
  Dashboard: {
    Owner: { view: true, create: true, edit: true, delete: true },
    'Villa Manager': { view: true, create: true, edit: true, delete: false },
    'Assistant Manager': { view: true, create: true, edit: false, delete: false },
    'Housekeeping Staff': { view: true, create: false, edit: false, delete: false },
    'External Accountant': { view: true, create: false, edit: false, delete: false }
  },
  Reservations: {
    Owner: { view: true, create: true, edit: true, delete: true },
    'Villa Manager': { view: true, create: true, edit: true, delete: true },
    'Assistant Manager': { view: true, create: true, edit: true, delete: false },
    'Housekeeping Staff': { view: true, create: false, edit: false, delete: false },
    'External Accountant': { view: true, create: false, edit: false, delete: false }
  },
  'Room Management': {
    Owner: { view: true, create: true, edit: true, delete: true },
    'Villa Manager': { view: true, create: true, edit: true, delete: false },
    'Assistant Manager': { view: true, create: true, edit: true, delete: false },
    'Housekeeping Staff': { view: true, create: false, edit: true, delete: false },
    'External Accountant': { view: false, create: false, edit: false, delete: false }
  },
  'Guest Management': {
    Owner: { view: true, create: true, edit: true, delete: true },
    'Villa Manager': { view: true, create: true, edit: true, delete: false },
    'Assistant Manager': { view: true, create: true, edit: true, delete: false },
    'Housekeeping Staff': { view: true, create: false, edit: false, delete: false },
    'External Accountant': { view: false, create: false, edit: false, delete: false }
  },
  Finance: {
    Owner: { view: true, create: true, edit: true, delete: true },
    'Villa Manager': { view: true, create: true, edit: false, delete: false },
    'Assistant Manager': { view: false, create: false, edit: false, delete: false },
    'Housekeeping Staff': { view: false, create: false, edit: false, delete: false },
    'External Accountant': { view: true, create: true, edit: true, delete: false }
  },
  'Staff Management': {
    Owner: { view: true, create: true, edit: true, delete: true },
    'Villa Manager': { view: true, create: true, edit: true, delete: false },
    'Assistant Manager': { view: true, create: true, edit: false, delete: false },
    'Housekeeping Staff': { view: false, create: false, edit: false, delete: false },
    'External Accountant': { view: false, create: false, edit: false, delete: false }
  },
  Reports: {
    Owner: { view: true, create: true, edit: true, delete: true },
    'Villa Manager': { view: true, create: true, edit: false, delete: false },
    'Assistant Manager': { view: false, create: false, edit: false, delete: false },
    'Housekeeping Staff': { view: false, create: false, edit: false, delete: false },
    'External Accountant': { view: true, create: true, edit: false, delete: false }
  },
  Settings: {
    Owner: { view: true, create: true, edit: true, delete: true },
    'Villa Manager': { view: true, create: false, edit: true, delete: false },
    'Assistant Manager': { view: false, create: false, edit: false, delete: false },
    'Housekeeping Staff': { view: false, create: false, edit: false, delete: false },
    'External Accountant': { view: false, create: false, edit: false, delete: false }
  }
}

export const INITIAL_GUEST_CONSENTS: GuestConsentRecord[] = [
  {
    id: 'CONS-01',
    guestName: 'Amelia Hart',
    email: 'amelia.hart@gmail.com',
    phone: '+44 7911 123456',
    emailConsent: true,
    smsConsent: true,
    whatsappConsent: true,
    consentDate: '2026-11-10',
    status: 'Consented',
    notes: 'Opted in during Booking.com online check-in'
  },
  {
    id: 'CONS-02',
    guestName: 'Nimal Perera',
    email: 'nimal.p@sltnet.lk',
    phone: '+94 77 765 4321',
    emailConsent: true,
    smsConsent: false,
    whatsappConsent: true,
    consentDate: '2026-11-12',
    status: 'Consented',
    notes: 'Requested WhatsApp exclusive promotional vouchers'
  },
  {
    id: 'CONS-03',
    guestName: 'Sophie Laurent',
    email: 'sophie.laurent@paris.fr',
    phone: '+33 6 12 34 56 78',
    emailConsent: true,
    smsConsent: true,
    whatsappConsent: false,
    consentDate: '2026-11-08',
    status: 'Consented',
    notes: 'Subscribed to seasonal tea harvest updates'
  },
  {
    id: 'CONS-04',
    guestName: 'Kavindi Silva',
    email: 'kavindi.silva@outlook.com',
    phone: '+94 71 888 9900',
    emailConsent: false,
    smsConsent: false,
    whatsappConsent: false,
    consentDate: '2026-11-14',
    status: 'Not Consented',
    notes: 'Declined marketing communications on reservation request'
  },
  {
    id: 'CONS-05',
    guestName: 'Daniel Kim',
    email: 'daniel.kim@seoul.kr',
    phone: '+82 10 9876 5432',
    emailConsent: false,
    smsConsent: false,
    whatsappConsent: false,
    consentDate: '2026-10-18',
    status: 'Withdrawn',
    notes: 'Unsubscribed from promotional emails on Oct 25'
  },
  {
    id: 'CONS-06',
    guestName: 'Oliver James',
    email: 'oliver.james@london.co.uk',
    phone: '+44 7820 998877',
    emailConsent: true,
    smsConsent: false,
    whatsappConsent: true,
    consentDate: '2026-09-14',
    status: 'Consented',
    notes: 'Repeat guest · Interested in Ceylon tea plantation tasting tours'
  }
]

export const INITIAL_CAMPAIGNS: MarketingCampaign[] = [
  {
    id: 'CAMP-01',
    name: 'Winter Festive Highland Retreat 15% Off',
    description: 'Direct booking promotion for December & January holiday stays at Villa Tea Fields.',
    channel: 'Email',
    targetAudience: 'All Consented Guests (186 recipients)',
    status: 'Scheduled',
    recipientCount: 186,
    scheduledDate: '2026-11-20 10:00',
    content: 'Experience misty mornings and wood fires in Nuwara Eliya. Book directly to enjoy 15% off and complimentary Ceylon artisan high tea.'
  },
  {
    id: 'CAMP-02',
    name: 'WhatsApp Exclusive: Repeat Guest Privilege',
    description: 'Complimentary room upgrade offer for past visitors during weekdays.',
    channel: 'WhatsApp',
    targetAudience: 'Repeat Guests with WhatsApp Consent (58 recipients)',
    status: 'Sent',
    recipientCount: 58,
    scheduledDate: '2026-11-01 14:00',
    content: 'Ayubowan from Villa Tea Fields! As our valued return guest, enjoy a complimentary upgrade to our Planter\'s Vista Suite on your next highland visit.'
  },
  {
    id: 'CAMP-03',
    name: 'Spring Strawberry & Tea Season Flash Sale',
    description: 'Early bird campaign for the April festive racing and garden season.',
    channel: 'SMS',
    targetAudience: 'Sri Lankan Local Residents (94 recipients)',
    status: 'Draft',
    recipientCount: 94,
    scheduledDate: '2026-12-05 09:00',
    content: 'Villa Tea Fields Nuwara Eliya: April reservations are now open. Reserve your boutique villa stay with 20% advance discount. Reply YES to hold.'
  }
]
