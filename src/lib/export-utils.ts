const MONTH_NAMES_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export type ExportScope = "year" | "month";

export interface ExportRangeOptions {
  scope: ExportScope;
  year: number;
  month?: number;
}

export interface ExportRange {
  startDate: Date;
  endDate: Date;
  label: string;
  fileLabel: string;
}

export function isOffSeason(date: Date): boolean {
  const month = date.getMonth();
  return month >= 4 && month <= 10;
}

export function calculateAdministrationCharge({
  bookingDate,
  numberOfPeople,
  noCleaningService,
  cleaningHours,
}: {
  bookingDate: Date;
  numberOfPeople: number;
  noCleaningService?: boolean;
  cleaningHours?: number | null;
}): number {
  if (isOffSeason(bookingDate)) {
    return 30;
  }

  if (!noCleaningService) {
    return numberOfPeople > 5 ? numberOfPeople * 7 : 30;
  }

  const hasWorkedHours =
    typeof cleaningHours === "number" && Number.isFinite(cleaningHours) && cleaningHours > 0;

  if (!hasWorkedHours) {
    return 30;
  }

  return numberOfPeople > 5 ? numberOfPeople * 7 : 30;
}

export function getExportRange({
  scope,
  year,
  month,
}: ExportRangeOptions): ExportRange {
  if (scope === "month") {
    if (!month || month < 1 || month > 12) {
      throw new Error("Invalid month parameter");
    }

    const startDate = new Date(year, month - 2, 22, 0, 0, 0, 0);
    const endDate = new Date(year, month - 1, 22, 23, 59, 59, 999);
    const monthName = MONTH_NAMES_ES[month - 1];
    const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    return {
      startDate,
      endDate,
      label: `${monthLabel} ${year} (22/${String(startDate.getMonth() + 1).padStart(2, "0")}/${startDate.getFullYear()} - 22/${String(month).padStart(2, "0")}/${year})`,
      fileLabel: `${monthLabel}_${year}_22-${String(startDate.getMonth() + 1).padStart(2, "0")}-${startDate.getFullYear()}_a_22-${String(month).padStart(2, "0")}-${year}`,
    };
  }

  return {
    startDate: new Date(year, 0, 1, 0, 0, 0, 0),
    endDate: new Date(year, 11, 31, 23, 59, 59, 999),
    label: `${year}`,
    fileLabel: String(year),
  };
}

export function getMonthOptions() {
  return MONTH_NAMES_ES.map((name, index) => ({
    value: String(index + 1),
    label: name.charAt(0).toUpperCase() + name.slice(1),
  }));
}
