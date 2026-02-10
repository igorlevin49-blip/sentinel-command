export interface ClientObject {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'inactive';
  guardsOnDuty: number;
  totalGuards: number;
  todayPatrolsCompleted: number;
  todayPatrolsTotal: number;
  slaCompliance: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface AcceptanceRecord {
  id: string;
  objectId: string;
  objectName: string;
  action: 'accept' | 'handover';
  timestamp: string;
  performedBy: string;
  comment: string;
}

export interface ClientViolation {
  id: string;
  objectName: string;
  type: 'late_shift' | 'missed_shift' | 'missed_checkpoint' | 'late_checkpoint';
  description: string;
  date: string;
  guardName: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ClientIncident {
  id: string;
  objectName: string;
  type: 'alarm' | 'violation' | 'event';
  title: string;
  description: string;
  status: 'created' | 'accepted' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  resolvedAt?: string;
  responseTimeMin?: number;
  acknowledged: boolean;
  clientComment?: string;
  timeline: { time: string; action: string }[];
}

export interface SLAMetrics {
  avgResponseTimeMin: number;
  medianResponseTimeMin: number;
  maxResponseTimeMin: number;
  patrolCompletionPct: number;
  shiftDisciplinePct: number;
  overallSLA: number;
  monthly: { month: string; sla: number; patrols: number; discipline: number }[];
}

export const clientObjects: ClientObject[] = [
  {
    id: 'obj-1',
    name: 'БЦ «Горизонт»',
    address: 'ул. Ленина, 45',
    status: 'active',
    guardsOnDuty: 3,
    totalGuards: 4,
    todayPatrolsCompleted: 5,
    todayPatrolsTotal: 6,
    slaCompliance: 96.2,
    riskLevel: 'medium',
  },
  {
    id: 'obj-2',
    name: 'ТЦ «Мега Молл»',
    address: 'пр. Победы, 120',
    status: 'active',
    guardsOnDuty: 5,
    totalGuards: 6,
    todayPatrolsCompleted: 8,
    todayPatrolsTotal: 8,
    slaCompliance: 98.5,
    riskLevel: 'high',
  },
  {
    id: 'obj-3',
    name: 'Склад «Логистик»',
    address: 'Промзона, стр. 12',
    status: 'active',
    guardsOnDuty: 2,
    totalGuards: 2,
    todayPatrolsCompleted: 3,
    todayPatrolsTotal: 4,
    slaCompliance: 91.0,
    riskLevel: 'low',
  },
];

export const acceptanceRecords: AcceptanceRecord[] = [
  { id: 'acc-1', objectId: 'obj-1', objectName: 'БЦ «Горизонт»', action: 'accept', timestamp: '2026-02-10T08:00:00', performedBy: 'Смирнов И.П.', comment: 'Объект принят, всё в порядке' },
  { id: 'acc-2', objectId: 'obj-2', objectName: 'ТЦ «Мега Молл»', action: 'accept', timestamp: '2026-02-09T09:15:00', performedBy: 'Смирнов И.П.', comment: 'Принято после проверки постов' },
  { id: 'acc-3', objectId: 'obj-1', objectName: 'БЦ «Горизонт»', action: 'handover', timestamp: '2026-02-08T18:00:00', performedBy: 'Смирнов И.П.', comment: 'Сдача объекта, замечаний нет' },
  { id: 'acc-4', objectId: 'obj-3', objectName: 'Склад «Логистик»', action: 'accept', timestamp: '2026-02-07T07:30:00', performedBy: 'Смирнов И.П.', comment: 'Принято' },
];

export const clientViolations: ClientViolation[] = [
  { id: 'viol-1', objectName: 'БЦ «Горизонт»', type: 'late_shift', description: 'Опоздание на смену: Петров Д.А., 14 мин.', date: '2026-02-10', guardName: 'Петров Д.А.', severity: 'medium' },
  { id: 'viol-2', objectName: 'ТЦ «Мега Молл»', type: 'missed_checkpoint', description: 'Пропущен чекпоинт #5 на маршруте «Периметр»', date: '2026-02-09', guardName: 'Иванов С.К.', severity: 'high' },
  { id: 'viol-3', objectName: 'Склад «Логистик»', type: 'late_checkpoint', description: 'Чекпоинт #3 пройден с опозданием 22 мин.', date: '2026-02-09', guardName: 'Козлов А.В.', severity: 'low' },
  { id: 'viol-4', objectName: 'БЦ «Горизонт»', type: 'missed_shift', description: 'Пропущена ночная смена', date: '2026-02-08', guardName: 'Сидоров М.Е.', severity: 'high' },
  { id: 'viol-5', objectName: 'ТЦ «Мега Молл»', type: 'late_shift', description: 'Опоздание на смену: Волков А.С., 8 мин.', date: '2026-02-08', guardName: 'Волков А.С.', severity: 'low' },
];

export const clientIncidents: ClientIncident[] = [
  {
    id: 'INC-041', objectName: 'БЦ «Горизонт»', type: 'alarm', title: 'Сработка датчика движения, зона B2',
    description: 'Срабатывание на 2 этаже, зона B2. Охранник выехал на проверку.',
    status: 'resolved', priority: 'high', createdAt: '2026-02-10T02:14:00', resolvedAt: '2026-02-10T02:38:00',
    responseTimeMin: 8, acknowledged: true, clientComment: 'Подтверждаю, ложная тревога',
    timeline: [
      { time: '02:14', action: 'Инцидент создан' },
      { time: '02:16', action: 'Принят диспетчером' },
      { time: '02:22', action: 'Охранник на месте' },
      { time: '02:38', action: 'Решён: ложная тревога' },
    ],
  },
  {
    id: 'INC-042', objectName: 'ТЦ «Мега Молл»', type: 'violation', title: 'Несанкционированный доступ, парковка',
    description: 'Неизвестное ТС на закрытой парковке уровня -2.',
    status: 'in_progress', priority: 'critical', createdAt: '2026-02-10T06:45:00',
    responseTimeMin: 5, acknowledged: false,
    timeline: [
      { time: '06:45', action: 'Инцидент создан' },
      { time: '06:47', action: 'Принят диспетчером' },
      { time: '06:50', action: 'Охранник направлен' },
    ],
  },
  {
    id: 'INC-039', objectName: 'Склад «Логистик»', type: 'event', title: 'Плановая проверка пожарной сигнализации',
    description: 'Плановое тестирование системы.',
    status: 'closed', priority: 'low', createdAt: '2026-02-09T10:00:00', resolvedAt: '2026-02-09T11:30:00',
    responseTimeMin: 0, acknowledged: true,
    timeline: [
      { time: '10:00', action: 'Событие зарегистрировано' },
      { time: '11:30', action: 'Закрыто' },
    ],
  },
];

export const slaMetrics: SLAMetrics = {
  avgResponseTimeMin: 7.2,
  medianResponseTimeMin: 6,
  maxResponseTimeMin: 24,
  patrolCompletionPct: 94.5,
  shiftDisciplinePct: 91.8,
  overallSLA: 95.2,
  monthly: [
    { month: 'Сен', sla: 92.1, patrols: 89, discipline: 88 },
    { month: 'Окт', sla: 93.5, patrols: 91, discipline: 90 },
    { month: 'Ноя', sla: 94.8, patrols: 93, discipline: 91 },
    { month: 'Дек', sla: 93.2, patrols: 90, discipline: 89 },
    { month: 'Янв', sla: 95.0, patrols: 94, discipline: 92 },
    { month: 'Фев', sla: 95.2, patrols: 94.5, discipline: 91.8 },
  ],
};
