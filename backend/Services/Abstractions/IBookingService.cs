using NookBook.API.DTOs;

namespace NookBook.API.Services.Abstractions;

public interface IBookingService
{
    Task<ApiResponse<IEnumerable<BookingDto>>> GetUserBookingsAsync(int userId, string? hotelNameSearch = null);
    Task<ApiResponse<BookingDto>> GetBookingByIdAsync(int bookingId);
    Task<ApiResponse<BookingDto>> CreateBookingAsync(CreateBookingDto createDto);
    Task<ApiResponse<BookingDto>> UpdateBookingAsync(int bookingId, UpdateBookingDto updateDto, int? currentUserId = null);
    Task<ApiResponse<bool>> CancelBookingAsync(int bookingId, int userId);
    Task<ApiResponse<IEnumerable<BookingDto>>> GetAllBookingsAsync();
    Task<ApiResponse<IEnumerable<BookingDto>>> GetBookingsByHotelAsync(int hotelId);
    Task<ApiResponse<bool>> DeleteBookingAsync(int bookingId);
    Task<ApiResponse<bool>> SendBookingReminderAsync(int bookingId, int managerUserId);
}
