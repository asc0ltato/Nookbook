"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, Users } from "lucide-react";
import { bookingsApi, roomsApi, usersApi } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Booking, Room } from "@/types/api";
import { UserSearchField } from "@/components/shared/UserSearchField";
import { DateRangePicker } from "@/components/home/DateRangePicker";
import { isBookableUser } from "@/lib/userUtils";
import { normalizeRoomImageUrl } from "@/lib/imageUtils";

const MEAL_OPTIONS = [
  { value: "0", label: "с собственной кухней" },
  { value: "1", label: "завтрак включен" },
  { value: "2", label: "завтрак и ужин включены" },
] as const;

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBooking: Booking | null;
  hotels: any[];
  managerHotel: any;
  refetch: () => void;
  clientUsers?: Array<{
    id: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    isManager?: boolean;
    IsManager?: boolean;
  }>;
}

export function BookingDialog({
  open,
  onOpenChange,
  editingBooking,
  hotels,
  managerHotel,
  refetch,
  clientUsers,
}: BookingDialogProps) {
  const defaultHotelId = managerHotel?.id || (hotels.length > 0 ? hotels[0].id : 0);

  const [bookingFormData, setBookingFormData] = useState({
    userId: 0,
    hotelId: 0,
    roomId: 0,
    checkInDate: "",
    checkOutDate: "",
    guestCount: 1,
    specialRequests: "",
  });
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [checkInPopoverOpen, setCheckInPopoverOpen] = useState(false);
  const [checkOutPopoverOpen, setCheckOutPopoverOpen] = useState(false);
  const [guestsPopoverOpen, setGuestsPopoverOpen] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<"checkin" | "checkout">("checkin");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [childrenAges, setChildrenAges] = useState<(number | null)[]>([]);
  const [pets, setPets] = useState(false);
  const [bookingRoomSearch, setBookingRoomSearch] = useState("");

  const formatAge = (age: number | null): string => {
    if (age === null || age === undefined) return "Выберите";
    if (age === 0) return "до года";
    if (age === 1) return "1 год";
    if (age >= 2 && age <= 4) return `${age} года`;
    return `${age} лет`;
  };

  const ageOptions = Array.from({ length: 18 }, (_, i) => ({
    value: i.toString(),
    label: formatAge(i),
  }));

  const formatGuests = () => {
    const parts = [`${adults} ${adults === 1 ? "взрослый" : "взрослых"}`];
    if (children > 0) {
      parts.push(`${children} ${children === 1 ? "ребенок" : children < 5 ? "ребенка" : "детей"}`);
    }
    if (pets) parts.push("питомец");
    return parts.join(", ");
  };

  useEffect(() => {
    if (childrenAges.length < children) {
      setChildrenAges((prev) => [...prev, ...Array(children - prev.length).fill(null)]);
    } else if (childrenAges.length > children) {
      setChildrenAges((prev) => prev.slice(0, children));
    }
  }, [children]);

  const { data: usersResponse } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => usersApi.getAll(),
    enabled: open && !clientUsers,
  });

  const bookableUsers = useMemo(() => {
    if (clientUsers) return clientUsers;
    const all = Array.isArray(usersResponse?.data) ? usersResponse.data : [];
    return all.filter((u: any) => isBookableUser(u));
  }, [clientUsers, usersResponse]);

  const { data: roomsResponse } = useQuery({
    queryKey: ["booking-dialog-rooms", bookingFormData.hotelId],
    queryFn: () => roomsApi.getByHotel(bookingFormData.hotelId),
    enabled: open && bookingFormData.hotelId > 0,
  });

  const roomsMap = useMemo(() => {
    const map = new Map<number, Room[]>();
    if (bookingFormData.hotelId > 0) {
      const rooms = Array.isArray(roomsResponse?.data) ? (roomsResponse.data as Room[]) : [];
      map.set(bookingFormData.hotelId, rooms);
    }
    return map;
  }, [bookingFormData.hotelId, roomsResponse]);

  const bookingCheckInStr = checkIn ? format(checkIn, "yyyy-MM-dd") : "";
  const bookingCheckOutStr = checkOut ? format(checkOut, "yyyy-MM-dd") : "";
  const bookingGuests = adults + children;

  const { data: availableRoomsResponse } = useQuery({
    queryKey: [
      "manager-available-rooms",
      bookingFormData.hotelId,
      bookingCheckInStr,
      bookingCheckOutStr,
      bookingGuests,
    ],
    queryFn: () =>
      roomsApi.getAvailable(
        bookingFormData.hotelId,
        bookingCheckInStr,
        bookingCheckOutStr,
        bookingGuests > 0 ? bookingGuests : undefined,
      ),
    enabled: open && bookingFormData.hotelId > 0 && !!bookingCheckInStr && !!bookingCheckOutStr,
  });

  const availableRoomsForBooking: Room[] = Array.isArray(availableRoomsResponse?.data)
    ? (availableRoomsResponse?.data as Room[])
    : [];
  const baseBookingRooms =
    availableRoomsForBooking.length > 0
      ? availableRoomsForBooking
      : roomsMap.get(bookingFormData.hotelId) || [];

  const filteredBookingRooms = baseBookingRooms.filter((room: Room) => {
    const maxGuests = room.maxGuests ?? (room as { capacity?: number }).capacity ?? 0;
    if (bookingGuests > 0 && maxGuests > 0 && maxGuests < bookingGuests) return false;
    if (!bookingRoomSearch.trim()) return true;
    const search = bookingRoomSearch.trim().toLowerCase();
    const roomNumber = (room.roomNumber || "").toLowerCase();
    const roomType = (room.roomType || room.type || "").toLowerCase();
    const roomName = (room.name || "").toLowerCase();
    return roomNumber.includes(search) || roomType.includes(search) || roomName.includes(search);
  });

  const resetBookingForm = () => {
    setBookingFormData({
      userId: 0,
      hotelId: defaultHotelId,
      roomId: 0,
      checkInDate: "",
      checkOutDate: "",
      guestCount: 1,
      specialRequests: "",
    });
    setCheckIn(undefined);
    setCheckOut(undefined);
    setAdults(1);
    setChildren(0);
    setChildrenAges([]);
    setPets(false);
    setBookingRoomSearch("");
  };

  const createBookingMutation = useMutation({
    mutationFn: (bookingData: any) => bookingsApi.create(bookingData),
    onSuccess: () => {
      toast.success("Бронирование создано");
      onOpenChange(false);
      resetBookingForm();
      refetch();
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "Ошибка при создании";
      toast.error(errorMessage);
    },
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ bookingId, bookingData }: { bookingId: number; bookingData: any }) =>
      bookingsApi.update(bookingId, bookingData),
    onSuccess: () => {
      toast.success("Бронирование обновлено");
      onOpenChange(false);
      resetBookingForm();
      refetch();
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.errors?.[0] ||
        error?.message ||
        "Ошибка при обновлении";
      toast.error(errorMessage);
      refetch();
    },
  });

  useEffect(() => {
    if (!open) return;
    if (editingBooking) {
      setBookingFormData({
        userId: editingBooking.userId,
        hotelId: editingBooking.hotelId,
        roomId: editingBooking.roomId,
        checkInDate: new Date(editingBooking.checkInDate).toISOString().split("T")[0],
        checkOutDate: new Date(editingBooking.checkOutDate).toISOString().split("T")[0],
        guestCount: editingBooking.guestCount,
        specialRequests: editingBooking.specialRequests || "",
      });
      setCheckIn(new Date(editingBooking.checkInDate));
      setCheckOut(new Date(editingBooking.checkOutDate));
      setAdults(editingBooking.guestCount);
      setChildren(0);
      setChildrenAges([]);
      setPets(false);
      setBookingRoomSearch("");
      return;
    }

    resetBookingForm();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    setCheckIn(today);
    setCheckOut(tomorrow);
    setBookingFormData((prev) => ({
      ...prev,
      hotelId: defaultHotelId,
      checkInDate: format(today, "yyyy-MM-dd"),
      checkOutDate: format(tomorrow, "yyyy-MM-dd"),
    }));
  }, [open, editingBooking, defaultHotelId]);

  const handleSubmit = () => {
    if (!editingBooking && (!bookingFormData.userId || bookingFormData.userId <= 0)) {
      toast.error("Выберите пользователя");
      return;
    }
    if (!bookingFormData.roomId || bookingFormData.roomId <= 0) {
      toast.error("Выберите номер");
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error("Выберите даты заезда и выезда");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkIn < today) {
      toast.error("Дата заезда не может быть в прошлом");
      return;
    }
    if (checkOut <= checkIn) {
      toast.error("Дата выезда должна быть позже даты заезда");
      return;
    }

    const totalGuests = adults + children;
    if (children > 0 && childrenAges.some((age) => age === null || age === undefined)) {
      toast.error("Укажите возраст всех детей");
      return;
    }

    const selectedRoom = roomsMap.get(bookingFormData.hotelId)?.find((r: Room) => r.id === bookingFormData.roomId);
    if (selectedRoom && totalGuests > selectedRoom.maxGuests) {
      toast.error(`Количество гостей не может превышать ${selectedRoom.maxGuests} (максимум для выбранного номера)`);
      return;
    }

    const checkInDate = format(checkIn, "yyyy-MM-dd");
    const checkOutDate = format(checkOut, "yyyy-MM-dd");

    if (editingBooking) {
      updateBookingMutation.mutate({
        bookingId: editingBooking.id,
        bookingData: {
          roomId: bookingFormData.roomId,
          checkInDate,
          checkOutDate,
          guestCount: totalGuests,
          specialRequests: bookingFormData.specialRequests || null,
        },
      });
    } else {
      createBookingMutation.mutate({
        userId: bookingFormData.userId,
        hotelId: bookingFormData.hotelId,
        roomId: bookingFormData.roomId,
        checkInDate,
        checkOutDate,
        guestCount: totalGuests,
        specialRequests: bookingFormData.specialRequests || null,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-playfair text-3xl font-semibold">
            {editingBooking ? "Редактировать бронирование" : "Добавить бронирование"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!editingBooking && (
            <UserSearchField
              users={bookableUsers}
              value={bookingFormData.userId}
              onChange={(userId) => setBookingFormData({ ...bookingFormData, userId })}
              label="Пользователь *"
              placeholder="Имя, фамилия или email"
              filterRoles={["user"]}
            />
          )}

          <div>
            <Label htmlFor="bookingRoomId">Номер *</Label>
            {!managerHotel?.id && !bookingFormData.hotelId ? (
              <p className="text-sm text-muted-foreground mt-1">Нет привязанного отеля</p>
            ) : (
              <div className="mt-1 space-y-2">
                <Input
                  placeholder="Поиск по номеру, названию или типу..."
                  value={bookingRoomSearch}
                  onChange={(e) => setBookingRoomSearch(e.target.value)}
                />
                <div className="max-h-64 overflow-y-auto border rounded-md p-2">
                  {filteredBookingRooms.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Номера не найдены</p>
                  ) : (
                    filteredBookingRooms.map((room: Room) => (
                      <div
                        key={room.id}
                        onClick={() => setBookingFormData({ ...bookingFormData, roomId: room.id })}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          bookingFormData.roomId === room.id
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-stretch gap-3 min-h-[100px]">
                          {(() => {
                            const realImages = (room.images || []).filter(
                              (img) => img && !img.includes("block.jpg"),
                            );
                            const first =
                              realImages[0] ||
                              (room.imageUrl && !room.imageUrl.includes("block.jpg") ? room.imageUrl : null);
                            if (!first) return null;
                            return (
                              <div className="relative w-24 min-h-full rounded-lg overflow-hidden bg-muted flex-shrink-0 self-stretch">
                                <Image
                                  src={normalizeRoomImageUrl(first)}
                                  alt={room.roomType || "Номер"}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              </div>
                            );
                          })()}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className="font-semibold mb-1">
                              {room.roomNumber || `Номер ${room.id}`}
                            </div>
                            <div className="text-xs text-muted-foreground mb-1">
                              Тип: {room.roomType || room.type || "Не указан"}
                            </div>
                            {(room.mealLabel || room.mealType != null) && (
                              <div className="text-xs text-muted-foreground mb-1">
                                Питание:{" "}
                                {room.mealLabel ||
                                  MEAL_OPTIONS.find((o) => o.value === String(room.mealType))?.label ||
                                  "—"}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              До {room.maxGuests} гостей · {(room.price || room.pricePerNight || 0).toLocaleString()} BYN/сутки
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Заезд *
              </Label>
              <Popover open={checkInPopoverOpen} onOpenChange={setCheckInPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-medium"
                    onClick={() => {
                      setDatePickerMode("checkin");
                      setCheckOutPopoverOpen(false);
                    }}
                  >
                    {checkIn ? format(checkIn, "d MMM yyyy", { locale: ru }) : "Когда"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border-border max-h-[80vh] overflow-hidden" align="start">
                  <DateRangePicker
                    checkIn={checkIn}
                    checkOut={checkOut}
                    onCheckInChange={(date) => {
                      setCheckIn(date);
                      if (date) {
                        const dateStr = format(date, "yyyy-MM-dd");
                        setBookingFormData({ ...bookingFormData, checkInDate: dateStr });
                      }
                    }}
                    onCheckOutChange={(date) => {
                      setCheckOut(date);
                      if (date) {
                        const dateStr = format(date, "yyyy-MM-dd");
                        setBookingFormData({ ...bookingFormData, checkOutDate: dateStr });
                      }
                    }}
                    mode={datePickerMode}
                    onModeChange={(mode) => {
                      setDatePickerMode(mode);
                      if (mode === "checkout") {
                        setCheckInPopoverOpen(false);
                        setCheckOutPopoverOpen(true);
                      }
                    }}
                    onClose={() => setCheckInPopoverOpen(false)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Выезд *
              </Label>
              <Popover open={checkOutPopoverOpen} onOpenChange={setCheckOutPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-medium"
                    onClick={() => {
                      setDatePickerMode("checkout");
                      setCheckInPopoverOpen(false);
                    }}
                  >
                    {checkOut ? format(checkOut, "d MMM yyyy", { locale: ru }) : "Когда"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border-border max-h-[80vh] overflow-hidden" align="start">
                  <DateRangePicker
                    checkIn={checkIn}
                    checkOut={checkOut}
                    onCheckInChange={(date) => {
                      setCheckIn(date);
                      if (date) {
                        const dateStr = format(date, "yyyy-MM-dd");
                        setBookingFormData({ ...bookingFormData, checkInDate: dateStr });
                      }
                    }}
                    onCheckOutChange={(date) => {
                      setCheckOut(date);
                      if (date) {
                        const dateStr = format(date, "yyyy-MM-dd");
                        setBookingFormData({ ...bookingFormData, checkOutDate: dateStr });
                      }
                    }}
                    mode={datePickerMode}
                    onModeChange={(mode) => {
                      setDatePickerMode(mode);
                      if (mode === "checkin") {
                        setCheckOutPopoverOpen(false);
                        setCheckInPopoverOpen(true);
                      }
                    }}
                    onClose={() => setCheckOutPopoverOpen(false)}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Гости *
            </Label>
            <Popover open={guestsPopoverOpen} onOpenChange={setGuestsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-medium truncate"
                  onClick={() => setGuestsPopoverOpen(true)}
                >
                  <span className="truncate">{formatGuests()}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-popover border-border z-[80]" align="start">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Взрослые</div>
                      <div className="text-sm text-muted-foreground">От 18 лет</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        className="h-8 w-8"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{adults}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setAdults(Math.min(20, adults + 1))}
                        disabled={adults >= 20}
                        className="h-8 w-8"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Дети</div>
                      <div className="text-sm text-muted-foreground">До 17 лет</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newChildren = Math.max(0, children - 1);
                          setChildren(newChildren);
                          setChildrenAges((prev) => prev.slice(0, newChildren));
                        }}
                        disabled={children === 0}
                        className="h-8 w-8 text-primary"
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{children}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (children < 10) {
                            setChildren((prev) => prev + 1);
                            setChildrenAges((prev) => [...prev, null]);
                          }
                        }}
                        disabled={children >= 10}
                        className="h-8 w-8"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  {children > 0 && (
                    <div className="space-y-3">
                      {childrenAges.map((age, index) => (
                        <div key={index} className="space-y-1.5">
                          <label className="text-sm font-medium text-foreground">Возраст ребенка {index + 1}</label>
                          <Select
                            value={age !== null && age !== undefined ? age.toString() : ""}
                            onValueChange={(value) => {
                              const newAges = [...childrenAges];
                              newAges[index] = value === "" ? null : parseInt(value);
                              setChildrenAges(newAges);
                            }}
                          >
                            <SelectTrigger className="w-full h-10 bg-background text-foreground">
                              <SelectValue>
                                {age !== null && age !== undefined
                                  ? ageOptions.find((opt) => opt.value === age.toString())?.label || formatAge(age)
                                  : "Выберите"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="z-[100] bg-popover text-popover-foreground">
                              {ageOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="font-medium">С питомцами</div>
                    <button
                      type="button"
                      onClick={() => setPets(!pets)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        pets ? "bg-yellow-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          pets ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialRequests">Особые пожелания</Label>
            <Textarea
              id="specialRequests"
              value={bookingFormData.specialRequests}
              onChange={(e) => setBookingFormData({ ...bookingFormData, specialRequests: e.target.value })}
              rows={3}
              placeholder="Ранний заезд, поздний выезд и т.д."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                (editingBooking ? updateBookingMutation.isPending : createBookingMutation.isPending) ||
                !checkIn ||
                !checkOut ||
                (children > 0 && childrenAges.some((age) => age === null || age === undefined))
              }
            >
              {editingBooking
                ? updateBookingMutation.isPending
                  ? "Обновление..."
                  : "Обновить бронирование"
                : createBookingMutation.isPending
                  ? "Создание..."
                  : "Создать бронирование"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
