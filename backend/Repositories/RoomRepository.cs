using Microsoft.EntityFrameworkCore;
using NookBook.API.Data;
using NookBook.API.Models;
using NookBook.API.Repositories.Abstractions;

namespace NookBook.API.Repositories;

public class RoomRepository : Repository<Room>, IRoomRepository
{
    private static readonly BookingStatusEnum[] BlockingBookingStatuses = [BookingStatusEnum.Pending, BookingStatusEnum.Confirmed, BookingStatusEnum.CheckedIn];

    public RoomRepository(ApplicationDbContext context) : base(context)
    {
    }

    private static bool HasBlockingBooking(Room room, DateTime checkIn, DateTime checkOut)
    {
        return room.Bookings.Any(b =>
        {
            var latestStatus = b.BookingStatuses
                .OrderByDescending(bs => bs.CreatedAt)
                .FirstOrDefault()?.Status;

            return b.CheckInDate.Date < checkOut.Date &&
                   b.CheckOutDate.Date > checkIn.Date &&
                   (latestStatus == BookingStatusEnum.Pending || 
                    latestStatus == BookingStatusEnum.Confirmed || 
                    latestStatus == BookingStatusEnum.CheckedIn);
        });
    }

    public async Task<Room?> GetRoomWithDetailsAsync(int roomId)
    {
        return await _dbSet
            .Include(r => r.Hotel)
                .ThenInclude(h => h.City)
            .Include(r => r.RoomType)
                .ThenInclude(rt => rt.Images)
            .Include(r => r.RoomAmenities)
                .ThenInclude(ra => ra.RoomAmenityType)
            .FirstOrDefaultAsync(r => r.Id == roomId);
    }

    public async Task<IEnumerable<Room>> GetRoomsByHotelAsync(int hotelId)
    {
        var query = _dbSet
            .Include(r => r.RoomType)
                .ThenInclude(rt => rt.Images)
            .Include(r => r.RoomAmenities)
                .ThenInclude(ra => ra.RoomAmenityType)
            .Include(r => r.Bookings)
                .ThenInclude(b => b.BookingStatuses)
            .Where(r => r.HotelId == hotelId)
            .OrderBy(r => r.Price);

        return await query.ToListAsync();
    }

    public async Task<IEnumerable<Room>> GetAvailableRoomsAsync(int hotelId, DateTime checkIn, DateTime checkOut, int? guests = null)
    {
        var normalizedCheckIn = DateTime.SpecifyKind(checkIn.Date, DateTimeKind.Utc);
        var normalizedCheckOut = DateTime.SpecifyKind(checkOut.Date, DateTimeKind.Utc);
        
        var query = _dbSet
            .Include(r => r.RoomType)
                .ThenInclude(rt => rt.Images)
            .Include(r => r.RoomAmenities)
                .ThenInclude(ra => ra.RoomAmenityType)
            .Include(r => r.Bookings)
                .ThenInclude(b => b.BookingStatuses)
            .Where(r => r.HotelId == hotelId);

        if (guests.HasValue && guests.Value > 0)
        {
            query = query.Where(r => r.RoomType.MaxGuests >= guests.Value);
        }

        var rooms = await query
            .OrderBy(r => r.Price)
            .ToListAsync();

        var blockedRoomIds = await GetBlockedRoomIdsAsync();
        return rooms
            .Where(r => !blockedRoomIds.Contains(r.Id))
            .Where(r => !HasBlockingBooking(r, normalizedCheckIn, normalizedCheckOut))
            .ToList();
    }

    public async Task<IEnumerable<Room>> GetAvailableRoomsByTypeAsync(int hotelId, int roomTypeId, DateTime checkIn, DateTime checkOut, int? guests = null)
    {
        var normalizedCheckIn = DateTime.SpecifyKind(checkIn.Date, DateTimeKind.Utc);
        var normalizedCheckOut = DateTime.SpecifyKind(checkOut.Date, DateTimeKind.Utc);

        var query = _dbSet
            .Include(r => r.RoomType)
                .ThenInclude(rt => rt.Images)
            .Include(r => r.RoomAmenities)
                .ThenInclude(ra => ra.RoomAmenityType)
            .Include(r => r.Bookings)
                .ThenInclude(b => b.BookingStatuses)
            .Where(r => r.HotelId == hotelId)
            .Where(r => r.RoomTypeId == roomTypeId);

        if (guests.HasValue && guests.Value > 0)
        {
            query = query.Where(r => r.RoomType.MaxGuests >= guests.Value);
        }

        var rooms = await query
            .OrderBy(r => r.Price)
            .ToListAsync();

        var blockedRoomIds = await GetBlockedRoomIdsAsync();
        return rooms
            .Where(r => !blockedRoomIds.Contains(r.Id))
            .Where(r => !HasBlockingBooking(r, normalizedCheckIn, normalizedCheckOut))
            .ToList();
    }
    
    public override async Task<Room?> GetByIdAsync(int id)
    {
        return await _dbSet
            .Include(r => r.RoomType)
                .ThenInclude(rt => rt.Images)
            .Include(r => r.RoomAmenities)
                .ThenInclude(ra => ra.RoomAmenityType)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    private async Task<HashSet<int>> GetBlockedRoomIdsAsync()
    {
        var blockedRoomIds = await _context.BlockHistory
            .Where(bh => bh.EntityType == "Room")
            .GroupBy(bh => bh.EntityId)
            .Select(g => new
            {
                RoomId = g.Key,
                IsBlocked = g.OrderByDescending(bh => bh.ChangedAt).Select(bh => bh.IsBlocked).First()
            })
            .Where(status => status.IsBlocked)
            .Select(status => status.RoomId)
            .ToListAsync();

        return blockedRoomIds.ToHashSet();
    }
}
