import type { Booking, BookingDraft, Seat, ValidationResult, Zone } from '../types'

export const MIN_HOURS = 1
export const MAX_HOURS = 12

export function computeTotalPrice(pricePerHour: number, hours: number): number {
  return pricePerHour * hours
}

export function clampHours(hours: number): number {
  if (!Number.isFinite(hours)) {
    return MIN_HOURS
  }
  return Math.min(MAX_HOURS, Math.max(MIN_HOURS, Math.round(hours)))
}

export function validateDraft(draft: BookingDraft): ValidationResult {
  const errors: Partial<Record<keyof BookingDraft, string>> = {}

  const name = draft.name.trim()
  if (name.length < 2) {
    errors.name = "Введіть ім'я (мінімум 2 символи)"
  }

  const phone = draft.phone.replace(/[\s()\-.]/g, '')
  if (!/^\+?\d{7,15}$/.test(phone)) {
    errors.phone = 'Введіть коректний номер телефону'
  }

  const hours = draft.hours
  if (!Number.isFinite(hours) || hours < MIN_HOURS || hours > MAX_HOURS) {
    errors.hours = `Кількість годин: від ${MIN_HOURS} до ${MAX_HOURS}`
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function createBooking(
  seat: Seat,
  zone: Zone,
  draft: BookingDraft,
  id: string,
): Booking {
  const hours = clampHours(draft.hours)

  return {
    id,
    seatId: seat.id,
    zoneId: zone.id,
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    hours,
    totalPrice: computeTotalPrice(zone.pricePerHour, hours),
    createdAt: Date.now(),
  }
}

export function formatPrice(value: number): string {
  return `${value.toLocaleString('uk-UA')} грн`
}

export function createBookingId(): string {
  return `bk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
