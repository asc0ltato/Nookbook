export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    phoneNumber?: string;
    createdAt: string;
  };
}

export interface ForgotPasswordData {
  email: string;
}

export interface VerifyCodeData {
  email: string;
  code: string;
}

export interface ResetPasswordData {
  resetToken: string;
  newPassword: string;
}

export interface OAuthCallbackData {
  code: string;
  state?: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  avatar: string;
  role: string;
  isBlocked: boolean;
  isManager: boolean;
  hasPassword: boolean;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatar?: string;
}

export interface ChangePasswordData {
  currentPassword?: string;
  newPassword: string;
}

export interface Hotel {
  id: number;
  name: string;
  description: string;
  address: string;
  cityId: number;
  city?: City;
  rating: number;
  pricePerNight: number;
  imageUrl?: string;
  amenities: string[];
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHotelData {
  name: string;
  description: string;
  address: string;
  cityId: number;
  pricePerNight: number;
  imageUrl?: string;
  amenities?: string[];
}

export interface UpdateHotelData {
  name?: string;
  description?: string;
  address?: string;
  cityId?: number;
  pricePerNight?: number;
  imageUrl?: string;
  amenities?: string[];
}

export interface SearchHotelsData {
  cityId?: number;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
}

export interface City {
  id: number;
  name: string;
  country: string;
  description?: string;
  imageUrl?: string;
}

export interface Room {
  id: number;
  hotelId: number;
  roomNumber: string;
  type: string;
  pricePerNight: number;
  capacity: number;
  amenities: string[];
  imageUrl?: string;
  isAvailable: boolean;
}

export interface CreateRoomData {
  hotelId: number;
  roomNumber: string;
  type: string;
  pricePerNight: number;
  capacity: number;
  amenities?: string[];
  imageUrl?: string;
}

export interface UpdateRoomData {
  roomNumber?: string;
  type?: string;
  pricePerNight?: number;
  capacity?: number;
  amenities?: string[];
  imageUrl?: string;
  isAvailable?: boolean;
}

export interface Booking {
  id: number;
  userId: number;
  hotelId: number;
  roomId: number;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  user?: User;
  hotel?: Hotel;
  room?: Room;
}

export interface CreateBookingData {
  hotelId: number;
  roomId: number;
  checkIn: string;
  checkOut: string;
}

export interface UpdateBookingData {
  status?: string;
}

export interface Review {
  id: number;
  hotelId: number;
  userId: number;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
  responses?: ReviewResponse[];
}

export interface CreateReviewData {
  hotelId: number;
  rating: number;
  comment: string;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
}

export interface ReviewResponse {
  id: number;
  reviewId: number;
  userId: number;
  response: string;
  createdAt: string;
  user?: User;
}

export interface CreateReviewResponseData {
  response: string;
}

export interface RoomType {
  id: number;
  name: string;
}

export interface AmenityType {
  id: number;
  name: string;
}
