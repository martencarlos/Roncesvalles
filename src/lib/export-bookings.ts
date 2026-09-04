// src/lib/export-bookings.ts — shared bookings-export engine (fetch + CSV + print window)
import { getExportRange, type ExportScope } from "@/lib/export-utils";

export interface BookingDetail {
  date: string;
  mealType: string;
  attendees: number;
  amount: number;
  tables: number[];
  services: string[];
  conciergeStatus: string;
  cleaningHours: number | null;
}

export interface ApartmentData {
  apartmentNumber: number;
  totalBookings: number;
  totalAttendees: number;
  totalAmount: number;
  bookingDetails: BookingDetail[];
}

export async function runBookingsExport({
  scope,
  year,
  month,
  format,
  includeDetails,
}: {
  scope: ExportScope;
  year: string;
  month: string;
  format: 'excel' | 'pdf';
  includeDetails: boolean;
}): Promise<void> {
  const params = new URLSearchParams({ year, scope });
  if (scope === "month") {
    params.set("month", month);
  }

  const response = await fetch(`/api/export?${params.toString()}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al exportar los datos');
  }

  const data: ApartmentData[] = await response.json();

  if (data.length === 0) {
    throw new Error(
      scope === "month"
        ? "No hay reservas completadas en el periodo mensual seleccionado."
        : "No hay reservas completadas en el año seleccionado."
    );
  }

  const { label, fileLabel } = getExportRange({
    scope,
    year: Number(year),
    month: scope === "month" ? Number(month) : undefined,
  });

  if (format === 'excel') {
    generateExcel(data, fileLabel, includeDetails);
  } else {
    generatePDF(data, label, includeDetails);
  }
}

function generateExcel(data: ApartmentData[], year: string, includeDetails: boolean) {
  // Create CSV content with detailed breakdown
  let csvContent = "Apartamento,Total Reservas,Total Asistentes,Importe Total (€)\n";

  // First add the summary rows
  data.forEach(apartment => {
    csvContent += `${apartment.apartmentNumber},${apartment.totalBookings},${apartment.totalAttendees},${apartment.totalAmount.toFixed(2)}\n`;
  });

  // Add grand total row
  const totalBookings = data.reduce((sum, apt) => sum + apt.totalBookings, 0);
  const totalAttendees = data.reduce((sum, apt) => sum + apt.totalAttendees, 0);
  const totalAmount = data.reduce((sum, apt) => sum + apt.totalAmount, 0);

  csvContent += `\nTOTAL,${totalBookings},${totalAttendees},${totalAmount.toFixed(2)}\n\n`;

  // If detailed view is requested, add a breakdown of each booking
  if (includeDetails) {
    csvContent += "\nDETALLE DE RESERVAS\n";
    csvContent += "Apartamento,Fecha,Servicio,Asistentes,Mesas,Conserjería,Horas Limpieza,Servicios,Importe (€)\n";

    data.forEach(apartment => {
      apartment.bookingDetails.forEach(booking => {
        csvContent += `${apartment.apartmentNumber},${booking.date},${booking.mealType},${booking.attendees},"${booking.tables.join(', ')}","${booking.conciergeStatus}",${booking.cleaningHours ?? ""},"${booking.services.join(', ')}",${booking.amount.toFixed(2)}\n`;
      });
    });
  }

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Reservas_${year}${includeDetails ? '_Detallado' : ''}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function generatePDF(data: ApartmentData[], label: string, includeDetails: boolean) {
  // Create a new window
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Por favor, permite las ventanas emergentes para generar PDF.');
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
      <title>Informe de Reservas ${label}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1, h2 { text-align: center; }
        h2 { margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total-row { font-weight: bold; background-color: #f2f2f2; }
        .page-break { page-break-before: always; }
      </style>
    </head>
    <body>
      <h1>Informe de Reservas Confirmadas ${label}</h1>
      <p>Fecha de generación: ${new Date().toLocaleDateString()}</p>

      <h2>Resumen por Apartamento</h2>
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

      ${includeDetails ? `
        <div class="page-break"></div>
        <h2>Detalle de Reservas</h2>
        ${data.map(apt => `
          <h3>Apartamento ${apt.apartmentNumber}</h3>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Servicio</th>
                <th>Asistentes</th>
                <th>Mesas</th>
                <th>Conserjería</th>
                <th>Horas</th>
                <th>Servicios</th>
                <th>Importe (€)</th>
              </tr>
            </thead>
            <tbody>
              ${apt.bookingDetails.map(booking => `
                <tr>
                  <td>${booking.date}</td>
                  <td>${booking.mealType}</td>
                  <td>${booking.attendees}</td>
                  <td>${booking.tables.join(', ')}</td>
                  <td>${booking.conciergeStatus}</td>
                  <td>${booking.cleaningHours ?? ''}</td>
                  <td>${booking.services.join(', ')}</td>
                  <td>${booking.amount.toFixed(2)} €</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="7">TOTAL</td>
                <td>${apt.totalAmount.toFixed(2)} €</td>
              </tr>
            </tbody>
          </table>
        `).join('')}
      ` : ''}

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
}
