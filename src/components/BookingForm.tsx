// src/components/BookingForm.tsx
import React, { useState, useEffect } from "react";
import { IBooking, MealType } from "@/models/Booking";
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
import {
  CalendarIcon,
  LockIcon,
  InfoIcon,
  AlertTriangle,
} from "lucide-react";
import { useSession } from "next-auth/react";

registerLocale("es", es);

interface BookingsForDate {
  [date: string]: {
    lunch: boolean;
    dinner: boolean;
  };
}

interface BookingFormProps {
  onSubmit: (data: Partial<IBooking>) => Promise<void>;
  initialData?: Partial<IBooking>;
  onCancel: () => void;
}

const APARTMENT_NUMBERS = Array.from({ length: 48 }, (_, i) => i + 1);
const LAST_APARTMENT_KEY = "lastSelectedApartment";
const FIRST_BOOKING_KEY = "hasCreatedFirstBooking";
const MAX_PEOPLE_PER_TABLE = 8;

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
  const [numberOfPeople, setNumberOfPeople] = useState<number>(
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
  const [bookingsForDates, setBookingsForDates] = useState<BookingsForDate>({});
  const [noCleaningService, setNoCleaningService] = useState<boolean>(
    initialData?.noCleaningService || false
  );
  const [cleaningWarningReason, setCleaningWarningReason] = useState<string>("");

  const maxPeopleAllowed = selectedTables.length * MAX_PEOPLE_PER_TABLE;

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
  
    const daysDifference = differenceInDays(checkDate, today);
    
    // Check day of week (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
    const dayOfWeek = checkDate.getDay();
    const isConciergeRestDay = dayOfWeek === 2 || dayOfWeek === 3; // Tue or Wed
    const isShortNotice = daysDifference <= 4;

    if (!initialData?._id || (initialData?._id && 
        (initialData.date && new Date(initialData.date).getTime() !== date.getTime()))) {
      
      if (isConciergeRestDay) {
        setNoCleaningService(true);
        setCleaningWarningReason("Los martes y miércoles son días de descanso de la conserje.");
      } else if (isShortNotice) {
        setNoCleaningService(true);
        setCleaningWarningReason("Para reservas con menos de 5 días de antelación no se proporciona servicio de limpieza.");
      } else {
        setNoCleaningService(false);
        setCleaningWarningReason("");
      }
    } else if (initialData?.noCleaningService) {
        // Keep original state if editing and date hasn't changed, but update text reasoning
        if (isConciergeRestDay) {
            setCleaningWarningReason("Los martes y miércoles son días de descanso de la conserje.");
        } else {
            setCleaningWarningReason("Para reservas con menos de 5 días de antelación no se proporciona servicio de limpieza.");
        }
    }
  }, [date, initialData]);

  useEffect(() => {
    const fetchAllBookings = async () => {
      try {
        const res = await fetch("/api/bookings?forCalendar=true");
        if (!res.ok) throw new Error("Error al obtener reservas");
        const bookings: IBooking[] = await res.json();
        const bookingMap: BookingsForDate = {};

        bookings.forEach((booking) => {
          const dateKey = format(new Date(booking.date), "yyyy-MM-dd");
          if (!bookingMap[dateKey]) {
            bookingMap[dateKey] = { lunch: false, dinner: false };
          }
          if (booking.mealType === "lunch") {
            bookingMap[dateKey].lunch = true;
          } else {
            bookingMap[dateKey].dinner = true;
          }
        });
        setBookingsForDates(bookingMap);
      } catch (err) {
        console.error("Error fetching all bookings:", err);
      }
    };
    fetchAllBookings();
  }, []);

  useEffect(() => {
    const fetchBookedTables = async () => {
      if (!date || !mealType) return;
      setLoading(true);
      try {
        const dateString = date.toISOString().split("T")[0];
        const res = await fetch(
          `/api/bookings?date=${dateString}&mealType=${mealType}`
        );
        if (!res.ok) throw new Error("Error al obtener reservas");
        const bookings: IBooking[] = await res.json();
        
        const filteredBookings = initialData?._id
          ? bookings.filter((booking) => booking._id !== initialData._id)
          : bookings;

        const allBookedTables = filteredBookings.flatMap(
          (booking) => booking.tables
        );
        setBookedTables(allBookedTables);

        const hasConflict = selectedTables.some((tableNum) =>
          allBookedTables.includes(tableNum)
        );

        if (hasConflict) {
          const validTables = selectedTables.filter(
            (tableNum) => !allBookedTables.includes(tableNum)
          );
          setSelectedTables(validTables);
          if (selectedTables.length !== validTables.length) {
            toast.info("Selección de mesas actualizada", {
              description: "Algunas mesas que había seleccionado ya no están disponibles.",
            });
          }
        }
      } catch (err) {
        console.error("Error fetching booked tables:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookedTables();
  }, [date, mealType, initialData?._id]);

  const handleMealTypeChange = (value: MealType) => {
    setMealType(value);
    setSelectedTables([]);
  };

  useEffect(() => {
    if (selectedTables.length > 0 && numberOfPeople > maxPeopleAllowed) {
      setNumberOfPeople(maxPeopleAllowed);
      toast.info("Número de personas ajustado", {
        description: `El máximo de personas permitidas para ${selectedTables.length} mesa(s) es ${maxPeopleAllowed}.`,
      });
    }
  }, [selectedTables, maxPeopleAllowed, numberOfPeople]);

  const handleApartmentChange = (value: string) => {
    if (!isRegularUser) {
      const apartmentNum = parseInt(value);
      setApartmentNumber(apartmentNum.toString());
    }
  };

  const handleNumberOfPeopleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
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
      if (newTables.length > 0 && numberOfPeople > newMaxCapacity) {
        setNumberOfPeople(newMaxCapacity);
        toast.info("Número de personas ajustado", {
          description: `El máximo de personas permitidas para ${newTables.length} mesa(s) es ${newMaxCapacity}.`,
        });
      }
      return newTables;
    });
  };

  const isSelected = (tableNumber: number) => selectedTables.includes(tableNumber);
  const isBooked = (tableNumber: number) => bookedTables.includes(tableNumber);

  const renderDayContents = (day: number, date: Date | undefined) => {
    if (!date) return <span>{day}</span>;
    const dateKey = format(date, "yyyy-MM-dd");
    const bookingInfo = bookingsForDates[dateKey];

    return (
      <div className="relative">
        <span>{day}</span>
        {bookingInfo && (
          <>
            {bookingInfo.lunch && bookingInfo.dinner && (
              <div className="booking-indicator booking-dot-both" title="Reservas para comida y cena" />
            )}
            {bookingInfo.lunch && !bookingInfo.dinner && (
              <div className="booking-indicator booking-indicator-lunch booking-dot-lunch" title="Reservas para comida" />
            )}
            {!bookingInfo.lunch && bookingInfo.dinner && (
              <div className="booking-indicator booking-indicator-dinner booking-dot-dinner" title="Reservas para cena" />
            )}
          </>
        )}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const effectiveApartmentNumber = isRegularUser
      ? session?.user.apartmentNumber
      : apartmentNumber
      ? parseInt(apartmentNumber)
      : undefined;

    if (!effectiveApartmentNumber) {
      setError("Por favor, seleccione un número de apartamento");
      toast.error("Error de Validación", { description: "Por favor, seleccione un número de apartamento" });
      return;
    }

    if (selectedTables.length === 0) {
      setError("Por favor, seleccione al menos una mesa");
      toast.error("Error de Validación", { description: "Por favor, seleccione al menos una mesa" });
      return;
    }

    if (numberOfPeople > maxPeopleAllowed) {
      setError(`El número máximo de personas permitidas para ${selectedTables.length} mesa(s) es ${maxPeopleAllowed}`);
      toast.error("Error de Validación", { description: `El número máximo de personas permitidas para ${selectedTables.length} mesa(s) es ${maxPeopleAllowed}` });
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        apartmentNumber: effectiveApartmentNumber,
        date,
        mealType,
        numberOfPeople,
        tables: selectedTables,
        prepararFuego,
        reservaHorno,
        userId: session?.user?.id,
        noCleaningService,
      });

      if (!initialData?._id && !isRegularUser) {
        saveLastSelectedApartment(effectiveApartmentNumber);
      }
    } catch (error: any) {
      setError(error.message || "Error al enviar la reserva");
      toast.error("Error", { description: error.message || "Error al enviar la reserva" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTableClasses = (tableNumber: number) => {
    if (isBooked(tableNumber)) {
      return "bg-gray-300 text-gray-500 cursor-not-allowed relative border border-gray-400";
    }
    if (isSelected(tableNumber)) {
      return "bg-primary text-primary-foreground cursor-pointer border-2 border-primary-dark ";
    }
    return "bg-orange-300 hover:bg-orange-400 cursor-pointer border border-orange-400 hover:scale-105";
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
            <div className="absolute left-3 pointer-events-none text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <DatePicker
              selected={date}
              onChange={(date: Date) => setDate(date)}
              minDate={new Date()}
              dateFormat="d MMMM, yyyy"
              locale="es"
              onFocus={(e) => e.target.blur()}
              wrapperClassName="w-full"
              renderDayContents={renderDayContents}
              customInput={<input className="w-full pl-10 p-2 border rounded-md cursor-pointer" readOnly />}
            />
          </div>
          <div className="datepicker-legend">
            {/* Legend items */}
            <div className="datepicker-legend-item"><div className="datepicker-legend-dot booking-dot-lunch"></div><span>Comida</span></div>
            <div className="datepicker-legend-item"><div className="datepicker-legend-dot booking-dot-dinner"></div><span>Cena</span></div>
            <div className="datepicker-legend-item"><div className="datepicker-legend-dot booking-dot-both"></div><span>Ambas</span></div>
            <div className="flex items-center gap-1 text-muted-foreground ml-auto"><InfoIcon className="h-3 w-3" /><span>Fechas con reservas</span></div>
          </div>
        </div>
      </div>

      {/* Meal Type */}
      <div className="space-y-2">
        <Label htmlFor="mealType">Tipo de Comida</Label>
        <RadioGroup value={mealType} onValueChange={(value) => handleMealTypeChange(value as MealType)} className="flex space-x-4">
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
                  <div className="flex justify-end mb-3 gap-3 text-xs bg-gray-50 p-2 rounded-md">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-300 rounded-md shadow-sm"></div><span>Disponible</span></div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-primary rounded-md shadow-sm"></div><span>Seleccionada</span></div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-300 rounded-md shadow-sm"></div><span>Reservada</span></div>
                  </div>

                  <div className="relative w-full aspect-video bg-[#f5f8fa] rounded-lg mb-4 border border-gray-200 shadow-inner overflow-hidden">
                    {/* Render Tables 1-6 using helper logic similar to original file, omitted for brevity but keeping same structure */}
                    {[1, 2, 3, 4, 5, 6].map((num) => {
                        let positionClass = "";
                        if (num === 1) positionClass = "absolute bottom-4 left-4 mb-16"; 
                        return null; 
                    })}
                    
                    <div className="absolute flex flex-col items-start justify-end h-full left-0 py-2 sm:py-4">
                      <div className="relative m-1 sm:m-2"><div className={`w-16 h-12 sm:w-24 sm:h-16 rounded-sm flex items-center justify-center text-sm sm:text-base shadow-md transition-all duration-200 ${getTableClasses(2)}`} onClick={() => toggleTable(2)}><span className="font-bold">2</span>{isBooked(2) && <LockIcon className="h-3 w-3 absolute top-1 right-1 text-gray-500" />}{isSelected(2) && <div className="absolute top-0 right-0 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center"><span className="text-white text-xs">✓</span></div>}</div></div>
                      <div className="relative m-1 sm:m-2"><div className={`w-16 h-12 sm:w-24 sm:h-16 rounded-sm flex items-center justify-center text-sm sm:text-base shadow-md transition-all duration-200 ${getTableClasses(1)}`} onClick={() => toggleTable(1)}><span className="font-bold">1</span>{isBooked(1) && <LockIcon className="h-3 w-3 absolute top-1 right-1 text-gray-500" />}{isSelected(1) && <div className="absolute top-0 right-0 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center"><span className="text-white text-xs">✓</span></div>}</div></div>
                    </div>
                    <div className="absolute flex justify-center space-x-2 sm:space-x-4 w-full top-2 sm:top-4">
                      <div className="relative"><div className={`w-16 h-12 sm:w-24 sm:h-16 rounded-sm flex items-center justify-center text-sm sm:text-base shadow-md transition-all duration-200 ${getTableClasses(3)}`} onClick={() => toggleTable(3)}><span className="font-bold">3</span>{isBooked(3) && <LockIcon className="h-3 w-3 absolute top-1 right-1 text-gray-500" />}{isSelected(3) && <div className="absolute top-0 right-0 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center"><span className="text-white text-xs">✓</span></div>}</div></div>
                      <div className="relative"><div className={`w-16 h-12 sm:w-24 sm:h-16 rounded-sm flex items-center justify-center text-sm sm:text-base shadow-md transition-all duration-200 ${getTableClasses(4)}`} onClick={() => toggleTable(4)}><span className="font-bold">4</span>{isBooked(4) && <LockIcon className="h-3 w-3 absolute top-1 right-1 text-gray-500" />}{isSelected(4) && <div className="absolute top-0 right-0 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center"><span className="text-white text-xs">✓</span></div>}</div></div>
                    </div>
                    <div className="absolute flex flex-col items-end justify-end h-full right-0 py-2 sm:py-4">
                      <div className="relative m-1 sm:m-2"><div className={`w-16 h-12 sm:w-24 sm:h-16 rounded-sm flex items-center justify-center text-sm sm:text-base shadow-md transition-all duration-200 ${getTableClasses(5)}`} onClick={() => toggleTable(5)}><span className="font-bold">5</span>{isBooked(5) && <LockIcon className="h-3 w-3 absolute top-1 right-1 text-gray-500" />}{isSelected(5) && <div className="absolute top-0 right-0 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center"><span className="text-white text-xs">✓</span></div>}</div></div>
                      <div className="relative m-1 sm:m-2"><div className={`w-16 h-12 sm:w-24 sm:h-16 rounded-sm flex items-center justify-center text-sm sm:text-base shadow-md transition-all duration-200 ${getTableClasses(6)}`} onClick={() => toggleTable(6)}><span className="font-bold">6</span>{isBooked(6) && <LockIcon className="h-3 w-3 absolute top-1 right-1 text-gray-500" />}{isSelected(6) && <div className="absolute top-0 right-0 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center"><span className="text-white text-xs">✓</span></div>}</div></div>
                    </div>
                  </div>

                  <div className="mb-3 grid grid-cols-1 gap-y-2">
                    <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                      <p className="font-medium text-sm sm:text-base">
                        Mesas seleccionadas:
                        {selectedTables.length > 0 ? (
                          <span className="ml-1 text-primary">{selectedTables.sort((a, b) => a - b).join(", ")}</span>
                        ) : (
                          <span className="ml-1 text-gray-500">Ninguna</span>
                        )}
                      </p>
                      {selectedTables.length > 0 && (
                        <p className="text-sm text-gray-600 mt-1">Capacidad total: <span className="font-medium">{maxPeopleAllowed} personas</span></p>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" type="button" onClick={() => setSelectedTables([])} className="w-full" size="sm">Limpiar Selección</Button>
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
              <Input id="apartmentNumber" value={`Apartamento #${session?.user.apartmentNumber}`} disabled className="bg-muted" />
              <div className="ml-2 text-muted-foreground"><LockIcon className="h-4 w-4" /></div>
            </div>
          ) : (
            <Select value={apartmentNumber} onValueChange={handleApartmentChange}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar apartamento" /></SelectTrigger>
              <SelectContent>
                {APARTMENT_NUMBERS.map((num) => (<SelectItem key={num} value={num.toString()}>Apartamento #{num}</SelectItem>))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="numberOfPeople">Número de Personas</Label>
          <div className="relative">
            <Input id="numberOfPeople" type="number" min="1" max={selectedTables.length > 0 ? maxPeopleAllowed : undefined} required value={numberOfPeople} onChange={handleNumberOfPeopleChange} />
            {selectedTables.length > 0 && (
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><InfoIcon className="h-3 w-3" /><span>Máximo: {maxPeopleAllowed} personas ({MAX_PEOPLE_PER_TABLE} por mesa)</span></div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Options */}
      <div className="space-y-2">
        <Label>Opciones Adicionales</Label>
        <div className="flex flex-col gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="prepararFuego" checked={prepararFuego} onCheckedChange={() => setPrepararFuego(!prepararFuego)} />
            <Label htmlFor="prepararFuego" className="font-normal cursor-pointer">Preparar fuego para la reserva</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="reservaHorno" checked={reservaHorno} onCheckedChange={() => setReservaHorno(!reservaHorno)} />
            <Label htmlFor="reservaHorno" className="font-normal cursor-pointer">Reserva de horno</Label>
          </div>
         
        </div>
      </div>

      {noCleaningService && (
        <Alert className="bg-amber-50 border-amber-200 mt-4 mb-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Aviso importante:</strong> {cleaningWarningReason || "Sin servicio de limpieza."} El propietario deberá encargarse de la limpieza tras su uso.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:space-x-2 pt-4">
        <Button variant="outline" type="button" onClick={onCancel} className="cursor-pointer w-full sm:w-auto">Cancelar</Button>
        <Button type="submit" disabled={isSubmitting} className={`cursor-pointer w-full sm:w-auto active:scale-95 transition-all duration-150 ${initialData?._id ? "" : "bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium shadow-md hover:shadow-lg"}`}>
          {isSubmitting ? "Guardando..." : initialData?._id ? "Actualizar Reserva" : "Crear Reserva"}
        </Button>
      </div>
    </form>
  );
};

export default BookingForm;