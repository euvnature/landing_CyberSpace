export type ZoneId = 'standard' | 'pro' | 'vip'

export type SeatStatus = 'free' | 'occupied' | 'selected'

export type Accent = 'green' | 'cyan' | 'purple'

export interface Zone {
  id: ZoneId
  name: string
  pricePerHour: number
  accent: Accent
  tagline: string
  description: string
  features: string[]
  seatCount: number
}

export interface Seat {
  id: string
  zoneId: ZoneId
  label: string
  specs: string
  status: SeatStatus
}

export interface Booking {
  id: string
  seatId: string
  zoneId: ZoneId
  name: string
  phone: string
  hours: number
  totalPrice: number
  createdAt: number
}

export interface BookingDraft {
  name: string
  phone: string
  hours: number
}

export interface ValidationResult {
  valid: boolean
  errors: Partial<Record<keyof BookingDraft, string>>
}

export interface ClubStats {
  total: number
  free: number
  occupied: number
}
