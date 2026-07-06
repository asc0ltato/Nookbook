"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { UserRole, AuthService, mapApiUserToUser, getAvatarInitials } from "@/lib/auth";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Mail, Phone, Edit, Save, X, Trash2, Lock, Camera, Upload } from "lucide-react";
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
import { usersApi, bookingsApi, reviewsApi, uploadsApi } from "@/lib/api";
import { toast } from "sonner";
import type { User as ApiUser, Booking } from "@/types/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function ProfilePage() {
  return (
    <ProtectedRoute requiredRole={UserRole.User}>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}

function ProfilePageContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: authUser, logout, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const userId = authUser?.id ?? 0;
  const userIdReady = userId > 0;

  const { data: userResponse, refetch: refetchUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => usersApi.getById(userId),
    enabled: userIdReady,
    refetchOnMount: 'always',
  });

  const user = userResponse?.data as ApiUser | null;
  const profileAvatar = user?.avatar || authUser?.avatar;
  const userInitials = getAvatarInitials({
    firstName: user?.firstName || authUser?.firstName,
    lastName: user?.lastName || authUser?.lastName,
    name: authUser?.name,
    email: user?.email || authUser?.email,
  });

  const { data: bookingsResponse, refetch: refetchBookings } = useQuery({
    queryKey: ['user-bookings', userId],
    queryFn: () => bookingsApi.getUserBookings(userId),
    enabled: userIdReady,
    refetchOnMount: 'always',
  });

  const bookings: Booking[] = (Array.isArray(bookingsResponse?.data) ? bookingsResponse.data : []);

  const { data: reviewsResponse } = useQuery({
    queryKey: ['user-reviews', userId],
    queryFn: () => reviewsApi.getByUser(userId),
    enabled: userIdReady,
  });

  const reviews: any[] = (Array.isArray(reviewsResponse?.data) ? reviewsResponse.data : []);

  const cancelBookingMutation = useMutation({
    mutationFn: (bookingId: number) => bookingsApi.cancel(bookingId, userId),
    onSuccess: () => {
      toast.success("Бронирование отменено");
      refetchBookings();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Ошибка при отмене бронирования");
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: (reviewData: any) => reviewsApi.create(reviewData),
    onSuccess: () => {
      toast.success("Отзыв успешно отправлен на модерацию");
      setShowReviewDialog(false);
      setReviewRating(10);
      setReviewComment("");
      setReviewHotelId(null);
      setReviewBookingId(null);
      setReviewHotelName("");
      refetchBookings();
    },
    onError: (error: any) => {
      const firstError = error?.response?.data?.errors?.[0];
      const errorMessage =
        firstError ||
        error?.response?.data?.message ||
        error?.message ||
        "Ошибка при создании отзыва";
      toast.error(errorMessage);
    },
  });

  const handleCancelBooking = (bookingId: number) => {
    if (confirm("Вы уверены, что хотите отменить бронирование?")) {
      cancelBookingMutation.mutate(bookingId);
    }
  };

  const handleWriteReview = (hotelId: number, hotelName: string, bookingId: number) => {
    setReviewHotelId(hotelId);
    setReviewHotelName(hotelName);
    setReviewBookingId(bookingId);
    setShowReviewDialog(true);
  };

  const handleSubmitReview = () => {
    if (!reviewHotelId || !reviewBookingId || !reviewComment.trim()) {
      toast.error("Заполните все поля");
      return;
    }
    createReviewMutation.mutate({
      userId,
      hotelId: reviewHotelId,
      bookingId: reviewBookingId,
      rating: reviewRating,
      comment: reviewComment,
    });
  };

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    avatar: "",
  });
  const [phoneValid, setPhoneValid] = useState(true);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewHotelId, setReviewHotelId] = useState<number | null>(null);
  const [reviewBookingId, setReviewBookingId] = useState<number | null>(null);
  const [reviewHotelName, setReviewHotelName] = useState<string>("");
  const [reviewRating, setReviewRating] = useState<number>(10);
  const [reviewComment, setReviewComment] = useState<string>("");

  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber: user.phoneNumber || "",
        avatar: user.avatar || "",
      });
      setAvatarPreview("");
      setAvatarFile(null);
    }
  }, [user, isEditing]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Размер файла не должен превышать 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("Выберите изображение");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateMutation = useMutation({
    mutationFn: (data: any) => usersApi.update(userId, data),
    onSuccess: async (response) => {
      toast.success("Профиль обновлен");
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview("");

      if (response?.data) {
        queryClient.setQueryData(['user', userId], response);
        const mappedUser = mapApiUserToUser(response.data as Record<string, unknown>);
        const token = AuthService.getToken();
        if (token) {
          AuthService.setAuth(token, AuthService.getRefreshToken() || token, mappedUser);
        }
      }

      await Promise.all([
        refetchUser(),
        refreshUser(),
        queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
        queryClient.invalidateQueries({ queryKey: ["reviews-moderation"] }),
        queryClient.invalidateQueries({ queryKey: ["complaints-moderation"] }),
        queryClient.invalidateQueries({ queryKey: ["header-notifications"] }),
      ]);
    },
    onError: () => {
      toast.error("Ошибка при обновлении профиля");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string | null; newPassword: string }) => 
      usersApi.changePassword(userId, data.currentPassword, data.newPassword),
    onSuccess: () => {
      const message = user?.hasPassword === false 
        ? "Пароль успешно установлен" 
        : "Пароль успешно изменен";
      toast.success(message);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordDialog(false);
      refetchUser();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Ошибка при изменении пароля");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => usersApi.delete(userId),
    onSuccess: () => {
      toast.success("Профиль удален");
      logout();
      router.push("/");
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || "Ошибка при удалении профиля";
      toast.error(errorMessage);
      console.error("Delete profile error:", error);
    },
  });

  const handleSave = async () => {
    if (formData.phoneNumber && !phoneValid) {
      toast.error("Введите корректный номер телефона");
      return;
    }
    try {
      let avatar = user?.avatar || "";
      if (avatarFile) {
        avatar = await uploadsApi.uploadAvatar(avatarFile);
      } else if (formData.avatar && !formData.avatar.startsWith("data:")) {
        avatar = formData.avatar;
      }
      await updateMutation.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        avatar,
      });
    } catch {
      toast.error(avatarFile ? "Ошибка при загрузке аватара" : "Ошибка при обновлении профиля");
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber: user.phoneNumber || "",
        avatar: user.avatar || "",
      });
    }
    setAvatarFile(null);
    setAvatarPreview("");
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    const hasPassword = user?.hasPassword !== false;
    
    if (hasPassword && !passwordData.currentPassword) {
      toast.error("Введите текущий пароль");
      return;
    }
    
    if (!passwordData.newPassword) {
      toast.error("Введите новый пароль");
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Новые пароли не совпадают");
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error("Пароль должен содержать минимум 6 символов");
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword: hasPassword ? passwordData.currentPassword : null,
      newPassword: passwordData.newPassword,
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="pt-[calc(var(--header-height)+2rem)] pb-12">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Личный кабинет
            </h1>
          </div>

          <Card className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Информация о профиле</h2>
                <p className="text-muted-foreground">
                  Управляйте своей личной информацией
                </p>
              </div>
              <div className="flex gap-2">
                {!isEditing ? (
                  <>
                    <Button onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Редактировать
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Удалить
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="border-border text-muted-foreground hover:bg-muted"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Отмена
                    </Button>
                    <Button onClick={handleSave} disabled={updateMutation.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      Сохранить
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-border relative">
                    {isEditing && avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <UserAvatar
                        avatar={profileAvatar}
                        alt="Avatar"
                        initials={userInitials}
                        fill
                        fallbackClassName="bg-primary/10 text-primary text-lg"
                      />
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-muted-foreground">{user?.email}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName">Имя</Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 text-lg font-semibold">{user?.firstName || "-"}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Фамилия</Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <div className="mt-1 text-lg font-semibold">{user?.lastName || "-"}</div>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-lg">{user?.email || "-"}</span>
                  </div>
                </div>
                <div>
                  {isEditing ? (
                    <PhoneInput
                      id="phoneNumber"
                      label="Телефон"
                      value={formData.phoneNumber}
                      onChange={(value) => setFormData({ ...formData, phoneNumber: value })}
                      onValidityChange={setPhoneValid}
                      defaultCountryIso="BY"
                    />
                  ) : (
                    <div className="mt-7 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-lg">{user?.phoneNumber || "-"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 mt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Безопасность</h2>
                <p className="text-muted-foreground">
                  {user?.hasPassword === false 
                    ? "Установите пароль для входа через email и пароль" 
                    : "Измените пароль для защиты аккаунта"}
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
                <Lock className="w-4 h-4 mr-2" />
                {user?.hasPassword === false ? "Установить пароль" : "Изменить пароль"}
              </Button>
            </div>
          </Card>
          
          <Dialog open={showPasswordDialog} onOpenChange={(open) => {
            setShowPasswordDialog(open);
            if (!open) {
              setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-playfair text-3xl font-semibold">
                  {user?.hasPassword === false ? "Установка пароля" : "Изменение пароля"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {user?.hasPassword !== false && (
                  <div>
                    <Label htmlFor="currentPassword">Текущий пароль</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="newPassword">Новый пароль</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Подтвердите новый пароль</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleChangePassword}
                  disabled={changePasswordMutation.isPending}
                  className="w-full"
                >
                  {changePasswordMutation.isPending 
                    ? (user?.hasPassword === false ? "Установка..." : "Изменение...")
                    : (user?.hasPassword === false ? "Установить пароль" : "Изменить пароль")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить профиль</AlertDialogTitle>
                <AlertDialogDescription>
                  Вы уверены, что хотите удалить свой профиль? Это действие необратимо и все ваши данные будут удалены.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border text-muted-foreground hover:bg-muted">
                  Отмена
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Удаление..." : "Удалить"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-playfair text-3xl font-semibold">Написать отзыв</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Отель</Label>
                  <p className="text-lg font-semibold">{reviewHotelName}</p>
                </div>
                <div>
                  <Label>Оценка (от 1 до 10)</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setReviewRating(rating)}
                        className={`px-3 py-2 rounded-lg border-2 transition-colors ${
                          rating === reviewRating
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:border-primary"
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Выбрано: {reviewRating}
                  </p>
                </div>
                <div>
                  <Label htmlFor="reviewComment">Комментарий</Label>
                  <Textarea
                    id="reviewComment"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="mt-1"
                    rows={5}
                    placeholder="Поделитесь своими впечатлениями..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleSubmitReview}
                  disabled={createReviewMutation.isPending || !reviewComment.trim()}
                  className="w-full"
                >
                  {createReviewMutation.isPending ? "Отправка..." : "Отправить"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
