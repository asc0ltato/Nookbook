using NookBook.API.Models;

namespace NookBook.API.Repositories.Abstractions;

public interface IBookingRepository : IRepository<Booking>
{
    Task<IEnumerable<Booking>> GetBookingsByUserAsync(int userId);
    Task<IEnumerable<Booking>> GetBookingsByHotelAsync(int hotelId);
    Task<Booking?> GetBookingWithDetailsAsync(int bookingId);
    Task<bool> IsRoomAvailableAsync(int roomId, DateTime checkInDate, DateTime checkOutDate);
}
