
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from '@/components/header';
import { ScheduleGrid } from '@/components/schedule-grid';
import { ReportDialog } from '@/components/report-dialog';
import { Button } from '@/components/ui/button';
import { useScheduleManager } from '@/hooks/use-schedule-manager';
import type { WeekData, ReportData, AppointmentDetails } from '@/types';
import type { DayOfWeek, TimeSlot } from '@/lib/constants';
import { DAYS_OF_WEEK, ALL_TIME_SLOTS, MAX_PAST_WEEKS } from '@/lib/constants';
import { getWeekId, getFormattedWeekTitle, getNextWeek, getPreviousWeek, parseISO, getCurrentWeekStartDate, subWeeks, isBefore } from '@/lib/date-utils';
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Copy, FileText, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  const {
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
  } = useScheduleManager();

  const { toast } = useToast();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const currentWeekData = useMemo(() => getWeekData(currentWeekId), [currentWeekId, getWeekData]);

  const handlePreviousWeek = () => {
    const currentDate = parseISO(currentWeekId);
    const earliestAllowedDate = subWeeks(getCurrentWeekStartDate(), MAX_PAST_WEEKS);
    const previousWeekDate = getPreviousWeek(currentDate);

    if (isBefore(previousWeekDate, earliestAllowedDate) && !isSameDay(previousWeekDate, earliestAllowedDate)) {
      toast({
        title: "Límite de Navegación",
        description: `No se puede retroceder más de ${MAX_PAST_WEEKS} semanas.`,
        variant: "default",
      });
      return;
    }
    setCurrentWeekId(getWeekId(previousWeekDate));
  };
  
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  const handleNextWeek = () => {
    const nextWeekDate = getNextWeek(parseISO(currentWeekId));
    setCurrentWeekId(getWeekId(nextWeekDate));
  };

  const handleCopyToNextWeek = () => {
    copyWeekToNext(currentWeekId);
    toast({ title: "Semana Copiada", description: "El horario de la semana actual (solo nombres de pacientes) se copió a la siguiente semana." });
  };
  
  const generateReport = useCallback(() => {
    if (!currentWeekData) return;

    let totalScheduled = 0;
    let totalAttended = 0;
    let totalBilled = 0;
    const patientsWithPendingPayments: ReportData['patientsWithPendingPayments'] = [];

    DAYS_OF_WEEK.forEach(day => {
      ALL_TIME_SLOTS.forEach(slot => {
        const appointment = currentWeekData.days[day]?.[slot];
        if (appointment && appointment.patientName && !appointment.isBlocked) {
          totalScheduled++;
          if (appointment.attended) {
            totalAttended++;
            totalBilled += appointment.amountPaid || 0;
            if (!appointment.amountPaid || appointment.amountPaid === 0) {
              patientsWithPendingPayments.push({
                name: appointment.patientName,
                day: day,
                time: slot,
              });
            }
          }
        }
      });
    });

    const attendancePercentage = totalScheduled > 0 ? (totalAttended / totalScheduled) * 100 : 0;

    setReportData({
      totalScheduledSessions: totalScheduled,
      totalAttendedSessions: totalAttended,
      attendancePercentage: attendancePercentage,
      totalBilled: totalBilled,
      patientsWithPendingPayments: patientsWithPendingPayments,
    });
    setIsReportDialogOpen(true);
  }, [currentWeekData]);


  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <CalendarDays className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-xl text-muted-foreground">Cargando Horario...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="mb-6 shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-card-foreground/5 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <CardTitle className="text-2xl sm:text-3xl font-bold text-primary flex items-center">
                <CalendarDays className="h-7 w-7 mr-3" />
                {currentWeekId ? getFormattedWeekTitle(parseISO(currentWeekId)) : 'Cargando...'}
              </CardTitle>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Button onClick={handlePreviousWeek} variant="outline" size="sm" className="text-primary border-primary hover:bg-primary/10">
                  <ChevronLeft className="h-5 w-5" />
                  <span className="hidden sm:inline ml-1">Ant.</span>
                </Button>
                <Button onClick={handleNextWeek} variant="outline" size="sm" className="text-primary border-primary hover:bg-primary/10">
                  <span className="hidden sm:inline mr-1">Sig.</span>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0"> {/* Remove padding to let ScheduleGrid control it */}
            <ScheduleGrid
              weekData={currentWeekData}
              currentWeekId={currentWeekId}
              onUpdateAppointment={updateAppointment}
              onDeleteAppointment={deleteAppointment}
              onBlockSlot={blockSlot}
              onUnblockSlot={unblockSlot}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 mb-8">
          <Button onClick={handleCopyToNextWeek} variant="outline" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground font-medium">
            <Copy className="mr-2 h-5 w-5" /> Copiar Semana Actual a Siguiente
          </Button>
          <Button onClick={generateReport} variant="default" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
            <FileText className="mr-2 h-5 w-5" /> Generar Informe Semanal
          </Button>
        </div>
      </main>

      <ReportDialog
        isOpen={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        reportData={reportData}
        weekTitle={currentWeekId ? getFormattedWeekTitle(parseISO(currentWeekId)) : ''}
      />
    </div>
  );
}
