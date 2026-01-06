
"use client";

import type { ReportData } from '@/types';
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from 'lucide-react';

interface ReportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  reportData: ReportData | null;
  weekTitle: string;
}

export function ReportDialog({ isOpen, onOpenChange, reportData, weekTitle }: ReportDialogProps) {
  const handleExportCSV = () => {
    if (!reportData) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Informe Semanal - ${weekTitle}\n\n`;
    csvContent += "Métrica,Valor\n";
    csvContent += `Total Sesiones Programadas,${reportData.totalScheduledSessions}\n`;
    csvContent += `Total Sesiones Asistidas,${reportData.totalAttendedSessions}\n`;
    csvContent += `Porcentaje de Asistencia,${reportData.attendancePercentage.toFixed(2)}%\n`;
    csvContent += `Total Facturado,${reportData.totalBilled.toFixed(2)}\n\n`;

    csvContent += "Pacientes con Pagos Pendientes\n";
    csvContent += "Nombre Paciente,Día,Hora\n";
    reportData.patientsWithPendingPayments.forEach(p => {
      csvContent += `${p.name},${p.day},${p.time}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `informe_semanal_${weekTitle.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!reportData) {
    return (
       <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Informe Semanal</DialogTitle>
            <DialogDescription>{weekTitle}</DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center text-muted-foreground">Cargando datos del informe...</div>
           <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cerrar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col bg-card text-card-foreground rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Informe Semanal</DialogTitle>
          <DialogDescription>{weekTitle}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow py-4 pr-6">
          <div className="grid gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2 text-primary">Resumen</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <span className="text-muted-foreground">Total Programadas:</span> <span className="font-semibold text-foreground">{reportData.totalScheduledSessions}</span>
                <span className="text-muted-foreground">Total Asistidas:</span> <span className="font-semibold text-foreground">{reportData.totalAttendedSessions}</span>
                <span className="text-muted-foreground">% Asistencia:</span> <span className="font-semibold text-foreground">{reportData.attendancePercentage.toFixed(1)}%</span>
                <span className="text-muted-foreground">Total Facturado:</span> <span className="font-semibold text-foreground">${reportData.totalBilled.toFixed(2)}</span>
              </div>
            </div>

            {reportData.patientsWithPendingPayments.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2 text-primary">Pacientes con Pagos Pendientes</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-muted-foreground">Nombre Paciente</TableHead>
                      <TableHead className="text-muted-foreground">Día</TableHead>
                      <TableHead className="text-muted-foreground">Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.patientsWithPendingPayments.map((patient, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-foreground">{patient.name}</TableCell>
                        <TableCell className="text-foreground">{patient.day}</TableCell>
                        <TableCell className="text-foreground">{patient.time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
             {reportData.patientsWithPendingPayments.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay pagos pendientes esta semana.</p>
             )}
          </div>
        </ScrollArea>
        <DialogFooter className="mt-4">
           <Button onClick={handleExportCSV} variant="outline" className="text-primary border-primary hover:bg-primary/10">
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
