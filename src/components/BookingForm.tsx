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
import { format, addDays, isBefore, differenceInDays } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import {
  CalendarIcon,
  LockIcon,
  InfoIcon,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { useSession } from "next-auth/react";

// Registrar el locale español para el datepicker
registerLocale("es", es);

interface BookingForm {
  date: Date;
  mealType: MealType;
}

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
  // Get current user session
  const { data: session } = useSession();

  // Check if user is a regular user
  const isRegularUser = session?.user?.role === "user";

  // For regular users, use their apartment number from session
  // For admin/IT admin users, use initialData or undefined
  const initialApartment = isRegularUser
    ? session?.user.apartmentNumber?.toString()
    : initialData?.apartmentNumber?.toString() || "";

  // Check if this is a first-time booking
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
  const [reservaBrasa, setReservaBrasa] = useState<boolean>(
    initialData?.reservaBrasa || false
  );
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingsForDates, setBookingsForDates] = useState<BookingsForDate>({});

  // Add state to track if cleaning service warning applies
  const [noCleaningService, setNoCleaningService] = useState<boolean>(
    initialData?.noCleaningService || false
  );

  // Calculate max people allowed based on selected tables
  const maxPeopleAllowed = selectedTables.length * MAX_PEOPLE_PER_TABLE;

  // Helper function to get last selected apartment from localStorage
  function getLastSelectedApartment(): number | undefined {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LAST_APARTMENT_KEY);
      return saved ? parseInt(saved) : undefined;
    }
    return undefined;
  }

  // Helper function to save selected apartment to localStorage
  function saveLastSelectedApartment(apartmentNum: number) {
    if (typeof window !== "undefined" && !isRegularUser) {
      localStorage.setItem(LAST_APARTMENT_KEY, apartmentNum.toString());
      // Mark that user has created their first booking
      if (!hasCreatedFirstBooking) {
        localStorage.setItem(FIRST_BOOKING_KEY, "true");
        setHasCreatedFirstBooking(true);
      }
    }
  }

  // Check if the selected date is less than or equal to 4 days in advance
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const daysDifference = differenceInDays(date, today);
    
    // Update the cleaning service warning in these cases:
    // 1. For new bookings (no initialData._id) - always calculate based on date proximity
    // 2. For existing bookings where the date is being changed
    
    if (!initialData?._id || (initialData?._id && 
        (initialData.date && new Date(initialData.date).getTime() !== date.getTime()))) {
      const needsCleaningWarning = daysDifference <= 4;
      setNoCleaningService(needsCleaningWarning);
    }
  }, [date, initialData]);

  // Fetch all bookings to highlight dates in calendar
  useEffect(() => {
    const fetchAllBookings = async () => {
      try {
        // Use the new parameter to get all bookings for calendar
        const res = await fetch("/api/bookings?forCalendar=true");
        if (!res.ok) {
          throw new Error("Error al obtener reservas");
        }

        const bookings: IBooking[] = await res.json();

        // Organize bookings by date and meal type
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

  // Get booked tables for selected date and meal type
  useEffect(() => {
    const fetchBookedTables = async () => {
      if (!date || !mealType) return;

      setLoading(true);

      try {
        // Format date to ISO string
        const dateString = date.toISOString().split("T")[0];

        // Add console logging to debug
        console.log(
          `Fetching bookings for date: ${dateString}, mealType: ${mealType}`
        );

        // Fetch bookings for selected date and meal type
        const res = await fetch(
          `/api/bookings?date=${dateString}&mealType=${mealType}`
        );

        if (!res.ok) {
          throw new Error("Error al obtener reservas");
        }

        const bookings: IBooking[] = await res.json();

        // Log all bookings received
        console.log("All bookings for this date/meal:", bookings);

        // Filter out the current booking being edited if applicable
        const filteredBookings = initialData?._id
          ? bookings.filter((booking) => booking._id !== initialData._id)
          : bookings;

        console.log(
          "Filtered bookings (excluding current if editing):",
          filteredBookings
        );

        // Get all booked tables from other bookings
        const allBookedTables = filteredBookings.flatMap(
          (booking) => booking.tables
        );

        console.log("Tables already booked:", allBookedTables);

        // Ensure we're setting booked tables correctly
        setBookedTables(allBookedTables);

        // Check if any of our selected tables are now booked by others
        const hasConflict = selectedTables.some((tableNum) =>
          allBookedTables.includes(tableNum)
        );

        if (hasConflict) {
          console.log(
            "Conflict detected between selected tables and booked tables"
          );
          // Remove only the conflicting tables
          const validTables = selectedTables.filter(
            (tableNum) => !allBookedTables.includes(tableNum)
          );

          console.log(
            "Removing conflicting tables. New selection:",
            validTables
          );

          setSelectedTables(validTables);

          // Notify user if tables were removed
          if (selectedTables.length !== validTables.length) {
            toast.info("Selección de mesas actualizada", {
              description:
                "Algunas mesas que había seleccionado ya no están disponibles.",
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

  // Handle meal type change - reset selected tables
  const handleMealTypeChange = (value: MealType) => {
    setMealType(value);
    setSelectedTables([]); // Reset selection when changing meal type
  };

  // Adjust number of people if it exceeds the maximum allowed
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
      // Only non-regular users can change the apartment
      const apartmentNum = parseInt(value);
      setApartmentNumber(apartmentNum.toString());
    }
  };

  const handleNumberOfPeopleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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

  // Toggle for table selection
  const toggleTable = (tableNumber: number) => {
    // Don't allow toggling of booked tables - add explicit console logging
    if (bookedTables.includes(tableNumber)) {
      console.log(
        `Attempted to select booked table ${tableNumber}, but it's already booked`
      );
      return;
    }

    setSelectedTables((prev) => {
      const newTables = prev.includes(tableNumber)
        ? prev.filter((t) => t !== tableNumber)
        : [...prev, tableNumber];

      // Check if the new table selection would reduce capacity below current number of people
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

  // Check if a table is selected
  const isSelected = (tableNumber: number) =>
    selectedTables.includes(tableNumber);

  // Check if a table is booked by someone else
  const isBooked = (tableNumber: number) => {
    const isTableBooked = bookedTables.includes(tableNumber);
    // Add this for debugging
    if (isTableBooked) {
      console.log(`Table ${tableNumber} is marked as booked`);
    }
    return isTableBooked;
  };

  // Custom day rendering for the date picker to highlight dates with bookings
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
              <div
                className="booking-indicator booking-dot-both"
                title="Reservas para comida y cena"
              />
            )}
            {bookingInfo.lunch && !bookingInfo.dinner && (
              <div
                className="booking-indicator booking-indicator-lunch booking-dot-lunch"
                title="Reservas para comida"
              />
            )}
            {!bookingInfo.lunch && bookingInfo.dinner && (
              <div
                className="booking-indicator booking-indicator-dinner booking-dot-dinner"
                title="Reservas para cena"
              />
            )}
          </>
        )}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // For regular users, always use their apartment number from session
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

    if (numberOfPeople > maxPeopleAllowed) {
      setError(
        `El número máximo de personas permitidas para ${selectedTables.length} mesa(s) es ${maxPeopleAllowed}`
      );
      toast.error("Error de Validación", {
        description: `El número máximo de personas permitidas para ${selectedTables.length} mesa(s) es ${maxPeopleAllowed}`,
      });
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
        reservaBrasa,
        userId: session?.user?.id, // Add the user ID from the session
        noCleaningService, // Include the cleaning service status
      });

      // Save the apartment number for future bookings (only for non-regular users)
      if (!initialData?._id && !isRegularUser) {
        saveLastSelectedApartment(effectiveApartmentNumber);
      }
    } catch (error: any) {
      setError(error.message || "Error al enviar la reserva");
      toast.error("Error", {
        description: error.message || "Error al enviar la reserva",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get table style classes based on status
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

      {/* Date selection - MOVED TO FIRST POSITION */}
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
              onFocus={(e) => e.target.blur()} // Prevent keyboard from showing
              
              wrapperClassName="w-full"
              renderDayContents={renderDayContents}
              customInput={
                <input
                  className="w-full pl-10 p-2 border rounded-md cursor-pointer"
                  readOnly
                />
              }
            />
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
            <div className="flex items-center gap-1 text-muted-foreground ml-auto">
              <InfoIcon className="h-3 w-3" />
              <span>Fechas con reservas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Meal Type - MOVED TO SECOND POSITION */}
      <div className="space-y-2">
        <Label htmlFor="mealType">Tipo de Comida</Label>
        <RadioGroup
          value={mealType}
          onValueChange={(value) => handleMealTypeChange(value as MealType)}
          className="flex space-x-4"
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

      {/* Tables Selection - MOVED TO THIRD POSITION */}
      <div className="space-y-2">
        <Label>Seleccionar Mesas</Label>
        <Card className="w-full overflow-hidden border-2">
          <CardContent className="p-2 sm:p-4">
            {/* Fixed height container to prevent layout shift */}
            <div className="min-h-[240px]">
              {loading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <>
                  {/* Leyenda para mesas */}
                  <div className="flex justify-end mb-3 gap-3 text-xs bg-gray-50 p-2 rounded-md">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-orange-300 rounded-md shadow-sm"></div>
                      <span>Disponible</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-primary rounded-md shadow-sm"></div>
                      <span>Seleccionada</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-gray-300 rounded-md shadow-sm"></div>
                      <span>Reservada</span>
                    </div>
                  </div>

                  {/* Disposición de mesa en forma de U - Optimizado para móvil */}
                  <div className="relative w-full aspect-video bg-[#f5f8fa] rounded-lg mb-4 border border-gray-200 shadow-inner overflow-hidden">
                    {/* Mesas del lado izquierdo (1 y 2) */}
                    <div className="absolute flex flex-col items-start justify-end h-full left-0 py-2 sm:py-4">
                      {/* Table 2 */}
                      <div className="relative m-1 sm:m-2">
                        <div
                          className={`w-16 h-12 sm:w-24 sm:h-16 rounded-sm flex items-center justify-center text-sm sm:text-base shadow-md transition-all duration-200 ${getTableClasses(
                            2
                          )}`}
                          onClick={() => toggleTable(2)}
                        >
                          <span className="font-bold">2</span>
                          {isBooked(2) && (
                            <LockIcon className="h-3 w-3 absolute top-1 right-1 text-gray-500" />
                          )}
                          {isSelected(2) && (
                            <div className="absolute top-0 right-0 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Table 1 */}
                      <div className="relative m-1 sm:m-2">
                        <div
                          className={`w-16 h-12 sm:w-24 sm:h-16 rounded-sm flex items-center justify-center text-sm sm:text-base shadow-md transition-all duration-200 ${getTableClasses(
                            1
                          )}`}
                          onClick={() => toggleTable(1)}
                        >
                          <span className="font-bold">1</span>
                          {isBooked(1) && (
                            <LockIcon className="h-3 w-3 absolute top-1 right-1 text-gray-500" />
                          )}
                          {isSelected(1) && (
                            <div className="absolute top-0 right-0 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mesas centrales superiores (3 y 4) */}
                    <div className="absolute flex justify-center space-x-2 sm:space-x-4 w-full top-2 sm:top-4">
                      {/* Table 3 */}
                      <div className="relative">
                        <div
                          className={`w-16 h-12 sm:w-24 sm:h-16 rounded-sm flex items-center justify-center text-sm sm:text-base shadow-md transition-all duration-200 ${getTableClasses(
                            3
                          )}`}
                          onClick={() => toggleTable(3)}
                        >
                          <span className="font-bold">3</span>
                          {isBooked(3) && (
                            <LockIcon className="h-3 w-3 absolute top-1 right-1 text-gray-500" />
                          )}
                          {isSelected(3) && (
                            <div className="absolute top-0 right-0 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Table 4 */}
                      <div className="relative">
                        <div
                          className={`w-16 h-12 sm:w-24 sm:h-16 rounded-sm flex items-center justify-center text-sm sm:text-base shadow-md transition-all duration-200 ${getTableClasses(
                            4
                          )}`}
                          onClick={() => toggleTable(4)}
                        >
                          <span className="font-bold">4</span>
                          {isBooked(4) && (
                            <LockIcon className="h-3 w-3 absolute top-1 right-1 text-gray-500" />
                          )}
                          {isSelected(4) && (
                            <div className="absolute top-0 right-0 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mesas del lado derecho (5 y 6) */}
                    <div className="absolute flex flex-col items-end justify-end h-full right-0 py-2 sm:py-4">
                      {/* Table 5 */}
                      <div className="relative m-1 sm:m-2">
                        <div
                          className={`w-16 h-12 sm:w-24 sm:h-16 rounded-sm flex items-center justify-center text-sm sm:text-base shadow-md transition-all duration-200 ${getTableClasses(
                            5
                          )}`}
                          onClick={() => toggleTable(5)}
                        >
                          <span className="font-bold">5</span>
                          {isBooked(5) && (
                            <LockIcon className="h-3 w-3 absolute top-1 right-1 text-gray-500" />
                          )}
                          {isSelected(5) && (
                            <div className="absolute top-0 right-0 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Table 6 */}
                      <div className="relative m-1 sm:m-2">
                        <div
                          className={`w-16 h-12 sm:w-24 sm:h-16 rounded-sm flex items-center justify-center text-sm sm:text-base shadow-md transition-all duration-200 ${getTableClasses(
                            6
                          )}`}
                          onClick={() => toggleTable(6)}
                        >
                          <span className="font-bold">6</span>
                          {isBooked(6) && (
                            <LockIcon className="h-3 w-3 absolute top-1 right-1 text-gray-500" />
                          )}
                          {isSelected(6) && (
                            <div className="absolute top-0 right-0 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table information and selection summary */}
                  <div className="mb-3 grid grid-cols-1 gap-y-2">
                    <div className="bg-gray-50 p-2 rounded-md border border-gray-200">
                      <p className="font-medium text-sm sm:text-base">
                        Mesas seleccionadas:
                        {selectedTables.length > 0 ? (
                          <span className="ml-1 text-primary">
                            {selectedTables.sort((a, b) => a - b).join(", ")}
                          </span>
                        ) : (
                          <span className="ml-1 text-gray-500">Ninguna</span>
                        )}
                      </p>
                      {selectedTables.length > 0 && (
                        <p className="text-sm text-gray-600 mt-1">
                          Capacidad total:{" "}
                          <span className="font-medium">
                            {maxPeopleAllowed} personas
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botón para limpiar selección */}
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

      {/* Apartment and People fields side by side on desktop - MOVED TO FOURTH POSITION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="apartmentNumber">Número de Apartamento</Label>
          {isRegularUser ? (
            // For regular users, show a disabled input with their apartment number
            <div className="flex items-center">
              <Input
                id="apartmentNumber"
                value={`Apartamento #${session?.user.apartmentNumber}`}
                disabled
                className="bg-muted"
              />
              <div className="ml-2 text-muted-foreground">
                <LockIcon className="h-4 w-4" />
              </div>
            </div>
          ) : (
            // For admins and IT admins, show the dropdown
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
                    Apartamento #{num}
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
              value={numberOfPeople}
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

      {/* Additional Options - KEPT AT LAST POSITION */}
      <div className="space-y-2">
        <Label>Opciones Adicionales</Label>
        <div className="flex flex-col gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="prepararFuego"
              checked={prepararFuego}
              onCheckedChange={() => setPrepararFuego(!prepararFuego)}
            />
            <Label
              htmlFor="prepararFuego"
              className="font-normal cursor-pointer"
            >
              Preparar fuego para la reserva
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="reservaHorno"
              checked={reservaHorno}
              onCheckedChange={() => setReservaHorno(!reservaHorno)}
            />
            <Label
              htmlFor="reservaHorno"
              className="font-normal cursor-pointer"
            >
              Reserva de horno
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="reservaBrasa"
              checked={reservaBrasa}
              onCheckedChange={() => setReservaBrasa(!reservaBrasa)}
            />
            <Label
              htmlFor="reservaBrasa"
              className="font-normal cursor-pointer"
            >
              Reserva de brasa
            </Label>
          </div>
        </div>
      </div>

      {/* Add cleaning service warning alert just above the buttons */}
      {noCleaningService && (
        <Alert className="bg-amber-50 border-amber-200 mt-4 mb-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Aviso importante:</strong> Para reservas con menos de 5 días
            de antelación no se proporciona servicio de limpieza. Deberá
            encargarse de la limpieza tras su uso.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:space-x-2 pt-4">
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          className="cursor-pointer w-full sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className={`cursor-pointer w-full sm:w-auto active:scale-95 transition-all duration-150 ${
            initialData?._id
              ? "" // Regular styling for update
              : "bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-medium shadow-md hover:shadow-lg" // Enhanced styling for create
          }`}
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
