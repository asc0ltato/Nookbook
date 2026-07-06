"use client";

import React from "react";
import {
  Heart,
  Search,
  LogOut,
  Calendar,
  Settings,
  Bell,
  BookOpen,
  Star,
  AlertTriangle,
  Megaphone,
  Info,
  ShieldOff,
  ChevronDown,
  Gem,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { CompactSearchBar } from "@/components/home/CompactSearchBar";
import { Logo } from "@/components/shared/Logo";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { AuthDialog } from "@/components/shared/AuthDialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  User,
  getUserDisplayName,
  getUserRoleLabel,
  getAvatarInitials,
} from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api";
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
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export const Header = () => {
  const pathname = usePathname();
  const params = useParams();
  const city = params?.city as string;
  const { isAuthenticated, user, logout, isAdmin, isManager } = useAuth();
  
  const isElevatedUser = isAuthenticated && (isAdmin() || isManager());
  const showCompactSearch = pathname?.includes('/hotels/') && city;
  const [showSearchBar, setShowSearchBar] = React.useState(false);
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const notificationsRef = React.useRef<HTMLDivElement | null>(null);
  const userMenuRef = React.useRef<HTMLDivElement | null>(null);

  const { data: notificationsResponse, refetch: refetchNotifications } = useQuery({
    queryKey: ["header-notifications", user?.id],
    queryFn: () => notificationsApi.getMy(20),
    enabled: isAuthenticated,
    refetchInterval: 20000,
  });

  const notifications = Array.isArray((notificationsResponse as any)?.data)
    ? (notificationsResponse as any).data
    : [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const markReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationsApi.markRead(notificationId),
    onSuccess: () => refetchNotifications(),
  });

  const markAllAsRead = () => {
    const unread = notifications.filter((n: any) => !n.isRead);
    unread.forEach((item: any) => markReadMutation.mutate(item.id));
  };

  const resolveNotificationHref = (item: { link?: string; type?: number }) => {
    if (item.type === 5) {
      if (isAdmin()) return "/admin";
      if (isManager()) return "/managers";
    }
    if (item.link) return item.link;
    return "/bookings";
  };

  React.useEffect(() => {
    if (!showNotifications && !showUserMenu) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (showNotifications && notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (showUserMenu && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showNotifications, showUserMenu]);

  const handleLogout = () => {
    logout();
    setShowLogoutDialog(false);
  };

  return (
    <>
      {showCompactSearch && showSearchBar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setShowSearchBar(false)} />
      )}
      <header className={`fixed top-0 left-0 right-0 z-50 border-b border-border transition-all ${
        showCompactSearch && showSearchBar 
          ? 'bg-background/95 backdrop-blur-md' 
          : 'bg-background/95 backdrop-blur-sm'
      }`}>
        <div className="container mx-auto px-6 max-w-7xl h-[60px] flex items-center justify-between">
          {isElevatedUser ? (
            <div className="flex items-center gap-3">
              <Logo size={40} />
              <span className="text-2xl font-serif font-semibold tracking-tight">NookBook</span>
            </div>
          ) : (
            <Link href="/hotels" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Logo size={40} />
              <span className="text-2xl font-serif font-semibold tracking-tight">NookBook</span>
            </Link>
          )}
          
          {showCompactSearch && showSearchBar && (
            <div className="absolute top-full left-0 right-0 mt-0 z-50 bg-background border-b border-border shadow-lg">
              <div className="container mx-auto px-6 py-4">
                <CompactSearchBar prefillCity={city} onClose={() => setShowSearchBar(false)} />
              </div>
            </div>
          )}
        
        <nav className="flex items-center gap-2 ml-auto">
          <ThemeToggle />
          {showCompactSearch && !isElevatedUser && (
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:text-primary hover:bg-secondary h-9 w-9"
              title="Поиск"
              onClick={() => setShowSearchBar(!showSearchBar)}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
          
          {isAuthenticated && (
            <div className="relative" ref={notificationsRef}>
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground hover:text-primary hover:bg-secondary h-9 w-9"
                title="Уведомления"
                onClick={() => setShowNotifications((v) => !v)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-popover shadow-xl p-2 z-50">
                  <div className="px-2 py-1 flex items-center justify-between">
                    <span className="text-sm font-semibold">Уведомления</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                        onClick={markAllAsRead}
                      >
                        Прочитать все
                      </button>
                    )}
                  </div>
                  <div className={`${notifications.length >= 6 ? "max-h-80 overflow-y-auto pr-1" : ""} space-y-1`}>
                    {notifications.length === 0 ? (
                      <div className="px-2 py-3 text-sm text-muted-foreground">Пока пусто</div>
                    ) : (
                      notifications.map((item: any) => {    
                        const typeIcons: Record<number, React.ReactNode> = {
                          0: <BookOpen className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />,
                          1: <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />,
                          2: <AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />,
                          3: <Megaphone className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />,
                          4: <Info className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />,
                          5: <ShieldOff className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />,
                        };
                        const icon = typeIcons[item.type ?? 4] ?? typeIcons[4];
                        return (
                          <Link
                            key={item.id}
                            href={resolveNotificationHref(item)}
                            className={`flex items-start gap-2 rounded-md px-2 py-2 hover:bg-muted ${item.isRead ? "" : "bg-primary/10"}`}
                            onClick={() => {
                              setShowNotifications(false);
                              if (!item.isRead) {
                                markReadMutation.mutate(item.id);
                              }
                            }}
                          >
                            <span className="mt-0.5">{icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{item.title}</div>
                              <div className="text-xs text-muted-foreground line-clamp-2">{item.message}</div>
                              <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                                {new Date(item.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            {!item.isRead && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {isAuthenticated && !isElevatedUser && (
            <Link href="/favorites">
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground hover:text-primary hover:bg-secondary h-9 w-9"
                title="Избранное"
              >
                <Heart className="h-5 w-5" />
              </Button>
            </Link>
          )}
          
          {isAuthenticated && !isElevatedUser && (
            <Link href="/bookings">
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground hover:text-primary hover:bg-secondary h-9 w-9"
                title="Бронирования"
              >
                <Calendar className="h-5 w-5" />
              </Button>
            </Link>
          )}

          {isAuthenticated && !isElevatedUser && (
            <Link href="/my-reviews">
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground hover:text-primary hover:bg-secondary h-9 w-9"
                title="Мои отзывы"
              >
                <Star className="h-5 w-5" />
              </Button>
            </Link>
          )}
          
          {isAuthenticated && user && (
            <HeaderUserProfile
              user={user}
              isElevatedUser={isElevatedUser}
              isAdmin={isAdmin()}
              isManager={isManager()}
              open={showUserMenu}
              onOpenChange={setShowUserMenu}
              menuRef={userMenuRef}
              onLogout={() => {
                setShowUserMenu(false);
                setShowLogoutDialog(true);
              }}
            />
          )}

          {!isAuthenticated ? (
            <Button
              variant="outline"
              className="h-9 border-border text-foreground bg-transparent hover:border-primary hover:text-primary hover:bg-primary/10 dark:border-white/30 dark:text-white dark:hover:border-yellow-400 dark:hover:text-yellow-400 transition-all duration-200"
              onClick={() => setShowAuthDialog(true)}
            >
              Войти
            </Button>
          ) : null}
        </nav>
        </div>
      </header>
      
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-playfair text-3xl font-semibold">Выход из аккаунта</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите выйти? Вам придется войти снова для доступа к вашему профилю.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Выйти
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

function HeaderUserProfile({
  user,
  isElevatedUser,
  isAdmin,
  isManager,
  open,
  onOpenChange,
  menuRef,
  onLogout,
}: {
  user: User;
  isElevatedUser: boolean;
  isAdmin: boolean;
  isManager: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onLogout: () => void;
}) {
  const displayName = getUserDisplayName(user);
  const roleLabel = getUserRoleLabel(user.role);
  const initials = getAvatarInitials(user);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 hover:bg-secondary/80 transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <div className="relative flex-shrink-0">
          <div className="relative w-9 h-9 rounded-full overflow-hidden border border-border/60 bg-muted flex items-center justify-center">
            <UserAvatar
              avatar={user.avatar}
              alt={displayName}
              initials={initials}
              fill
              fallbackClassName="bg-muted text-foreground/80 text-xs font-semibold"
            />
          </div>
        </div>
        <div className="hidden sm:block text-left leading-tight min-w-0">
          <p className="text-sm font-semibold text-foreground truncate max-w-[140px]">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[140px]">{roleLabel}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-lg border border-border bg-popover shadow-xl py-1 z-50">
          <div className="px-3 py-2 border-b border-border/60 sm:hidden">
            <p className="text-sm font-semibold text-foreground">{displayName}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
          {!isElevatedUser && (
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
              onClick={() => onOpenChange(false)}
            >
              <UserIcon className="w-4 h-4" />
              Профиль
            </Link>
          )}
          {(isAdmin || isManager) && (
            <Link
              href={isAdmin ? "/admin" : "/manager"}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
              onClick={() => onOpenChange(false)}
            >
              <Settings className="w-4 h-4" />
              {isAdmin ? "Панель администратора" : "Панель менеджера"}
            </Link>
          )}
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-muted"
            onClick={onLogout}
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </button>
        </div>
      )}
    </div>
  );
}
