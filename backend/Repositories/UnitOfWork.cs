using Microsoft.EntityFrameworkCore.Storage;
using NookBook.API.Data;
using NookBook.API.Models;
using NookBook.API.Repositories.Abstractions;

namespace NookBook.API.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IDbContextTransaction? _transaction;

    public IHotelRepository Hotels { get; }
    public ICityRepository Cities { get; }
    public IRoomRepository Rooms { get; }
    public IRepository<RoomType> RoomTypes => new Repository<RoomType>(_context);
    public IRepository<RoomTypeImage> RoomTypeImages => new Repository<RoomTypeImage>(_context);
    public IRepository<HotelImage> HotelImages => new Repository<HotelImage>(_context);
    public IReviewRepository Reviews { get; }
    public IUserRepository Users { get; }
    public IBookingRepository Bookings { get; }
    public IFavoriteRepository Favorites { get; }
    public IManagerRepository Managers { get; }
    public IReviewCommentRepository ReviewComments { get; }
    public IReviewComplaintRepository ReviewComplaints { get; }
    public IRepository<BookingStatus> BookingStatuses { get; }
    public IBlockHistoryRepository BlockHistory { get; }

    public UnitOfWork(
        ApplicationDbContext context,
        IHotelRepository hotelRepository,
        ICityRepository cityRepository,
        IRoomRepository roomRepository,
        IReviewRepository reviewRepository,
        IUserRepository userRepository,
        IBookingRepository bookingRepository,
        IFavoriteRepository favoriteRepository,
        IManagerRepository managerRepository,
        IReviewCommentRepository reviewCommentRepository,
        IReviewComplaintRepository reviewComplaintRepository,
        IRepository<BookingStatus> bookingStatusRepository,
        IBlockHistoryRepository blockHistoryRepository)
    {
        _context = context;
        Hotels = hotelRepository;
        Cities = cityRepository;
        Rooms = roomRepository;
        Reviews = reviewRepository;
        Users = userRepository;
        Bookings = bookingRepository;
        Favorites = favoriteRepository;
        Managers = managerRepository;
        ReviewComments = reviewCommentRepository;
        ReviewComplaints = reviewComplaintRepository;
        BookingStatuses = bookingStatusRepository;
        BlockHistory = blockHistoryRepository;
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public async Task BeginTransactionAsync()
    {
        _transaction = await _context.Database.BeginTransactionAsync();
    }

    public async Task CommitTransactionAsync()
    {
        try
        {
            await _context.SaveChangesAsync();
            
            if (_transaction != null)
            {
                await _transaction.CommitAsync();
            }
        }
        catch
        {
            await RollbackTransactionAsync();
            throw;
        }
        finally
        {
            if (_transaction != null)
            {
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }
    }

    public async Task RollbackTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}
