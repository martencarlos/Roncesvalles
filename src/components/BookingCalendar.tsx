// src/components/BookingCalendar.tsx
import { format } from "date-fns";

export interface BookingCalendarInfo {
  [date: string]: {
    lunch: boolean;
    dinner: boolean;
    blockedLunch?: boolean;
    blockedDinner?: boolean;
  };
}

export function buildBookingCalendarInfo(
  bookings: { date: Date | string; mealType: string }[],
  blocks: { date: Date | string; mealType: string }[]
): BookingCalendarInfo {
  const map: BookingCalendarInfo = {};
  const ensure = (key: string) =>
    (map[key] ??= { lunch: false, dinner: false });

  bookings.forEach((booking) => {
    const key = format(new Date(booking.date), "yyyy-MM-dd");
    if (booking.mealType === "lunch") ensure(key).lunch = true;
    else ensure(key).dinner = true;
  });

  blocks.forEach((block) => {
    const key = format(new Date(block.date), "yyyy-MM-dd");
    const info = ensure(key);
    if (block.mealType === "both") {
      info.blockedLunch = true;
      info.blockedDinner = true;
    } else if (block.mealType === "lunch") {
      info.blockedLunch = true;
    } else {
      info.blockedDinner = true;
    }
  });

  return map;
}

export function CalendarDayContent({
  day,
  date,
  info,
}: {
  day: number;
  date: Date | undefined;
  info?: BookingCalendarInfo[string];
}) {
  if (!date) return <span>{day}</span>;

  return (
    <div className="relative">
      <span>{day}</span>
      {info && (
        <>
          {info.lunch && info.dinner && (
            <div
              className="booking-indicator booking-dot-both"
              title="Reservas para comida y cena"
            />
          )}
          {info.lunch && !info.dinner && (
            <div
              className="booking-indicator booking-indicator-lunch booking-dot-lunch"
              title="Reservas para comida"
            />
          )}
          {!info.lunch && info.dinner && (
            <div
              className="booking-indicator booking-indicator-dinner booking-dot-dinner"
              title="Reservas para cena"
            />
          )}
          {(info.blockedLunch || info.blockedDinner) && (
            <div
              className="booking-indicator booking-dot-blocked"
              style={{ bottom: "-6px" }}
              title={
                info.blockedLunch && info.blockedDinner
                  ? "Fecha bloqueada (Comida y Cena)"
                  : info.blockedLunch
                  ? "Comida bloqueada"
                  : "Cena bloqueada"
              }
            />
          )}
        </>
      )}
    </div>
  );
}
