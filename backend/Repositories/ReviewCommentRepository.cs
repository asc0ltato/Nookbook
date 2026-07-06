using Microsoft.EntityFrameworkCore;
using NookBook.API.Data;
using NookBook.API.Models;
using NookBook.API.Repositories.Abstractions;

namespace NookBook.API.Repositories;

public class ReviewCommentRepository : IReviewCommentRepository
{
    private readonly ApplicationDbContext _context;

    public ReviewCommentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ReviewComment?> GetByIdAsync(int id)
    {
        return await _context.ReviewComments
            .Include(c => c.User)
            .Include(c => c.Review)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<IEnumerable<ReviewComment>> GetAllAsync()
    {
        return await _context.ReviewComments
            .Include(c => c.User)
            .Include(c => c.Review)
            .ToListAsync();
    }

    public async Task<IEnumerable<ReviewComment>> FindAsync(System.Linq.Expressions.Expression<Func<ReviewComment, bool>> predicate)
    {
        return await _context.ReviewComments
            .Include(c => c.User)
            .Include(c => c.Review)
            .Where(predicate)
            .ToListAsync();
    }

    public async Task AddAsync(ReviewComment comment)
    {
        await _context.ReviewComments.AddAsync(comment);
    }

    public void Update(ReviewComment comment)
    {
        _context.ReviewComments.Update(comment);
    }

    public void Delete(ReviewComment comment)
    {
        _context.ReviewComments.Remove(comment);
    }
}
