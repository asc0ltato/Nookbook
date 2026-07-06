using NookBook.API.Data;
using NookBook.API.Models;
using Microsoft.EntityFrameworkCore;

namespace NookBook.API.Services;

public class BookingCancellationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BookingCancellationService> _logger;

    public BookingCancellationService(IServiceProvider serviceProvider, ILogger<BookingCancellationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Starting booking cancellation service - running initial check");
        await CancelExpiredBookingsAsync();

        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.UtcNow;
            var nextRun = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc).AddDays(1);
            var delay = nextRun - now;

            _logger.LogInformation($"Next booking cancellation check scheduled for: {nextRun:yyyy-MM-dd HH:mm:ss} UTC");

            try
            {
                await Task.Delay(delay, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                _logger.LogInformation("Booking cancellation service stopping");
                break;
            }

            if (!stoppingToken.IsCancellationRequested)
            {
                await CancelExpiredBookingsAsync();
            }
        }
    }

    private async Task CancelExpiredBookingsAsync()
    {
        _logger.LogInformation("Starting expired booking cancellation check");

        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        try
        {
            try
            {
                await context.Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE ""BookingStatuses"" 
                    DROP CONSTRAINT IF EXISTS ""FK_BookingStatuses_Users_StatusBy"";
                ");
                _logger.LogInformation("Dropped foreign key constraint");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not drop foreign key constraint");
            }

            try
            {
                await context.Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE ""BookingStatuses"" 
                    ALTER COLUMN ""StatusBy"" DROP NOT NULL;
                ");
                _logger.LogInformation("Made StatusBy column nullable");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not make StatusBy nullable (may already be nullable)");
            }

            try
            {
                await context.Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE ""BookingStatuses"" 
                    ADD CONSTRAINT ""FK_BookingStatuses_Users_StatusBy"" 
                    FOREIGN KEY (""StatusBy"") REFERENCES ""Users""(""Id"") 
                    ON DELETE RESTRICT;
                ");
                _logger.LogInformation("Recreated foreign key constraint allowing nulls");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not recreate foreign key constraint");
            }

            var belarusTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Europe/Minsk");
            var todayLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, belarusTimeZone).Date;
            
            var allPendingBookings = await context.Bookings
                .Include(b => b.BookingStatuses)
                .Where(b => b.BookingStatuses.Any(bs => bs.Status == BookingStatusEnum.Pending))
                .ToListAsync();
            
            var expiredBookings = allPendingBookings
                .Where(b => TimeZoneInfo.ConvertTimeFromUtc(b.CheckInDate, belarusTimeZone).Date < todayLocal)
                .ToList();

            if (expiredBookings.Any())
            {
                _logger.LogInformation($"Found {expiredBookings.Count} expired pending bookings to cancel");

                foreach (var booking in expiredBookings)
                {
                    var cancelledStatus = new BookingStatus
                    {
                        Status = BookingStatusEnum.Cancelled,
                        CreatedAt = DateTime.UtcNow,
                        StatusBy = null // System cancellation
                    };
                    booking.BookingStatuses.Add(cancelledStatus);
                    
                    _logger.LogInformation($"Cancelled booking ID: {booking.Id} (check-in was {booking.CheckInDate:yyyy-MM-dd})");
                }

                await context.SaveChangesAsync();
                _logger.LogInformation($"Successfully cancelled {expiredBookings.Count} expired bookings");
            }
            else
            {
                _logger.LogInformation("No expired pending bookings found");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during automatic booking cancellation");
        }
    }
}
