
"use client";

import { useState, useMemo } from 'react';
import type { Appointment, AppointmentDetails, WeekData } from '@/types';
import { DAYS_OF_WEEK, MORNING_SLOTS, AFTERNOON_SLOTS, ALL_TIME_SLOTS, DayOfWeek, TimeSlot } from '@/lib/constants';
import { AppointmentDialog } from './appointment-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, DollarSign, Edit3, Ban, GripVertical } from 'lucide-react';

interface ScheduleGridProps {
  weekData: WeekData | undefined;
  currentWeekId: string;
  onUpdateAppointment: (weekId: string, day: DayOfWeek, timeSlot: TimeSlot, details: Partial<AppointmentDetails>) => void;
  onDeleteAppointment: (weekId: string, day: DayOfWeek, timeSlot: TimeSlot) => void;
  onBlockSlot: (weekId: string, day: DayOfWeek, timeSlot: TimeSlot) => void;
  onUnblockSlot: (weekId: string, day: DayOfWeek, timeSlot: TimeSlot) => void;
}

export function ScheduleGrid({
  weekData,
  currentWeekId,
  onUpdateAppointment,
  onDeleteAppointment,
  onBlockSlot,
  onUnblockSlot,
}: ScheduleGridProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Partial<Appointment> | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ day: DayOfWeek; timeSlot: TimeSlot } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCellClick = (day: DayOfWeek, timeSlot: TimeSlot) => {
    const appointment = weekData?.days[day]?.[timeSlot] || { id: `${day}-${timeSlot}`, isBlocked: false, patientName: '', attended: false, amountPaid: 0 };
    setSelectedAppointment(appointment);
    setSelectedCell({ day, timeSlot });
    setIsDialogOpen(true);
  };

  const renderCellContent = (appointment: Partial<Appointment> | undefined) => {
    if (appointment?.isBlocked) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-1">
          <Ban className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Bloqueado</span>
        </div>
      );
    }
    if (appointment?.patientName) {
      return (
        <div className="p-1.5 text-xs md:text-sm flex flex-col justify-between h-full">
          <p className="font-semibold truncate text-foreground leading-tight">{appointment.patientName}</p>
          <div className="mt-1 flex flex-col space-y-0.5 text-muted-foreground">
            <div className="flex items-center text-xs">
              {appointment.attended ? <CheckCircle className="w-3 h-3 mr-1 text-primary" /> : <XCircle className="w-3 h-3 mr-1" />}
              <span>{appointment.attended ? 'Asistió' : 'Ausente'}</span>
            </div>
            <div className="flex items-center text-xs">
              <DollarSign className="w-3 h-3 mr-1" />
              <span>{(appointment.amountPaid ?? 0) > 0 ? `${appointment.amountPaid!.toFixed(2)}` : 'No Pagado'}</span>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-full">
        <Edit3 className="w-5 h-5 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  };
  
  const timeSlotSections = useMemo(() => [
    { title: "Sesiones Matutinas", slots: MORNING_SLOTS },
    { title: "Sesiones Vespertinas", slots: AFTERNOON_SLOTS },
  ], []);


  if (!weekData) {
    return <div className="text-center py-10 text-muted-foreground">Cargando datos del horario...</div>;
  }
  
  return (
    <>
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          <div className="grid grid-cols-[auto_repeat(5,1fr)] gap-px bg-border">
            {/* Header Row */}
            <div className="p-3 bg-card font-semibold text-center text-sm text-card-foreground sticky left-0 z-10">Hora</div>
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="p-3 bg-card font-semibold text-center text-sm text-card-foreground capitalize">
                {day}
              </div>
            ))}

            {/* Time Slots Rows */}
            {timeSlotSections.map((section, sectionIndex) => (
              section.slots.map((timeSlot, slotIndex) => (
                <div key={timeSlot} className="contents"> {/* Use contents to avoid extra div in grid */}
                  {/* Time Slot Label Cell */}
                  <div className={cn(
                    "p-2 bg-card text-xs md:text-sm text-center font-medium text-card-foreground sticky left-0 z-10 flex items-center justify-center",
                    slotIndex === 0 && sectionIndex > 0 && "border-t-2 border-accent" // Separator for afternoon
                  )}>
                    {timeSlot}
                  </div>
                  {/* Appointment Cells */}
                  {DAYS_OF_WEEK.map(day => {
                    const appointment = weekData.days[day]?.[timeSlot];
                    return (
                      <button
                        key={`${day}-${timeSlot}`}
                        onClick={() => handleCellClick(day, timeSlot)}
                        aria-label={`Programar o editar cita para ${day} a las ${timeSlot}`}
                        className={cn(
                          "h-24 min-h-[6rem] bg-card hover:bg-accent/20 focus:outline-none focus:ring-2 focus:ring-accent focus:z-10 group transition-colors duration-150 ease-in-out",
                          appointment?.isBlocked ? "bg-muted/70 hover:bg-muted" : "bg-card",
                          appointment?.patientName && !appointment?.isBlocked ? "border-l-4 border-primary/70" : "",
                          slotIndex === 0 && sectionIndex > 0 && "border-t-2 border-accent/50" // Separator for afternoon content cells
                        )}
                      >
                        {renderCellContent(appointment)}
                      </button>
                    );
                  })}
                </div>
              ))
            ))}
          </div>
        </div>
      </div>

      {selectedCell && (
        <AppointmentDialog
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          appointment={selectedAppointment}
          day={selectedCell.day}
          timeSlot={selectedCell.timeSlot}
          weekId={currentWeekId}
          onSave={onUpdateAppointment}
          onDelete={onDeleteAppointment}
          onBlock={onBlockSlot}
          onUnblock={onUnblockSlot}
        />
      )}
    </>
  );
}
