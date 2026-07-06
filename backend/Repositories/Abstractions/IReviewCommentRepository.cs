using NookBook.API.Models;

namespace NookBook.API.Repositories.Abstractions;

public interface IReviewCommentRepository
{
    Task<ReviewComment?> GetByIdAsync(int id);
    Task<IEnumerable<ReviewComment>> GetAllAsync();
    Task<IEnumerable<ReviewComment>> FindAsync(System.Linq.Expressions.Expression<Func<ReviewComment, bool>> predicate);
    Task AddAsync(ReviewComment comment);
    void Update(ReviewComment comment);
    void Delete(ReviewComment comment);
}
