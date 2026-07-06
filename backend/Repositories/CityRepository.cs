using Microsoft.EntityFrameworkCore;
using NookBook.API.Data;
using NookBook.API.Models;
using NookBook.API.Repositories.Abstractions;

namespace NookBook.API.Repositories;

public class CityRepository : Repository<City>, ICityRepository
{
    public CityRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<IEnumerable<City>> GetAllAsync()
    {
        return await _dbSet
            .Include(c => c.Hotels)
                .ThenInclude(h => h.Rooms)
                    .ThenInclude(r => r.Bookings)
            .ToListAsync();
    }
}
