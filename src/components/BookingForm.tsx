// src/components/BookingForm.tsx
import React, { useState, useEffect, useMemo } from "react";
import { IBooking, MealType } from "@/models/Booking";
import { IBlockedDate } from "@/models/BlockedDate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { es } from "date-fns/locale/es";
import { format, differenceInDays } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarIcon, ChevronDown, LockIcon, InfoIcon, AlertTriangle, ShieldAlert } from "lucide-react";
import { isOffSeason } from "@/lib/export-utils";
import { useSession } from "next-auth/react";
import { getApartmentLabel } from "@/lib/utils";
import {
  buildBookingCalendarInfo,
  CalendarDayContent,
  type BookingCalendarInfo,
} from "@/components/BookingCalendar";

registerLocale("es", es);

interface BookingFormProps {
  onSubmit: (data: Partial<IBooking>) => Promise<void>;
  initialData?: Partial<IBooking>;
  onCancel: () => void;
}

const APARTMENT_NUMBERS = Array.from({ length: 48 }, (_, i) => i + 1);
const LAST_APARTMENT_KEY = "lastSelectedApartment";
const FIRST_BOOKING_KEY = "hasCreatedFirstBooking";
const MAX_PEOPLE_PER_TABLE = 8;

const TableTile: React.FC<{
  number: number;
  selected: boolean;
  booked: boolean;
  onToggle: (n: number) => void;
}> = ({ number, selected, booked, onToggle }) => {
  const tableClass = booked
    ? "border-border bg-muted text-muted-foreground cursor-not-allowed"
    : selected
    ? "border-primary bg-primary text-primary-foreground cursor-pointer"
    : "border-warning/40 bg-warning/20 text-warning-foreground group-hover:bg-warning/30 cursor-pointer group-hover:scale-105";

  const chairClass = booked ? "bg-border" : selected ? "bg-primary" : "bg-warning/50";

  const chairs = (position: "top" | "bottom") => (
    <span
      className={`absolute left-1/2 flex -translate-x-1/2 gap-1 ${
        position === "top" ? "top-0" : "bottom-0"
      }`}
    >
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${chairClass}`} />
      ))}
    </span>
  );

  return (
    <button
      type="button"
      disabled={booked}
      aria-pressed={selected}
      aria-label={`Mesa ${number}`}
      onClick={() => onToggle(number)}
      className="group relative flex h-12 w-16 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-16 sm:w-24"
    >
      {chairs("top")}
      <span
        className={`relative flex h-8 w-14 items-center justify-center rounded-md border-2 text-sm font-bold shadow-sm transition-all duration-200 sm:h-11 sm:w-20 sm:text-base ${tableClass}`}
      >
        {number}
        {booked && (
          <LockIcon className="absolute right-1 top-1 h-3 w-3 text-muted-foreground" />
        )}
        {selected && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground ring-2 ring-background">
            ✓
          </span>
        )}
      </span>
      {chairs("bottom")}
    </button>
  );
};

const BookingForm: React.FC<BookingFormProps> = ({
  onSubmit,
  initialData,
  onCancel,
}) => {
  const { data: session } = useSession();
  const isRegularUser = session?.user?.role === "user";

  const initialApartment = isRegularUser
    ? session?.user.apartmentNumber?.toString()
    : initialData?.apartmentNumber?.toString() || "";

  const [hasCreatedFirstBooking, setHasCreatedFirstBooking] = useState<boolean>(
    typeof window !== "undefined"
      ? localStorage.getItem(FIRST_BOOKING_KEY) === "true"
      : false
  );

  const [apartmentNumber, setApartmentNumber] = useState<string>(
    initialApartment ||
      (hasCreatedFirstBooking && !isRegularUser
        ? getLastSelectedApartment()?.toString()
        : "") ||
      ""
  );

  const [date, setDate] = useState<Date>(
    initialData?.date ? new Date(initialData.date) : new Date()
  );
  const [mealType, setMealType] = useState<MealType>(
    initialData?.mealType || "lunch"
  );
  const [numberOfPeople, setNumberOfPeople] = useState<number | "">(
    initialData?.numberOfPeople || 4
  );
  const [selectedTables, setSelectedTables] = useState<number[]>(
    initialData?.tables || []
  );
  const [bookedTables, setBookedTables] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [prepararFuego, setPrepararFuego] = useState<boolean>(
    initialData?.prepararFuego || false
  );
  const [reservaHorno, setReservaHorno] = useState<boolean>(
    initialData?.reservaHorno || false
  );

  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingsForDates, setBookingsForDates] = useState<BookingCalendarInfo>({});
  const [isOvenBooked, setIsOvenBooked] = useState<boolean>(false);
  const [dateBlock, setDateBlock] = useState<IBlockedDate | null>(null);

  const maxPeopleAllowed = selectedTables.length * MAX_PEOPLE_PER_TABLE;

  // Derived concierge-service state (previously synced via an effect)
  const { isConciergeRestDay, isShortNotice, offSeason } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const daysDifference = differenceInDays(checkDate, today);
    const dayOfWeek = checkDate.getDay();
    return {
      isConciergeRestDay: dayOfWeek === 2 || dayOfWeek === 3, // Tue/Wed
      isShortNotice: daysDifference <= 4,
      offSeason: isOffSeason(checkDate),
    };
  }, [date]);

  const { noCleaningService, cleaningWarningReason } = useMemo(() => {
    const mealTypeHasChanged =
      initialData?.mealType !== undefined && initialData.mealType !== mealType;
    const dateHasChanged =
      initialData?.date !== undefined &&
      new Date(initialData.date).getTime() !== date.getTime();

    if (
      !initialData?._id ||
      (initialData?._id && (dateHasChanged || mealTypeHasChanged))
    ) {
      if (offSeason) {
        return {
          noCleaningService: true,
          cleaningWarningReason:
            "Durante la temporada baja (mayo a noviembre) no se proporciona servicio de conserjería.",
        };
      } else if (isConciergeRestDay) {
        return {
          noCleaningService: true,
          cleaningWarningReason:
            "Los martes y miércoles no hay servicio de conserjería.",
        };
      } else if (isShortNotice) {
        return {
          noCleaningService: true,
          cleaningWarningReason:
            "Para reservas con menos de 5 días de antelación no se proporciona servicio de conserjería.",
        };
      }
      return { noCleaningService: false, cleaningWarningReason: "" };
    } else if (initialData?.noCleaningService) {
      if (offSeason) {
        return {
          noCleaningService: true,
          cleaningWarningReason:
            "Durante la temporada baja (mayo a noviembre) no se proporciona servicio de conserjería.",
        };
      } else if (isConciergeRestDay) {
        return {
          noCleaningService: true,
          cleaningWarningReason:
            "Los martes y miércoles no hay servicio de conserjería.",
        };
      }
      return {
        noCleaningService: true,
        cleaningWarningReason:
          "Para reservas con menos de 5 días de antelación no se proporciona servicio de conserjería.",
      };
    }

    return {
      noCleaningService: initialData?.noCleaningService || false,
      cleaningWarningReason: "",
    };
  }, [
    date,
    mealType,
    initialData,
    offSeason,
    isConciergeRestDay,
    isShortNotice,
  ]);

  const effectivePrepararFuego =
    isConciergeRestDay || isShortNotice || offSeason ? false : prepararFuego;

  // Clamp attendees to the capacity of the selected tables (derived, so no
  // state-sync effect is needed).
  const effectiveNumberOfPeople =
    selectedTables.length > 0 &&
    typeof numberOfPeople === "number" &&
    numberOfPeople > maxPeopleAllowed
      ? maxPeopleAllowed
      : numberOfPeople;


  function getLastSelectedApartment(): number | undefined {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LAST_APARTMENT_KEY);
      return saved ? parseInt(saved) : undefined;
    }
    return undefined;
  }

  function saveLastSelectedApartment(apartmentNum: number) {
    if (typeof window !== "undefined" && !isRegularUser) {
      localStorage.setItem(LAST_APARTMENT_KEY, apartmentNum.toString());
      if (!hasCreatedFirstBooking) {
        localStorage.setItem(FIRST_BOOKING_KEY, "true");
        setHasCreatedFirstBooking(true);
      }
    }
  }


  useEffect(() => {
    const fetchAllBookings = async () => {
      try {
        const [res, blocksRes] = await Promise.all([
          fetch("/api/bookings?forCalendar=true"),
          fetch("/api/blocked-dates"),
        ]);
        if (!res.ok) throw new Error("Error al obtener reservas");
        const bookings: IBooking[] = await res.json();
        const blocks: IBlockedDate[] = blocksRes.ok
          ? await blocksRes.json()
          : [];

        setBookingsForDates(buildBookingCalendarInfo(bookings, blocks));
      } catch (err) {
        console.error("Error fetching all bookings:", err);
      }
    };
    fetchAllBookings();
  }, []);

  useEffect(() => {
    const fetchBookingsAndResources = async () => {
      if (!date || !mealType) return;
      setLoading(true);
      try {
        const dateString = date.toISOString().split("T")[0];
        const res = await fetch(
          `/api/bookings?date=${dateString}&mealType=${mealType}`
        );
        if (!res.ok) throw new Error("Error al obtener reservas");
        const bookings: IBooking[] = await res.json();

        const otherBookings = initialData?._id
          ? bookings.filter((booking) => booking._id !== initialData._id)
          : bookings;

        const allBookedTables = otherBookings.flatMap(
          (booking) => booking.tables
        );
        setBookedTables(allBookedTables);

        const ovenTaken = otherBookings.some((booking) => booking.reservaHorno);
        setIsOvenBooked(ovenTaken);

        if (ovenTaken) {
          setReservaHorno(false);
        }

        setSelectedTables((prev) => {
          const validTables = prev.filter(
            (tableNum) => !allBookedTables.includes(tableNum)
          );
          if (prev.length !== validTables.length) {
            toast.info("Selección de mesas actualizada", {
              description:
                "Algunas mesas que había seleccionado ya no están disponibles.",
            });
          }
          return validTables;
        });

        // Check if this date+mealType is blocked
        const blockRes = await fetch(`/api/blocked-dates?date=${dateString}`);
        if (blockRes.ok) {
          const blocks: IBlockedDate[] = await blockRes.json();
          const activeBlock =
            blocks.find((b) => b.mealType === mealType || b.mealType === "both") ||
            null;
          setDateBlock(activeBlock);
        } else {
          setDateBlock(null);
        }
      } catch (err) {
        console.error("Error fetching booked resources:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookingsAndResources();
  }, [date, mealType, initialData?._id]);

  const handleMealTypeChange = (value: MealType) => {
    setMealType(value);
    setSelectedTables([]);
  };

  const handleApartmentChange = (value: string) => {
    if (!isRegularUser) {
      const apartmentNum = parseInt(value);
      setApartmentNumber(apartmentNum.toString());
    }
  };

  const handleNumberOfPeopleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue = e.target.value;
    if (rawValue === "") {
      setNumberOfPeople("");
      return;
    }

    const value = parseInt(rawValue, 10);
    if (isNaN(value) || value < 1) {
      setNumberOfPeople(1);
      return;
    }
    if (selectedTables.length > 0 && value > maxPeopleAllowed) {
      setNumberOfPeople(maxPeopleAllowed);
      toast.info("Límite de capacidad", {
        description: `El máximo de personas permitidas para ${selectedTables.length} mesa(s) es ${maxPeopleAllowed}.`,
      });
    } else {
      setNumberOfPeople(value);
    }
  };

  const toggleTable = (tableNumber: number) => {
    if (bookedTables.includes(tableNumber)) return;

    setSelectedTables((prev) => {
      const newTables = prev.includes(tableNumber)
        ? prev.filter((t) => t !== tableNumber)
        : [...prev, tableNumber];

      const newMaxCapacity = newTables.length * MAX_PEOPLE_PER_TABLE;
      if (
        newTables.length > 0 &&
        typeof numberOfPeople === "number" &&
        numberOfPeople > newMaxCapacity
      ) {
        setNumberOfPeople(newMaxCapacity);
        toast.info("Número de personas ajustado", {
          description: `El máximo de personas permitidas para ${newTables.length} mesa(s) es ${newMaxCapacity}.`,
        });
      }
      return newTables;
    });
  };

  const isSelected = (tableNumber: number) =>
    selectedTables.includes(tableNumber);
  const isBooked = (tableNumber: number) => bookedTables.includes(tableNumber);

  const renderDayContents = (day: number, date: Date | undefined) => (
    <CalendarDayContent
      day={day}
      date={date}
      info={
        date ? bookingsForDates[format(date, "yyyy-MM-dd")] : undefined
      }
    />
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Block check guard
    if (dateBlock) {
      setError(
        `Esta fecha está bloqueada por ${dateBlock.reason}. No puede realizar reservas.`
      );
      return;
    }

    const effectiveApartmentNumber = isRegularUser
      ? session?.user.apartmentNumber
      : apartmentNumber
      ? parseInt(apartmentNumber)
      : undefined;

    if (!effectiveApartmentNumber) {
      setError("Por favor, seleccione un número de apartamento");
      toast.error("Error de Validación", {
        description: "Por favor, seleccione un número de apartamento",
      });
      return;
    }

    if (selectedTables.length === 0) {
      setError("Por favor, seleccione al menos una mesa");
      toast.error("Error de Validación", {
        description: "Por favor, seleccione al menos una mesa",
      });
      return;
    }

    if (effectiveNumberOfPeople === "" || effectiveNumberOfPeople < 1) {
      setError("Por favor, indique un número de personas válido");
      toast.error("Error de Validación", {
        description: "Por favor, indique un número de personas válido",
      });
      return;
    }

    if (effectiveNumberOfPeople > maxPeopleAllowed) {
      setError(
        `El número máximo de personas permitidas para ${selectedTables.length} mesa(s) es ${maxPeopleAllowed}`
      );
      toast.error("Error de Validación", {
        description: `El número máximo de personas permitidas para ${selectedTables.length} mesa(s) es ${maxPeopleAllowed}`,
      });
      return;
    }

    if (reservaHorno && isOvenBooked) {
      setError("El horno ya está reservado para este turno");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        apartmentNumber: effectiveApartmentNumber,
        date,
        mealType,
        numberOfPeople: effectiveNumberOfPeople,
        tables: selectedTables,
        // Force fire to false if rest day OR short notice (Concierge logic)
        prepararFuego: effectivePrepararFuego,
        // Allow oven regardless of rest day (unless conflict)
        reservaHorno: reservaHorno,
        userId: session?.user?.id,
        noCleaningService,
      });

      if (!initialData?._id && !isRegularUser) {
        saveLastSelectedApartment(effectiveApartmentNumber);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al enviar la reserva";
      setError(message);
      toast.error("Error", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date">Fecha</Label>
        <div className="custom-datepicker-container">
          <div className="relative flex items-center w-full">
            <div className="pointer-events-none absolute left-3 z-10 text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <DatePicker
              selected={date}
              onChange={(date: Date | null) => date && setDate(date)}
              minDate={new Date()}
              dateFormat="d MMMM, yyyy"
              locale="es"
              onFocus={(e) => e.target.blur()}
              wrapperClassName="w-full"
              renderDayContents={renderDayContents}
              customInput={
                <input
                  className="w-full cursor-pointer rounded-md border border-input bg-card py-2 pl-10 pr-10 text-center text-sm text-foreground outline-none transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  inputMode="none"
                  readOnly
                />
              }
            />
            <div className="pointer-events-none absolute right-3 z-10 text-muted-foreground">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          <div className="datepicker-legend">
            <div className="datepicker-legend-item">
              <div className="datepicker-legend-dot booking-dot-lunch"></div>
              <span>Comida</span>
            </div>
            <div className="datepicker-legend-item">
              <div className="datepicker-legend-dot booking-dot-dinner"></div>
              <span>Cena</span>
            </div>
            <div className="datepicker-legend-item">
              <div className="datepicker-legend-dot booking-dot-both"></div>
              <span>Ambas</span>
            </div>
            <div className="datepicker-legend-item">
              <div className="datepicker-legend-dot booking-dot-blocked"></div>
              <span>Bloqueada</span>
            </div>
            <div className="hidden items-center gap-1 text-muted-foreground sm:ml-auto sm:flex">
              <InfoIcon className="h-3 w-3" />
              <span>Fechas con reservas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Meal Type */}
      <div className="space-y-2">
        <Label htmlFor="mealType">Tipo de Comida</Label>
        <RadioGroup
          value={mealType}
          onValueChange={(value) => handleMealTypeChange(value as MealType)}
          className="flex mt-4 space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="lunch" id="lunch" />
            <Label htmlFor="lunch">Comida</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dinner" id="dinner" />
            <Label htmlFor="dinner">Cena</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Tables Selection */}
      <div className="space-y-2">
        <Label>Seleccionar Mesas</Label>
        <Card className="w-full overflow-hidden border-2">
          <CardContent className="p-2 sm:p-4">
            <div className="min-h-[240px]">
              {loading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <>
                  <div className="mb-3 flex justify-end gap-3 rounded-md bg-muted p-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-2.5 rounded-[4px] border-2 border-warning/50 bg-warning/40 shadow-sm"></div>
                      <span>Disponible</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-2.5 rounded-[4px] border-2 border-primary bg-primary shadow-sm"></div>
                      <span>Seleccionada</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-2.5 rounded-[4px] border-2 border-border bg-muted shadow-sm"></div>
                      <span>Reservada</span>
                    </div>
                  </div>

                  <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted/40 shadow-inner">
                    {/* Visual representation of tables layout */}
                    <div className="absolute flex flex-col items-start justify-end h-full left-0 py-2 sm:py-4">
                      {[2, 1].map((num) => (
                        <div key={num} className="m-1 sm:m-2">
                          <TableTile
                            number={num}
                            selected={isSelected(num)}
                            booked={isBooked(num)}
                            onToggle={toggleTable}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="absolute flex justify-center space-x-2 sm:space-x-4 w-full top-2 sm:top-4">
                      {[3, 4].map((num) => (
                        <TableTile
                          key={num}
                          number={num}
                          selected={isSelected(num)}
                          booked={isBooked(num)}
                          onToggle={toggleTable}
                        />
                      ))}
                    </div>
                    <div className="absolute flex flex-col items-end justify-end h-full right-0 py-2 sm:py-4">
                      {[5, 6].map((num) => (
                        <div key={num} className="m-1 sm:m-2">
                          <TableTile
                            number={num}
                            selected={isSelected(num)}
                            booked={isBooked(num)}
                            onToggle={toggleTable}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3 grid grid-cols-1 gap-y-2">
                    <div className="rounded-md border border-border bg-muted p-2">
                      <p className="text-sm font-medium sm:text-base">
                        Mesas seleccionadas:
                        {selectedTables.length > 0 ? (
                          <span className="ml-1 text-primary">
                            {selectedTables.sort((a, b) => a - b).join(", ")}
                          </span>
                        ) : (
                          <span className="ml-1 text-muted-foreground">
                            Ninguna
                          </span>
                        )}
                      </p>
                      {selectedTables.length > 0 && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Capacidad total:{" "}
                          <span className="font-medium">
                            {maxPeopleAllowed} personas
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setSelectedTables([])}
                    className="w-full"
                    size="sm"
                  >
                    Limpiar Selección
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Apartment and People */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="apartmentNumber">Número de Apartamento</Label>
          {isRegularUser ? (
            <div className="flex items-center">
              <Input
                id="apartmentNumber"
                value={`Apartamento #${
                  session?.user.apartmentNumber
                    ? getApartmentLabel(session.user.apartmentNumber)
                    : ""
                }`}
                disabled
                className="bg-muted"
              />
              <div className="ml-2 text-muted-foreground">
                <LockIcon className="h-4 w-4" />
              </div>
            </div>
          ) : (
            <Select
              value={apartmentNumber}
              onValueChange={handleApartmentChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar apartamento" />
              </SelectTrigger>
              <SelectContent>
                {APARTMENT_NUMBERS.map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    Apartamento #{getApartmentLabel(num)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="numberOfPeople">Número de Personas</Label>
          <div className="relative">
            <Input
              id="numberOfPeople"
              type="number"
              min="1"
              max={selectedTables.length > 0 ? maxPeopleAllowed : undefined}
              required
              value={effectiveNumberOfPeople}
              onChange={handleNumberOfPeopleChange}
            />
            {selectedTables.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <InfoIcon className="h-3 w-3" />
                <span>
                  Máximo: {maxPeopleAllowed} personas ({MAX_PEOPLE_PER_TABLE}{" "}
                  por mesa)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Options */}
      <div className="space-y-2">
        <Label>Opciones Adicionales</Label>
        
        <div className="flex mt-4 flex-col gap-4">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="prepararFuego"
                checked={effectivePrepararFuego}
                onCheckedChange={() => setPrepararFuego(!prepararFuego)}
                disabled={isConciergeRestDay || isShortNotice}
              />
              <Label
                htmlFor="prepararFuego"
                className={`font-normal cursor-pointer ${
                  (isConciergeRestDay || isShortNotice) ? "text-muted-foreground" : ""
                }`}
              >
                Preparar fuego para la reserva
              </Label>
            </div>
            {(isConciergeRestDay || isShortNotice) && (
              <span className="flex items-center gap-1 pl-6 text-xs text-warning-foreground">
                <InfoIcon className="h-3 w-3" />{" "}
                {isConciergeRestDay 
                  ? "No disponible martes y miércoles (sin conserje)." 
                  : "No disponible con menos de 5 días (autogestión)."}
              </span>
            )}
          </div>

          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="reservaHorno"
                checked={reservaHorno}
                onCheckedChange={() => setReservaHorno(!reservaHorno)}
                disabled={isOvenBooked}
              />
              <Label
                htmlFor="reservaHorno"
                className={`font-normal cursor-pointer ${
                  isOvenBooked ? "text-muted-foreground" : ""
                }`}
              >
                Reserva de horno
              </Label>
            </div>
            {isOvenBooked && (
              <span className="flex items-center gap-1 pl-6 text-xs text-warning-foreground">
                <InfoIcon className="h-3 w-3" /> El horno ya está reservado por
                otro usuario
              </span>
            )}
          </div>
        </div>
      </div>

      {noCleaningService && (
        <Alert className="mt-4 mb-2 border-warning/20 bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning-foreground">
            <strong>Aviso importante:</strong>{" "}
            {cleaningWarningReason || "Sin servicio de conserjería."} El
            propietario deberá encargarse de los servicios de conserjería, incluida la limpieza tras su uso.
          </AlertDescription>
        </Alert>
      )}

      {dateBlock && (
        <Alert className="mt-4 mb-2 border-destructive/20 bg-destructive/10">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <strong>Fecha no disponible:</strong> Esta fecha está reservada para{" "}
            <span className="font-semibold">{dateBlock.reason}</span>. No es
            posible realizar reservas de{" "}
            {mealType === "lunch" ? "comida" : "cena"} en esta fecha.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end sm:space-x-2">
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          className="w-full cursor-pointer sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !!dateBlock}
          className="w-full cursor-pointer sm:w-auto"
        >
          {isSubmitting
            ? "Guardando..."
            : initialData?._id
            ? "Actualizar Reserva"
            : "Crear Reserva"}
        </Button>
      </div>
    </form>
  );
};

export default BookingForm;
