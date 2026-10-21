import './style.css'
import type { Booking, BookingDraft, ClubStats, Seat, Zone } from './types'
import { ZONES, createSeats, getZone } from './data/mockData'
import { loadBookings, saveBookings } from './modules/storage'
import {
  clampHours,
  computeTotalPrice,
  createBooking,
  createBookingId,
  formatPrice,
  validateDraft,
} from './modules/booking'

type ToastType = 'success' | 'error' | 'warning' | 'info'

function q<T extends Element>(selector: string): T {
  const node = document.querySelector<T>(selector)
  if (!node) {
    throw new Error(`Element not found: ${selector}`)
  }
  return node
}

function createEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className) {
    node.className = className
  }
  if (text !== undefined) {
    node.textContent = text
  }
  return node
}

function append(parent: HTMLElement, ...children: (Node | null | undefined)[]): void {
  for (const child of children) {
    if (child) {
      parent.append(child)
    }
  }
}

const seatMap = q<HTMLElement>('#seat-map')
const mapStats = q<HTMLElement>('#map-stats')
const bookingsPanel = q<HTMLElement>('#bookings-panel')
const modal = q<HTMLElement>('#booking-modal')
const modalSeatInfo = q<HTMLElement>('#modal-seat')
const form = q<HTMLFormElement>('#booking-form')
const nameInput = q<HTMLInputElement>('#name')
const phoneInput = q<HTMLInputElement>('#phone')
const hoursInput = q<HTMLInputElement>('#hours')
const formErrors = q<HTMLElement>('#form-errors')
const priceValue = q<HTMLElement>('#price-value')
const toast = q<HTMLElement>('#toast')
const navToggle = q<HTMLButtonElement>('.nav-toggle')
const nav = q<HTMLElement>('#site-nav')

let seats: Seat[] = createSeats()
const bookings: Booking[] = loadBookings()

let selectedSeatId: string | null = null
let modalSeat: Seat | null = null
let toastTimer: number | undefined

for (const booking of bookings) {
  const seat = seats.find((item) => item.id === booking.seatId)
  if (seat) {
    seat.status = 'occupied'
  }
}

function seatStatusText(status: Seat['status']): string {
  switch (status) {
    case 'free':
      return 'Вільно'
    case 'occupied':
      return 'Зайнято'
    case 'selected':
      return 'Обрано'
  }
}

function seatLabelFromId(seatId: string): string {
  const [zoneId, index] = seatId.split('-')
  const zone = getZone(zoneId)
  return zone ? `${zone.name} #${index}` : seatId
}

function computeStats(seatList: Seat[]): ClubStats {
  const occupied = seatList.filter((seat) => seat.status === 'occupied').length
  return {
    total: seatList.length,
    occupied,
    free: seatList.length - occupied,
  }
}

function renderSeatMap(): void {
  seatMap.replaceChildren()

  for (const zone of ZONES) {
    const zoneSeats = seats.filter((seat) => seat.zoneId === zone.id)
    const freeCount = zoneSeats.filter((seat) => seat.status === 'free').length

    const block = createEl('div', `zone zone--${zone.accent}`)
    block.dataset.zone = zone.id

    const head = createEl('div', 'zone__head')
    head.append(createEl('h3', 'zone__title', `${zone.name} · ${zone.pricePerHour} грн/год`))
    head.append(createEl('span', 'zone__count', `Вільно: ${freeCount}/${zoneSeats.length}`))

    const grid = createEl('div', 'zone__grid')
    for (const seat of zoneSeats) {
      grid.append(buildSeat(seat, zone))
    }

    append(block, head, grid)
    seatMap.append(block)
  }
}

function buildSeat(seat: Seat, zone: Zone): HTMLElement {
  const button = createEl('button', `seat seat--${seat.status} seat--accent-${zone.accent}`)
  button.type = 'button'
  button.dataset.seat = seat.id
  button.disabled = seat.status === 'occupied'
  button.append(createEl('span', 'seat__label', seat.label))
  button.append(createEl('span', 'seat__specs', seat.specs))
  button.append(createEl('span', 'seat__state', seatStatusText(seat.status)))
  button.addEventListener('click', () => handleSeatClick(seat))
  return button
}

function handleSeatClick(seat: Seat): void {
  if (seat.status === 'occupied') {
    showToast('Це місце вже зайняте. Оберіть вільне.', 'warning')
    return
  }

  if (seat.status === 'selected') {
    seat.status = 'free'
    selectedSeatId = null
    renderSeatMap()
    renderStats()
    return
  }

  if (selectedSeatId) {
    const previous = seats.find((item) => item.id === selectedSeatId)
    if (previous && previous.status === 'selected') {
      previous.status = 'free'
    }
  }

  seat.status = 'selected'
  selectedSeatId = seat.id
  renderSeatMap()
  renderStats()
  openBookingModal(seat)
}

function renderStats(): void {
  const stats = computeStats(seats)
  mapStats.replaceChildren()

  const items: { label: string; value: number; className: string }[] = [
    { label: 'Всього місць', value: stats.total, className: 'stat--neutral' },
    { label: 'Вільно', value: stats.free, className: 'stat--free' },
    { label: 'Зайнято', value: stats.occupied, className: 'stat--occupied' },
  ]

  for (const item of items) {
    const stat = createEl('div', `stat ${item.className}`)
    stat.append(createEl('span', 'stat__value', String(item.value)))
    stat.append(createEl('span', 'stat__label', item.label))
    mapStats.append(stat)
  }
}

function openBookingModal(seat: Seat): void {
  const zone = getZone(seat.zoneId)
  if (!zone) {
    return
  }

  modalSeat = seat
  modalSeatInfo.replaceChildren()

  const info = createEl('div', `modal__seat-card modal__seat-card--${zone.accent}`)
  info.append(createEl('span', 'modal__seat-name', seat.label))
  info.append(
    createEl('span', 'modal__seat-zone', `${zone.name} · ${formatPrice(zone.pricePerHour)} / год`),
  )
  info.append(createEl('span', 'modal__seat-specs', seat.specs))
  modalSeatInfo.append(info)

  nameInput.value = ''
  phoneInput.value = ''
  hoursInput.value = '2'
  formErrors.replaceChildren()
  updatePrice()

  modal.classList.add('is-open')
  modal.setAttribute('aria-hidden', 'false')
  nameInput.focus()
}

function closeBookingModal(): void {
  modal.classList.remove('is-open')
  modal.setAttribute('aria-hidden', 'true')
  modalSeat = null

  if (selectedSeatId) {
    const seat = seats.find((item) => item.id === selectedSeatId)
    if (seat && seat.status === 'selected') {
      seat.status = 'free'
    }
    selectedSeatId = null
    renderSeatMap()
    renderStats()
  }
}

function updatePrice(): void {
  if (!modalSeat) {
    return
  }
  const zone = getZone(modalSeat.zoneId)
  if (!zone) {
    return
  }
  const hours = clampHours(Number(hoursInput.value))
  priceValue.textContent = formatPrice(computeTotalPrice(zone.pricePerHour, hours))
}

function renderErrors(errors: Partial<Record<keyof BookingDraft, string>>): void {
  formErrors.replaceChildren()
  const messages = Object.values(errors).filter(
    (value): value is string => typeof value === 'string',
  )
  for (const message of messages) {
    formErrors.append(createEl('p', 'form__error', message))
  }
}

function handleSubmit(event: SubmitEvent): void {
  event.preventDefault()
  if (!modalSeat) {
    return
  }

  const seat = modalSeat
  const zone = getZone(seat.zoneId)
  if (!zone) {
    return
  }

  const draft: BookingDraft = {
    name: nameInput.value,
    phone: phoneInput.value,
    hours: Number(hoursInput.value),
  }

  const result = validateDraft(draft)
  renderErrors(result.errors)

  if (!result.valid) {
    showToast('Перевірте правильність заповнення форми.', 'error')
    return
  }

  const booking = createBooking(seat, zone, draft, createBookingId())
  const label = seat.label

  bookings.push(booking)
  saveBookings(bookings)

  seat.status = 'occupied'
  selectedSeatId = null
  modalSeat = null

  modal.classList.remove('is-open')
  modal.setAttribute('aria-hidden', 'true')

  renderSeatMap()
  renderStats()
  renderBookingsPanel()
  showToast(
    `${label} заброньовано на ${booking.hours} год · ${formatPrice(booking.totalPrice)}`,
    'success',
  )
}

function renderBookingsPanel(): void {
  bookingsPanel.replaceChildren()

  const panel = createEl('div', 'bookings__inner')
  panel.append(createEl('h3', 'bookings__title', 'Активні бронювання'))

  if (bookings.length === 0) {
    panel.append(createEl('p', 'bookings__empty', 'Поки що немає активних бронювань.'))
    bookingsPanel.append(panel)
    return
  }

  const list = createEl('ul', 'bookings__list')
  for (const booking of bookings) {
    const zone = getZone(booking.zoneId)
    const item = createEl('li', 'booking')

    const main = createEl('div', 'booking__main')
    main.append(createEl('span', 'booking__seat', seatLabelFromId(booking.seatId)))
    main.append(
      createEl(
        'span',
        'booking__meta',
        `${booking.name} · ${booking.hours} год · ${formatPrice(booking.totalPrice)}`,
      ),
    )
    if (zone) {
      main.append(createEl('span', `booking__zone booking__zone--${zone.accent}`, zone.name))
    }

    const cancel = createEl('button', 'booking__cancel', 'Скасувати')
    cancel.type = 'button'
    cancel.addEventListener('click', () => cancelBooking(booking.id))

    append(item, main, cancel)
    list.append(item)
  }

  const clearAll = createEl('button', 'btn btn--ghost btn--block bookings__clear', 'Очистити все')
  clearAll.type = 'button'
  clearAll.addEventListener('click', clearAllBookings)

  panel.append(list, clearAll)
  bookingsPanel.append(panel)
}

function cancelBooking(bookingId: string): void {
  const index = bookings.findIndex((booking) => booking.id === bookingId)
  if (index === -1) {
    return
  }

  const booking = bookings[index]
  const seat = seats.find((item) => item.id === booking.seatId)
  if (seat && seat.status === 'occupied') {
    seat.status = 'free'
  }

  bookings.splice(index, 1)
  saveBookings(bookings)
  renderSeatMap()
  renderStats()
  renderBookingsPanel()
  showToast('Бронювання скасовано.', 'info')
}

function clearAllBookings(): void {
  if (bookings.length === 0) {
    return
  }

  for (const booking of bookings) {
    const seat = seats.find((item) => item.id === booking.seatId)
    if (seat && seat.status === 'occupied') {
      seat.status = 'free'
    }
  }

  bookings.length = 0
  saveBookings(bookings)
  renderSeatMap()
  renderStats()
  renderBookingsPanel()
  showToast('Усі бронювання очищено.', 'info')
}

function showToast(message: string, type: ToastType = 'info'): void {
  toast.textContent = message
  toast.className = `toast toast--${type}`
  toast.classList.remove('is-visible')
  void toast.offsetWidth
  toast.classList.add('is-visible')

  if (toastTimer !== undefined) {
    window.clearTimeout(toastTimer)
  }
  toastTimer = window.setTimeout(() => {
    toast.classList.remove('is-visible')
  }, 3200)
}

function wireHoursButtons(): void {
  const buttons = modal.querySelectorAll<HTMLButtonElement>('.form__hours-btn')
  for (const button of buttons) {
    button.addEventListener('click', () => {
      const delta = Number(button.dataset.hours)
      hoursInput.value = String(clampHours(Number(hoursInput.value) + delta))
      updatePrice()
    })
  }
  hoursInput.addEventListener('input', updatePrice)
}

function wireModalClose(): void {
  modal.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (target.closest('[data-close]')) {
      closeBookingModal()
    }
  })

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeBookingModal()
    }
  })
}

function wireNavToggle(): void {
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open')
    navToggle.setAttribute('aria-expanded', String(isOpen))
    navToggle.setAttribute('aria-label', isOpen ? 'Закрити меню' : 'Відкрити меню')
  })

  for (const link of nav.querySelectorAll('.nav__link')) {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open')
      navToggle.setAttribute('aria-expanded', 'false')
    })
  }
}

function wireZoneLinks(): void {
  const links = document.querySelectorAll<HTMLElement>('[data-zone]')
  for (const link of links) {
    link.addEventListener('click', () => {
      const zoneId = link.dataset.zone
      if (!zoneId) {
        return
      }
      const block = seatMap.querySelector<HTMLElement>(`.zone[data-zone="${zoneId}"]`)
      if (block) {
        block.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }
}

function init(): void {
  renderSeatMap()
  renderStats()
  renderBookingsPanel()
  wireHoursButtons()
  wireModalClose()
  wireNavToggle()
  wireZoneLinks()
  form.addEventListener('submit', handleSubmit)
}

init()
