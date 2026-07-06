using NookBook.API.Models;

namespace NookBook.API.Repositories.Abstractions;

public interface IReviewComplaintRepository : IRepository<ReviewComplaint>
{
    Task<IEnumerable<ReviewComplaint>> GetComplaintsByReviewAsync(int reviewId);
    Task<IEnumerable<ReviewComplaint>> GetPendingComplaintsAsync();
    Task<IEnumerable<ReviewComplaint>> GetComplaintsByUserAsync(int userId);
}
