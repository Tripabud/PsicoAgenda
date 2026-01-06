
import {
  startOfWeek,
  addWeeks,
  subWeeks,
  format,
  parseISO,
  isSameDay,
  isBefore,
  isAfter,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  isValid,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { MORNING_SLOTS, AFTERNOON_SLOTS, ALL_TIME_SLOTS, DayOfWeek, DAYS_OF_WEEK } from './constants';

export function getWeekId(date: Date): string {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  return format(monday, 'yyyy-MM-dd');
}

export function getFormattedWeekTitle(date: Date): string {
  const monday = startOfWeek(date, { weekStartsOn: 1 });
  // Ensure Spanish locale is used for month names
  return `Semana del ${format(monday, 'MMMM d, yyyy', { locale: es })}`;
}

export function getNextWeek(date: Date): Date {
  return addWeeks(date, 1);
}

export function getPreviousWeek(date: Date): Date {
  return subWeeks(date, 1);
}

export function getCurrentWeekStartDate(): Date {
  return startOfWeek(new Date(), { weekStartsOn: 1 });
}

export function getInitialWeekKeys(currentDate: Date, maxPastWeeks: number): string[] {
  const keys = [getWeekId(currentDate)];
  for (let i = 1; i <= maxPastWeeks; i++) {
    keys.push(getWeekId(subWeeks(currentDate, i)));
  }
  // Add one future week for potential copy
  keys.push(getWeekId(addWeeks(currentDate,1)));
  return [...new Set(keys)].sort(); // Ensure uniqueness and order
}


export function generateEmptyWeekData(weekStartDate: string): import('@/types').WeekData {
  const days: import('@/types').DayAppointments = {};
  DAYS_OF_WEEK.forEach(day => {
    days[day] = {};
    ALL_TIME_SLOTS.forEach(slot => {
      days[day][slot] = {
        id: `${day}-${slot}`,
        patientName: "",
        attended: false,
        amountPaid: 0,
        isBlocked: false,
      };
    });
  });
  return { weekStartDate, days };
}

export { format, parseISO, isSameDay, isBefore, isAfter, addWeeks, subWeeks, startOfWeek, isValid };
