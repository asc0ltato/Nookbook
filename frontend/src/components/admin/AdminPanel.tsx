"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Hotel, Users, Ban, CheckCircle, X, Plus, Edit, Trash2,
  ExternalLink
} from "lucide-react";
import { hotelsApi, usersApi } from "@/lib/api";
import { normalizeHotelImageUrl } from "@/lib/imageUtils";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import type { Hotel as ApiHotel, User as ApiUser } from "@/types/api";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("hotels");
  const [deleteHotelId, setDeleteHotelId] = useState<number | null>(null);
  const [deleteHotelName, setDeleteHotelName] = useState("");

  const { data: hotelsResponse, refetch: refetchHotels } = useQuery({
    queryKey: ['admin-hotels'],
    queryFn: () => hotelsApi.getAll(),
  });

  const hotels: ApiHotel[] = (Array.isArray(hotelsResponse?.data) ? hotelsResponse.data : []);

  const blockHotelMutation = useMutation({
    mutationFn: (id: number) => hotelsApi.block(id, "Заблокирован администратором"),
    onSuccess: () => {
      toast.success("Отель заблокирован");
      refetchHotels();
    },
    onError: () => toast.error("Ошибка при блокировке"),
  });

  const unblockHotelMutation = useMutation({
    mutationFn: (id: number) => hotelsApi.unblock(id),
    onSuccess: () => {
      toast.success("Отель разблокирован");
      refetchHotels();
    },
    onError: () => toast.error("Ошибка при разблокировке"),
  });

  const deleteHotelMutation = useMutation({
    mutationFn: (id: number) => hotelsApi.delete(id),
    onSuccess: () => {
      toast.success("Отель удален");
      refetchHotels();
    },
    onError: () => toast.error("Ошибка при удалении"),
  });

  const { data: usersResponse, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => {
      return Promise.resolve({ success: true, data: [] });
    },
  });

  const blockUserMutation = useMutation({
    mutationFn: (userId: number) => usersApi.block(userId, "Заблокирован администратором"),
    onSuccess: () => {
      toast.success("Пользователь заблокирован");
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
    onError: () => toast.error("Ошибка при разблокировке"),
  });

  const setManagerMutation = useMutation({
    mutationFn: ({ userId, isManager }: { userId: number; isManager: boolean }) =>
      usersApi.setManager(userId, isManager),
    onSuccess: () => {
      toast.success("Статус менеджера изменен");
      refetchUsers();
    },
    onError: () => toast.error("Ошибка"),
  });

  const getCitySlug = (hotel: ApiHotel) => {
    const cityName = (typeof hotel.city === "string" ? hotel.city : hotel.city?.name || "").toLowerCase();
    const cityMap: Record<string, string> = {
      'минск': 'minsk', 'брест': 'brest', 'витебск': 'vitebsk',
      'гомель': 'gomel', 'гродно': 'grodno', 'могилев': 'mogilev'
    };
    return cityMap[cityName] || cityName;
  };

  return (
    <div className="min-h-screen page-backdrop">
      <Header />
      
      <main className="pt-[calc(var(--header-height)+2rem)] pb-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-300 to-yellow-400 bg-clip-text text-transparent">
              Панель администратора
            </h1>
            <p className="text-muted-foreground">
              Управление отелями и пользователями
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="hotels" className="flex items-center gap-2">
                <Hotel className="w-4 h-4" />
                Отели
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Пользователи
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hotels">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Управление отелями</h2>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить отель
                  </Button>
                </div>

                {Array.isArray(hotels) && hotels.length === 0 ? (
                  <Card className="p-12 text-center">
                    <p className="text-muted-foreground">Отели не найдены</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.isArray(hotels) && hotels.map((hotel: ApiHotel) => (
                      <Card key={hotel.id} className="p-4 hover:shadow-lg transition-shadow">
                        <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4 bg-gray-200">
                          <Image
                            src={normalizeHotelImageUrl((hotel as any).images?.[0] || (hotel as any).imageUrl)}
                            alt={hotel.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/assets/hotels/block.jpg";
                            }}
                          />
                          {hotel.isBlocked && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Badge variant="destructive">Заблокирован</Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-bold text-lg">{hotel.name}</h3>
                          <Link
                            href={`/hotels/${getCitySlug(hotel)}/${hotel.id}`}
                            target="_blank"
                            className="text-primary hover:text-primary/80 ml-2 flex-shrink-0"
                            title="Открыть страницу отеля"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {typeof hotel.city === "string" ? hotel.city : (hotel.city?.name || "")}
                        </p>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-1">
                            <Badge>{hotel.stars} ★</Badge>
                            <Badge className="bg-green-500">{hotel.rating.toFixed(1)}</Badge>
                          </div>
                          <div className="font-bold text-primary">
                            {(hotel.price || 0).toLocaleString()} BYN
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              toast.info("Редактирование отеля");
                            }}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Редактировать
                          </Button>
                          {hotel.isBlocked ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => unblockHotelMutation.mutate(Number(hotel.id))}
                              disabled={unblockHotelMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Разблокировать
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => blockHotelMutation.mutate(Number(hotel.id))}
                              disabled={blockHotelMutation.isPending}
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Заблокировать
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setDeleteHotelId(Number(hotel.id));
                              setDeleteHotelName(hotel.name);
                            }}
                            disabled={deleteHotelMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Управление пользователями</h2>
                </div>

                <Card className="p-12 text-center">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Функция просмотра всех пользователей требует дополнительного API endpoint
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Используйте API endpoint для получения списка пользователей
                  </p>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />

      <AlertDialog open={!!deleteHotelId} onOpenChange={(open) => !open && setDeleteHotelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить отель?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить отель "{deleteHotelName}"? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteHotelId) {
                  deleteHotelMutation.mutate(deleteHotelId);
                  setDeleteHotelId(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPanel;

