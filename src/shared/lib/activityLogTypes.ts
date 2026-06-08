/** Значения поля `type` в журнале действий (сервер). */
export const ACTIVITY_LOG_TYPE_OPTIONS = [
  { value: '', label: 'Все типы' },
  { value: 'equipment', label: 'Оборудование' },
  { value: 'models', label: 'Модели' },
  { value: 'types', label: 'Категории' },
  { value: 'locations', label: 'Локации' },
  { value: 'documents', label: 'Документы' },
  { value: 'writeoffs', label: 'Списания' },
] as const
