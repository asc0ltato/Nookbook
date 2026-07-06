
import { authApi } from './api';

export enum UserRole {
  Guest = 'guest',
  User = 'user',
  Manager = 'manager',
  Admin = 'admin',
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  phoneNumber?: string;
  createdAt: string;
}

export function parseUserRole(role?: string): UserRole {
  const normalized = String(role ?? "user").trim().toLowerCase();
  switch (normalized) {
    case "admin":
      return UserRole.Admin;
    case "manager":
      return UserRole.Manager;
    case "guest":
      return UserRole.Guest;
    default:
      return UserRole.User;
  }
}

export function mapApiUserToUser(raw: Record<string, unknown>): User {
  const firstName = String(raw.firstName ?? "").trim();
  const lastName = String(raw.lastName ?? "").trim();
  const email = String(raw.email ?? "");
  const name =
    String(raw.name ?? "").trim() ||
    `${firstName} ${lastName}`.trim() ||
    email;

  return {
    id: Number(raw.id),
    name,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    email,
    avatar: raw.avatar ? String(raw.avatar) : undefined,
    role: parseUserRole(String(raw.role ?? "user")),
    phoneNumber: raw.phoneNumber ? String(raw.phoneNumber) : undefined,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

export function getUserDisplayName(user: User): string {
  if (user.lastName || user.firstName) {
    return [user.lastName, user.firstName].filter(Boolean).join(" ");
  }
  const parts = user.name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts.slice(1).join(" ")} ${parts[0]}`;
  }
  return user.name || user.email;
}

export function getUserRoleLabel(role: UserRole): string {
  switch (role) {
    case UserRole.Admin:
      return "Администратор";
    case UserRole.Manager:
      return "Менеджер";
    case UserRole.User:
      return "Пользователь";
    default:
      return "Гость";
  }
}

function isOAuthAvatarHost(value: string): boolean {
  return /googleusercontent\.com|ggpht\.com|mail\.ru|filin\.mail\.ru/i.test(value);
}

function isAvatarPlaceholder(value: string): boolean {
  return value.length <= 3 && !value.includes("/") && !value.includes(".");
}

function getPublicOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5223/api";
  return apiBase.replace(/\/api\/?$/, "");
}

export function resolveAvatarUrl(avatar?: string): string | null {
  if (!avatar) return null;
  let trimmed = avatar.trim();
  if (!trimmed || isAvatarPlaceholder(trimmed)) return null;
  if (trimmed.startsWith("data:")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (isOAuthAvatarHost(trimmed)) return `https://${trimmed.replace(/^\/+/, "")}`;
  if (!trimmed.startsWith("/")) {
    trimmed = trimmed.startsWith("assets/") ? `/${trimmed}` : `/${trimmed}`;
  }
  return `${getPublicOrigin()}${trimmed}`;
}

export function shouldUnoptimizeAvatar(url: string): boolean {
  return (
    url.startsWith("data:") ||
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("//")
  );
}

export function getAvatarInitials(user: {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
}): string {
  const fromNames = `${user.lastName?.[0] ?? ""}${user.firstName?.[0] ?? ""}`.toUpperCase();
  if (fromNames) return fromNames;
  const fromName = user.name?.trim()?.[0]?.toUpperCase();
  if (fromName) return fromName;
  return user.email?.[0]?.toUpperCase() || "U";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

export class AuthService {
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  static getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem(USER_KEY);
    if (!userData) return null;
    try {
      const parsed = JSON.parse(userData) as User;
      return { ...parsed, role: parseUserRole(parsed.role) };
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }

  static setAuth(accessToken: string, refreshToken: string, user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  static clearAuth(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static hasRole(role: UserRole): boolean {
    const user = this.getUser();
    if (!user) return false;

    const roleHierarchy = {
      [UserRole.Guest]: 0,
      [UserRole.User]: 1,
      [UserRole.Manager]: 2,
      [UserRole.Admin]: 3,
    };

    const currentRole = parseUserRole(user.role);
    return roleHierarchy[currentRole] >= roleHierarchy[role];
  }

  static isAdmin(): boolean {
    const user = this.getUser();
    return parseUserRole(user?.role) === UserRole.Admin;
  }

  static isManager(): boolean {
    return this.hasRole(UserRole.Manager);
  }

  static async login(email: string, password: string): Promise<User> {
    const response = await authApi.login(email, password);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Ошибка входа');
    }

    const { token, user } = response.data;
    
    const mappedUser = mapApiUserToUser(user as Record<string, unknown>);
    this.setAuth(token, token, mappedUser);
    return mappedUser;
  }

  static async register(name: string, email: string, password: string): Promise<User> {
    try {
      console.log('AuthService.register called with:', { name, email });
      const response = await authApi.register(name, email, password);
      console.log('API response:', response);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Ошибка регистрации');
      }

      const { token, user } = response.data;
      console.log('Token and user received:', { token: token?.substring(0, 20) + '...', user });
      
      const mappedUser = mapApiUserToUser(user as Record<string, unknown>);
      console.log('Mapped user:', mappedUser);
      this.setAuth(token, token, mappedUser);
      
      return mappedUser;
    } catch (error) {
      console.error('AuthService.register error:', error);
      throw error;
    }
  }

  static logout(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('suppress_auth_toast', '1');
    }
    this.clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  static async sendLoginCode(email: string): Promise<void> {
    const response = await authApi.sendLoginCode(email);
    
    if (!response.success) {
      throw new Error(response.message || 'Ошибка отправки кода');
    }
  }

  static async loginByCode(email: string, code: string): Promise<User> {
    const response = await authApi.loginByCode(email, code);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Ошибка входа');
    }

    const { token, user } = response.data;
    
    const mappedUser = mapApiUserToUser(user as Record<string, unknown>);
    this.setAuth(token, token, mappedUser);
    return mappedUser;
  }

  static async forgotPassword(email: string): Promise<void> {
    const response = await authApi.forgotPassword(email);
    
    if (!response.success) {
      throw new Error(response.message || 'Ошибка отправки кода');
    }
  }

  static async verifyCode(email: string, code: string): Promise<string> {
    const response = await authApi.verifyCode(email, code);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Неверный код');
    }

    return response.data.resetToken;
  }

  static async resendCode(email: string): Promise<void> {
    const response = await authApi.resendCode(email);
    
    if (!response.success) {
      throw new Error(response.message || 'Ошибка отправки кода');
    }
  }

  static async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    const response = await authApi.resetPassword(resetToken, newPassword);
    
    if (!response.success) {
      throw new Error(response.message || 'Ошибка сброса пароля');
    }
  }

  static async refreshAccessToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await authApi.refreshToken(refreshToken);
    
    if (!response.success || !response.data) {
      this.clearAuth();
      throw new Error('Token refresh failed');
    }

    const newToken = response.data.token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, newToken);
    }
    
    return newToken;
  }

  static async fetchCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error('No token');
    }

    const response = await authApi.getCurrentUser(token);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch user');
    }

    const mappedUser = mapApiUserToUser(response.data as Record<string, unknown>);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(mappedUser));
    }
    
    return mappedUser;
  }

  static loginWithGoogle(): void {
    if (typeof window === 'undefined') return;
    
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('NEXT_PUBLIC_GOOGLE_CLIENT_ID не настроен');
      return;
    }
    
    const redirectUri = `${window.location.origin}/api/auth/callback/google`;
    const scope = 'openid email profile';
    const responseType = 'code';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
    
    window.location.href = authUrl;
  }

  static loginWithMailru(): void {
    if (typeof window === 'undefined') return;
    
    const clientId = process.env.NEXT_PUBLIC_MAILRU_CLIENT_ID;
    if (!clientId) {
      console.error('NEXT_PUBLIC_MAILRU_CLIENT_ID не настроен');
      return;
    }
    
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('oauth_state_mailru', state);
    
    const redirectUri = `${window.location.origin}/api/auth/callback/mailru`;
    const responseType = 'code';
    
    const authUrl = `https://oauth.mail.ru/login?client_id=${clientId}&response_type=${responseType}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
    
    window.location.href = authUrl;
  }
}
