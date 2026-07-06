using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using NookBook.API.Data;
using NookBook.API.Models;
using NookBook.API.Repositories.Abstractions;

namespace NookBook.API.Repositories;

public class HotelRepository : Repository<Hotel>, IHotelRepository
{
    private readonly IMemoryCache _cache;
    private const int CacheExpirationMinutes = 5;

    public HotelRepository(ApplicationDbContext context, IMemoryCache cache) : base(context)
    {
        _cache = cache;
    }

    private IQueryable<Hotel> GetHotelsWithIncludes()
    {
        return _dbSet
            .Include(h => h.City)
            .AsQueryable();
    }
    
    private IQueryable<Hotel> GetHotelsWithFullIncludes()
    {
        return _dbSet
            .Include(h => h.City)
            .Include(h => h.HotelAmenities)
                .ThenInclude(ha => ha.HotelAmenityType)
            .Include(h => h.Images)
            .Include(h => h.Rooms)
                .ThenInclude(r => r.RoomType)
                    .ThenInclude(rt => rt.Images)
            .Include(h => h.Managers)
                .ThenInclude(m => m.User)
            .AsQueryable();
    }
    
    public override async Task<IEnumerable<Hotel>> GetAllAsync()
    {
        return await GetHotelsWithFullIncludes().ToListAsync();
    }

    public async Task<IEnumerable<Hotel>> GetHotelsByCityAsync(int cityId)
    {
        var hotels = await _dbSet
            .Include(h => h.City)
            .Include(h => h.HotelAmenities)
                .ThenInclude(ha => ha.HotelAmenityType)
            .Include(h => h.Rooms)
                .ThenInclude(r => r.RoomType)
                    .ThenInclude(rt => rt.Images)
            .Include(h => h.Images)
            .Include(h => h.Managers)
                .ThenInclude(m => m.User)
            .Where(h => h.CityId == cityId)
            .ToListAsync();

        return hotels;
    }

    public async Task<Hotel?> GetHotelWithDetailsAsync(int id)
    {
        return await _dbSet
            .Include(h => h.City)
            .Include(h => h.HotelAmenities)
                .ThenInclude(ha => ha.HotelAmenityType)
            .Include(h => h.Rooms)
                .ThenInclude(r => r.RoomType)
                    .ThenInclude(rt => rt.Images)
            .Include(h => h.Images)
            .Include(h => h.Managers)
                .ThenInclude(m => m.User)
            .Include(h => h.Rooms)
                .ThenInclude(r => r.RoomAmenities)
                    .ThenInclude(ra => ra.RoomAmenityType)
            .FirstOrDefaultAsync(h => h.Id == id);
    }

    public async Task<IEnumerable<Hotel>> SearchHotelsAsync(int cityId, DateTime? checkIn, DateTime? checkOut, int? guests)
    {
        var query = _dbSet
            .Include(h => h.City)
            .Include(h => h.HotelAmenities)
                .ThenInclude(ha => ha.HotelAmenityType)
            .Include(h => h.Rooms)
                .ThenInclude(r => r.RoomType)
                    .ThenInclude(rt => rt.Images)
            .Include(h => h.Images)
            .Include(h => h.Managers)
                .ThenInclude(m => m.User)
            .Where(h => h.CityId == cityId);

        if (checkIn.HasValue && checkOut.HasValue && guests.HasValue)
        {
            var normalizedCheckIn = DateTime.SpecifyKind(checkIn.Value.Date, DateTimeKind.Utc);
            var normalizedCheckOut = DateTime.SpecifyKind(checkOut.Value.Date, DateTimeKind.Utc);
            
            var checkInDate = normalizedCheckIn.Date;
            var checkOutDate = normalizedCheckOut.Date;
            
            var guestsValue = guests.Value;
            query = query.Where(h => h.Rooms.Any(r => 
                r.RoomType != null && r.RoomType.MaxGuests >= guestsValue &&
                !r.Bookings.Any(b => 
                    (b.CheckInDate.Date <= checkInDate && b.CheckOutDate.Date > checkInDate) ||
                    (b.CheckInDate.Date < checkOutDate && b.CheckOutDate.Date >= checkOutDate) ||
                    (b.CheckInDate.Date >= checkInDate && b.CheckOutDate.Date <= checkOutDate))));
        }

        return await query.ToListAsync();
    }

    public async Task<IEnumerable<Hotel>> GetTopRatedHotelsAsync(int count)
    {
        var cacheKey = $"hotels_top_rated_{count}";
        
        if (_cache.TryGetValue(cacheKey, out IEnumerable<Hotel>? cachedHotels))
        {
            return cachedHotels!;
        }

        var hotels = await _dbSet
            .Include(h => h.City)
            .Include(h => h.Rooms)
                .ThenInclude(r => r.RoomType)
                    .ThenInclude(rt => rt.Images)
            .Include(h => h.Images)
            .Include(h => h.Managers)
                .ThenInclude(m => m.User)
            .Take(count)
            .ToListAsync();

        _cache.Set(cacheKey, hotels, TimeSpan.FromMinutes(CacheExpirationMinutes));
        return hotels;
    }

    public void InvalidateCityCache(int? cityId = null)
    {
        if (cityId.HasValue)
        {
            _cache.Remove($"hotels_city_{cityId.Value}");
        }
        
        _cache.Remove("hotels_top_rated_10");
    }
}
