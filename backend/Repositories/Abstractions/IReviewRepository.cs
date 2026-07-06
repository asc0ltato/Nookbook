using NookBook.API.Models;

namespace NookBook.API.Repositories.Abstractions;

public interface IReviewRepository : IRepository<Review>
{
    Task<IEnumerable<Review>> GetReviewsByHotelAsync(int hotelId, bool approvedOnly = true);
    Task<IEnumerable<Review>> GetReviewsByUserAsync(int userId);
    Task<Review?> GetUserReviewForHotelAsync(int userId, int hotelId);
    Task<Review?> GetUserReviewForBookingAsync(int userId, int bookingId);
    Task<Review?> GetReviewByBookingAsync(int bookingId);
    Task<IEnumerable<Review>> GetPendingReviewsAsync();
    Task<IEnumerable<Review>> GetAllReviewsForModerationAsync(int? hotelId = null);
}
