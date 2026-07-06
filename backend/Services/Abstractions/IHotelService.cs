using NookBook.API.DTOs;

namespace NookBook.API.Services.Abstractions;

public interface IHotelService
{
    Task<ApiResponse<IEnumerable<HotelDto>>> GetAllHotelsAsync();
    Task<ApiResponse<HotelDetailDto>> GetHotelByIdAsync(int id);
    Task<ApiResponse<IEnumerable<HotelDto>>> GetHotelsByCityAsync(int cityId, int? userId = null); 
    Task<ApiResponse<IEnumerable<HotelDto>>> SearchHotelsAsync(SearchHotelsDto searchDto);
    Task<ApiResponse<HotelDto>> CreateHotelAsync(CreateHotelDto createDto);
    Task<ApiResponse<HotelDto>> UpdateHotelAsync(int id, UpdateHotelDto updateDto);
    Task<ApiResponse<bool>> DeleteHotelAsync(int id);
    Task<ApiResponse<bool>> BlockHotelAsync(int id, string? reason = null);
    Task<ApiResponse<bool>> UnblockHotelAsync(int id);
    Task<ApiResponse<IEnumerable<HotelDto>>> GetTopRatedHotelsAsync(int count = 10);
    Task<ApiResponse<IEnumerable<HotelDto>>> GetManagerHotelsAsync(int userId);
}
