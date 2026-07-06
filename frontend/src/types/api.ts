export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
}

export type ID = string | number;
export type StringId<T extends ID> = T extends string ? T : string;
export type NumberId<T extends ID> = T extends number ? T : number;

export function toNumberId(id: ID): number {
  return typeof id === 'number' ? id : parseInt(id, 10);
}

export function toStringId(id: ID): string {
  return typeof id === 'string' ? id : id.toString();
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

export interface RefreshTokenData {
  refreshToken: string;
}

export interface Hotel {
  id: number | string;
  name: string;
  description: string;
  stars?: number;
  rating: number;
  reviewCount?: number;
  pricePerNight: number;
  price?: number;
  imageUrl?: string;
  images?: string[];
  Images?: string[];
  cityId: number | string;
  city?: City | string;
  address: string;
  distanceToCenter?: number;
  latitude?: number;
  longitude?: number;
  isBlocked: boolean;
  blockReason?: string;
  hasActiveBookings?: boolean;
  managerId?: number;
  managers?: Array<{
    userId?: number;
    email?: string;
    firstName?: string;
    lastName?: string;
  }>;
  amenities: string[];
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
  images?: string[];
  amenities?: string[];
}

export interface UpdateHotelData {
  name?: string;
  description?: string;
  address?: string;
  cityId?: number;
  pricePerNight?: number;
  imageUrl?: string;
  images?: string[];
  amenities?: string[];
}

export interface HotelDetail extends Hotel {
  rooms: Room[];
  reviews: Review[];
}

export interface City {
  id: number;
  name: string;
  country: string;
  slug?: string;
  imageUrl?: string;
  description?: string;
  hotelCount?: number;
  latitude?: number;
  longitude?: number;
}

export interface Room {
  id: number;
  hotelId: number;
  name?: string;
  roomNumber: string;
  type: string;
  roomType?: string;
  roomTypeId?: number;
  pricePerNight: number;
  price?: number;
  capacity: number;
  maxGuests?: number;
  size?: number;
  bedCount?: number;
  description?: string;
  imageUrl?: string;
  image?: string;
  images?: string[];
  amenities?: string[];
  isAvailable?: boolean;
  isBlocked?: boolean;
  blockReason?: string;
  mealType?: number;
  mealLabel?: string;
}

export interface CreateRoomData {
  hotelId: number;
  roomNumber: string;
  type: string;
  pricePerNight: number;
  capacity: number;
  amenities?: string[];
  imageUrl?: string;
  image?: string;
  images?: string[];
}

export interface UpdateRoomData {
  roomNumber?: string;
  type?: string;
  pricePerNight?: number;
  capacity?: number;
  amenities?: string[];
  imageUrl?: string;
  image?: string;
  images?: string[];
  isAvailable?: boolean;
}

export interface RoomType {
  id: number;
  name: string;
}

export interface AmenityType {
  id: number;
  name: string;
}

export interface Booking {
  id: number;
  userId: number;
  hotelId: number;
  roomId: number;
  checkIn: string;
  checkOut: string;
  checkInDate?: string;
  checkOutDate?: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  userName?: string;
  hotelName?: string;
  cityName?: string;
  roomName?: string;
  roomType?: string;
  roomImageUrl?: string;
  roomImageUrls?: string[];
  bookingCode?: string;
  guestCount?: number;
  specialRequests?: string;
  statusBy?: string;
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
  originalComment?: string;
  moderationReason?: string;
  status?: "Pending" | "Approved" | "Hidden" | "Rejected";
  hasUserComplaint?: boolean;
  managerResponseAuthor?: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userAvatar?: string;
  bookingId?: number;
  roomId?: number;
  roomName?: string;
  roomDescription?: string;
  nightsStayed?: number;
  hotelName?: string;
  managerResponse?: string;
  managerResponseAt?: string;
  managerId?: number;
  positiveTags?: string[];
  negativeTags?: string[];
  user?: User;
  responses?: ReviewResponse[];
  comments?: ReviewComment[];
}

export interface CreateReviewData {
  hotelId: number;
  rating: number;
  comment: string;
  positiveTags?: string[];
  negativeTags?: string[];
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string;
  positiveTags?: string[];
  negativeTags?: string[];
}

export interface ReviewResponse {
  id: number;
  reviewId: number;
  userId: number;
  response: string;
  createdAt: string;
  user?: User;
}

export interface ReviewComment {
  id: number;
  reviewId: number;
  userId: number;
  comment: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  roleId?: number;
  createdAt: string;
  replies?: ReviewComment[];
}

export interface ReviewComplaint {
  id: number;
  reviewId: number;
  complaintType: string;
  comment?: string;
  status: string;
  createdAt: string;
  userId: number;
  userName: string;
  resolvedAt?: string;
  reviewText?: string;
  reviewStatus?: string;
  hotelId?: number;
  hotelName?: string;
}

export interface ReviewModerationTabCounts {
  all: number;
  pending: number;
  approved?: number;
  rejected?: number;
  hidden: number;
  complaints: number;
  needsReply?: number;
  replied?: number;
}

export interface ReviewModerationItem extends Review {
  firstName?: string;
  lastName?: string;
  hotelName?: string;
  checkInDate?: string;
  checkOutDate?: string;
  complaintCount?: number;
  complaints?: ReviewComplaint[];
  hasManagerReply?: boolean;
  managerResponse?: string;
  managerResponseAt?: string;
}

export interface ReviewModerationList {
  items: ReviewModerationItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  tabCounts: ReviewModerationTabCounts;
}

export interface CreateReviewResponseData {
  response: string;
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

export interface SetRoleData {
  role: number;
}

export interface SearchParams {
  cityId?: number;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
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
