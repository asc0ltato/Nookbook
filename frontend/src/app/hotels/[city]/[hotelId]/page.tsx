"use client";

import { useState, useEffect, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Star, MapPin, Wifi, Car, UtensilsCrossed, Bed, Users, 
  Calendar, Heart, Share2, Check, X, Coffee,
  Droplet, Tv, Wind, Lock, Sparkles, Trash2, MessageSquare, AlertTriangle
} from "lucide-react";
import { hotelsApi, roomsApi, bookingsApi, reviewsApi, citiesApi, usersApi, recommendationsApi } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { getHotelCarouselImages, normalizeHotelImageUrl } from "@/lib/imageUtils";
import { calculateDistance } from "@/lib/distanceUtils";
import { useAuth } from "@/contexts/AuthContext";
import { DateRangePicker } from "@/components/home/DateRangePicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoomTypeCard } from "@/components/hotels/RoomTypeCard";
import { PhoneInput } from "@/components/ui/phone-input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImageCarousel } from "@/components/shared/ImageCarousel";
import { ReviewComplaintDialog } from "@/components/reviews/ReviewComplaintDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { HotelDetail as ApiHotelDetail, Room, Review, ReviewComment } from "@/types/api";
import { UserRole, getAvatarInitials } from "@/lib/auth";
import { UserAvatar } from "@/components/shared/UserAvatar";

const citySlugToId: { [key: string]: number } = {
  'minsk': 1,
  'brest': 2,
  'vitebsk': 3,
  'gomel': 4,
  'grodno': 5,
  'mogilev': 6,
};

export default function HotelDetailPage({ params }: { params: Promise<{ city: string; hotelId: string }> }) {
  const { city, hotelId } = use(params);
  const { isAuthenticated, user, refreshUser, isAdmin: checkIsAdmin } = useAuth();
  const queryClient = useQueryClient();
  
  const loadSearchParams = () => {
    if (typeof window === 'undefined') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return {
        checkIn: today,
        checkOut: tomorrow,
        adults: 2,
        children: 0,
        childrenAges: [],
        pets: false,
      };
    }

    try {
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      if (history.length > 0) {
        const lastSearch = history[0];
        return {
          checkIn: lastSearch.checkIn ? new Date(lastSearch.checkIn) : undefined,
          checkOut: lastSearch.checkOut ? new Date(lastSearch.checkOut) : undefined,
          adults: lastSearch.adults || 2,
          children: lastSearch.children || 0,
          childrenAges: lastSearch.childrenAges ? lastSearch.childrenAges.map((age: number) => age === 0 ? null : age) : [],
          pets: lastSearch.pets || false,
        };
      }
    } catch (error) {
      console.error('Error loading search params:', error);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      checkIn: today,
      checkOut: tomorrow,
      adults: 2,
      children: 0,
      childrenAges: [],
      pets: false,
    };
  };

  const initialSearchParams = loadSearchParams() || {
    checkIn: undefined,
    checkOut: undefined,
    adults: 2,
    children: 0,
    childrenAges: [],
    pets: false,
  };

  const [checkIn, setCheckIn] = useState<Date | undefined>(initialSearchParams.checkIn);
  const [checkOut, setCheckOut] = useState<Date | undefined>(initialSearchParams.checkOut);
  const [datePickerMode, setDatePickerMode] = useState<"checkin" | "checkout">("checkin");
  const [checkInPopoverOpen, setCheckInPopoverOpen] = useState(false);
  const [checkOutPopoverOpen, setCheckOutPopoverOpen] = useState(false);
  const [guestsPopoverOpen, setGuestsPopoverOpen] = useState(false);

  const [adults, setAdults] = useState(initialSearchParams.adults);
  const [children, setChildren] = useState(initialSearchParams.children);
  const initialChildrenAges = initialSearchParams.childrenAges.length === initialSearchParams.children
    ? initialSearchParams.childrenAges
    : Array(initialSearchParams.children).fill(null);
  const [childrenAges, setChildrenAges] = useState<(number | null)[]>(initialChildrenAges);
  const [pets, setPets] = useState(initialSearchParams.pets);

  useEffect(() => {
    if (childrenAges.length < children) {
      setChildrenAges(prev => [...prev, ...Array(children - prev.length).fill(null)]);
    } else if (childrenAges.length > children) {
      setChildrenAges(prev => prev.slice(0, children));
    }
  }, [children]);
  
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedRoomPrice, setSelectedRoomPrice] = useState<number | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [specialRequests, setSpecialRequests] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);
  const [deleteReviewId, setDeleteReviewId] = useState<number | null>(null);
  const [complaintReviewId, setComplaintReviewId] = useState<number | null>(null);
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [managerReplyDialogText, setManagerReplyDialogText] = useState<string | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyReviewId, setReplyReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const isRealPhone = (phone?: string | null) => {
    if (!phone) return false;
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 7;
  };
  
  const formatAge = (age: number | null): string => {
    if (age === null || age === undefined) return "Выберите";
    if (age === 0) return "до года";
    if (age === 1) return "1 год";
    if (age >= 2 && age <= 4) return `${age} года`;
    return `${age} лет`;
  };

  const ageOptions = Array.from({ length: 18 }, (_, i) => ({
    value: i.toString(),
    label: formatAge(i)
  }));
  
  const formatGuests = () => {
    let parts = [];
    parts.push(`${adults} ${adults === 1 ? 'взрослый' : adults < 5 ? 'взрослых' : 'взрослых'}`);
    if (children > 0) {
      parts.push(`${children} ${children === 1 ? 'ребенок' : children < 5 ? 'ребенка' : 'детей'}`);
    }
    if (pets) {
      parts.push('питомец');
    }
    return parts.join(', ');
  };
  
  const getMealLabel = (mealType: number) => {
    if (mealType === 1) return "завтрак включен";
    if (mealType === 2) return "завтрак и ужин включены";
    return "с собственной кухней";
  };

  const handleRoomSelect = (roomTypeId: number, roomId: number, price: number) => {
    if (!canBook) return;
    setSelectedRoomTypeId(roomTypeId);
    setSelectedRoomId(roomId);
    setSelectedRoomPrice(price);
    setIsBooking(true);
  };

  const handleMealFilterClick = (mealType: number | null) => {
    setMealFilter(mealType);
    if (mealType === null) {
      setSelectedRoomTypeId(null);
      setSelectedRoomId(null);
      setSelectedRoomPrice(null);
      setIsBooking(false);
      return;
    }
    for (const rt of roomTypeGroups) {
      const option = (rt.mealOptions || []).find(
        (m: any) => m.mealType === mealType && m.availableCount > 0
      );
      if (option) {
        handleRoomSelect(rt.roomTypeId, option.roomId, option.price);
        return;
      }
    }
  };

  const cityMapping: { [key: string]: string } = {
    minsk: "Минск",
    brest: "Брест",
    vitebsk: "Витебск",
    gomel: "Гомель",
    grodno: "Гродно",
    mogilev: "Могилев"
  };
  
  let citySlug = city;
  let cityName = city;
  
  if (cityMapping[city]) {
    cityName = cityMapping[city];
    citySlug = city;
  } else {
    try {
      const decoded = decodeURIComponent(city);
      if (cityMapping[decoded]) {
        cityName = cityMapping[decoded];
        citySlug = decoded;
      } else {
        cityName = decoded.charAt(0).toUpperCase() + decoded.slice(1);
        citySlug = decoded.toLowerCase();
      }
    } catch {
      cityName = city.charAt(0).toUpperCase() + city.slice(1);
      citySlug = city;
    }
  }

  const cityId = citySlugToId[citySlug.toLowerCase()] || 0;

  const { data: cityResponse } = useQuery({
    queryKey: ['city', cityId],
    queryFn: () => citiesApi.getById(cityId),
    enabled: cityId > 0,
  });

  const { data: hotelResponse, isLoading: hotelLoading, refetch: refetchHotel } = useQuery({
    queryKey: ['hotel', hotelId],
    queryFn: () => hotelsApi.getById(parseInt(hotelId)),
    enabled: !!hotelId,
  });

  const hotel = hotelResponse?.data as ApiHotelDetail | null;
  
  const cityLatitude = (cityResponse?.data as any)?.latitude;
  const cityLongitude = (cityResponse?.data as any)?.longitude;

  const authUserId =
    user?.id == null ? 0 : typeof user.id === "string" ? parseInt(user.id, 10) : Number(user.id);
  const authUserIdOk = Number.isFinite(authUserId) && authUserId > 0;
  const isManager = user?.role === UserRole.Manager;
  const isAdmin = checkIsAdmin();
  const isClient = user?.role === UserRole.User;
  const isElevatedUser = isManager || isAdmin;
  const canBook = isAuthenticated && isClient;

  const { data: favoritesResponse } = useQuery({
    queryKey: ["favorites", authUserId],
    queryFn: () => usersApi.getFavorites(authUserId),
    enabled: isAuthenticated && authUserIdOk && !!hotel && !isElevatedUser,
  });

  const favorites = (favoritesResponse?.data as any[] | undefined) || [];
  const favId = (f: any) => Number(f?.id ?? f?.Id ?? 0);
  const hotelIdNum = hotel ? Number(hotel.id) : 0;
  const isFavorite = hotel ? favorites.some((f: any) => favId(f) === hotelIdNum) : false;

  const userPhoneValid = isRealPhone(user?.phoneNumber);
  const shouldRequestBookingPhone = !userPhoneValid;

  useEffect(() => {
    setSelectedRoomTypeId(null);
    setIsBooking(false);
    setSpecialRequests("");
    if (userPhoneValid) {
      setBookingPhone(user!.phoneNumber!.trim());
      setPhoneValid(true);
      return;
    }
    setBookingPhone("");
    setPhoneValid(false);
  }, [hotelId, user?.phoneNumber, userPhoneValid]);

  const favoriteMutation = useMutation({
    mutationFn: (action: "add" | "remove") => {
      if (!authUserIdOk || !hotel) throw new Error("Пользователь или отель не найден");
      const hid = typeof hotel.id === "string" ? parseInt(hotel.id, 10) : Number(hotel.id);

      if (action === "add") return usersApi.addFavorite(authUserId, hid);
      return usersApi.removeFavorite(authUserId, hid);
    },
    onMutate: async (action: "add" | "remove") => {
      if (!hotel) return undefined;
      const queryKey = ["favorites", authUserId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<any>(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        const prevList: any[] = Array.isArray(old?.data) ? old.data : [];
        const hid = typeof hotel.id === "string" ? parseInt(hotel.id, 10) : Number(hotel.id);
        if (action === "add") {
          if (prevList.some((f: any) => Number(f?.id ?? f?.Id ?? 0) === hid)) {
            return old;
          }
          return {
            ...(old || {}),
            data: [...prevList, { id: hid, name: hotel.name }],
          };
        }
        return {
          ...(old || {}),
          data: prevList.filter(
            (f: any) => Number(f?.id ?? f?.Id ?? 0) !== hid
          ),
        };
      });

      return { previous, queryKey };
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables === "add"
          ? "Отель добавлен в избранное"
          : "Отель удален из избранного"
      );
    },
    onError: (error: any, _variables, context: any) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
      const status = error?.status ?? error?.response?.status;
      const msg = String(error?.response?.data?.message ?? error?.message ?? "");
      if (status === 401 || msg.toLowerCase().includes("не авторизован")) {
        toast.error("Войдите в аккаунт, чтобы работать с избранным");
        return;
      }
      if (status === 403) {
        toast.error("Нет доступа к избранному");
        return;
      }
      if (
        msg.toLowerCase().includes("уже в избранном") ||
        msg.toLowerCase().includes("уже удалено") ||
        msg.toLowerCase().includes("already")
      ) {
        return;
      }
      toast.error("Ошибка при обновлении избранного");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const handleFavoriteClick = () => {
    favoriteMutation.mutate(isFavorite ? 'remove' : 'add');
  };

  const formatDateForApi = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const hasBookingDates = !!checkIn && !!checkOut;
  const totalGuests = adults + children;

  const { data: roomsResponse, isLoading: roomsLoading } = useQuery({
    queryKey: [
      "room-types",
      hotelId,
      hasBookingDates && checkIn ? formatDateForApi(checkIn) : null,
      hasBookingDates && checkOut ? formatDateForApi(checkOut) : null,
      hasBookingDates && totalGuests > 0 ? totalGuests : null,
    ],
    queryFn: () => {
      return roomsApi.getRoomTypeGroups(
        parseInt(hotelId),
        hasBookingDates && checkIn ? formatDateForApi(checkIn) : undefined,
        hasBookingDates && checkOut ? formatDateForApi(checkOut) : undefined,
        hasBookingDates && totalGuests > 0 ? totalGuests : undefined
      );
    },
    enabled: !!hotelId,
  });

  const roomTypeGroups: any[] = (Array.isArray(roomsResponse?.data) ? roomsResponse.data : []);

  // Meal filter state
  const [mealFilter, setMealFilter] = useState<number | null>(null); // null=all, 0=SelfCatering, 1=Breakfast, 2=HalfBoard

  const visibleRoomTypeGroups = mealFilter === null
    ? roomTypeGroups
    : roomTypeGroups.filter((rt: any) =>
        (rt.mealOptions || []).some((m: any) => m.mealType === mealFilter)
      );

  const availableMealTypes = [
    ...new Set(
      roomTypeGroups.flatMap((rt: any) =>
        (rt.mealOptions || []).map((m: any) => m.mealType as number)
      )
    ),
  ].sort();

  const { data: reviewsResponse, refetch: refetchReviews } = useQuery({
    queryKey: ['reviews', hotelId],
    queryFn: () => reviewsApi.getByHotel(parseInt(hotelId)),
    enabled: !!hotelId,
  });

  const reviews: Review[] = (Array.isArray(reviewsResponse?.data) ? reviewsResponse.data : []);
  const computedRating = reviews.length > 0
    ? reviews.reduce((acc, review) => acc + Number(review.rating || 0), 0) / reviews.length
    : Number(hotel?.rating || 0);
  const computedReviewCount = reviews.length > 0 ? reviews.length : Number(hotel?.reviewCount || 0);
  const topPositiveTags = Object.entries(
    reviews
      .flatMap((review) => review.positiveTags || [])
      .reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tag]) => tag);
  const topNegativeTags = Object.entries(
    reviews
      .flatMap((review) => review.negativeTags || [])
      .reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tag]) => tag);

  const { data: similarHotelsResponse } = useQuery({
    queryKey: ['similar-hotels', hotelId],
    queryFn: () => recommendationsApi.getSimilarHotels(parseInt(hotelId), 6),
    enabled: !!hotelId,
  });

  const similarHotels: any[] = (Array.isArray(similarHotelsResponse?.data) ? similarHotelsResponse.data : []);

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: number) => reviewsApi.delete(reviewId),
    onSuccess: () => {
      toast.success("Отзыв удален");
      refetchReviews();
      refetchHotel();
      queryClient.invalidateQueries({ queryKey: ['hotels', city] });
      queryClient.invalidateQueries({ queryKey: ['city', city, 'hotels'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || "Ошибка при удалении отзыва";
      toast.error(msg);
    },
  });

  const bookingMutation = useMutation({
    mutationFn: (bookingData: any) => bookingsApi.create(bookingData),
    onSuccess: () => {
      toast.success("Бронирование успешно создано! Ожидает подтверждения менеджера.");
      setIsBooking(false);
      setSelectedRoomTypeId(null);
      setSelectedRoomId(null);
      setSelectedRoomPrice(null);
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['room-types', hotelId] });
      refreshUser().catch(() => {
        /* refreshing the profile is best-effort and never blocks booking */
      });
    },
    onError: (error: any) => {
      console.error('Booking error:', error);
      const status = error?.status ?? error?.response?.status;
      const rawMessage = String(
        error?.response?.data?.message ??
          error?.response?.data?.Message ??
          error?.response?.data?.errors?.[0] ??
          error?.message ??
          ""
      );
      const looksLikeAuthError =
        status === 401 ||
        rawMessage.toLowerCase().includes("неверный токен") ||
        rawMessage.toLowerCase().includes("invalid token") ||
        rawMessage.toLowerCase().includes("не авторизован");

      if (looksLikeAuthError) {
        toast.error("Сессия истекла. Войдите снова, чтобы забронировать.");
        return;
      }

      toast.error(rawMessage || "Ошибка при создании бронирования");
    },
  });

  const normalizePhoneForSave = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits ? `+${digits}` : "";
  };

  const handleBooking = async () => {
    if (!canBook) {
      toast.error("Менеджеры и администраторы не могут бронировать отели");
      return;
    }
    if (!selectedRoomId || !checkIn || !checkOut) {
      toast.error("Заполните все поля");
      return;
    }
    if (children > 0 && childrenAges.some(age => age === null || age === undefined)) {
      toast.error("Укажите возраст всех детей");
      return;
    }

    if (!user) {
      toast.error("Войдите в систему для бронирования");
      return;
    }

    if (shouldRequestBookingPhone && !bookingPhone.trim()) {
      toast.error("Укажите номер телефона");
      return;
    }
    if (shouldRequestBookingPhone && !phoneValid) {
      toast.error("Введите корректный номер телефона");
      return;
    }

    const totalGuests = adults + children;

    const checkInDate = new Date(checkIn);
    checkInDate.setHours(0, 0, 0, 0);
    const checkOutDate = new Date(checkOut);
    checkOutDate.setHours(0, 0, 0, 0);

    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const phoneToSave = normalizePhoneForSave(bookingPhone);
    const effectivePhone = userPhoneValid
      ? user!.phoneNumber!.trim()
      : shouldRequestBookingPhone && isRealPhone(phoneToSave)
        ? phoneToSave
        : "";

    bookingMutation.mutate({
      userId: user.id,
      hotelId: parseInt(hotelId),
      roomId: selectedRoomId,
      checkInDate: formatDate(checkInDate),
      checkOutDate: formatDate(checkOutDate),
      guestCount: totalGuests,
      specialRequests: specialRequests.trim() || null,
      phoneNumber: isRealPhone(effectivePhone) ? effectivePhone : null,
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 9) return "bg-green-500";
    if (rating >= 8) return "bg-blue-500";
    if (rating >= 7) return "bg-yellow-500";
    return "bg-orange-500";
  };
  const safeRating = Number.isFinite(computedRating) ? computedRating : 0;

  const amenityIcons: { [key: string]: any } = {
    "Wi-Fi": Wifi,
    "Парковка": Car,
    "Ресторан": UtensilsCrossed,
    "Бар": UtensilsCrossed,
    "Бассейн": Droplet,
    "Фитнес-центр": Users,
    "Спа": Sparkles,
    "Трансфер": Car,
    "Прачечная": Droplet,
  };
  const cleanDescription = (description: string, amenities: string[] = []) => {
    let cleaned = description;
    amenities.forEach(amenity => {
      const patterns = [
        new RegExp(`${amenity}[,\\.]?\\s*`, 'gi'),
        new RegExp(`,\\s*${amenity}[,\\.]?`, 'gi'),
      ];
      patterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
      });
    });
    cleaned = cleaned.replace(/,\s*,/g, ',').replace(/^\s*,\s*/, '').replace(/\s*,\s*$/, '').trim();
    return cleaned;
  };

  const canDeleteOwnReview = (review: Review) => {
    if (!isAuthenticated || !isClient || !authUserIdOk) return false;
    if (review.userId !== authUserId) return false;
    const createdAt = new Date(review.createdAt).getTime();
    if (!Number.isFinite(createdAt)) return false;
    return Date.now() - createdAt <= 24 * 60 * 60 * 1000;
  };

  const canDeleteOwnComment = (comment: ReviewComment) => {
    if (!isAuthenticated || !isClient || !authUserIdOk) return false;
    if (comment.userId !== authUserId) return false;
    const createdAt = new Date(comment.createdAt).getTime();
    if (!Number.isFinite(createdAt)) return false;
    return Date.now() - createdAt <= 24 * 60 * 60 * 1000;
  };

  const canDeleteOwnManagerComment = (comment: ReviewComment) => {
    if (!isAuthenticated || !isManager || !authUserIdOk) return false;
    if (comment.userId !== authUserId) return false;
    const createdAt = new Date(comment.createdAt).getTime();
    if (!Number.isFinite(createdAt)) return false;
    return Date.now() - createdAt <= 24 * 60 * 60 * 1000;
  };

  const canDeleteComment = (comment: ReviewComment) => {
    if (isAuthenticated && isAdmin) return true;
    return canDeleteOwnComment(comment) || canDeleteOwnManagerComment(comment);
  };

  const isManagerComment = (comment: ReviewComment) => comment.roleId === 3 || comment.roleId === 4;

  const getManagerDisplayName = (comment: ReviewComment) => {
    const fromParts = [comment.firstName, comment.lastName].filter(Boolean).join(" ").trim();
    return fromParts || comment.userName || "Менеджер";
  };

  const renderReviewComments = (comments: ReviewComment[] = [], depth = 0) => {
    return comments.map((comment) => {
      const manager = isManagerComment(comment);
      const canDelete = canDeleteComment(comment);

      const inner = (
        <div
          className={
            manager
              ? "relative rounded-lg bg-muted/40 border border-border/60 p-4"
              : "rounded-lg bg-primary/5 border border-primary/15 p-3"
          }
        >
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger
                type="button"
                className="absolute top-2 right-2 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-muted/50"
                aria-label="Удалить комментарий"
              >
                <Trash2 className="w-4 h-4" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить комментарий?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Комментарий будет удален без возможности восстановления.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => {
                      reviewsApi.deleteComment(comment.id)
                        .then(() => {
                          toast.success("Комментарий удален");
                          refetchReviews();
                        })
                        .catch((error: any) => {
                          const msg = error?.response?.data?.message || error?.message || "Ошибка при удалении комментария";
                          toast.error(msg);
                        });
                    }}
                  >
                    Удалить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <div className={`text-sm font-semibold mb-2 pr-8 ${manager ? "text-yellow-400" : "text-primary"}`}>
            {manager ? `Менеджер ${getManagerDisplayName(comment)}` : (comment.userName || "Пользователь")}
            <span className="text-muted-foreground font-normal ml-2">
              • {format(new Date(comment.createdAt), "d MMMM yyyy", { locale: ru })}
            </span>
          </div>
          <p className="text-sm text-foreground break-words overflow-wrap-anywhere whitespace-pre-wrap">
            {comment.comment}
          </p>
        </div>
      );

      return (
        <div
          key={comment.id}
          className={manager ? "mt-4 ml-1 border-l-4 border-yellow-400/80 pl-4" : "mt-3 border-l border-primary/25 pl-4"}
          style={{ marginLeft: manager ? 0 : Math.min(depth, 4) * 16 }}
        >
          {inner}
          {comment.replies && comment.replies.length > 0 && renderReviewComments(comment.replies, depth + 1)}
        </div>
      );
    });
  };

  if (hotelLoading) {
    return (
      <div className="min-h-screen page-backdrop">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Загрузка...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen page-backdrop">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground mb-4">Отель не найден</p>
              <Link href="/hotels">
                <Button>Вернуться к поиску</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen page-backdrop">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-6 max-w-7xl">
          {!isElevatedUser && (
            <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
              <Link href="/hotels" className="hover:text-primary transition-colors">Отели</Link>
              <span>→</span>
              <Link href={`/hotels/${citySlug}`} className="hover:text-primary transition-colors">{cityName}</Link>
              <span>→</span>
              <span className="text-foreground">{hotel.name}</span>
            </nav>
          )}

          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-4xl sm:text-5xl font-bold mb-3">
                  {hotel.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: hotel.stars }).map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 flex-shrink-0 text-primary/70" />
                    <span className="font-medium">
                      {typeof hotel.city === 'string' ? hotel.city : cityName}
                    </span>
                    
                    {cityLatitude && cityLongitude && hotel.latitude && hotel.longitude && (
                      (() => {
                        const distance = calculateDistance(
                          cityLatitude,
                          cityLongitude,
                          hotel.latitude,
                          hotel.longitude
                        );
                        if (distance > 0 && distance < 100) {
                          return (
                            <>
                              <span className="text-muted-foreground/50">•</span>
                              <span className="text-muted-foreground/80">
                                {distance.toFixed(1)} км до центра
                              </span>
                            </>
                          );
                        }
                        return null;
                      })()
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`inline-flex items-center gap-1.5 justify-center px-3 py-1 rounded-full text-white text-sm font-semibold ${getRatingColor(safeRating)}`}>
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {safeRating.toFixed(1)}
                  </div>
                  <span className="text-muted-foreground">
                    {(() => {
                      const count = computedReviewCount;
                      if (count === 0) return '0 отзывов';
                      if (count === 1) return '1 отзыв';
                      if (count >= 2 && count <= 4) return `${count} отзыва`;
                      return `${count} отзывов`;
                    })()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {isAuthenticated && !isElevatedUser && (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleFavoriteClick}
                    disabled={favoriteMutation.isPending}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: hotel.name,
                        text: hotel.description,
                        url: window.location.href,
                      }).catch((err) => {
                        console.error('Error sharing:', err);
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Ссылка скопирована в буфер обмена");
                    }
                  }}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="relative w-full h-96 rounded-2xl overflow-hidden mb-8 bg-gray-200">
            <ImageCarousel
              images={getHotelCarouselImages(hotel.images, hotel.imageUrl)}
              alt={hotel.name}
              className="absolute inset-0 h-full w-full"
              sizes="100vw"
              normalize={normalizeHotelImageUrl}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Описание</h2>
                <p className="text-muted-foreground leading-relaxed">{hotel.description}</p>
              </Card>

              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Удобства</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {hotel.amenities.map((amenity) => {
                    const Icon = amenityIcons[amenity] || Check;
                    return (
                      <div key={amenity} className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-4">Номера</h2>
                {availableMealTypes.length > 1 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => handleMealFilterClick(null)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        mealFilter === null
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      Все
                    </button>
                    {availableMealTypes.map((mt) => {
                      const label = getMealLabel(mt);
                      return (
                        <button
                          key={mt}
                          onClick={() => handleMealFilterClick(mt)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                            mealFilter === mt
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border text-muted-foreground hover:border-primary/50'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
                {roomsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : visibleRoomTypeGroups.length === 0 ? (
                  <p className="text-muted-foreground">
                    {hasBookingDates ? "Нет свободных номеров на выбранные даты" : "Номера не найдены"}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {visibleRoomTypeGroups.map((roomType) => (
                      <RoomTypeCard
                        key={roomType.roomTypeId}
                        roomType={roomType}
                        onBook={handleRoomSelect}
                        bookingEnabled={canBook}
                        selected={selectedRoomTypeId === roomType.roomTypeId}
                        selectedRoomId={selectedRoomId}
                        activeMealFilter={mealFilter}
                      />
                    ))}
                  </div>
                )}
              </Card>

              {similarHotels.length > 0 && (
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Рекомендуем для вас</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {similarHotels.map((similarHotel) => (
                      <Link
                        key={similarHotel.id}
                        href={`/hotels/${citySlug}/${similarHotel.id}`}
                        className="group relative h-[240px] rounded-2xl overflow-hidden cursor-pointer bg-black border border-gray-800 hover:border-yellow-500/40 transition-all duration-300 block"
                      >
                        <ImageCarousel
                          images={getHotelCarouselImages(similarHotel.images, similarHotel.image || similarHotel.imageUrl)}
                          alt={similarHotel.name}
                          className="absolute inset-0 h-full w-full"
                          imageClassName="opacity-70 group-hover:opacity-80 transition-opacity duration-500"
                          controlsClassName="top-1/2"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          normalize={normalizeHotelImageUrl}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                        <div className="relative h-full p-5 flex flex-col justify-between">
                          <div>
                            <div className="inline-flex bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-bold mb-3">
                              {similarHotel.stars || 0} ★
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1 line-clamp-2">{similarHotel.name}</h3>
                            <p className="text-sm text-gray-300 line-clamp-1">{similarHotel.description || ""}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-1">
                              <span className="text-sm text-gray-300">от</span>
                              <span className="text-xl font-bold text-yellow-400">
                                {Number(similarHotel.price || 0) > 0 ? Number(similarHotel.price).toLocaleString() : "—"}
                              </span>
                              {Number(similarHotel.price || 0) > 0 && <span className="text-sm text-gray-300">BYN</span>}
                            </div>
                            <span className="text-gray-300 text-sm">{similarHotel.city?.name || cityName}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}

              <Card className="p-6">
                {(topPositiveTags.length > 0 || topNegativeTags.length > 0) && (
                  <div className="mb-6 space-y-3">
                    {topPositiveTags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">Топ плюсы:</span>
                        {topPositiveTags.map((tag) => (
                          <Badge key={`top-plus-${tag}`} className="bg-yellow-500/90 hover:bg-yellow-500 text-black border border-yellow-300">
                            <Check className="w-3.5 h-3.5 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {topNegativeTags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-muted-foreground">Топ минусы:</span>
                        {topNegativeTags.map((tag) => (
                          <Badge key={`top-minus-${tag}`} className="bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-400/40">
                            <X className="w-3.5 h-3.5 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <h2 className="text-2xl font-bold mb-6">Отзывы ({reviews.length})</h2>
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Пока нет отзывов</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.slice(0, 5).map((review) => {
                      const reviewUserName = review.userName || "Пользователь";
                      const reviewInitials = getAvatarInitials({ name: reviewUserName });
                      return (
                      <Card key={review.id} className="p-5 border-border/70 bg-card/60 hover:shadow-md hover:border-primary/30 transition-all">
                        <div className="flex items-start gap-4">
                          <div className="relative w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-border flex-shrink-0">
                            <UserAvatar
                              avatar={review.userAvatar}
                              alt={reviewUserName}
                              initials={reviewInitials}
                              fill
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-bold text-lg">{review.userName || "Пользователь"}</h3>
                                  <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-400/60">
                                    <Star className="w-3.5 h-3.5 text-yellow-500 mr-1 fill-yellow-500" />
                                    <span className="font-semibold text-yellow-500 text-sm">
                                      {review.rating}/10
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{format(new Date(review.createdAt), "d MMMM yyyy", { locale: ru })}</span>
                                  </div>
                                  {review.roomName && (
                                    <div className="flex items-center gap-1.5">
                                      <Bed className="w-3.5 h-3.5" />
                                      <span>{review.roomName}</span>
                                    </div>
                                  )}
                                  {review.nightsStayed !== undefined && review.nightsStayed > 0 && (
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5" />
                                      <span>
                                        {review.nightsStayed} {review.nightsStayed === 1 ? 'сутки' : review.nightsStayed <= 4 ? 'суток' : 'суток'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {isAuthenticated && user && (
                                canDeleteOwnReview(review) || (isClient && review.userId !== authUserId && !review.hasUserComplaint)
                              ) && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      if (canDeleteOwnReview(review)) {
                                        setDeleteReviewId(review.id);
                                        return;
                                      }
                                      if (isClient && review.userId !== authUserId) {
                                        setComplaintReviewId(review.id);
                                      }
                                    }}
                                    disabled={deleteReviewMutation.isPending}
                                    className={`border-red-300/60 flex-shrink-0 h-9 w-9 ${
                                      canDeleteOwnReview(review)
                                        ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                                        : "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                    }`}
                                    title={canDeleteOwnReview(review) ? "Удалить отзыв" : "Пожаловаться"}
                                  >
                                    {canDeleteOwnReview(review) ? (
                                      <Trash2 className="w-4 h-4" />
                                    ) : (
                                      <AlertTriangle className="w-4 h-4" />
                                    )}
                                  </Button>
                              )}
                            </div>

                            <div className="mb-2 flex flex-wrap gap-2">
                              {(review.positiveTags || []).map((tag) => (
                                <Badge key={`plus-${review.id}-${tag}`} className="bg-yellow-500/90 hover:bg-yellow-500 text-black border border-yellow-300">
                                  <Check className="w-3.5 h-3.5 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              {(review.negativeTags || []).map((tag) => (
                                <Badge key={`minus-${review.id}-${tag}`} className="bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-400/40">
                                  <X className="w-3.5 h-3.5 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            {review.comment?.trim() && (
                              <p className="text-foreground leading-relaxed text-base break-words overflow-wrap-anywhere">
                                {review.comment}
                              </p>
                            )}

                            {review.comments && review.comments.length > 0 && (
                              <div className="mt-4">
                                {renderReviewComments(review.comments)}
                              </div>
                            )}

                            {isAuthenticated && isManager && (!review.comments || !review.comments.some(isManagerComment)) && (
                              <div className="mt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setReplyReviewId(review.id);
                                    setReplyText("");
                                    setReplyDialogOpen(true);
                                  }}
                                  className="text-primary border-primary/30 hover:bg-primary/10"
                                >
                                  <MessageSquare className="w-4 h-4 mr-1.5" />
                                  Ответить
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                    })}
                  </div>
                )}
              </Card>

            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <h2 className="text-2xl font-bold mb-6">Забронировать</h2>
                
                {!isBooking || !selectedRoomId ? (
                  <>
                    <div className="space-y-4 mb-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Заезд
                        </label>
                        <Popover open={checkInPopoverOpen} onOpenChange={setCheckInPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-medium bg-background border-border h-10"
                              onClick={() => {
                                setDatePickerMode("checkin");
                                setCheckOutPopoverOpen(false);
                              }}
                            >
                              {checkIn ? (
                                format(checkIn, "d MMM yyyy", { locale: ru })
                              ) : (
                                <span className="text-muted-foreground">Когда</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-background border-border max-h-[80vh] overflow-hidden" align="start">
                            <DateRangePicker
                              checkIn={checkIn}
                              checkOut={checkOut}
                              onCheckInChange={(date) => {
                                setCheckIn(date);
                              }}
                              onCheckOutChange={(date) => {
                                setCheckOut(date);
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
                        <label className="text-sm font-semibold flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Выезд
                        </label>
                        <Popover open={checkOutPopoverOpen} onOpenChange={setCheckOutPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-medium bg-background border-border h-10"
                              onClick={() => {
                                setDatePickerMode("checkout");
                                setCheckInPopoverOpen(false);
                              }}
                            >
                              {checkOut ? (
                                format(checkOut, "d MMM yyyy", { locale: ru })
                              ) : (
                                <span className="text-muted-foreground">Когда</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-background border-border max-h-[80vh] overflow-hidden" align="start">
                            <DateRangePicker
                              checkIn={checkIn}
                              checkOut={checkOut}
                              onCheckInChange={(date) => {
                                setCheckIn(date);
                              }}
                              onCheckOutChange={(date) => {
                                setCheckOut(date);
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
                      
                      <div className="space-y-2">
                        <label className="text-sm font-semibold flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Гости
                        </label>
                        <Popover open={guestsPopoverOpen} onOpenChange={setGuestsPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-medium bg-background border-border h-10 truncate"
                              onClick={() => setGuestsPopoverOpen(true)}
                            >
                              <span className="truncate">
                                {formatGuests()}
                              </span>
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
                                      setChildrenAges(prev => prev.slice(0, newChildren));
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
                                        setChildren(prev => prev + 1);
                                        setChildrenAges(prev => [...prev, null]);
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
                                  {childrenAges.map((age, index) => {
                                    return (
                                      <div key={index} className="space-y-1.5">
                                        <label className="text-sm font-medium text-foreground">Возраст</label>
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
                                                ? ageOptions.find(opt => opt.value === age.toString())?.label || formatAge(age)
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
                                    );
                                  })}
                                </div>
                              )}
                              <div className="flex items-center justify-between pt-3 border-t">
                                <div>
                                  <div className="font-medium">С питомцами</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setPets(!pets)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                                    pets ? 'bg-yellow-500' : 'bg-gray-300'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      pets ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {checkIn && checkOut && selectedRoomId && selectedRoomPrice != null && (() => {
                      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div className="mb-6 p-4 bg-muted rounded-lg">
                          <div className="flex justify-between mb-2">
                            <span>Стоимость за сутки</span>
                            <span className="font-semibold">
                              {selectedRoomPrice.toLocaleString()} BYN
                            </span>
                          </div>
                          <div className="flex justify-between mb-2">
                            <span>Ночей</span>
                            <span className="font-semibold">{nights}</span>
                          </div>
                          <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
                            <span>Итого</span>
                            <span className="text-primary">
                              {(selectedRoomPrice * nights).toLocaleString()} BYN
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                    {!selectedRoomId && (
                      <div className="mb-6 p-4 bg-muted rounded-lg text-center text-muted-foreground">
                        Выберите номер для бронирования
                      </div>
                    )}
                  </> 
                ) : (
                  <div className="space-y-4">
                    {selectedRoomId && selectedRoomPrice != null && (() => {
                      const selectedType = roomTypeGroups.find(rt => rt.roomTypeId === selectedRoomTypeId);
                      if (!selectedType) return null;
                      const nights = checkIn && checkOut
                        ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
                        : 0;
                      return (
                        <div className="mb-4 p-4 bg-muted rounded-lg">
                          <div className="font-semibold mb-2">Выбранный номер: {selectedType.roomTypeName}</div>
                          {checkIn && checkOut && (
                            <div className="text-sm space-y-1">
                              <div>Даты: {format(checkIn, "d MMM", { locale: ru })} - {format(checkOut, "d MMM yyyy", { locale: ru })}</div>
                              <div>Гости: {formatGuests()}</div>
                              <div className="font-semibold mt-2">
                                Итого: {(selectedRoomPrice * nights).toLocaleString()} BYN
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <div>
                      <Label htmlFor="specialRequests">Особые пожелания</Label>
                      <Textarea
                        id="specialRequests"
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        className="mt-1"
                        rows={3}
                        placeholder="Ранний заезд, поздний выезд и т.д."
                      />
                    </div>
                    {shouldRequestBookingPhone && (
                    <div>
                      <PhoneInput
                        id="bookingPhone"
                        label="Телефон"
                        value={bookingPhone}
                        onChange={setBookingPhone}
                        onValidityChange={setPhoneValid}
                        defaultCountryIso="by"
                      />
                    </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setIsBooking(false);
                          setSelectedRoomTypeId(null);
                        }}
                      >
                        Отмена
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleBooking}
                        disabled={bookingMutation.isPending || !checkIn || !checkOut || (children > 0 && childrenAges.some(age => age === null || age === undefined))}
                      >
                        {bookingMutation.isPending ? "Создание..." : "Подтвердить"}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>

      <ReviewComplaintDialog
        open={complaintReviewId !== null}
        onOpenChange={(open) => !open && setComplaintReviewId(null)}
        isSubmitting={complaintSubmitting}
        onSubmit={async (complaintType, comment) => {
          if (!complaintReviewId) return;
          setComplaintSubmitting(true);
          try {
            await reviewsApi.createComplaint(complaintReviewId, complaintType, comment);
            toast.success("Жалоба отправлена");
            setComplaintReviewId(null);
            refetchReviews();
          } catch {
            toast.error("Ошибка при отправке жалобы");
          } finally {
            setComplaintSubmitting(false);
          }
        }}
      />

      <Dialog open={deleteReviewId !== null} onOpenChange={(open) => !open && setDeleteReviewId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-playfair text-3xl font-semibold">Удалить отзыв?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Отзыв будет удален. Это действие нельзя отменить.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteReviewId(null)}>Отмена</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteReviewId) return;
                deleteReviewMutation.mutate(deleteReviewId, {
                  onSuccess: () => setDeleteReviewId(null),
                });
              }}
              disabled={deleteReviewMutation.isPending}
            >
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={managerReplyDialogText !== null} onOpenChange={(open) => !open && setManagerReplyDialogText(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-playfair text-3xl font-semibold">Ответ менеджера</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {managerReplyDialogText || ""}
          </p>
          <DialogFooter>
            <Button onClick={() => setManagerReplyDialogText(null)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-playfair text-3xl font-semibold">Ответ на комментарий</DialogTitle>
          </DialogHeader>
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={4}
            placeholder="Введите ответ..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>Отмена</Button>
            <Button
              onClick={() => {
                if (!replyReviewId || !replyText.trim()) return;
                reviewsApi.addComment(replyReviewId, replyText.trim())
                  .then(() => {
                    toast.success("Ответ добавлен");
                    setReplyDialogOpen(false);
                    setReplyText("");
                    setReplyReviewId(null);
                    refetchReviews();
                  })
                  .catch((error: any) => {
                    const msg = error?.response?.data?.message || error?.message || "Ошибка при добавлении ответа";
                    toast.error(msg);
                  });
              }}
              disabled={!replyText.trim()}
            >
              Отправить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
