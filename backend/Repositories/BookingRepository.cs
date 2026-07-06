using Microsoft.EntityFrameworkCore;
using NookBook.API.Data;
using NookBook.API.Models;
using NookBook.API.Repositories.Abstractions;

namespace NookBook.API.Repositories;

public class BookingRepository : Repository<Booking>, IBookingRepository
{
    private static readonly BookingStatusEnum[] BlockingBookingStatuses = [BookingStatusEnum.Pending, BookingStatusEnum.Confirmed, BookingStatusEnum.CheckedIn];

    public BookingRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Booking>> GetBookingsByUserAsync(int userId)
    {
        return await _dbSet
            .Include(b => b.User)
            .Include(b => b.Room)
                .ThenInclude(r => r.RoomType)
                    .ThenInclude(rt => rt.Images)
            .Include(b => b.Room)
                .ThenInclude(r => r.Hotel)
                .ThenInclude(h => h.City)
            .Include(b => b.BookingStatuses)
                .ThenInclude(bs => bs.StatusByUser)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Booking>> GetBookingsByHotelAsync(int hotelId)
    {
        var bookings = await _dbSet
            .Include(b => b.User)
            .Include(b => b.Room)
                .ThenInclude(r => r.RoomType)
                    .ThenInclude(rt => rt.Images)
            .Include(b => b.Room)
                .ThenInclude(r => r.Hotel)
            .Include(b => b.BookingStatuses)
                .ThenInclude(bs => bs.StatusByUser)
            .Where(b => b.Room.HotelId == hotelId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();
        
        return bookings;
    }

    public async Task<Booking?> GetBookingWithDetailsAsync(int bookingId)
    {
        return await _dbSet
            .Include(b => b.User)
            .Include(b => b.Room)
                .ThenInclude(r => r.RoomType)
                    .ThenInclude(rt => rt.Images)
            .Include(b => b.Room)
                .ThenInclude(r => r.Hotel)
                .ThenInclude(h => h.City)
            .Include(b => b.BookingStatuses)
                .ThenInclude(bs => bs.StatusByUser)
            .FirstOrDefaultAsync(b => b.Id == bookingId);
    }

    public new async Task<IEnumerable<Booking>> GetAllAsync()
    {
        return await _dbSet
            .Include(b => b.User)
            .Include(b => b.Room)
                .ThenInclude(r => r.RoomType)
                    .ThenInclude(rt => rt.Images)
            .Include(b => b.Room)
                .ThenInclude(r => r.Hotel)
                .ThenInclude(h => h.City)
            .Include(b => b.BookingStatuses)
                .ThenInclude(bs => bs.StatusByUser)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> IsRoomAvailableAsync(int roomId, DateTime checkInDate, DateTime checkOutDate)
    {
        var normalizedCheckIn = DateTime.SpecifyKind(checkInDate.Date, DateTimeKind.Utc);
        var normalizedCheckOut = DateTime.SpecifyKind(checkOutDate.Date, DateTimeKind.Utc);

        var existingBookings = await _dbSet
            .Include(b => b.BookingStatuses)
            .Where(b => b.RoomId == roomId)
            .ToListAsync();

        foreach (var booking in existingBookings)
        {
            var existingCheckIn = DateTime.SpecifyKind(booking.CheckInDate.Date, DateTimeKind.Utc);
            var existingCheckOut = DateTime.SpecifyKind(booking.CheckOutDate.Date, DateTimeKind.Utc);

            // Check for date overlap
            var latestStatus = booking.BookingStatuses
                .OrderByDescending(bs => bs.CreatedAt)
                .FirstOrDefault()?.Status;

            if (normalizedCheckIn < existingCheckOut &&
                normalizedCheckOut > existingCheckIn &&
                latestStatus.HasValue &&
                BlockingBookingStatuses.Contains(latestStatus.Value))
            {
                return false;
            }
        }

        return true;
    }
}
