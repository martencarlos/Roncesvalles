// src/components/ExportDialog.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileIcon, FileSpreadsheetIcon, Download } from "lucide-react";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose }) => {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // Generate year options (last 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);
  
  const handleExport = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Fetch data from our API
      const response = await fetch(`/api/export?year=${year}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al exportar los datos');
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        setError('No hay reservas confirmadas en el año seleccionado.');
        setIsLoading(false);
        return;
      }
      
      // Generate file based on format
      if (format === 'excel') {
        generateExcel(data, year);
      } else {
        generatePDF(data, year);
      }
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al exportar los datos');
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateExcel = (data: any[], year: string) => {
    // Create CSV content
    let csvContent = "Apartamento,Total Reservas,Total Asistentes,Importe Total (€)\n";
    
    data.forEach(apartment => {
      csvContent += `${apartment.apartmentNumber},${apartment.totalBookings},${apartment.totalAttendees},${apartment.totalAmount.toFixed(2)}\n`;
    });
    
    // Add summary row
    const totalBookings = data.reduce((sum, apt) => sum + apt.totalBookings, 0);
    const totalAttendees = data.reduce((sum, apt) => sum + apt.totalAttendees, 0);
    const totalAmount = data.reduce((sum, apt) => sum + apt.totalAmount, 0);
    
    csvContent += `\nTOTAL,${totalBookings},${totalAttendees},${totalAmount.toFixed(2)}\n`;
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reservas_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const generatePDF = (data: any[], year: string) => {
    // For the PDF generation, we'll create a simple HTML table and use browser's print functionality
    // This is a simple approach without adding dependencies
    
    // Create a new window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('Por favor, permite las ventanas emergentes para generar PDF.');
      return;
    }
    
    // Calculate totals
    const totalBookings = data.reduce((sum, apt) => sum + apt.totalBookings, 0);
    const totalAttendees = data.reduce((sum, apt) => sum + apt.totalAttendees, 0);
    const totalAmount = data.reduce((sum, apt) => sum + apt.totalAmount, 0);
    
    // Write HTML content
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Informe de Reservas ${year}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total-row { font-weight: bold; background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Informe de Reservas Confirmadas ${year}</h1>
        <p>Fecha de generación: ${new Date().toLocaleDateString()}</p>
        
        <table>
          <thead>
            <tr>
              <th>Apartamento</th>
              <th>Total Reservas</th>
              <th>Total Asistentes</th>
              <th>Importe Total (€)</th>
            </tr>
          </thead>
          <tbody>
            ${data.map(apt => `
              <tr>
                <td>${apt.apartmentNumber}</td>
                <td>${apt.totalBookings}</td>
                <td>${apt.totalAttendees}</td>
                <td>${apt.totalAmount.toFixed(2)} €</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td>TOTAL</td>
              <td>${totalBookings}</td>
              <td>${totalAttendees}</td>
              <td>${totalAmount.toFixed(2)} €</td>
            </tr>
          </tbody>
        </table>
        
        <script>
          // Auto print and close the window after printing
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Exportar Datos</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="year">Año</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar año" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Formato</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'excel' | 'pdf')} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="flex items-center space-x-2 cursor-pointer">
                  <FileSpreadsheetIcon className="w-4 h-4 text-green-600" />
                  <span>Excel/CSV</span>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center space-x-2 cursor-pointer">
                  <FileIcon className="w-4 h-4 text-red-600" />
                  <span>PDF</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" className='cursor-pointer' onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleExport} className='cursor-pointer' disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center">
                <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></span>
                Exportando...
              </span>
            ) : (
              <span className="flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;