export type UserRole = 'super_admin' | 'org_admin' | 'dispatcher' | 'chief' | 'guard' | 'client';
export type OrganizationType = 'agency' | 'internal';
export type ObjectRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type PostType = 'static' | 'checkpoint' | 'mobile';
export type IncidentType = 'alarm' | 'violation' | 'event';
export type IncidentStatus = 'created' | 'accepted' | 'in_progress' | 'resolved' | 'closed';
export type ShiftStatus = 'scheduled' | 'active' | 'completed' | 'missed';
export type PatrolStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  legalName: string;
  tariff: string;
  objectCount: number;
  createdAt: string;
}

export interface SecurityObject {
  id: string;
  name: string;
  address: string;
  type: string;
  riskLevel: ObjectRiskLevel;
  workingMode: string;
  postsCount: number;
  personnelCount: number;
  status: 'active' | 'inactive';
}

export interface SecurityPost {
  id: string;
  objectId: string;
  objectName: string;
  type: PostType;
  name: string;
  schedule: string;
  isActive: boolean;
}

export interface Personnel {
  id: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  postName?: string;
  objectName?: string;
  status: 'on_duty' | 'off_duty' | 'on_leave';
  phone: string;
}

export interface Shift {
  id: string;
  postName: string;
  guardName: string;
  objectName: string;
  startTime: string;
  endTime: string;
  status: ShiftStatus;
  violations: number;
}

export interface Patrol {
  id: string;
  objectName: string;
  routeName: string;
  checkpoints: number;
  completedCheckpoints: number;
  plannedTime: string;
  status: PatrolStatus;
  guardName: string;
}

export interface Incident {
  id: string;
  type: IncidentType;
  title: string;
  objectName: string;
  createdAt: string;
  status: IncidentStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  description: string;
}

export interface DashboardStats {
  activeObjects: number;
  onDutyPersonnel: number;
  openIncidents: number;
  slaCompliance: number;
  totalPosts: number;
  activePatrols: number;
}