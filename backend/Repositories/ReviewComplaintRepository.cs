using Microsoft.EntityFrameworkCore;
using NookBook.API.Data;
using NookBook.API.Models;
using NookBook.API.Repositories.Abstractions;

namespace NookBook.API.Repositories;

public class ReviewComplaintRepository : Repository<ReviewComplaint>, IReviewComplaintRepository
{
    public ReviewComplaintRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ReviewComplaint>> GetComplaintsByReviewAsync(int reviewId)
    {
        return await _dbSet
            .Include(rc => rc.User)
            .Include(rc => rc.Review)
            .Where(rc => rc.ReviewId == reviewId)
            .OrderByDescending(rc => rc.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ReviewComplaint>> GetPendingComplaintsAsync()
    {
        return await _dbSet
            .Include(rc => rc.User)
            .Include(rc => rc.Review)
                .ThenInclude(r => r.Booking)
                .ThenInclude(b => b.User)
            .Include(rc => rc.Review)
                .ThenInclude(r => r.Booking)
                .ThenInclude(b => b.Room)
                .ThenInclude(room => room.Hotel)
            .Where(rc => rc.Status == ComplaintStatus.Pending)
            .OrderByDescending(rc => rc.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ReviewComplaint>> GetComplaintsByUserAsync(int userId)
    {
        return await _dbSet
            .Include(rc => rc.User)
            .Include(rc => rc.Review)
            .Where(rc => rc.UserId == userId)
            .OrderByDescending(rc => rc.CreatedAt)
            .ToListAsync();
    }
}
