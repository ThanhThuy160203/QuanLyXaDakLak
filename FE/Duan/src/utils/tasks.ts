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

    if (statusScope === 'COMPLETED') {
      return task.status === 'COMPLETED';
    }

    const urgency = getTaskUrgency(task);
    if (statusScope === 'OVERDUE') {
      return urgency === 'OVERDUE';
    }

    if (statusScope === 'DUE_SOON') {
      return urgency === 'DUE_SOON';
    }

    return true;
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
  const completedTasks = scopedTasks.filter(task => task.status === 'COMPLETED');
  const completed = completedTasks.length;
  const total = scopedTasks.length;
  const completedOnTime = completedTasks.filter(
    task => getTaskUrgency(task) !== 'OVERDUE',
  ).length;
  const completedLate = completed - completedOnTime;
  const inProgress = scopedTasks.filter(task =>
    task.status === 'NEW' || task.status === 'IN_PROGRESS' || task.status === 'REVIEW',
  ).length;

  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    total,
    overdue,
    dueSoon,
    completed,
    completionRate,
    completedOnTime,
    completedLate,
    inProgress,
  };
};
