// src/components/BookingsExportForm.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileIcon, FileSpreadsheetIcon } from "lucide-react";
import { getMonthOptions, type ExportScope } from "@/lib/export-utils";
import { runBookingsExport } from "@/lib/export-bookings";

export default function BookingsExportForm({
  variant = "panel",
  buttonLabel = "Exportar",
  onExportSuccess,
  onCancel,
}: {
  variant?: "dialog" | "panel";
  buttonLabel?: string;
  onExportSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [scope, setScope] = useState<ExportScope>("year");
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [format, setFormat] = useState<"excel" | "pdf">("excel");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [includeDetails, setIncludeDetails] = useState(true);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const monthOptions = getMonthOptions();

  const handleExport = async () => {
    setIsLoading(true);
    setError("");
    try {
      await runBookingsExport({ scope, year, month, format, includeDetails });
      onExportSuccess?.();
    } catch (err: any) {
      setError(err.message || "Error al exportar los datos");
    } finally {
      setIsLoading(false);
    }
  };

  const fields = (
    <>
      <div className="space-y-2">
        <Label>Periodo</Label>
        <RadioGroup
          value={scope}
          onValueChange={(v) => setScope(v as ExportScope)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="year" id="exportScopeYear" />
            <Label htmlFor="exportScopeYear" className="cursor-pointer">
              Año natural
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="month" id="exportScopeMonth" />
            <Label htmlFor="exportScopeMonth" className="cursor-pointer">
              Mes
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="exportYear">Año</Label>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className={variant === "dialog" ? undefined : "w-full"}>
            <SelectValue placeholder="Seleccionar año" />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {scope === "month" && (
        <div className="space-y-2">
          <Label htmlFor="exportMonth">Mes</Label>
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
        <RadioGroup
          value={format}
          onValueChange={(v) => setFormat(v as "excel" | "pdf")}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="excel" id="exportFormatExcel" />
            <Label
              htmlFor="exportFormatExcel"
              className="flex items-center space-x-2 cursor-pointer"
            >
              <FileSpreadsheetIcon className="w-4 h-4 text-success" />
              <span>Excel/CSV</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pdf" id="exportFormatPdf" />
            <Label
              htmlFor="exportFormatPdf"
              className="flex items-center space-x-2 cursor-pointer"
            >
              <FileIcon className="w-4 h-4 text-destructive" />
              <span>PDF</span>
            </Label>
          </div>
        </RadioGroup>
      </div>
    </>
  );

  const details = (
    <>
      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="exportIncludeDetails"
          checked={includeDetails}
          onCheckedChange={(checked) => setIncludeDetails(checked === true)}
        />
        <Label htmlFor="exportIncludeDetails" className="cursor-pointer">
          Incluir desglose detallado de reservas
        </Label>
      </div>

      {variant === "panel" && (
        <div className="bg-muted p-4 rounded-md text-sm">
          <h3 className="font-medium mb-2">Datos incluidos:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Resumen de reservas por apartamento</li>
            <li>Total de reservas, asistentes e importes</li>
            <li>Facturación según temporada y conserjería</li>
            {includeDetails && (
              <li>Detalle de cada reserva con estado de conserjería y horas</li>
            )}
          </ul>
        </div>
      )}
    </>
  );

  const exportButton = (
    <Button onClick={handleExport} disabled={isLoading}>
      {isLoading ? (
        <span className="flex items-center">
          <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></span>
          Exportando...
        </span>
      ) : (
        <span className="flex items-center">
          <Download className="w-4 h-4 mr-2" />
          {buttonLabel}
        </span>
      )}
    </Button>
  );

  if (variant === "dialog") {
    return (
      <div className="py-4 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {fields}
        {details}
        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          {exportButton}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">{fields}</div>
        <div className="space-y-4">{details}</div>
      </div>
      <div className="flex justify-end mt-6">{exportButton}</div>
    </div>
  );
}
