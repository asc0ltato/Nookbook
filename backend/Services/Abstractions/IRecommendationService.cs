using NookBook.API.Models;

namespace NookBook.API.Services.Abstractions;

public interface IRecommendationService
{
    Task<IEnumerable<Hotel>> GetPopularHotelsAsync(int limit = 10);
    Task<IEnumerable<City>> GetPopularDestinationsAsync(int limit = 6);
    Task<IEnumerable<Hotel>> GetSimilarHotelsAsync(int hotelId, int limit = 6);
}
