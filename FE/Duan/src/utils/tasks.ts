import {
  differenceInCalendarDays,
  isBefore,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import {
  RoleKey,
  StatusFilter,
  Task,
  TaskMetrics,
  TaskUrgency,
  TimeframeFilter,
} from '../types';
import { getTimeframeRange } from './date';

const DUE_SOON_THRESHOLD = 3; // days

export const getTaskUrgency = (task: Task): TaskUrgency => {
  const dueDate = parseISO(task.dueDate);
  const today = new Date();

  if (isBefore(dueDate, today)) {
    return 'OVERDUE';
  }

  const diff = differenceInCalendarDays(dueDate, today);
  return diff <= DUE_SOON_THRESHOLD ? 'DUE_SOON' : 'ON_TRACK';
};

const matchRole = (task: Task, roleView: RoleKey) =>
  task.assigneeRole === roleView || task.ownerRole === roleView;

export const filterTasks = (
  tasks: Task[],
  roleView: RoleKey,
  timeframe: TimeframeFilter,
  statusScope: StatusFilter,
) => {
  const range = getTimeframeRange(timeframe);

  return tasks.filter(task => {
    if (!matchRole(task, roleView)) {
      return false;
    }

    const dueDate = parseISO(task.dueDate);
    const inRange = isWithinInterval(dueDate, range);
    if (!inRange) {
      return false;
    }

    if (statusScope === 'ALL') {
      return true;
    }

    const urgency = getTaskUrgency(task);
    if (statusScope === 'OVERDUE') {
      return urgency === 'OVERDUE';
    }

    return urgency === 'DUE_SOON';
  });
};

export const buildTaskMetrics = (
  tasks: Task[],
  roleView: RoleKey,
  timeframe: TimeframeFilter,
): TaskMetrics => {
  const scopedTasks = filterTasks(tasks, roleView, timeframe, 'ALL');

  const overdue = scopedTasks.filter(task => getTaskUrgency(task) === 'OVERDUE')
    .length;
  const dueSoon = scopedTasks.filter(task => getTaskUrgency(task) === 'DUE_SOON')
    .length;
  const completed = scopedTasks.filter(task => task.status === 'COMPLETED').length;
  const total = scopedTasks.length;

  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    total,
    overdue,
    dueSoon,
    completed,
    completionRate,
  };
};
