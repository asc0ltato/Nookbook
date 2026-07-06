using Microsoft.EntityFrameworkCore;
using NookBook.API.Data;
using NookBook.API.Models;
using NookBook.API.Repositories.Abstractions;

namespace NookBook.API.Repositories;

public class ManagerRepository : IManagerRepository
{
    private readonly ApplicationDbContext _context;

    public ManagerRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Manager?> GetByUserIdAndHotelIdAsync(int userId, int hotelId)
    {
        return await _context.Managers
            .Include(m => m.User)
            .Include(m => m.Hotel)
            .FirstOrDefaultAsync(m => m.UserId == userId && m.HotelId == hotelId);
    }

    public async Task<IEnumerable<Manager>> GetAllAsync()
    {
        return await _context.Managers
            .Include(m => m.User)
            .Include(m => m.Hotel)
            .ToListAsync();
    }

    public async Task<IEnumerable<Manager>> FindAsync(System.Linq.Expressions.Expression<Func<Manager, bool>> predicate)
    {
        return await _context.Managers
            .Include(m => m.User)
            .Include(m => m.Hotel)
            .Where(predicate)
            .ToListAsync();
    }

    public async Task AddAsync(Manager manager)
    {
        await _context.Managers.AddAsync(manager);
    }

    public void Update(Manager manager)
    {
        _context.Managers.Update(manager);
    }

    public void Delete(Manager manager)
    {
        _context.Managers.Remove(manager);
    }
}
