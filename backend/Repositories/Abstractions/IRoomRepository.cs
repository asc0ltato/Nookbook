using NookBook.API.Models;

namespace NookBook.API.Repositories.Abstractions;

public interface IRoomRepository : IRepository<Room>
{
    Task<IEnumerable<Room>> GetRoomsByHotelAsync(int hotelId);
    Task<IEnumerable<Room>> GetAvailableRoomsAsync(int hotelId, DateTime checkIn, DateTime checkOut, int? guests = null);
    Task<Room?> GetRoomWithDetailsAsync(int roomId);
    Task<IEnumerable<Room>> GetAvailableRoomsByTypeAsync(int hotelId, int roomTypeId, DateTime checkIn, DateTime checkOut, int? guests = null);
}
