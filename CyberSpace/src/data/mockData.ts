import type { Seat, Zone, ZoneId } from '../types'

export const ZONES: Zone[] = [
  {
    id: 'standard',
    name: 'STANDARD',
    pricePerHour: 60,
    accent: 'green',
    tagline: 'Швидкий старт для будь-якої гри',
    description:
      'Потужна робоча станція для комфортного геймінгу в популярних онлайн-іграх та роботі.',
    features: ['RTX 4060', '16 ГБ RAM', 'Монітор 144 Гц', 'Механічна клавіатура'],
    seatCount: 8,
  },
  {
    id: 'pro',
    name: 'PRO',
    pricePerHour: 95,
    accent: 'cyan',
    tagline: 'Максимум FPS у кіберспортивних дисциплінах',
    description:
      'Розігнане залізо для CS2, Valorant та Dota 2. Стабільні 240+ FPS без просадок.',
    features: ['RTX 4070 Super', '32 ГБ RAM', 'Монітор 240 Гц', 'Світлові девайси'],
    seatCount: 8,
  },
  {
    id: 'vip',
    name: 'VIP',
    pricePerHour: 150,
    accent: 'purple',
    tagline: 'Приватна зона з преміум-комплектацією',
    description:
      'Окрема кімната, топова збірка та безмежний комфорт для стримерів і команд.',
    features: ['RTX 4080', '64 ГБ RAM', 'Монітор 360 Гц', 'Ігрове крісло + навушники'],
    seatCount: 6,
  },
]

const SPECS: Record<ZoneId, string[]> = {
  standard: [
    'Ryzen 5 · RTX 4060 · 144 Гц',
    'i5 · RTX 4060 · 144 Гц',
    'Ryzen 7 · RTX 4060 · 165 Гц',
    'i5 · RTX 4060 Ti · 144 Гц',
    'Ryzen 5 · RTX 4060 · 144 Гц',
    'i5 · RTX 4060 · 144 Гц',
    'Ryzen 7 · RTX 4060 · 165 Гц',
    'i5 · RTX 4060 Ti · 144 Гц',
  ],
  pro: [
    'i7 · RTX 4070 Super · 240 Гц',
    'Ryzen 7 · RTX 4070 Super · 240 Гц',
    'i7 · RTX 4070 Ti · 240 Гц',
    'Ryzen 9 · RTX 4070 Super · 240 Гц',
    'i7 · RTX 4070 Super · 240 Гц',
    'Ryzen 7 · RTX 4070 Ti · 240 Гц',
    'i7 · RTX 4070 Super · 240 Гц',
    'Ryzen 9 · RTX 4070 Super · 240 Гц',
  ],
  vip: [
    'i9 · RTX 4080 · 360 Гц',
    'Ryzen 9 · RTX 4080 · 360 Гц',
    'i9 · RTX 4080 Super · 360 Гц',
    'Ryzen 9 · RTX 4080 · 360 Гц',
    'i9 · RTX 4080 · 360 Гц',
    'Ryzen 9 · RTX 4080 Super · 360 Гц',
  ],
}

export function getZone(id: string): Zone | undefined {
  return ZONES.find((zone) => zone.id === id)
}

export function createSeats(): Seat[] {
  const seats: Seat[] = []

  for (const zone of ZONES) {
    for (let index = 1; index <= zone.seatCount; index += 1) {
      seats.push({
        id: `${zone.id}-${index}`,
        zoneId: zone.id,
        label: `${zone.name} #${index}`,
        specs: SPECS[zone.id][index - 1] ?? 'Станція',
        status: 'free',
      })
    }
  }

  return seats
}
