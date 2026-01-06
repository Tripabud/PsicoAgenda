import type { DayOfWeek, TimeSlot } from "@/lib/constants";

export interface Appointment {
  id: string; // Unique ID for the appointment, e.g., `${day}-${timeSlot}`
  patientName: string;
  attended: boolean;
  amountPaid: number;
  isBlocked: boolean;
}

export interface WeekAppointments {
  [key: string]: Partial<Appointment>; // Key is TimeSlot
}

export interface DayAppointments {
  [key: string]: WeekAppointments; // Key is DayOfWeek (Monday, Tuesday, etc.)
}

export interface WeekData {
  weekStartDate: string; // ISO string for Monday of the week
  days: DayAppointments;
}

export interface ReportData {
  totalScheduledSessions: number;
  totalAttendedSessions: number;
  attendancePercentage: number;
  totalBilled: number;
  patientsWithPendingPayments: Array<{
    name: string;
    day: DayOfWeek;
    time: TimeSlot;
  }>;
}

// Utility type for appointment details that can be updated
export type AppointmentDetails = Omit<Appointment, "id">;
