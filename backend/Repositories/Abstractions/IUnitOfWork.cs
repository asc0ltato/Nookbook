using NookBook.API.Models;

namespace NookBook.API.Repositories.Abstractions;

public interface IUnitOfWork : IDisposable
{
    IHotelRepository Hotels { get; }
    ICityRepository Cities { get; }
    IRoomRepository Rooms { get; }
    IRepository<RoomType> RoomTypes { get; }
    IRepository<RoomTypeImage> RoomTypeImages { get; }
    IRepository<HotelImage> HotelImages { get; }
    IReviewRepository Reviews { get; }
    IUserRepository Users { get; }
    IBookingRepository Bookings { get; }
    IFavoriteRepository Favorites { get; }
    IManagerRepository Managers { get; }
    IReviewCommentRepository ReviewComments { get; }
    IReviewComplaintRepository ReviewComplaints { get; }
    IRepository<BookingStatus> BookingStatuses { get; }
    IBlockHistoryRepository BlockHistory { get; }

    Task<int> SaveChangesAsync();
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
}
