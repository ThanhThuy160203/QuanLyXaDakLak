import { RoleKey } from './role';

export type TaskStatus = 'NEW' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';
export type TaskUrgency = 'OVERDUE' | 'DUE_SOON' | 'ON_TRACK';
export type TimeframeFilter = 'MONTH' | 'QUARTER' | 'YEAR';
export type StatusFilter = 'ALL' | 'OVERDUE' | 'DUE_SOON' | 'COMPLETED';
export type TaskSource = 'SO' | 'BAN_NGANH' | 'UBND_TINH' | 'UBND_HUYEN' | 'CHU_TICH' | 'NOI_BO';

export type TaskActivityType =
  | 'ASSIGNED'
  | 'ACKNOWLEDGED'
  | 'PROGRESS_UPDATED'
  | 'FEEDBACK'
  | 'COMPLETED'
  | 'REASSIGNED'
  | 'CANCELLED';

export type TaskActivity = {
  id: string;
  taskId: string;
  type: TaskActivityType;
  summary: string;
  detail?: string;
  actor: {
    name: string;
    role: RoleKey;
  };
  timestamp: string;
  meta?: Record<string, string | number>;
};

export type TaskAssignmentPayload = {
  assigneeRole: RoleKey;
  assigneeName: string;
  department: string;
};

export type CreateTaskPayload = {
  title: string;
  description: string;
  source: TaskSource;
  ownerRole: RoleKey;
  assigneeRole: RoleKey;
  assigneeName: string;
  department: string;
  dueDate: string;
  progress?: number;
  status?: TaskStatus;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  ownerRole: RoleKey;
  assigneeRole: RoleKey;
  assigneeName: string;
  department: string;
  source: TaskSource;
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
  completedOnTime: number;
  completedLate: number;
  inProgress: number;
};
