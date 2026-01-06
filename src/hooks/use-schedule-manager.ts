"use client";

import { useState, useEffect, useCallback } from 'react';
import type { WeekData, Appointment, AppointmentDetails } from '@/types';
import { DayOfWeek, TimeSlot, LOCAL_STORAGE_KEY, MAX_PAST_WEEKS, DAYS_OF_WEEK, ALL_TIME_SLOTS } from '@/lib/constants';
import { getWeekId, getCurrentWeekStartDate, generateEmptyWeekData, subWeeks, addWeeks, parseISO } from '@/lib/date-utils';

interface ScheduleManager {
  weeksData: Record<string, WeekData>;
  currentWeekId: string;
  isLoading: boolean;
  setCurrentWeekId: (weekId: string) => void;
  updateAppointment: (weekId: string, day: DayOfWeek, timeSlot: TimeSlot, details: Partial<AppointmentDetails>) => void;
  deleteAppointment: (weekId: string, day: DayOfWeek, timeSlot: TimeSlot) => void;
  blockSlot: (weekId: string, day: DayOfWeek, timeSlot: TimeSlot) => void;
  unblockSlot: (weekId: string, day: DayOfWeek, timeSlot: TimeSlot) => void;
  copyWeekToNext: (sourceWeekId: string) => void;
  getWeekData: (weekId: string) => WeekData | undefined;
}

export function useScheduleManager(): ScheduleManager {
  const [weeksData, setWeeksData] = useState<Record<string, WeekData>>({});
  const [currentWeekId, setCurrentWeekIdState] = useState<string>(() => getWeekId(getCurrentWeekStartDate()));
  const [isLoading, setIsLoading] = useState(true);

  const initializeWeekData = useCallback((weekIdToLoad: string): WeekData => {
    const existingWeek = weeksData[weekIdToLoad];
    if (existingWeek) return existingWeek;

    const newWeek = generateEmptyWeekData(weekIdToLoad);
    setWeeksData(prev => ({ ...prev, [weekIdToLoad]: newWeek }));
    return newWeek;
  }, [weeksData]);


  useEffect(() => {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData) as Record<string, WeekData>;
        // Ensure all necessary past weeks and current week are present
        const initialCurrentWeekId = getWeekId(getCurrentWeekStartDate());
        const weeksToEnsure = [initialCurrentWeekId];
        for (let i = 1; i <= MAX_PAST_WEEKS; i++) {
          weeksToEnsure.push(getWeekId(subWeeks(parseISO(initialCurrentWeekId), i)));
        }
        // Ensure one future week for potential copy action
        weeksToEnsure.push(getWeekId(addWeeks(parseISO(initialCurrentWeekId), 1)));


        const updatedData = { ...parsedData };
        weeksToEnsure.forEach(id => {
          if (!updatedData[id]) {
            updatedData[id] = generateEmptyWeekData(id);
          }
        });
        setWeeksData(updatedData);
        setCurrentWeekIdState(initialCurrentWeekId);

      } else {
        // Initialize with current week and defined past weeks if no data stored
        const initialCurrentWeekId = getWeekId(getCurrentWeekStartDate());
        const initialWeeks: Record<string, WeekData> = {};
        initialWeeks[initialCurrentWeekId] = generateEmptyWeekData(initialCurrentWeekId);
        for (let i = 1; i <= MAX_PAST_WEEKS; i++) {
          const pastWeekId = getWeekId(subWeeks(parseISO(initialCurrentWeekId), i));
          initialWeeks[pastWeekId] = generateEmptyWeekData(pastWeekId);
        }
        // Ensure one future week for potential copy action
        const futureWeekId = getWeekId(addWeeks(parseISO(initialCurrentWeekId),1));
        initialWeeks[futureWeekId] = generateEmptyWeekData(futureWeekId);

        setWeeksData(initialWeeks);
        setCurrentWeekIdState(initialCurrentWeekId);
      }
    } catch (error) {
      console.error("Failed to load schedule data from localStorage:", error);
      // Fallback to empty state if localStorage is corrupt or inaccessible
       const initialCurrentWeekId = getWeekId(getCurrentWeekStartDate());
       const fallbackWeeks: Record<string, WeekData> = {};
       fallbackWeeks[initialCurrentWeekId] = generateEmptyWeekData(initialCurrentWeekId);
       setWeeksData(fallbackWeeks);
       setCurrentWeekIdState(initialCurrentWeekId);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) { // Only save after initial load
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(weeksData));
    }
  }, [weeksData, isLoading]);

  const getWeekData = useCallback((weekId: string): WeekData | undefined => {
     if (weeksData[weekId]) {
      return weeksData[weekId];
    }
    // If week doesn't exist, try to initialize it (e.g. when navigating to a new future week)
    const newWeek = generateEmptyWeekData(weekId);
    setWeeksData(prev => ({ ...prev, [weekId]: newWeek }));
    return newWeek;
  }, [weeksData]);

  const setCurrentWeekId = useCallback((weekId: string) => {
    // Ensure the target week data exists or is created
    if (!weeksData[weekId]) {
        initializeWeekData(weekId);
    }
    setCurrentWeekIdState(weekId);
  }, [weeksData, initializeWeekData]);


  const updateAppointment = useCallback((weekId: string, day: DayOfWeek, timeSlot: TimeSlot, details: Partial<AppointmentDetails>) => {
    setWeeksData(prev => {
      const week = prev[weekId] ? { ...prev[weekId] } : generateEmptyWeekData(weekId);
      if (!week.days[day]) week.days[day] = {};
      const currentAppointment = week.days[day][timeSlot] || { id: `${day}-${timeSlot}`, patientName: "", attended: false, amountPaid: 0, isBlocked: false };
      
      week.days[day][timeSlot] = {
        ...currentAppointment,
        ...details,
        isBlocked: details.isBlocked !== undefined ? details.isBlocked : currentAppointment.isBlocked, // Preserve isBlocked if not in details
      } as Appointment;
      return { ...prev, [weekId]: week };
    });
  }, []);

  const deleteAppointment = useCallback((weekId: string, day: DayOfWeek, timeSlot: TimeSlot) => {
    updateAppointment(weekId, day, timeSlot, {
      patientName: "",
      attended: false,
      amountPaid: 0,
      // isBlocked is handled by blockSlot/unblockSlot
    });
  }, [updateAppointment]);

  const blockSlot = useCallback((weekId: string, day: DayOfWeek, timeSlot: TimeSlot) => {
    updateAppointment(weekId, day, timeSlot, {
      patientName: "", // Clear patient info when blocking
      attended: false,
      amountPaid: 0,
      isBlocked: true,
    });
  }, [updateAppointment]);

  const unblockSlot = useCallback((weekId: string, day: DayOfWeek, timeSlot: TimeSlot) => {
    updateAppointment(weekId, day, timeSlot, { isBlocked: false });
  }, [updateAppointment]);

  const copyWeekToNext = useCallback((sourceWeekId: string) => {
    const sourceWeek = weeksData[sourceWeekId];
    if (!sourceWeek) return;

    const nextWeekDate = addWeeks(parseISO(sourceWeekId), 1);
    const targetWeekId = getWeekId(nextWeekDate);
    
    const newTargetWeek = generateEmptyWeekData(targetWeekId);

    DAYS_OF_WEEK.forEach(day => {
      ALL_TIME_SLOTS.forEach(slot => {
        const sourceAppointment = sourceWeek.days[day]?.[slot];
        if (sourceAppointment && sourceAppointment.patientName && !sourceAppointment.isBlocked) {
          newTargetWeek.days[day][slot] = {
            ...generateEmptyWeekData(targetWeekId).days[day][slot], // start with fresh defaults
            id: `${day}-${slot}`,
            patientName: sourceAppointment.patientName,
            // attended, amountPaid, isBlocked remain default (false, 0, false)
          };
        }
      });
    });

    setWeeksData(prev => ({ ...prev, [targetWeekId]: newTargetWeek }));
    setCurrentWeekIdState(targetWeekId); // Navigate to the new week
  }, [weeksData]);


  return {
    weeksData,
    currentWeekId,
    isLoading,
    setCurrentWeekId,
    updateAppointment,
    deleteAppointment,
    blockSlot,
    unblockSlot,
    copyWeekToNext,
    getWeekData,
  };
}
