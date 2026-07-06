"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
  allowedPaths?: string[];
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = "/",
  allowedPaths = [],
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, isAdmin, isManager } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isElevatedUser = useMemo(() => {
    return isAuthenticated && (isAdmin() || isManager());
  }, [isAuthenticated, isAdmin, isManager]);

  const isGuest = !isAuthenticated;

  const publicPaths = ['/', '/hotels', '/hotels/'];
  const isPublicPath = mounted
    ? publicPaths.some(path => {
        const currentPath = window.location.pathname;
        if (path === '/') return currentPath === '/';
        if (path.endsWith('/')) return currentPath.startsWith(path);
        return currentPath === path || currentPath.startsWith(path + '/');
      })
    : false;

  useEffect(() => {
    if (!isLoading && mounted) {
      if (isGuest && isPublicPath) {
        return;
      }

      if (!isAuthenticated) {
        const currentPath = window.location.pathname;
        if (currentPath === redirectTo || redirectTo === "/") {
          return;
        }
        const suppress = window.localStorage.getItem("suppress_auth_toast");
        if (suppress === "1") {
          window.localStorage.removeItem("suppress_auth_toast");
          setTimeout(() => {
            window.location.href = redirectTo;
          }, 100);
          return;
        }

        setTimeout(() => {
          window.location.href = redirectTo;
        }, 100);
        return;
      }

      if (requiredRole && !hasRole(requiredRole)) {
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 100);
        return;
      }

      if (isElevatedUser && allowedPaths.length > 0) {
        const currentPath = window.location.pathname;
        const isAdminPath = currentPath.startsWith('/admin');
        const isManagerPath = currentPath.startsWith('/manager');

        if ((isAdminPath && !isAdmin()) || (isManagerPath && !isManager())) {
          const dashboardPath = isAdmin() ? '/admin' : '/manager';
          setTimeout(() => {
            window.location.href = dashboardPath;
          }, 100);
        }
      }
    }
  }, [isAuthenticated, isLoading, hasRole, requiredRole, redirectTo, isElevatedUser, allowedPaths, isGuest, isPublicPath, mounted, isAdmin, isManager]);

  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (isGuest && isPublicPath) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isElevatedUser && allowedPaths.length > 0) {
    const currentPath = window.location.pathname;
    const isAdminPath = currentPath.startsWith('/admin');
    const isManagerPath = currentPath.startsWith('/manager');

    if ((isAdminPath && !isAdmin()) || (isManagerPath && !isManager())) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Перенаправление...</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}