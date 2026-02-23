import {
  endOfMonth,
  endOfQuarter,
  endOfYear,
  startOfMonth,
  startOfQuarter,
  startOfYear,
} from 'date-fns';
import { TimeframeFilter } from '../types';

export const getTimeframeRange = (timeframe: TimeframeFilter) => {
  const now = new Date();

  switch (timeframe) {
    case 'QUARTER':
      return {
        start: startOfQuarter(now),
        end: endOfQuarter(now),
      };
    case 'YEAR':
      return {
        start: startOfYear(now),
        end: endOfYear(now),
      };
    case 'MONTH':
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
  }
};
