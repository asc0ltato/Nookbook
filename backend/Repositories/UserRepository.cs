using Microsoft.EntityFrameworkCore;
using NookBook.API.Data;
using NookBook.API.Models;
using NookBook.API.Repositories.Abstractions;

namespace NookBook.API.Repositories;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        return await _dbSet
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User?> GetUserWithBookingsAsync(int userId)
    {
        return await _dbSet
            .Include(u => u.Bookings)
                .ThenInclude(b => b.Room)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    public async Task<User?> GetUserWithFavoritesAsync(int userId)
    {
        return await _dbSet
            .Include(u => u.Favorites)
                .ThenInclude(f => f.Hotel)
                    .ThenInclude(h => h.City)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }
}
