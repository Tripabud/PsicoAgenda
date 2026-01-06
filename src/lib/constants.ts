
export const DAYS_OF_WEEK = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"] as const;
export type DayOfWeek = typeof DAYS_OF_WEEK[number];

export const MORNING_SLOTS = ["08:00", "08:45", "09:30", "10:15", "11:00", "11:45"] as const;
export const AFTERNOON_SLOTS = ["14:00", "14:45", "15:30", "16:15", "17:00", "17:45", "18:30", "19:15"] as const;
export const ALL_TIME_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS] as const;
export type TimeSlot = typeof ALL_TIME_SLOTS[number];

export const MAX_PAST_WEEKS = 6;
export const LOCAL_STORAGE_KEY = "sessionZenScheduleData";
