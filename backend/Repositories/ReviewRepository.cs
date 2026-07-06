using Microsoft.EntityFrameworkCore;
using NookBook.API.Data;
using NookBook.API.Models;
using NookBook.API.Repositories.Abstractions;

namespace NookBook.API.Repositories;

public class ReviewRepository : Repository<Review>, IReviewRepository
{
    public ReviewRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task<Review?> GetByIdAsync(int id)
    {
        return await _dbSet
            .Include(r => r.Booking)
                .ThenInclude(b => b.User)
            .Include(r => r.Booking)
                .ThenInclude(b => b.Room)
                    .ThenInclude(room => room.RoomType)
            .Include(r => r.Booking)
                .ThenInclude(b => b.Room)
                    .ThenInclude(room => room.Hotel)
            .Include(r => r.ReviewComments)
                .ThenInclude(c => c.User)
            .Include(r => r.Complaints)
                .ThenInclude(c => c.User)
            .Include(r => r.ReviewTags)
                .ThenInclude(rt => rt.Tag)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<IEnumerable<Review>> GetReviewsByHotelAsync(int hotelId, bool approvedOnly = true)
    {
        var query = _dbSet
            .Include(r => r.Booking)
                .ThenInclude(b => b.User)
            .Include(r => r.Booking)
                .ThenInclude(b => b.Room)
                    .ThenInclude(room => room.RoomType)
            .Include(r => r.Booking)
                .ThenInclude(b => b.Room)
                    .ThenInclude(room => room.Hotel)
            .Include(r => r.ReviewComments)
                .ThenInclude(c => c.User)
            .Include(r => r.Complaints)
            .Include(r => r.ReviewTags)
                .ThenInclude(rt => rt.Tag)
            .Where(r => r.Booking.Room.HotelId == hotelId);

        if (approvedOnly)
        {
            query = query.Where(r => r.Status == ReviewStatus.Approved);
        }

        return await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
    }

    public async Task<IEnumerable<Review>> GetReviewsByUserAsync(int userId)
    {
        return await _dbSet
            .Include(r => r.Booking)
                .ThenInclude(b => b.User)
            .Include(r => r.Booking)
                .ThenInclude(b => b.Room)
                    .ThenInclude(room => room.RoomType)
            .Include(r => r.Booking)
                .ThenInclude(b => b.Room)
                    .ThenInclude(room => room.Hotel)
            .Include(r => r.ReviewComments)
                .ThenInclude(c => c.User)
            .Include(r => r.Complaints)
            .Include(r => r.ReviewTags)
                .ThenInclude(rt => rt.Tag)
            .Where(r => r.Booking != null && r.Booking.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Review>> GetPendingReviewsAsync()
    {
        return await _dbSet
            .Include(r => r.Booking)
                .ThenInclude(b => b.User)
            .Include(r => r.Booking)
                .ThenInclude(b => b.Room)
                    .ThenInclude(room => room.RoomType)
            .Include(r => r.ReviewComments)
                .ThenInclude(c => c.User)
            .Where(r => r.Status == ReviewStatus.Pending || r.Status == ReviewStatus.Hidden)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
    }

    public async Task<Review?> GetUserReviewForHotelAsync(int userId, int hotelId)
    {
        return await _dbSet
            .Include(r => r.Booking)
                .ThenInclude(b => b.Room)
            .FirstOrDefaultAsync(r => r.Booking.UserId == userId && r.Booking.Room.HotelId == hotelId);
    }

    public async Task<Review?> GetReviewByBookingAsync(int bookingId)
    {
        return await _dbSet
            .FirstOrDefaultAsync(r => r.BookingId == bookingId);
    }

    public async Task<Review?> GetUserReviewForBookingAsync(int userId, int bookingId)
    {
        var booking = await _context.Bookings
            .FirstOrDefaultAsync(b => b.Id == bookingId && b.UserId == userId);
        
        if (booking == null) return null;
        
        return await _dbSet
            .FirstOrDefaultAsync(r => r.BookingId == bookingId);
    }

    public async Task<IEnumerable<Review>> GetAllReviewsForModerationAsync(int? hotelId = null)
    {
        var query = _dbSet
            .Include(r => r.Booking)
                .ThenInclude(b => b!.User)
            .Include(r => r.Booking)
                .ThenInclude(b => b!.Room)
                    .ThenInclude(room => room!.RoomType)
            .Include(r => r.Booking)
                .ThenInclude(b => b!.Room)
                    .ThenInclude(room => room!.Hotel)
            .Include(r => r.ReviewComments)
                .ThenInclude(c => c.User)
            .Include(r => r.Complaints)
                .ThenInclude(c => c.User)
            .AsQueryable();

        if (hotelId.HasValue)
        {
            query = query.Where(r => r.Booking != null && r.Booking.Room.HotelId == hotelId.Value);
        }

        return await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
    }
}
