/** Guard mobile interface mock data */

export interface GuardShiftDetail {
  id: string;
  objectName: string;
  objectAddress: string;
  postName: string;
  postType: 'static' | 'checkpoint' | 'mobile';
  scheduledStart: string;
  scheduledEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  status: 'scheduled' | 'active' | 'completed' | 'missed';
  supervisorName: string;
  supervisorPhone: string;
  startLocation: { lat: number; lng: number } | null;
  endLocation: { lat: number; lng: number } | null;
}

export interface PatrolRoute {
  id: string;
  name: string;
  checkpoints: PatrolCheckpoint[];
  plannedTime: string;
  frequency: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
}

export interface PatrolCheckpoint {
  id: string;
  name: string;
  order: number;
  expectedTimeWindow: string;
  completed: boolean;
  completedAt: string | null;
  location: { lat: number; lng: number } | null;
  code: string | null;
  deviation: PatrolDeviation | null;
}

export interface PatrolDeviation {
  reason: 'obstacle' | 'emergency' | 'equipment_failure' | 'other';
  description: string;
  timestamp: string;
}

export interface PatrolRun {
  id: string;
  routeId: string;
  routeName: string;
  startedAt: string;
  completedAt: string | null;
  checkpointsTotal: number;
  checkpointsCompleted: number;
  status: 'in_progress' | 'completed' | 'aborted';
  deviations: number;
}

export interface GuardIncident {
  id: string;
  type: 'alarm' | 'violation' | 'event';
  title: string;
  description: string;
  objectName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'created' | 'accepted' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  assignedResponder: string | null;
  notes: string[];
  hasPhoto: boolean;
  location: { lat: number; lng: number } | null;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  synced: boolean;
}

export interface GuardProfile {
  id: string;
  fullName: string;
  organization: string;
  role: string;
  postAssignment: string;
  objectAssignment: string;
  phone: string;
  gpsEnabled: boolean;
  notificationsEnabled: boolean;
  dispatcherPhone: string;
}

// --- Mock Data ---

export const guardProfile: GuardProfile = {
  id: 'per-002',
  fullName: 'Петров Дмитрий Алексеевич',
  organization: 'ЧОП «Щит и Меч»',
  role: 'Охранник',
  postAssignment: 'КПП Главный',
  objectAssignment: 'БЦ «Москва-Сити Тауэр»',
  phone: '+7 (999) 222-33-44',
  gpsEnabled: true,
  notificationsEnabled: true,
  dispatcherPhone: '+7 (999) 444-55-66',
};

export const guardShift: GuardShiftDetail = {
  id: 'sh-002',
  objectName: 'БЦ «Москва-Сити Тауэр»',
  objectAddress: 'г. Москва, Пресненская наб., 12',
  postName: 'КПП Главный',
  postType: 'checkpoint',
  scheduledStart: '2026-02-10T08:00:00',
  scheduledEnd: '2026-02-10T20:00:00',
  actualStart: '2026-02-10T07:52:00',
  actualEnd: null,
  status: 'active',
  supervisorName: 'Козлов А.В.',
  supervisorPhone: '+7 (999) 111-22-33',
  startLocation: { lat: 55.749, lng: 37.537 },
  endLocation: null,
};

export const guardPatrolRoutes: PatrolRoute[] = [
  {
    id: 'route-001',
    name: 'Маршрут А — Периметр',
    plannedTime: '45 мин',
    frequency: 'Каждые 3 часа',
    status: 'in_progress',
    checkpoints: [
      { id: 'cp-1', name: 'КПП Главный вход', order: 1, expectedTimeWindow: '0–5 мин', completed: true, completedAt: '08:15', location: { lat: 55.749, lng: 37.537 }, code: 'QR-001', deviation: null },
      { id: 'cp-2', name: 'Периметр — Сектор А', order: 2, expectedTimeWindow: '5–15 мин', completed: true, completedAt: '08:28', location: { lat: 55.7495, lng: 37.538 }, code: 'QR-002', deviation: null },
      { id: 'cp-3', name: 'Парковка П1', order: 3, expectedTimeWindow: '15–25 мин', completed: true, completedAt: '08:42', location: { lat: 55.7498, lng: 37.539 }, code: 'QR-003', deviation: null },
      { id: 'cp-4', name: 'Периметр — Сектор Б', order: 4, expectedTimeWindow: '25–30 мин', completed: false, completedAt: null, location: null, code: 'QR-004', deviation: null },
      { id: 'cp-5', name: 'Технический вход', order: 5, expectedTimeWindow: '30–35 мин', completed: false, completedAt: null, location: null, code: 'QR-005', deviation: null },
      { id: 'cp-6', name: 'Периметр — Сектор В', order: 6, expectedTimeWindow: '35–40 мин', completed: false, completedAt: null, location: null, code: 'QR-006', deviation: null },
      { id: 'cp-7', name: 'Загрузочная зона', order: 7, expectedTimeWindow: '40–43 мин', completed: false, completedAt: null, location: null, code: 'QR-007', deviation: null },
      { id: 'cp-8', name: 'КПП Главный (возврат)', order: 8, expectedTimeWindow: '43–45 мин', completed: false, completedAt: null, location: null, code: 'QR-008', deviation: null },
    ],
  },
  {
    id: 'route-002',
    name: 'Маршрут Б — Внутренний обход',
    plannedTime: '30 мин',
    frequency: 'Каждые 4 часа',
    status: 'not_started',
    checkpoints: [
      { id: 'cp-b1', name: 'Лобби 1 этаж', order: 1, expectedTimeWindow: '0–5 мин', completed: false, completedAt: null, location: null, code: 'QR-B01', deviation: null },
      { id: 'cp-b2', name: 'Лестничная клетка A', order: 2, expectedTimeWindow: '5–10 мин', completed: false, completedAt: null, location: null, code: 'QR-B02', deviation: null },
      { id: 'cp-b3', name: 'Серверная', order: 3, expectedTimeWindow: '10–15 мин', completed: false, completedAt: null, location: null, code: 'QR-B03', deviation: null },
      { id: 'cp-b4', name: 'Паркинг -1', order: 4, expectedTimeWindow: '15–22 мин', completed: false, completedAt: null, location: null, code: 'QR-B04', deviation: null },
      { id: 'cp-b5', name: 'Лобби 1 этаж (возврат)', order: 5, expectedTimeWindow: '22–30 мин', completed: false, completedAt: null, location: null, code: 'QR-B05', deviation: null },
    ],
  },
];

export const guardPatrolHistory: PatrolRun[] = [
  { id: 'run-001', routeId: 'route-001', routeName: 'Маршрут А — Периметр', startedAt: '2026-02-10T05:00:00', completedAt: '2026-02-10T05:43:00', checkpointsTotal: 8, checkpointsCompleted: 8, status: 'completed', deviations: 0 },
  { id: 'run-002', routeId: 'route-002', routeName: 'Маршрут Б — Внутренний обход', startedAt: '2026-02-10T04:00:00', completedAt: '2026-02-10T04:28:00', checkpointsTotal: 5, checkpointsCompleted: 5, status: 'completed', deviations: 0 },
];

export const guardIncidents: GuardIncident[] = [
  {
    id: 'INC-2026-0040',
    type: 'violation',
    title: 'Попытка несанкционированного прохода',
    description: 'Неизвестный пытался пройти через КПП без пропуска. Задержан до выяснения.',
    objectName: 'БЦ «Москва-Сити Тауэр»',
    severity: 'high',
    status: 'accepted',
    createdAt: '2026-02-10T01:42:00',
    assignedResponder: 'Петров Д.А.',
    notes: ['Передано диспетчеру', 'Личность устанавливается'],
    hasPhoto: true,
    location: { lat: 55.749, lng: 37.537 },
  },
  {
    id: 'INC-2026-0035',
    type: 'event',
    title: 'Обнаружена незапертая дверь',
    description: 'Служебный вход в зону Б оставлен открытым после уборочной бригады.',
    objectName: 'БЦ «Москва-Сити Тауэр»',
    severity: 'low',
    status: 'resolved',
    createdAt: '2026-02-09T22:15:00',
    assignedResponder: null,
    notes: ['Дверь закрыта, уведомлён старший'],
    hasPhoto: false,
    location: { lat: 55.7492, lng: 37.5385 },
  },
  {
    id: 'INC-2026-0032',
    type: 'alarm',
    title: 'Сработала пожарная сигнализация',
    description: 'Сработал датчик на 3 этаже. Ложное срабатывание.',
    objectName: 'БЦ «Москва-Сити Тауэр»',
    severity: 'critical',
    status: 'closed',
    createdAt: '2026-02-09T14:30:00',
    assignedResponder: 'Козлов А.В.',
    notes: ['Ложная тревога', 'Система сброшена', 'Акт составлен'],
    hasPhoto: false,
    location: { lat: 55.7491, lng: 37.5372 },
  },
];

export const guardAuditLog: AuditLogEntry[] = [
  { id: 'al-1', action: 'shift_start', timestamp: '2026-02-10T07:52:00', details: 'Смена начата', synced: true },
  { id: 'al-2', action: 'checkpoint_confirm', timestamp: '2026-02-10T08:15:00', details: 'КПП Главный вход — отметка', synced: true },
  { id: 'al-3', action: 'checkpoint_confirm', timestamp: '2026-02-10T08:28:00', details: 'Периметр — Сектор А — отметка', synced: true },
  { id: 'al-4', action: 'checkpoint_confirm', timestamp: '2026-02-10T08:42:00', details: 'Парковка П1 — отметка', synced: true },
  { id: 'al-5', action: 'incident_create', timestamp: '2026-02-10T01:42:00', details: 'Инцидент INC-2026-0040 создан', synced: true },
];

export const guardAlerts = [
  { id: 'alert-1', text: 'Обход Маршрут А просрочен на 12 мин', severity: 'high' as const, time: '11:12' },
];
