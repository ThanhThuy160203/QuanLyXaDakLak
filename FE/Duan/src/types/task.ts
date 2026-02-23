import { RoleKey } from './role';

export type TaskStatus = 'NEW' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';
export type TaskUrgency = 'OVERDUE' | 'DUE_SOON' | 'ON_TRACK';
export type TimeframeFilter = 'MONTH' | 'QUARTER' | 'YEAR';
export type StatusFilter = 'ALL' | 'OVERDUE' | 'DUE_SOON';

export type Task = {
  id: string;
  title: string;
  description: string;
  ownerRole: RoleKey;
  assigneeRole: RoleKey;
  assigneeName: string;
  department: string;
  source: 'SO' | 'UBND_TINH' | 'UBND_HUYEN' | 'CHU_TICH' | 'NOI_BO';
  dueDate: string; // ISO string
  status: TaskStatus;
  progress: number;
  attachments?: number;
};

export type TaskMetrics = {
  total: number;
  overdue: number;
  dueSoon: number;
  completed: number;
  completionRate: number;
};
