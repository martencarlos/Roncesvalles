// src/components/ExportDialog.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileIcon, FileSpreadsheetIcon, Download } from "lucide-react";
import { getMonthOptions, type ExportScope } from "@/lib/export-utils";
import { runBookingsExport } from "@/lib/export-bookings";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose }) => {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [scope, setScope] = useState<ExportScope>("year");
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [includeDetails, setIncludeDetails] = useState<boolean>(true);

  // Generate year options (last 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const monthOptions = getMonthOptions();

  const handleExport = async () => {
    setIsLoading(true);
    setError('');

    try {
      await runBookingsExport({ scope, year, month, format, includeDetails });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al exportar los datos');
    } finally {
      setIsLoading(false);
    }
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
            <Label>Periodo</Label>
            <RadioGroup value={scope} onValueChange={(v) => setScope(v as ExportScope)} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="year" id="dialogScopeYear" />
                <Label htmlFor="dialogScopeYear" className="cursor-pointer">
                  Año natural
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="month" id="dialogScopeMonth" />
                <Label htmlFor="dialogScopeMonth" className="cursor-pointer">
                  Mes
                </Label>
              </div>
            </RadioGroup>
          </div>

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

          {scope === "month" && (
            <div className="space-y-2">
              <Label htmlFor="month">Mes</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Ejemplo: febrero 2026 incluye del 22/01/2026 al 22/02/2026.
              </p>
            </div>
          )}

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

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="includeDetails"
              checked={includeDetails}
              onChange={(e) => setIncludeDetails(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <Label htmlFor="includeDetails" className="text-sm cursor-pointer">
              Incluir desglose detallado de reservas
            </Label>
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
