/** Extended mock data for Executive and Control dashboards */

export const incidentsOverTime = [
  { date: '08 Янв', incidents: 5, sla: 94 },
  { date: '15 Янв', incidents: 8, sla: 91 },
  { date: '22 Янв', incidents: 3, sla: 97 },
  { date: '29 Янв', incidents: 6, sla: 93 },
  { date: '05 Фев', incidents: 4, sla: 96 },
  { date: '06 Фев', incidents: 2, sla: 98 },
];

export const incidentsByObject = [
  { object: 'Завод «Прометей»', incidents: 14 },
  { object: 'БЦ «Москва-Сити»', incidents: 11 },
  { object: 'ТЦ «Галерея»', incidents: 8 },
  { object: 'Склад «Логистик»', incidents: 6 },
  { object: 'ЖК «Резиденция»', incidents: 4 },
  { object: 'Офис «Финтех»', incidents: 3 },
  { object: 'Парковка «Центр.»', incidents: 2 },
];

export const incidentTypeDistribution = [
  { name: 'Тревога', value: 18, color: 'hsl(0, 72%, 51%)' },
  { name: 'Нарушение', value: 24, color: 'hsl(38, 92%, 50%)' },
  { name: 'Событие', value: 12, color: 'hsl(213, 94%, 55%)' },
];

export const performanceByUnit = [
  { unit: 'Группа А', sla: 98, patrols: 96, discipline: 95 },
  { unit: 'Группа Б', sla: 94, patrols: 91, discipline: 88 },
  { unit: 'Группа В', sla: 97, patrols: 99, discipline: 97 },
  { unit: 'Группа Г', sla: 91, patrols: 87, discipline: 82 },
];

export const slaTrend = [
  { period: 'Нояб', value: 92 },
  { period: 'Дек', value: 94 },
  { period: 'Янв', value: 93 },
  { period: 'Фев (тек.)', value: 96.4 },
];

export const controlDashboardStats = {
  shiftCoverage: 94,
  lateShifts: 3,
  missedShifts: 1,
  patrolCompletion: 91,
  personnelViolations: 7,
  activeObjectsCount: 12,
};

export const slaByObject = [
  { object: 'БЦ «Москва-Сити»', sla: 98, target: 95 },
  { object: 'Завод «Прометей»', sla: 92, target: 95 },
  { object: 'ТЦ «Галерея»', sla: 96, target: 95 },
  { object: 'Склад «Логистик»', sla: 97, target: 95 },
  { object: 'ЖК «Резиденция»', sla: 99, target: 95 },
  { object: 'Офис «Финтех»', sla: 95, target: 95 },
];

export const incidentsByObjectForControl = [
  { object: 'Завод «Прометей»', open: 2, resolved: 8, closed: 4 },
  { object: 'БЦ «Москва-Сити»', open: 1, resolved: 6, closed: 4 },
  { object: 'ТЦ «Галерея»', open: 0, resolved: 4, closed: 4 },
  { object: 'Склад «Логистик»', open: 0, resolved: 3, closed: 3 },
  { object: 'ЖК «Резиденция»', open: 0, resolved: 2, closed: 2 },
];

export const guardShiftData = {
  guardName: 'Петров Д.А.',
  postName: 'КПП Главный',
  objectName: 'БЦ «Москва-Сити Тауэр»',
  shiftStart: '2026-02-06T08:00:00',
  shiftEnd: '2026-02-06T20:00:00',
  status: 'active' as const,
  currentPatrol: {
    routeName: 'Маршрут А — Периметр',
    checkpoints: [
      { id: 'cp-1', name: 'КПП Главный вход', completed: true, time: '08:15' },
      { id: 'cp-2', name: 'Периметр — Сектор А', completed: true, time: '08:28' },
      { id: 'cp-3', name: 'Парковка П1', completed: true, time: '08:42' },
      { id: 'cp-4', name: 'Периметр — Сектор Б', completed: false, time: null },
      { id: 'cp-5', name: 'Технический вход', completed: false, time: null },
      { id: 'cp-6', name: 'Периметр — Сектор В', completed: false, time: null },
      { id: 'cp-7', name: 'Загрузочная зона', completed: false, time: null },
      { id: 'cp-8', name: 'КПП Главный вход (возврат)', completed: false, time: null },
    ],
  },
  recentIncidents: [
    { id: 'INC-2026-0040', title: 'Попытка несанкц. прохода', time: '01:42', priority: 'high' as const },
  ],
};

export const clientObjectData = {
  objectName: 'БЦ «Москва-Сити Тауэр»',
  status: 'active' as const,
  slaCompliance: 98,
  guardsOnDuty: 4,
  totalGuards: 6,
  currentShifts: 4,
  incidentsThisMonth: 3,
  incidentsResolved: 2,
  lastPatrolTime: '08:42',
};
