using NookBook.API.Models;

namespace NookBook.API.Repositories.Abstractions;

public interface IFavoriteRepository : IRepository<Favorite>
{
    Task<IEnumerable<Favorite>> GetFavoritesByUserAsync(int userId);
    Task<Favorite?> GetUserFavoriteAsync(int userId, int hotelId);
    Task<bool> IsFavoriteAsync(int userId, int hotelId);
}
