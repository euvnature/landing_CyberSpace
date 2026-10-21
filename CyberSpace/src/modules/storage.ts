import type { Booking } from '../types'

const STORAGE_KEY = 'cyberspace.bookings.v1'

function isBooking(value: unknown): value is Booking {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.seatId === 'string' &&
    typeof candidate.zoneId === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.phone === 'string' &&
    typeof candidate.hours === 'number' &&
    typeof candidate.totalPrice === 'number' &&
    typeof candidate.createdAt === 'number'
  )
}

export function loadBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isBooking)
  } catch {
    return []
  }
}

export function saveBookings(bookings: Booking[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))
  } catch {
    // localStorage може бути недоступний (приватний режим, переповнене сховище).
  }
}

export function clearBookings(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ігноруємо помилки очищення сховища.
  }
}
