using NookBook.API.Models;

namespace NookBook.API.Repositories.Abstractions;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetUserByEmailAsync(string email);
    Task<User?> GetUserWithBookingsAsync(int userId);
    Task<User?> GetUserWithFavoritesAsync(int userId);
}
