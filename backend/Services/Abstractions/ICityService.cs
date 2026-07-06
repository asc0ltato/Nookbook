using NookBook.API.DTOs;

namespace NookBook.API.Services.Abstractions;

public interface ICityService
{
    Task<ApiResponse<IEnumerable<CityDto>>> GetAllCitiesAsync();
    Task<ApiResponse<CityDto>> GetCityByIdAsync(int id);
    Task<ApiResponse<CityWithHotelsDto>> GetCityWithHotelsAsync(int id);
}
