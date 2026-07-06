"use client";

import { useState, useRef, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { UserRole, getAvatarInitials, resolveAvatarUrl, shouldUnoptimizeAvatar } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Hotel, Users, Ban, CheckCircle, Plus, Edit, UserCog, Star, Search, Shield, AlertTriangle, Eye, EyeOff, XCircle
} from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { ManagerMultiSearchField, HotelSearchField } from "@/components/shared/UserSearchField";
import { BlockReasonPicker, resolveBlockReason } from "@/components/shared/BlockReasonPicker";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { hotelsApi, usersApi, citiesApi, getApiBaseUrl, uploadsApi } from "@/lib/api";
import {
  getHotelCarouselImages,
  getHotelGalleryImages,
  normalizeHotelImagesForApi,
  normalizeHotelImageUrl,
} from "@/lib/imageUtils";
import { ImageCarousel } from "@/components/shared/ImageCarousel";
import { CatalogCheckMark } from "@/components/shared/CatalogCheckMark";
import { ReviewsModerationPanel } from "@/components/reviews/ReviewsModerationPanel";
import { ComplaintsModerationPanel } from "@/components/reviews/ComplaintsModerationPanel";
import { toast } from "sonner";
import Image from "next/image";
import type { Hotel as ApiHotel, City } from "@/types/api";
import { loadYandexMaps } from "@/lib/yandexMaps";

const HOTELS_PER_PAGE = 6;

const CITY_SLUG_MAP: Record<string, string> = {
  минск: "minsk",
  брест: "brest",
  витебск: "vitebsk",
  гомель: "gomel",
  гродно: "grodno",
  могилев: "mogilev",
};

const getHotelCitySlug = (hotel: ApiHotel) => {
  const cityName = (typeof hotel.city === "string" ? hotel.city : hotel.city?.name || "").toLowerCase();
  return CITY_SLUG_MAP[cityName] || cityName;
};

const HOTEL_BLOCK_REASONS = [
  "Нарушение правил платформы",
  "Жалобы гостей",
  "Технические работы",
  "По запросу владельца",
  "Другое",
];

const USER_BLOCK_REASONS = [
  "Нарушение правил платформы",
  "Жалобы гостей",
  "Подозрительная активность",
  "По запросу пользователя",
  "Другое",
];

interface ExtendedCity extends City {
  latitude?: number;
  longitude?: number;
}

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole={UserRole.Admin} allowedPaths={['/admin', '/admin/reviews']}>
      <Suspense fallback={null}>
        <AdminPageContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function AdminPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("hotels");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "reviews" || tab === "complaints" || tab === "hotels" || tab === "users" || tab === "registration") {
      setActiveTab(tab);
    }
  }, [searchParams]);
  const [hotelDialogOpen, setHotelDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<ApiHotel | null>(null);
  const [registerManagerForm, setRegisterManagerForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    hotelId: 0,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [hotelForm, setHotelForm] = useState({
    name: "",
    description: "",
    stars: 5,
    imageUrl: "/assets/hotels/block.jpg",
    images: [] as string[],
    cityId: 0,
    address: "",
    managerUserIds: [] as number[],
    amenityTypeIds: [] as number[],
    latitude: 53.9045,
    longitude: 27.5615,
  });

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [addressLockedFromMap, setAddressLockedFromMap] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("all");
  const [hotelSearchQuery, setHotelSearchQuery] = useState("");
  const [hotelCityFilter, setHotelCityFilter] = useState<string>("all");
  const [hotelCatalogPage, setHotelCatalogPage] = useState(1);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [phoneInputRevision, setPhoneInputRevision] = useState(0);
  const [blockHotelDialogOpen, setBlockHotelDialogOpen] = useState(false);
  const [hotelToBlock, setHotelToBlock] = useState<ApiHotel | null>(null);
  const [blockHotelReason, setBlockHotelReason] = useState("");
  const [blockHotelCustomReason, setBlockHotelCustomReason] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [blockUserDialogOpen, setBlockUserDialogOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState<any | null>(null);
  const [blockUserReason, setBlockUserReason] = useState("");
  const [blockUserCustomReason, setBlockUserCustomReason] = useState("");

  // Data fetching
  const { data: hotelsResponse, refetch: refetchHotels } = useQuery({
    queryKey: ['admin-hotels'],
    queryFn: () => hotelsApi.getAll(),
  });

  const { data: citiesResponse } = useQuery({
    queryKey: ['admin-cities'],
    queryFn: () => citiesApi.getAll(),
  });

  const { data: hotelAmenityTypesResponse } = useQuery({
    queryKey: ["hotel-amenity-types"],
    queryFn: () => hotelsApi.getAmenityTypes(),
  });

  const hotelAmenityTypes: Array<{ id: number; name: string }> = Array.isArray(
    hotelAmenityTypesResponse?.data,
  )
    ? hotelAmenityTypesResponse.data
    : [];

  const { data: usersResponse, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => usersApi.getAll(),
  });

  const hotels: ApiHotel[] = Array.isArray(hotelsResponse?.data) ? hotelsResponse.data : [];
  const users: any[] = Array.isArray(usersResponse?.data) ? usersResponse.data : [];
  const cities: ExtendedCity[] = Array.isArray(citiesResponse?.data) ? citiesResponse.data : [];
  
  const getManagerUserIdsForHotel = (hotel: ApiHotel): number[] => {
    const raw = hotel.managers;
    if (raw?.length) {
      return raw
        .map((m) => Number(m.userId))
        .filter((id) => Number.isFinite(id) && id > 0);
    }
    if (hotel.managerId != null) return [Number(hotel.managerId)];
    return [];
  };

  const assignedToAnyHotelIds = useMemo(() => {
    const ids = new Set<number>();
    hotels.forEach((h) => {
      getManagerUserIdsForHotel(h).forEach((id) => ids.add(id));
    });
    return ids;
  }, [hotels]);

  const autofillManagerFormByEmail = (email: string) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;
    const found = users.find((u) => (u.email || "").toLowerCase() === normalized);
    if (!found) return;
    const nextPhone = found.phoneNumber || "";
    setRegisterManagerForm((prev) => ({
      ...prev,
      firstName: found.firstName || prev.firstName,
      lastName: found.lastName || prev.lastName,
      phoneNumber: nextPhone || prev.phoneNumber,
    }));
    if (nextPhone) {
      setPhoneInputRevision((n) => n + 1);
    }
  };

  const userAndManagerList = users.filter((u) => {
    const role = String(u.role || "").toLowerCase();
    return role === "user" || role === "manager";
  });

  const filteredUsers = userAndManagerList.filter((u) => {
    if (userRoleFilter !== "all") {
      const role = (u.role || "").toLowerCase();
      if (userRoleFilter === "user" && role !== "user") return false;
      if (userRoleFilter === "manager" && role !== "manager") return false;
    }
    if (userStatusFilter !== "all") {
      if (userStatusFilter === "blocked" && !u.isBlocked) return false;
      if (userStatusFilter === "active" && u.isBlocked) return false;
    }
    if (userSearchQuery.trim()) {
      const query = userSearchQuery.toLowerCase();
      const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      if (!fullName.includes(query) && !u.email?.toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) =>
    (a.firstName || a.email).localeCompare(b.firstName || b.email),
  );

  const filteredHotels = hotels.filter((hotel: ApiHotel) => {
    if (hotelSearchQuery.trim()) {
      const query = hotelSearchQuery.toLowerCase();
      if (!hotel.name?.toLowerCase().includes(query)) return false;
    }
    if (hotelCityFilter !== "all" && hotel.city !== hotelCityFilter) return false;
    return true;
  });

  const hotelCatalogTotalPages = Math.max(1, Math.ceil(filteredHotels.length / HOTELS_PER_PAGE));

  const paginatedHotels = useMemo(() => {
    const start = (hotelCatalogPage - 1) * HOTELS_PER_PAGE;
    return filteredHotels.slice(start, start + HOTELS_PER_PAGE);
  }, [filteredHotels, hotelCatalogPage]);

  useEffect(() => {
    setHotelCatalogPage(1);
  }, [hotelSearchQuery, hotelCityFilter]);

  useEffect(() => {
    if (!editingHotel || hotelAmenityTypes.length === 0) return;
    setHotelForm((prev) => {
      if (prev.amenityTypeIds.length > 0) return prev;
      const ids = (editingHotel.amenities || [])
        .map((name) => hotelAmenityTypes.find((t) => t.name === name)?.id)
        .filter((id): id is number => Boolean(id));
      if (ids.length === 0) return prev;
      return { ...prev, amenityTypeIds: ids };
    });
  }, [editingHotel, hotelAmenityTypes]);

  // Image upload handler
  const handleHotelImageChange = async (file: File) => {
    if (hotelForm.images.length >= 5) {
      toast.error("Максимальное количество фото - 5");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setHotelForm((prev) => ({
      ...prev,
      images: [...prev.images.filter((image) => image !== "/assets/hotels/block.jpg"), previewUrl],
    }));

    try {
      const imagePath = await uploadsApi.uploadHotelImage(file);
      setHotelForm((prev) => {
        const images = prev.images
          .map((img) => (img === previewUrl ? imagePath : img))
          .filter((image) => image !== "/assets/hotels/block.jpg");
        return {
          ...prev,
          images,
          imageUrl: images[0] || "/assets/hotels/block.jpg",
        };
      });
      toast.success("Фото добавлено");
    } catch (error: any) {
      console.error("Upload error", error);
      setHotelForm((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img !== previewUrl),
        imageUrl: prev.images.filter((img) => img !== previewUrl)[0] || "/assets/hotels/block.jpg",
      }));
      toast.error(error?.message || "Не удалось загрузить изображение");
    } finally {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleRemoveHotelImage = (index: number) => {
    setHotelForm((prev) => {
      const removed = prev.images[index];
      if (removed?.startsWith("blob:")) {
        URL.revokeObjectURL(removed);
      }
      const newImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newImages,
        imageUrl: newImages[0] || "/assets/hotels/block.jpg",
      };
    });
  };

  const handleSetMainHotelImage = (index: number) => {
    if (index === 0) return; // Already main
    setHotelForm((prev) => {
      const newImages = [...prev.images];
      const [selected] = newImages.splice(index, 1);
      newImages.unshift(selected); // Move to first position
      return {
        ...prev,
        images: newImages,
        imageUrl: newImages[0] || "/assets/hotels/block.jpg",
      };
    });
    toast.success("Главное фото изменено");
  };

  // Map initialization
  useEffect(() => {
    if (!hotelDialogOpen) return;

    let cancelled = false;

    loadYandexMaps()
      .then(() => {
        const ymaps = (window as any).ymaps;
        if (!cancelled && ymaps && typeof ymaps.Map === "function") {
          setMapLoaded(true);
        }
      })
      .catch((err) => console.error("Failed to load Yandex Maps:", err));

    return () => {
      cancelled = true;
      setMapLoaded(false);
    };
  }, [hotelDialogOpen]);

  useEffect(() => {
    if (!hotelDialogOpen || !mapLoaded || !mapRef.current) return;

    const ymaps = (window as any).ymaps;
    if (!ymaps || typeof ymaps.ready !== "function") return;

    ymaps.ready(() => {
      if (!mapRef.current || !ymaps || typeof ymaps.Map !== "function") return;

      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
          markerRef.current = null;
        }

        const defaultLat = hotelForm.latitude || 53.9045;
        const defaultLon = hotelForm.longitude || 27.5615;

        const map = new ymaps.Map(mapRef.current, {
          center: [defaultLat, defaultLon],
          zoom: hotelForm.latitude && hotelForm.longitude ? 15 : 12,
          controls: ["zoomControl"],
        });

        mapInstanceRef.current = map;

        if (hotelForm.latitude && hotelForm.longitude) {
          const marker = new ymaps.Placemark([hotelForm.latitude, hotelForm.longitude], {}, {
            preset: "islands#yellowIcon",
          });
          map.geoObjects.add(marker);
          markerRef.current = marker;
        }

        map.events.add("click", async (e: any) => {
          const coords = e.get("coords");
          const [lat, lon] = coords;

          if (markerRef.current) {
            markerRef.current.geometry.setCoordinates([lat, lon]);
          } else {
            const newMarker = new ymaps.Placemark([lat, lon], {}, {
              preset: "islands#yellowIcon",
            });
            map.geoObjects.add(newMarker);
            markerRef.current = newMarker;
          }

          setHotelForm((prev) => ({
            ...prev,
            latitude: lat,
            longitude: lon,
          }));

          try {
            const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAP_API_KEY;
            if (!apiKey) return;

            const geocodeUrl = `https://geocode-maps.yandex.ru/1.x/?format=json&apikey=${apiKey}&geocode=${lon},${lat}&lang=ru_RU`;
            const res = await fetch(geocodeUrl);
            const geoData = await res.json();

            const member = geoData?.response?.GeoObjectCollection?.featureMember?.[0];
            const meta = member?.GeoObject?.metaDataProperty?.GeocoderMetaData;
            const textAddress: string | undefined = meta?.text;
            
            let nearestCity: ExtendedCity | null = null;
            let bestDist = Number.POSITIVE_INFINITY;
            
            cities.forEach((c) => {
              const cLat = c.latitude;
              const cLon = c.longitude;
              if (typeof cLat === "number" && typeof cLon === "number") {
                const dLat = lat - cLat;
                const dLon = lon - cLon;
                const dist2 = dLat * dLat + dLon * dLon;
                if (dist2 < bestDist) {
                  bestDist = dist2;
                  nearestCity = c;
                }
              }
            });

            setHotelForm((prev) => ({
              ...prev,
              latitude: lat,
              longitude: lon,
              address: textAddress || prev.address,
              cityId: nearestCity?.id ?? prev.cityId,
            }));

            if (textAddress) {
              setAddressLockedFromMap(true);
            }
          } catch (err) {
            console.error("Reverse geocoding error", err);
          }
        });
      } catch (error) {
        console.error("Error creating map:", error);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
        } catch (error) {
          console.error("Error destroying map:", error);
        }
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [hotelDialogOpen, mapLoaded, hotelForm.latitude, hotelForm.longitude, cities]);

  useEffect(() => {
    if (!hotelDialogOpen || !mapLoaded || !mapInstanceRef.current || !hotelForm.cityId) return;
    const city = cities.find((c) => Number(c.id) === Number(hotelForm.cityId));
    if (typeof city?.latitude === "number" && typeof city?.longitude === "number") {
      try {
        mapInstanceRef.current.setCenter([city.latitude, city.longitude], 12);
      } catch {
        /* map may be destroying */
      }
    }
  }, [hotelDialogOpen, mapLoaded, hotelForm.cityId, cities]);

  // Form reset
  const resetHotelForm = () => {
    setHotelForm({
      name: "",
      description: "",
      stars: 5,
      imageUrl: "/assets/hotels/block.jpg",
      images: [],
      cityId: 0,
      address: "",
      managerUserIds: [] as number[],
      amenityTypeIds: [] as number[],
      latitude: 53.9045,
      longitude: 27.5615,
    });
    setEditingHotel(null);
    setAddressLockedFromMap(false);
  };

  // Mutations
  const blockHotelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      await hotelsApi.block(id, reason);
      return { success: true };
    },
    onSuccess: () => {
      toast.success("Отель заблокирован");
      setBlockHotelDialogOpen(false);
      setHotelToBlock(null);
      setBlockHotelReason("");
      setBlockHotelCustomReason("");
      refetchHotels();
      refetchUsers();
    },
    onError: (error: Error) => {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        error.message ||
        "Ошибка при блокировке";
      toast.error(message);
    },
  });

  const openBlockHotelDialog = (hotel: ApiHotel) => {
    if ((hotel as ApiHotel & { hasActiveBookings?: boolean }).hasActiveBookings) {
      toast.error(
        "Есть активные бронирования (не завершенные и не отмененные). Сначала завершите или отмените их.",
      );
      return;
    }
    setHotelToBlock(hotel);
    setBlockHotelReason("");
    setBlockHotelCustomReason("");
    setBlockHotelDialogOpen(true);
  };

  const submitBlockHotel = () => {
    if (!hotelToBlock) return;
    const finalReason = resolveBlockReason(blockHotelReason, blockHotelCustomReason);
    if (!finalReason) {
      toast.error("Укажите причину блокировки");
      return;
    }
    blockHotelMutation.mutate({ id: Number(hotelToBlock.id), reason: finalReason });
  };

  const openBlockUserDialog = (user: any) => {
    setUserToBlock(user);
    setBlockUserReason("");
    setBlockUserCustomReason("");
    setBlockUserDialogOpen(true);
  };

  const submitBlockUser = () => {
    if (!userToBlock) return;
    const finalReason = resolveBlockReason(blockUserReason, blockUserCustomReason);
    if (!finalReason) {
      toast.error("Укажите причину блокировки");
      return;
    }
    blockUserMutation.mutate({ id: userToBlock.id, reason: finalReason });
  };

  const unblockHotelMutation = useMutation({
    mutationFn: async (id: number) => {
      const hotel = hotels.find((h: ApiHotel) => Number(h.id) === id);
      const managerIds = hotel ? getManagerUserIdsForHotel(hotel) : [];

      await hotelsApi.unblock(id);

      for (const managerId of managerIds) {
        await usersApi.unblock(managerId).catch(() => {});
      }

      return { success: true };
    },
    onSuccess: () => {
      toast.success("Отель и менеджер разблокированы");
      refetchHotels();
      refetchUsers();
    },
    onError: () => toast.error("Ошибка при разблокировке"),
  });

  const createHotelMutation = useMutation({
    mutationFn: (data: any) => hotelsApi.create(data),
    onSuccess: (res: any) => {
      if (res.success) {
        toast.success(res.message || "Отель создан");
        refetchHotels();
        refetchUsers();
        queryClient.invalidateQueries({ queryKey: ['hotels'] });
        queryClient.invalidateQueries({ queryKey: ['admin-hotels'] });
        setHotelDialogOpen(false);
        resetHotelForm();
      } else {
        toast.error(res.message || "Ошибка при создании отеля");
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Ошибка при создании отеля");
    },
  });

  const updateHotelMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => hotelsApi.update(id, data),
    onSuccess: (res: any) => {
      if (res.success) {
        toast.success(res.message || "Отель обновлен");
        if (res.data?.id != null) {
          queryClient.setQueryData(['admin-hotels'], (old: { data?: ApiHotel[] } | undefined) => {
            if (!Array.isArray(old?.data)) return old;
            return {
              ...old,
              data: old.data.map((h) =>
                Number(h.id) === Number(res.data.id) ? { ...h, ...res.data } : h
              ),
            };
          });
        }
        refetchHotels();
        refetchUsers();
        queryClient.invalidateQueries({ queryKey: ['hotels'] });
        queryClient.invalidateQueries({ queryKey: ['admin-hotels'] });
        setHotelDialogOpen(false);
        resetHotelForm();
      } else {
        toast.error(res.message || "Ошибка при обновлении отеля");
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || "Ошибка при обновлении отеля");
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      usersApi.block(id, reason),
    onSuccess: () => {
      toast.success("Пользователь заблокирован");
      setBlockUserDialogOpen(false);
      setUserToBlock(null);
      setBlockUserReason("");
      setBlockUserCustomReason("");
      refetchUsers();
    },
    onError: () => toast.error("Ошибка при блокировке"),
  });

  const unblockUserMutation = useMutation({
    mutationFn: (userId: number) => usersApi.unblock(userId),
    onSuccess: () => {
      toast.success("Пользователь разблокирован");
      refetchUsers();
    },
    onError: () => toast.error("Ошибка при разблокировании"),
  });

  // Helper functions
  const getRoleBadgeColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'manager': return 'bg-blue-500';
      case 'admin': return 'bg-red-500';
      case 'user': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'manager': return 'Менеджер';
      case 'admin': return 'Администратор';
      case 'user': return 'Пользователь';
      default: return 'Гость';
    }
  };

  const handleOpenCreateHotel = () => {
    resetHotelForm();
    setHotelDialogOpen(true);
  };

  const handleOpenEditHotel = (hotel: ApiHotel) => {
    setEditingHotel(hotel);
    const cityForHotel = cities.find((c) => c.name === hotel.city);
    const managerIds = getManagerUserIdsForHotel(hotel);
    const hotelImages = hotel.images ?? (hotel as ApiHotel & { Images?: string[] }).Images;
    const galleryImages = getHotelGalleryImages(hotelImages, hotel.imageUrl);
    const amenityTypeIds = (hotel.amenities || [])
      .map((name) => hotelAmenityTypes.find((t) => t.name === name)?.id)
      .filter((id): id is number => Boolean(id));

    setHotelForm({
      name: hotel.name,
      description: hotel.description,
      stars: hotel.stars,
      imageUrl: galleryImages[0] || "/assets/hotels/block.jpg",
      images: galleryImages,
      cityId: cityForHotel?.id || 0,
      address: hotel.address,
      managerUserIds: managerIds,
      amenityTypeIds,
      latitude: (hotel as any).latitude ?? 53.9045,
      longitude: (hotel as any).longitude ?? 27.5615,
    });
    setAddressLockedFromMap(false);
    setHotelDialogOpen(true);
  };

  const toggleHotelFormManager = (userId: number) => {
    setHotelForm((prev) => {
      const set = new Set(prev.managerUserIds);
      if (set.has(userId)) {
        if (prev.managerUserIds.length <= 1) {
          toast.error("У отеля должен быть хотя бы один менеджер");
          return prev;
        }
        set.delete(userId);
      } else {
        set.add(userId);
      }
      return { ...prev, managerUserIds: Array.from(set) };
    });
  };

  const handleSubmitHotel = () => {
    if (hotelForm.managerUserIds.length === 0) {
      toast.error("Выберите хотя бы одного менеджера");
      return;
    }

    const managerEmails = hotelForm.managerUserIds
      .map((userId) => users.find((u) => u.id === userId)?.email)
      .filter((e): e is string => Boolean(e));
    if (managerEmails.length !== hotelForm.managerUserIds.length) {
      toast.error("Не удалось определить email выбранных менеджеров");
      return;
    }

    if (hotelForm.cityId <= 0) {
      toast.error("Необходимо выбрать город");
      return;
    }

    if (!hotelForm.name.trim()) {
      toast.error("Необходимо указать название отеля");
      return;
    }

    if (!hotelForm.address.trim()) {
      toast.error("Необходимо указать адрес");
      return;
    }

    if (hotelForm.images.some((img) => img.startsWith("blob:"))) {
      toast.error("Дождитесь окончания загрузки всех фото");
      return;
    }

    const imagesPayload = normalizeHotelImagesForApi(hotelForm.images, hotelForm.imageUrl);

    if (editingHotel) {
      const payload: any = {
        name: hotelForm.name,
        description: hotelForm.description,
        stars: hotelForm.stars,
        images: imagesPayload,
        address: hotelForm.address,
        cityId: hotelForm.cityId,
        latitude: hotelForm.latitude,
        longitude: hotelForm.longitude,
        amenityIds: hotelForm.amenityTypeIds,
      };

      payload.managerEmails = managerEmails;

      updateHotelMutation.mutate({ id: Number(editingHotel.id), data: payload });
    } else {
      const payload: any = {
        name: hotelForm.name,
        description: hotelForm.description,
        stars: hotelForm.stars,
        images: imagesPayload,
        cityId: hotelForm.cityId,
        address: hotelForm.address,
        latitude: hotelForm.latitude,
        longitude: hotelForm.longitude,
        amenityIds: hotelForm.amenityTypeIds,
        managerEmails,
      };

      createHotelMutation.mutate(payload);
    }
  };

  return (
    <div className="min-h-screen page-backdrop">
      <Header />
      
      <main className="pt-[calc(var(--header-height)+2rem)] pb-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Панель администратора
            </h1>
            <p className="text-muted-foreground">
              Управление отелями, пользователями и отзывами
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="hotels" className="flex items-center gap-2">
                <Hotel className="w-4 h-4" />
                Отели
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Пользователи
              </TabsTrigger>
              <TabsTrigger value="registration" className="flex items-center gap-2">
                <UserCog className="w-4 h-4" />
                Регистрация
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Отзывы
              </TabsTrigger>
              <TabsTrigger value="complaints" className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Жалобы
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hotels">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h2 className="text-2xl font-bold">Управление отелями</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Поиск по названию отеля"
                        value={hotelSearchQuery}
                        onChange={(e) => setHotelSearchQuery(e.target.value)}
                        className="pl-10 pr-10 w-[400px]"
                      />
                      {hotelSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setHotelSearchQuery("")}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                          aria-label="Очистить поиск отелей"
                        >
                          <span className="text-lg leading-none">×</span>
                        </button>
                      )}
                    </div>
                    <Select value={hotelCityFilter} onValueChange={setHotelCityFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Все города">
                          {/* Отображаем русский текст вместо "all" */}
                          {hotelCityFilter === "all" ? "Все города" : hotelCityFilter}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все города</SelectItem>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.name}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleOpenCreateHotel}>
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить отель
                    </Button>
                  </div>
                </div>

                {filteredHotels.length === 0 ? (
                  <Card className="p-12 text-center">
                    <p className="text-muted-foreground">Отели не найдены</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {filteredHotels.length}{" "}
                      {filteredHotels.length === 1
                        ? "отель"
                        : filteredHotels.length <= 4
                          ? "отеля"
                          : "отелей"}{" "}
                      в каталоге
                    </p>
                    {paginatedHotels.map((hotel: ApiHotel) => {
                      const hotelImages = hotel.images ?? (hotel as ApiHotel & { Images?: string[] }).Images;
                      const carouselImages = getHotelCarouselImages(hotelImages, hotel.imageUrl);
                      const managerSummaryLines = (() => {
                        const raw = hotel.managers;
                        if (raw?.length) {
                          return raw.map((m) => {
                            const fromUser = users.find((u) => u.id === m.userId);
                            const name =
                              [m.firstName, m.lastName].filter(Boolean).join(" ").trim() ||
                              [fromUser?.firstName, fromUser?.lastName].filter(Boolean).join(" ").trim();
                            const email = m.email || fromUser?.email || "";
                            if (name && email) return `${name} (${email})`;
                            return email || name || `id ${m.userId}`;
                          });
                        }
                        const single = users.find((u) => u.id === hotel.managerId);
                        if (!single) return [];
                        return [
                          `${single.firstName || ""} ${single.lastName || ""} (${single.email})`.trim(),
                        ];
                      })();
                      const hotelPrice = Number(hotel.price || 0);
                      return (
                        <Card
                          key={hotel.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(`/hotels/${getHotelCitySlug(hotel)}/${hotel.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              router.push(`/hotels/${getHotelCitySlug(hotel)}/${hotel.id}`);
                            }
                          }}
                          className={`border rounded-lg p-5 transition-all cursor-pointer ${
                            hotel.isBlocked
                              ? "border-orange-400/60 bg-orange-50/5 opacity-90"
                              : "border-border/70 hover:border-primary/30"
                          }`}
                        >
                          <div className="flex flex-col md:flex-row items-stretch gap-4">
                            <div className="relative w-full md:w-56 min-h-[180px] rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 self-stretch">
                              <ImageCarousel
                                key={`${hotel.id}-${carouselImages.join("|")}`}
                                images={carouselImages}
                                alt={hotel.name}
                                className="absolute inset-0 h-full w-full"
                                imageClassName="object-cover"
                                sizes="(max-width: 768px) 100vw, 320px"
                                normalize={normalizeHotelImageUrl}
                              />
                              {hotel.isBlocked && (
                                <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1">
                                  <Badge variant="destructive">Заблокирован</Badge>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 flex flex-col gap-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h3 className="font-semibold text-lg">{hotel.name}</h3>
                                    <Badge variant="outline" className="text-xs">
                                      {hotel.stars} ★
                                    </Badge>
                                    {(hotel as any).blockReason && (
                                      <p className="text-xs text-orange-600 w-full">
                                        Причина: {(hotel as any).blockReason}
                                      </p>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {typeof hotel.city === "string" ? hotel.city : hotel.city?.name || ""}
                                  </p>
                                  <div className="text-xs text-muted-foreground mb-2">
                                    <span className="font-medium text-foreground/80">Менеджеры:</span>
                                    {managerSummaryLines.length ? (
                                      <ul className="mt-1 space-y-0.5 list-disc pl-4">
                                        {managerSummaryLines.map((line, idx) => (
                                          <li key={`${hotel.id}-manager-${idx}`} className="leading-snug break-words">
                                            {line}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <span className="ml-1">не назначены</span>
                                    )}
                                  </div>
                                  {(hotel.reviewCount ?? 0) > 0 && (
                                    <Badge
                                      className={
                                        hotel.rating >= 9
                                          ? "bg-green-500"
                                          : hotel.rating >= 8
                                            ? "bg-blue-500"
                                            : hotel.rating >= 7
                                              ? "bg-yellow-500"
                                              : "bg-orange-500"
                                      }
                                    >
                                      {hotel.rating.toFixed(1)}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditHotel(hotel);
                                    }}
                                    title="Редактировать"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  {hotel.isBlocked ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        unblockHotelMutation.mutate(Number(hotel.id));
                                      }}
                                      disabled={unblockHotelMutation.isPending}
                                      className="gap-1.5 text-green-700 hover:text-green-800 hover:bg-green-50 border-green-300"
                                      title="Разблокировать"
                                    >
                                      <CatalogCheckMark checked size="sm" />
                                      <span className="sr-only sm:not-sr-only sm:inline text-xs font-medium">
                                        Разблок.
                                      </span>
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openBlockHotelDialog(hotel);
                                      }}
                                      disabled={
                                        blockHotelMutation.isPending ||
                                        Boolean((hotel as ApiHotel & { hasActiveBookings?: boolean }).hasActiveBookings)
                                      }
                                      className="text-orange-700 hover:text-orange-800 hover:bg-orange-50 border-orange-300 disabled:opacity-50"
                                      title={
                                        (hotel as ApiHotel & { hasActiveBookings?: boolean }).hasActiveBookings
                                          ? "Есть активные бронирования. Сначала завершите или отмените их."
                                          : "Заблокировать"
                                      }
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              {hotelPrice > 0 && (
                                <div className="pt-2 border-t border-border/50 flex items-end justify-end">
                                  <div className="text-right shrink-0">
                                    <div className="text-2xl font-bold text-primary">
                                      от {hotelPrice.toLocaleString()} BYN
                                    </div>
                                    <p className="text-sm text-muted-foreground">за сутки</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                    {hotelCatalogTotalPages > 1 && (
                      <Pagination className="mt-4">
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setHotelCatalogPage((p) => Math.max(1, p - 1))}
                              className={
                                hotelCatalogPage === 1
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                          {Array.from({ length: hotelCatalogTotalPages }, (_, i) => i + 1).map(
                            (page) => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setHotelCatalogPage(page)}
                                  isActive={hotelCatalogPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ),
                          )}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() =>
                                setHotelCatalogPage((p) =>
                                  Math.min(hotelCatalogTotalPages, p + 1),
                                )
                              }
                              className={
                                hotelCatalogPage === hotelCatalogTotalPages
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Управление пользователями</h2>
                  <p className="text-sm text-muted-foreground">Всего: {userAndManagerList.length}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Поиск по имени или email"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {userSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setUserSearchQuery("")}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                        aria-label="Очистить поиск пользователей"
                      >
                        <span className="text-lg leading-none">×</span>
                      </button>
                    )}
                  </div>
                  <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Все роли">
                        {userRoleFilter === "all"
                          ? "Все роли"
                          : userRoleFilter === "user"
                            ? "Пользователь"
                            : userRoleFilter === "manager"
                              ? "Менеджер"
                              : userRoleFilter}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все роли</SelectItem>
                      <SelectItem value="user">Пользователь</SelectItem>
                      <SelectItem value="manager">Менеджер</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Все пользователи">
                        {userStatusFilter === "all" ? "Все пользователи" : 
                        userStatusFilter === "active" ? "Активные" :
                        userStatusFilter === "blocked" ? "Заблокированные" : userStatusFilter}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все пользователи</SelectItem>
                      <SelectItem value="active">Активные</SelectItem>
                      <SelectItem value="blocked">Заблокированные</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {userAndManagerList.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Пользователи не найдены</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {sortedUsers.map((user: any) => {
                        const avatarUrl = resolveAvatarUrl(user.avatar);
                        const initials = getAvatarInitials({
                          firstName: user.firstName,
                          lastName: user.lastName,
                          email: user.email,
                        });
                        return (
                      <Card key={user.id} className="p-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                            <div className="relative w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-border flex-shrink-0">
                              {avatarUrl ? (
                                <Image
                                  src={avatarUrl}
                                  alt={`${user.firstName} ${user.lastName}`}
                                  fill
                                  className="object-cover"
                                  unoptimized={shouldUnoptimizeAvatar(avatarUrl)}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/60 text-white text-sm font-bold">
                                  {initials}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="font-bold">{user.firstName} {user.lastName}</h3>
                                {user.id === 1 && (
                                  <Badge className="bg-yellow-500">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Главный админ
                                  </Badge>
                                )}
                                {user.isBlocked && (
                                  <Badge variant="destructive">Заблокирован</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Роль:</span>
                              <Badge className={getRoleBadgeColor(user.role)}>
                                {getRoleLabel(user.role)}
                              </Badge>
                            </div>

                            {user.id !== 1 &&
                              (user.role?.toLowerCase() === "user" ||
                                user.role?.toLowerCase() === "manager") && (
                              <div className="flex gap-2">
                                {user.isBlocked ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => unblockUserMutation.mutate(user.id)}
                                    disabled={unblockUserMutation.isPending}
                                    className="gap-1.5 text-green-700 hover:text-green-800 hover:bg-green-50 border-green-300"
                                    title="Разблокировать"
                                  >
                                    <CatalogCheckMark checked size="sm" />
                                    <span className="sr-only sm:not-sr-only sm:inline text-xs font-medium">
                                      Разблок.
                                    </span>
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openBlockUserDialog(user)}
                                    disabled={blockUserMutation.isPending}
                                    className="text-orange-700 hover:text-orange-800 hover:bg-orange-50 border-orange-300"
                                    title="Заблокировать"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                        );
                      })}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reviews">
              <ReviewsModerationPanel />
            </TabsContent>

            <TabsContent value="complaints">
              <ComplaintsModerationPanel />
            </TabsContent>

            <TabsContent value="registration">
              <div className="max-w-md mx-auto space-y-3">
                <div className="text-center">
                  <h2 className="text-xl font-bold">Регистрация менеджера</h2>
                  <p className="text-sm text-muted-foreground">
                    Отель можно выбрать сразу или оставить пустым и назначить позже.
                  </p>
                </div>

                <Card className="p-4 sm:p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs">Email *</Label>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        className="h-9 text-foreground"
                        value={registerManagerForm.email || ''}
                        onChange={(e) =>
                          setRegisterManagerForm((prev) => ({ ...prev, email: e.target.value }))
                        }
                        onBlur={(e) => autofillManagerFormByEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs">Пароль *</Label>
                      <div className="relative">
                        <Input
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="h-9 pr-10 text-foreground"
                          value={registerManagerForm.password || ''}
                          onChange={(e) =>
                            setRegisterManagerForm((prev) => ({ ...prev, password: e.target.value }))
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showRegisterPassword ? "Скрыть пароль" : "Показать пароль"}
                        >
                          {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Имя *</Label>
                      <Input
                        placeholder="Имя"
                        className="h-9 text-foreground"
                        value={registerManagerForm.firstName || ''}
                        onChange={(e) =>
                          setRegisterManagerForm((prev) => ({ ...prev, firstName: e.target.value }))
                        }
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Фамилия *</Label>
                      <Input
                        placeholder="Фамилия"
                        className="h-9 text-foreground"
                        value={registerManagerForm.lastName || ''}
                        onChange={(e) =>
                          setRegisterManagerForm((prev) => ({ ...prev, lastName: e.target.value }))
                        }
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <PhoneInput
                        key={`register-manager-phone-${phoneInputRevision}`}
                        id="register-manager-phone"
                        label="Телефон *"
                        value={registerManagerForm.phoneNumber || ''}
                        onChange={(value) =>
                          setRegisterManagerForm((prev) => ({ ...prev, phoneNumber: value }))
                        }
                        defaultCountryIso="BY"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <HotelSearchField
                        label="Отель (необязательно)"
                        placeholder="Название отеля"
                        hotels={hotels.map((h) => ({
                          id: Number(h.id),
                          name: h.name,
                          city: typeof h.city === "string" ? h.city : undefined,
                        }))}
                        value={registerManagerForm.hotelId}
                        onChange={(hotelId) =>
                          setRegisterManagerForm((prev) => ({ ...prev, hotelId }))
                        }
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4 h-9"
                    onClick={async () => {
                        if (!registerManagerForm.email || !registerManagerForm.password ||
                            !registerManagerForm.firstName || !registerManagerForm.lastName) {
                          toast.error("Заполните все обязательные поля");
                          return;
                        }

                        const phoneDigits = (registerManagerForm.phoneNumber || "").replace(/\D/g, "");
                        if (phoneDigits.length < 10) {
                          toast.error("Введите корректный номер телефона");
                          return;
                        }

                        try {
                          // Single endpoint for manager registration
                          const response = await fetch(`${getApiBaseUrl()}/auth/register-manager`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                            },
                            body: JSON.stringify({
                              email: registerManagerForm.email,
                              password: registerManagerForm.password,
                              firstName: registerManagerForm.firstName,
                              lastName: registerManagerForm.lastName,
                              phoneNumber: registerManagerForm.phoneNumber,
                              hotelId: registerManagerForm.hotelId || undefined,
                            }),
                          });

                          const data = await response.json();

                          if (!response.ok || !data.success) {
                            toast.error(data.message || "Ошибка при регистрации менеджера");
                            return;
                          }

                          toast.success(
                            registerManagerForm.hotelId
                              ? "Менеджер успешно зарегистрирован и назначен на отель"
                              : "Менеджер успешно зарегистрирован без отеля"
                          );
                          setRegisterManagerForm({
                            email: '',
                            password: '',
                            firstName: '',
                            lastName: '',
                            phoneNumber: '',
                            hotelId: 0
                          });
                          refetchUsers();
                          refetchHotels();
                        } catch (error) {
                          toast.error("Ошибка при регистрации менеджера");
                          console.error(error);
                        }
                      }}
                    >
                      Зарегистрировать менеджера
                    </Button>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Hotel Dialog */}
      <Dialog open={hotelDialogOpen} onOpenChange={(open) => {
        setHotelDialogOpen(open);
        if (!open) {
          resetHotelForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-playfair text-3xl font-semibold">
              {editingHotel ? "Редактирование отеля" : "Добавление отеля"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название *</Label>
              <Input
                value={hotelForm.name}
                onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
                placeholder="Введите название отеля"
              />
            </div>

            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                rows={4}
                value={hotelForm.description}
                onChange={(e) => setHotelForm({ ...hotelForm, description: e.target.value })}
                placeholder="Введите описание отеля"
              />
            </div>

            <ManagerMultiSearchField
              users={users}
              selectedIds={hotelForm.managerUserIds}
              onToggle={toggleHotelFormManager}
              assignedToAnyHotelIds={assignedToAnyHotelIds}
              minSelected={1}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Звезды</Label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((starValue) => (
                    <button
                      key={starValue}
                      type="button"
                      className="p-1 text-yellow-400 hover:scale-110 transition-transform"
                      onClick={() => setHotelForm({ ...hotelForm, stars: starValue })}
                    >
                      <Star
                        className={
                          starValue <= hotelForm.stars
                            ? "w-6 h-6 fill-yellow-400 text-yellow-400"
                            : "w-6 h-6 text-muted-foreground"
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Город *</Label>
                <Select
                  value={hotelForm.cityId ? String(hotelForm.cityId) : ""}
                  onValueChange={(value) => {
                    setHotelForm({ ...hotelForm, cityId: Number(value) });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите город">
                      {hotelForm.cityId
                        ? cities.find((city) => Number(city.id) === Number(hotelForm.cityId))?.name || "Выберите город"
                        : "Выберите город"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={String(city.id)}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Удобства отеля</Label>
              <div className="space-y-3 p-3 border rounded-md min-h-[60px]">
                {hotelAmenityTypes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Загрузка удобств...</p>
                ) : (
                  hotelAmenityTypes.map((amenityType) => {
                    const isSelected = hotelForm.amenityTypeIds.includes(amenityType.id);
                    return (
                      <div
                        key={amenityType.id}
                        className="flex items-center space-x-2 rounded-md px-2 py-1.5"
                      >
                        <Checkbox
                          id={`hotel-amenity-${amenityType.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setHotelForm({
                                ...hotelForm,
                                amenityTypeIds: [...hotelForm.amenityTypeIds, amenityType.id],
                              });
                            } else {
                              setHotelForm({
                                ...hotelForm,
                                amenityTypeIds: hotelForm.amenityTypeIds.filter(
                                  (id) => id !== amenityType.id,
                                ),
                              });
                            }
                          }}
                        />
                        <Label
                          htmlFor={`hotel-amenity-${amenityType.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {amenityType.name}
                        </Label>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Адрес *</Label>
              <Input
                value={hotelForm.address}
                onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })}
                placeholder="Введите адрес отеля"
                disabled
                className="text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Адрес задается точкой на карте и не редактируется вручную.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Расположение на карте</Label>
              <p className="text-xs text-muted-foreground">
                Кликните по карте, чтобы указать точку, где находится отель. При выборе города карта приближается к нему.
              </p>
              <div className="h-64 rounded-lg border border-border overflow-hidden bg-muted">
                <div ref={mapRef} className="w-full h-full" />
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Координаты:{" "}
                {hotelForm.latitude && hotelForm.longitude
                  ? `${hotelForm.latitude.toFixed(6)}, ${hotelForm.longitude.toFixed(6)}`
                  : "не выбрано"}
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-foreground font-semibold">Фотографии отеля</Label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleHotelImageChange(file);
                    }
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={hotelForm.images.length >= 5}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {hotelForm.images.length === 0
                    ? "Добавить фото"
                    : `Добавить фото (${hotelForm.images.length}/5)`}
                </Button>
                {hotelForm.images.length >= 5 && (
                  <span className="text-xs text-muted-foreground">Максимум 5 фото</span>
                )}
              </div>

              {hotelForm.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {hotelForm.images.map((img, idx) => (
                    <div
                      key={`${img}-${idx}`}
                      className={`relative group aspect-square rounded-xl transition-all ${
                        idx === 0
                          ? "ring-2 ring-yellow-500 ring-offset-2 ring-offset-background rounded-xl"
                          : ""
                      }`}
                    >
                      <div className={`relative w-full h-full rounded-xl overflow-hidden bg-gray-900/50 ${
                        idx !== 0 ? "border border-border" : ""
                      }`}>
                        <Image
                          src={normalizeHotelImageUrl(img)}
                          alt={`Фото ${idx + 1}`}
                          fill
                          unoptimized
                          className="object-cover transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-[5]" />
                        {idx === 0 && (
                          <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg z-10">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                            Главное
                          </div>
                        )}
                      </div>
                      {idx !== 0 && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetMainHotelImage(idx);
                            }}
                            className="w-9 h-9 bg-yellow-500 hover:bg-yellow-600 text-black rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg pointer-events-auto"
                            title="Сделать главным"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          </button>
                        </div>
                      )}
                      <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveHotelImage(idx);
                          }}
                          className="w-6 h-6 -mt-1 -mr-1 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg pointer-events-auto"
                          title="Удалить фото"
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {hotelForm.images.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    Желтая рамка — главное фото. Наведите на фото — затемнение, звезда по центру, крестик справа.
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setHotelDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSubmitHotel}
              disabled={createHotelMutation.isPending || updateHotelMutation.isPending}
            >
              {editingHotel ? "Сохранить изменения" : "Создать отель"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={blockHotelDialogOpen} onOpenChange={setBlockHotelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-playfair text-3xl font-semibold">
              Заблокировать отель
            </DialogTitle>
          </DialogHeader>
          {hotelToBlock && (
            <p className="text-sm text-muted-foreground">
              Отель: <span className="text-foreground font-medium">{hotelToBlock.name}</span>
            </p>
          )}
          <BlockReasonPicker
            reasons={HOTEL_BLOCK_REASONS}
            selectedReason={blockHotelReason}
            onSelectReason={setBlockHotelReason}
            customReason={blockHotelCustomReason}
            onCustomReasonChange={setBlockHotelCustomReason}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockHotelDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={submitBlockHotel} disabled={blockHotelMutation.isPending}>
              {blockHotelMutation.isPending ? "Блокировка..." : "Заблокировать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={blockUserDialogOpen} onOpenChange={setBlockUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-playfair text-3xl font-semibold">
              Заблокировать пользователя
            </DialogTitle>
          </DialogHeader>
          {userToBlock && (
            <p className="text-sm text-muted-foreground">
              {userToBlock.firstName} {userToBlock.lastName}{" "}
              <span className="text-foreground">({userToBlock.email})</span>
            </p>
          )}
          <BlockReasonPicker
            reasons={USER_BLOCK_REASONS}
            selectedReason={blockUserReason}
            onSelectReason={setBlockUserReason}
            customReason={blockUserCustomReason}
            onCustomReasonChange={setBlockUserCustomReason}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockUserDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={submitBlockUser} disabled={blockUserMutation.isPending}>
              {blockUserMutation.isPending ? "Блокировка..." : "Заблокировать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
