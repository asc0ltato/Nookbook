using NookBook.API.Models;

namespace NookBook.API.Repositories.Abstractions;

public interface IManagerRepository
{
    Task<Manager?> GetByUserIdAndHotelIdAsync(int userId, int hotelId);
    Task<IEnumerable<Manager>> GetAllAsync();
    Task<IEnumerable<Manager>> FindAsync(System.Linq.Expressions.Expression<Func<Manager, bool>> predicate);
    Task AddAsync(Manager manager);
    void Update(Manager manager);
    void Delete(Manager manager);
}
