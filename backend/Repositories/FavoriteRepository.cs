using Microsoft.EntityFrameworkCore;
using NookBook.API.Data;
using NookBook.API.Models;
using NookBook.API.Repositories.Abstractions;

namespace NookBook.API.Repositories;

public class FavoriteRepository : Repository<Favorite>, IFavoriteRepository
{
    public FavoriteRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Favorite>> GetFavoritesByUserAsync(int userId)
    {
        return await _dbSet
            .Include(f => f.Hotel)
                .ThenInclude(h => h.City)
            .Include(f => f.Hotel.HotelAmenities)
                .ThenInclude(ha => ha.HotelAmenityType)
            .Include(f => f.Hotel.Rooms)
                .ThenInclude(r => r.RoomType)
            .Include(f => f.Hotel.Images)
            .Where(f => f.UserId == userId)
            .ToListAsync();
    }

    public async Task<Favorite?> GetUserFavoriteAsync(int userId, int hotelId)
    {
        return await _dbSet
            .FirstOrDefaultAsync(f => f.UserId == userId && f.HotelId == hotelId);
    }

    public async Task<bool> IsFavoriteAsync(int userId, int hotelId)
    {
        return await _dbSet
            .AnyAsync(f => f.UserId == userId && f.HotelId == hotelId);
    }
}
