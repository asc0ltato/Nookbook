using NookBook.API.DTOs;

namespace NookBook.API.Services.Abstractions;

public interface IRoomService
{
    Task<ApiResponse<IEnumerable<RoomDto>>> GetRoomsByHotelAsync(int hotelId);
    Task<ApiResponse<RoomDto>> GetRoomByIdAsync(int id);
    Task<ApiResponse<RoomDto>> CreateRoomAsync(CreateRoomDto createDto);
    Task<ApiResponse<RoomDto>> UpdateRoomAsync(int id, UpdateRoomDto updateDto);
    Task<ApiResponse<bool>> DeleteRoomAsync(int id);
    Task<ApiResponse<IEnumerable<RoomDto>>> GetAvailableRoomsAsync(int hotelId, DateTime checkIn, DateTime checkOut, int? guests = null);
    Task<ApiResponse<IEnumerable<RoomTypeGroupDto>>> GetRoomTypeGroupsAsync(int hotelId, DateTime? checkIn = null, DateTime? checkOut = null, int? guests = null);
    Task<ApiResponse<bool>> BlockRoomAsync(int id, string reason);
    Task<ApiResponse<bool>> UnblockRoomAsync(int id);
}

