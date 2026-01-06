
"use client";

import { useState, useEffect } from 'react';
import type { Appointment, AppointmentDetails } from '@/types';
import type { DayOfWeek, TimeSlot } from '@/lib/constants';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserPlus, Ban, CheckSquare, XSquare, DollarSign } from 'lucide-react';

interface AppointmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Partial<Appointment> | null; // Null for new appointment
  day: DayOfWeek;
  timeSlot: TimeSlot;
  weekId: string;
  onSave: (weekId: string, day: DayOfWeek, timeSlot: TimeSlot, details: Partial<AppointmentDetails>) => void;
  onDelete: (weekId: string, day: DayOfWeek, timeSlot: TimeSlot) => void;
  onBlock: (weekId: string, day: DayOfWeek, timeSlot: TimeSlot) => void;
  onUnblock: (weekId: string, day: DayOfWeek, timeSlot: TimeSlot) => void;
}

export function AppointmentDialog({
  isOpen,
  onOpenChange,
  appointment,
  day,
  timeSlot,
  weekId,
  onSave,
  onDelete,
  onBlock,
  onUnblock,
}: AppointmentDialogProps) {
  const [patientName, setPatientName] = useState(appointment?.patientName || "");
  const [attended, setAttended] = useState(appointment?.attended || false);
  const [amountPaid, setAmountPaid] = useState<string>(appointment?.amountPaid?.toString() || "");
  const { toast } = useToast();

  const isBlocked = appointment?.isBlocked || false;
  const isNew = !appointment?.patientName && !isBlocked;

  useEffect(() => {
    if (isOpen) {
      setPatientName(appointment?.patientName || "");
      setAttended(appointment?.attended || false);
      setAmountPaid(appointment?.amountPaid?.toString() || "");
    }
  }, [isOpen, appointment]);

  const handleSave = () => {
    if (!patientName && !isNew) { // Allow saving empty name if it was already empty (e.g. after delete)
       onSave(weekId, day, timeSlot, { patientName: "", attended: false, amountPaid: 0 });
       toast({ title: "Cita Eliminada", description: "Detalles del paciente eliminados." });
       onOpenChange(false);
       return;
    }
    if (!patientName && isNew) {
       toast({ title: "Error", description: "El nombre del paciente no puede estar vacío.", variant: "destructive" });
       return;
    }
    const paidAmount = parseFloat(amountPaid) || 0;
    onSave(weekId, day, timeSlot, { patientName, attended, amountPaid: paidAmount, isBlocked: false });
    toast({ title: "Cita Guardada", description: `Paciente ${patientName} programado para ${day} a las ${timeSlot}.` });
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete(weekId, day, timeSlot);
    toast({ title: "Cita Cancelada", description: `La cita para ${day} a las ${timeSlot} ha sido cancelada.` });
    onOpenChange(false);
  };

  const handleBlock = () => {
    onBlock(weekId, day, timeSlot);
    toast({ title: "Horario Bloqueado", description: `El horario ${day} a las ${timeSlot} ahora no está disponible.` });
    onOpenChange(false);
  };

  const handleUnblock = () => {
    onUnblock(weekId, day, timeSlot);
    toast({ title: "Horario Desbloqueado", description: `El horario ${day} a las ${timeSlot} ahora está disponible.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-2xl bg-card text-card-foreground rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            {isBlocked ? "Horario Bloqueado" : isNew ? "Programar Paciente" : "Editar Cita"}
          </DialogTitle>
          <DialogDescription>
            {day}, {timeSlot}
          </DialogDescription>
        </DialogHeader>

        {isBlocked ? (
          <div className="py-4 text-center">
            <p className="text-muted-foreground mb-4">Este horario está actualmente bloqueado.</p>
            <Button onClick={handleUnblock} variant="outline" className="w-full text-primary border-primary hover:bg-primary/10">
              <CheckSquare className="mr-2 h-4 w-4" /> Desbloquear Horario
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="patientName" className="text-foreground">Nombre del Paciente</Label>
              <Input
                id="patientName"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Ingrese el nombre del paciente"
                className="bg-input text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {!isNew && (
              <>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="attended"
                    checked={attended}
                    onCheckedChange={(checked) => setAttended(checked as boolean)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary"
                  />
                  <Label htmlFor="attended" className="font-medium text-foreground flex items-center">
                    {attended ? <CheckSquare className="mr-2 h-5 w-5 text-primary" /> : <XSquare className="mr-2 h-5 w-5 text-muted-foreground" />}
                     Asistió
                  </Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amountPaid" className="text-foreground">Monto Pagado</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="amountPaid"
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder="0.00"
                      className="pl-8 bg-input text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-3 mt-4">
          {/* "Bloquear Horario" button */}
          {!isBlocked && (
            <Button 
              onClick={handleBlock} 
              variant="outline" 
              className="w-full sm:w-auto sm:mr-auto border-destructive text-destructive hover:bg-destructive/10"
            >
              <Ban className="mr-2 h-4 w-4" /> Bloquear Horario
            </Button>
          )}
          
          {/* Group for Cancel, Save, Delete buttons. */}
          <div className="flex flex-col sm:flex-row w-full sm:w-auto justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary" className="w-full sm:w-auto">
                Cancelar
              </Button>
            </DialogClose>
            
            {/* Render "Desbloquear" button here if isBlocked, instead of Save/Delete */}
            {isBlocked ? (
              null // Desbloquear button is shown in main content area if isBlocked
            ) : (
              <>
                <Button 
                  onClick={handleSave} 
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <UserPlus className="mr-2 h-4 w-4" /> {isNew ? "Programar" : "Guardar Cambios"}
                </Button>
                {!isNew && (
                  <Button 
                    onClick={handleDelete} 
                    variant="destructive" 
                    className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

