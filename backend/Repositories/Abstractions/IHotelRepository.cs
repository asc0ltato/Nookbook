using NookBook.API.Models;

namespace NookBook.API.Repositories.Abstractions;

public interface IHotelRepository : IRepository<Hotel>
{
    Task<IEnumerable<Hotel>> GetHotelsByCityAsync(int cityId);
    Task<Hotel?> GetHotelWithDetailsAsync(int id);
    Task<IEnumerable<Hotel>> SearchHotelsAsync(int cityId, DateTime? checkIn, DateTime? checkOut, int? guests);
    Task<IEnumerable<Hotel>> GetTopRatedHotelsAsync(int count);
    void InvalidateCityCache(int? cityId = null);
}
