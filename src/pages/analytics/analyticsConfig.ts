export const STATUS_LABELS: Record<string, string> = {
  active: 'Активно',
  broken: 'Неисправно',
  written_off: 'Списано',
}

export const STATUS_COLORS: Record<string, string> = {
  active: '#2e9e6b',
  broken: '#e0a32e',
  written_off: '#d2544b',
}

export const STATUS_ORDER = ['active', 'broken', 'written_off']

export const TICKET_TYPE_LABELS: Record<string, string> = {
  repair: 'Ремонт',
  network: 'Сеть',
  hardware: 'Оборудование',
  software: 'ПО',
}

export const TICKET_STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  in_progress: 'В работе',
  done: 'Выполнено',
  cancelled: 'Отменено',
}

export const TICKET_STATUS_COLORS: Record<string, string> = {
  draft: '#9aa6b2',
  in_progress: '#3b82c4',
  done: '#2e9e6b',
  cancelled: '#d2544b',
}

export const TICKET_STATUS_ORDER = ['draft', 'in_progress', 'done', 'cancelled']

export const WEEKDAY_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

export const CHART_PALETTE = [
  '#3b82c4',
  '#2e9e6b',
  '#e0a32e',
  '#d2544b',
  '#7c5cc4',
  '#48a9a6',
  '#c4724b',
  '#5a8f3c',
]

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

export function ticketTypeLabel(type: string): string {
  return TICKET_TYPE_LABELS[type] ?? type
}
