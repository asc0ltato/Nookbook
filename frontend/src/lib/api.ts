import type { ReviewModerationList } from "@/types/api";

declare const process: {
  env: {
    NEXT_PUBLIC_API_URL?: string;
    BACKEND_URL?: string;
  };
};

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const configured = process.env.NEXT_PUBLIC_API_URL;
    if (configured) {
      try {
        const configuredOrigin = new URL(configured).origin;
        if (configuredOrigin !== window.location.origin) {
          return configured.replace(/\/$/, '');
        }
      } catch {
        return configured.replace(/\/$/, '');
      }
    }
    return `${window.location.origin}/api`;
  }

  const serverUrl =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5223/api';
  return serverUrl.replace(/\/$/, '');
}

export const API_BASE_URL = getApiBaseUrl();

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

async function tryRefreshToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json();
    if (res.ok && data?.success && data?.data?.token) {
      localStorage.setItem('auth_token', data.data.token);
      localStorage.setItem('refresh_token', data.data.token);
      return true;
    }
  } catch {
  }
  return false;
}

async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
  retried = false
): Promise<ApiResponse<T>> {
  try {
    const token = getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      ...options,
      headers,
    });

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && (contentType.includes('application/json') || contentType.includes('application/problem+json'))) {
      data = await response.json();
    } else {
      data = null;
    }
    
    if (response.ok) {
      if (response.status === 201) {
        return data;
      }
      if (data && data.success === false) {
        const error = new Error(data.message || data.errors?.[0] || 'Request failed') as any;
        error.response = { data };
        throw error;
      }
      return data;
    }
    
    if (response.status === 401 && !retried && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        return apiFetch<T>(endpoint, options, true);
      }
    }

    const errorMessage = data?.message || data?.errors?.[0] || (response.status === 404 ? 'Ресурс не найден' : 'Request failed');
    const error = new Error(errorMessage) as any;
    error.response = { data: data || {} };
    error.status = response.status;
    throw error;
  } catch (error: any) {
    console.error('API Error:', error);
    if (error.response?.data) {
      throw error;
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw {
        response: {
          data: {
            success: false,
            message: 'Ошибка подключения к серверу. Проверьте, запущен ли бэкенд.',
            data: null,
            errors: ['Network error'],
          }
        }
      };
    }
    throw {
      response: {
        data: {
          success: false,
          message: error.message || 'Network error',
          data: null,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        }
      }
    };
  }
}

export const hotelsApi = {
  getAll: () => apiFetch('/hotels', { method: 'GET' }),
  
  getById: (id: number) => apiFetch(`/hotels/${id}`, { method: 'GET' }),
  
  getByCity: (cityId: number) => 
    apiFetch(`/hotels/city/${cityId}`, { method: 'GET' }),
  
  getManagerHotels: (userId: number) => 
    apiFetch(`/hotels/manager/${userId}`, { method: 'GET' }),
  
  search: (searchParams: any) => 
    apiFetch('/hotels/search', {
      method: 'POST',
      body: JSON.stringify(searchParams),
    }),
  
  getTopRated: (count: number = 10) => 
    apiFetch(`/hotels/top-rated?count=${count}`, { method: 'GET' }),

  getAmenityTypes: () =>
    apiFetch('/hotels/amenity-types', { method: 'GET' }),
  
  create: (hotelData: any) =>
    apiFetch('/hotels', {
      method: 'POST',
      body: JSON.stringify(hotelData),
    }),
  
  update: (id: number, hotelData: any) =>
    apiFetch(`/hotels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(hotelData),
    }),
  
  delete: (id: number) =>
    apiFetch(`/hotels/${id}`, { method: 'DELETE' }),
  
  block: (id: number, reason: string) =>
    apiFetch(`/hotels/${id}/block`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  
  unblock: (id: number) =>
    apiFetch(`/hotels/${id}/unblock`, { method: 'POST' }),
};

export const citiesApi = {
  getAll: () => apiFetch('/cities', { method: 'GET' }),
  
  getById: (id: number) => apiFetch(`/cities/${id}`, { method: 'GET' }),

  getBySlug: (slug: string) => {
    const slugToId: Record<string, number> = {
      minsk: 1,
      brest: 2,
      vitebsk: 3,
      gomel: 4,
      grodno: 5,
      mogilev: 6,
    };
    const id = slugToId[slug.toLowerCase()];
    if (!id) {
      return Promise.resolve({
        success: false,
        message: "Город не найден",
        data: null,
        errors: ["Unknown city slug"],
      } as any);
    }
    return apiFetch(`/cities/${id}`, { method: 'GET' });
  },
  
  getWithHotels: (idOrSlug: number | string) => {
    if (typeof idOrSlug === "string") {
      const slugToId: Record<string, number> = {
        minsk: 1,
        brest: 2,
        vitebsk: 3,
        gomel: 4,
        grodno: 5,
        mogilev: 6,
      };
      const id = slugToId[idOrSlug.toLowerCase()];
      if (!id) {
        return Promise.resolve({
          success: false,
          message: "Город не найден",
          data: null,
          errors: ["Unknown city slug"],
        } as any);
      }
      return apiFetch(`/cities/${id}/hotels`, { method: 'GET' });
    }
    return apiFetch(`/cities/${idOrSlug}/hotels`, { method: 'GET' });
  },
};

export const bookingsApi = {
  getUserBookings: (userId: number) => 
    apiFetch(`/bookings/user/${userId}`, { method: 'GET' }),
  
  getById: (bookingId: number) => 
    apiFetch(`/bookings/${bookingId}`, { method: 'GET' }),
  
  create: (bookingData: any) => 
    apiFetch('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    }),
  
  update: (bookingId: number, bookingData: any) => 
    apiFetch(`/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(bookingData),
    }),
  
  cancel: (bookingId: number, userId: number) => 
    apiFetch(`/bookings/${bookingId}/cancel?userId=${userId}`, {
      method: 'POST',
    }),
  
  getAll: () =>
    apiFetch('/bookings', { method: 'GET' }),
  
  delete: (bookingId: number) =>
    apiFetch(`/bookings/${bookingId}`, { method: 'DELETE' }),

  sendReminder: (bookingId: number) =>
    apiFetch(`/bookings/${bookingId}/reminder`, {
      method: 'POST',
    }),
};

export const reviewsApi = {
  getByHotel: (hotelId: number) => 
    apiFetch(`/reviews/hotel/${hotelId}`, { method: 'GET' }),
  
  getByUser: (userId: number) => 
    apiFetch(`/reviews/user/${userId}`, { method: 'GET' }),
  
  create: (reviewData: any) => 
    apiFetch('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    }),
  
  update: (reviewId: number, reviewData: any) => 
    apiFetch(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(reviewData),
    }),
  
  delete: (reviewId: number) =>
    apiFetch(`/reviews/${reviewId}`, {
      method: 'DELETE',
    }),
  
  approve: (reviewId: number) =>
    apiFetch(`/reviews/${reviewId}/approve`, { method: 'POST' }),
  
  reject: (reviewId: number) =>
    apiFetch(`/reviews/${reviewId}/reject`, { method: 'POST' }),
  
  getPending: () =>
    apiFetch('/reviews/pending', { method: 'GET' }),

  getPendingComplaints: () =>
    apiFetch('/reviews/complaints/pending', { method: 'GET' }),

  addComment: (reviewId: number, comment: string) =>
    apiFetch(`/reviews/${reviewId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    }),

  getManagerModeration: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    return apiFetch<ReviewModerationList>(`/reviews/moderation/manager?${qs.toString()}`, { method: 'GET' });
  },

  getAdminModeration: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    return apiFetch<ReviewModerationList>(`/reviews/moderation/admin?${qs.toString()}`, { method: 'GET' });
  },

  getAdminComplaintsModeration: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    return apiFetch<ReviewModerationList>(`/reviews/moderation/complaints/admin?${qs.toString()}`, { method: 'GET' });
  },

  hideReview: (reviewId: number) =>
    apiFetch(`/reviews/${reviewId}/hide`, { method: 'POST' }),

  rejectAllComplaints: (reviewId: number) =>
    apiFetch(`/reviews/${reviewId}/complaints/reject-all`, { method: 'POST' }),

  deleteComment: (commentId: number) =>
    apiFetch(`/reviews/comments/${commentId}`, {
      method: 'DELETE',
    }),

  createComplaint: (reviewId: number, complaintType: string, comment?: string) =>
    apiFetch(`/reviews/${reviewId}/complaint`, {
      method: 'POST',
      body: JSON.stringify({ complaintType, comment }),
    }),

  resolveComplaint: (complaintId: number, approve: boolean) =>
    apiFetch(`/reviews/complaints/${complaintId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ approve }),
    }),

  appeal: (reviewId: number, reason?: string) =>
    apiFetch(`/reviews/${reviewId}/appeal`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || undefined }),
    }),

  addResponse: (reviewId: number, responseData: any) =>
    apiFetch(`/reviews/${reviewId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ comment: responseData?.response || responseData?.comment || "" }),
    }),

  deleteResponse: (reviewId: number, responseId: number) =>
    apiFetch(`/reviews/${reviewId}/response/${responseId}`, {
      method: 'DELETE',
    }),

  googleCallback: (code: string) =>
    apiFetch('/auth/google/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  mailruCallback: (code: string, state?: string) =>
    apiFetch('/auth/mailru/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    }),
};

export const usersApi = {
  getById: (id: number) => apiFetch(`/users/${id}`, { method: 'GET' }),
  
  getByEmail: (email: string) => 
    apiFetch(`/users/email/${email}`, { method: 'GET' }),
  
  update: (id: number, userData: any) => 
    apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
  
  delete: (id: number) =>
    apiFetch(`/users/${id}`, { method: 'DELETE' }),
  
  changePassword: (id: number, currentPassword: string | null, newPassword: string) =>
    apiFetch(`/users/${id}/change-password`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  
  getFavorites: (userId: number) => 
    apiFetch(`/users/${userId}/favorites`, { method: 'GET' }),
  
  addFavorite: (userId: number, hotelId: number) => 
    apiFetch(`/users/${userId}/favorites/${hotelId}`, {
      method: 'POST',
    }),
  
  removeFavorite: (userId: number, hotelId: number) => 
    apiFetch(`/users/${userId}/favorites/${hotelId}`, {
      method: 'DELETE',
    }),
  
  getAll: () =>
    apiFetch('/users', { method: 'GET' }),
  
  block: (userId: number, reason: string) =>
    apiFetch(`/users/${userId}/block`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  
  unblock: (userId: number) =>
    apiFetch(`/users/${userId}/unblock`, { method: 'POST' }),
  
  setRole: (userId: number, role: number) =>
    apiFetch(`/users/${userId}/set-role`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),
  
  setManager: (userId: number, isManager: boolean = true) =>
    apiFetch(`/users/${userId}/set-manager?isManager=${isManager}`, {
      method: 'POST',
    }),
  
  assignManagerToHotel: (userId: number, hotelId: number) =>
    apiFetch(`/users/${userId}/assign-hotel`, {
      method: 'POST',
      body: JSON.stringify({ hotelId }),
    }),
  
  getManagers: () =>
    apiFetch('/users/managers', { method: 'GET' }),
};

export const roomsApi = {
  getByHotel: (hotelId: number) =>
    apiFetch(`/rooms/hotel/${hotelId}`, { method: 'GET' }),
  
  getById: (id: number) =>
    apiFetch(`/rooms/${id}`, { method: 'GET' }),
  
  getAvailable: (hotelId: number, checkIn: string, checkOut: string, guests?: number) => {
    const guestsParam = guests ? `&guests=${guests}` : '';
    return apiFetch(`/rooms/hotel/${hotelId}/available?checkIn=${checkIn}&checkOut=${checkOut}${guestsParam}`, {
      method: 'GET',
    });
  },
  
  getRoomTypeGroups: (hotelId: number, checkIn?: string, checkOut?: string, guests?: number) => {
    const params = new URLSearchParams();
    if (checkIn) params.append('checkIn', checkIn);
    if (checkOut) params.append('checkOut', checkOut);
    if (guests) params.append('guests', guests.toString());
    const queryString = params.toString();
    return apiFetch(`/rooms/hotel/${hotelId}/room-types${queryString ? '?' + queryString : ''}`, { method: 'GET' });
  },
  
  getTypes: () =>
    apiFetch('/rooms/types', { method: 'GET' }),
  
  getAmenityTypes: () =>
    apiFetch('/rooms/amenity-types', { method: 'GET' }),
  
  create: (roomData: any) =>
    apiFetch('/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    }),
  
  update: (id: number, roomData: any) =>
    apiFetch(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    }),
  
  delete: (id: number) =>
    apiFetch(`/rooms/${id}`, { method: 'DELETE' }),

  block: (id: number, reason: string) =>
    apiFetch(`/rooms/${id}/block`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  unblock: (id: number) =>
    apiFetch(`/rooms/${id}/unblock`, { method: 'POST' }),
};

export const authApi = {
  login: async (email: string, password: string) => {
    return apiFetch<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  googleCallback: async (code: string) => {
    return apiFetch<{ token: string; user: any }>('/auth/google/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  mailruCallback: async (code: string, state?: string) => {
    return apiFetch<{ token: string; user: any }>('/auth/mailru/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    });
  },
  
  register: async (name: string, email: string, password: string) => {
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';
    
    const payload = { 
      firstName, 
      lastName, 
      email, 
      password,
      phoneNumber: ''
    };
    
    console.log('Sending registration request:', payload);
    
    return apiFetch<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  
  sendLoginCode: async (email: string) => {
    return apiFetch<{ success: boolean }>('/auth/send-login-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  loginByCode: async (email: string, code: string) => {
    return apiFetch<{ token: string; user: any }>('/auth/login-by-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  forgotPassword: async (email: string) => {
    return apiFetch<{ success: boolean }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  
  verifyCode: async (email: string, code: string) => {
    return apiFetch<{ resetToken: string }>('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },
  
  
  resetPassword: async (resetToken: string, newPassword: string) => {
    return apiFetch<{ success: boolean }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ resetToken, newPassword }),
    });
  },
  
  getCurrentUser: async (token: string) => {
    return apiFetch<any>('/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
  
  refreshToken: async (refreshToken: string) => {
    return apiFetch<{ token: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  resendCode: async (email: string) => {
    return apiFetch<{ success: boolean }>('/auth/send-login-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};

export const recommendationsApi = {
  getPopularHotels: (limit: number = 10) =>
    apiFetch(`/recommendations/popular-hotels?limit=${limit}`, { method: 'GET' }),

  getPopularDestinations: (limit: number = 6) =>
    apiFetch(`/recommendations/popular-destinations?limit=${limit}`, { method: 'GET' }),

  getSimilarHotels: (hotelId: number, limit: number = 6) =>
    apiFetch(`/recommendations/similar/${hotelId}?limit=${limit}`, { method: 'GET' }),
};

export const notificationsApi = {
  getMy: (limit: number = 30) =>
    apiFetch(`/notifications/me?limit=${limit}`, { method: 'GET' }),
  markRead: (notificationId: string) =>
    apiFetch(`/notifications/${notificationId}/read`, { method: 'POST' }),
};

async function uploadAssetFile(
  endpoint: '/uploads/hotels' | '/uploads/rooms' | '/uploads/avatars',
  file: File
): Promise<string> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    method: 'POST',
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = await response.json();
  const isSuccess = data?.success === true || data?.Success === true;
  const payload = data?.data ?? data?.Data;

  if (!response.ok || !isSuccess || typeof payload !== 'string') {
    throw new Error(data?.message || data?.Message || 'Ошибка загрузки изображения');
  }

  return payload;
}

export const uploadsApi = {
  uploadHotelImage: (file: File) => uploadAssetFile('/uploads/hotels', file),
  uploadRoomImage: (file: File) => uploadAssetFile('/uploads/rooms', file),
  uploadAvatar: (file: File) => uploadAssetFile('/uploads/avatars', file),
};

export default {
  hotels: hotelsApi,
  cities: citiesApi,
  bookings: bookingsApi,
  reviews: reviewsApi,
  users: usersApi,
  rooms: roomsApi,
  auth: authApi,
  recommendations: recommendationsApi,
  notifications: notificationsApi,
};
