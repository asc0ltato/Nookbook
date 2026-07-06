using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using NookBook.API.Data;
using NookBook.API.Models;
using NookBook.API.DTOs;
using NookBook.API.Services.Abstractions;

namespace NookBook.API.Services;

public class BookingReminderService : BackgroundService
{
    private static readonly ConcurrentDictionary<string, byte> SentReminders = new();

    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<BookingReminderService> _logger;

    public BookingReminderService(IServiceProvider serviceProvider, ILogger<BookingReminderService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await ProcessRemindersAsync();

        while (!stoppingToken.IsCancellationRequested)
        {
            var delay = TimeSpan.FromHours(1);
            try
            {
                await Task.Delay(delay, stoppingToken);
            }
            catch (TaskCanceledException)
            {
                break;
            }

            if (!stoppingToken.IsCancellationRequested)
            {
                await ProcessRemindersAsync();
            }
        }
    }

    private async Task ProcessRemindersAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<EmailService>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        try
        {
            var belarusTz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Minsk");
            var today = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, belarusTz).Date;

            var bookings = await context.Bookings
                .Include(b => b.User)
                .Include(b => b.Room)
                    .ThenInclude(r => r!.Hotel)
                .Include(b => b.Room)
                    .ThenInclude(r => r!.RoomType)
                .Include(b => b.BookingStatuses)
                .Where(b => b.BookingStatuses.Any(bs => bs.Status == BookingStatusEnum.Confirmed))
                .ToListAsync();

            foreach (var booking in bookings)
            {
                var checkInLocal = TimeZoneInfo.ConvertTimeFromUtc(booking.CheckInDate, belarusTz).Date;
                var daysUntil = (checkInLocal - today).Days;

                if (daysUntil is not (7 or 3 or 1))
                {
                    continue;
                }

                var reminderKey = $"{booking.Id}:{daysUntil}:{checkInLocal:yyyyMMdd}";
                if (!SentReminders.TryAdd(reminderKey, 0))
                {
                    continue;
                }

                try
                {
                    await SendReminderAsync(booking, daysUntil, emailService, notificationService);
                }
                catch
                {
                    SentReminders.TryRemove(reminderKey, out _);
                    throw;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка автоматической отправки напоминаний о бронировании");
        }
    }

    private static async Task SendReminderAsync(
        Booking booking,
        int daysBefore,
        EmailService emailService,
        INotificationService notificationService)
    {
        if (booking.User == null || string.IsNullOrWhiteSpace(booking.User.Email))
        {
            return;
        }

        var bookingCode = $"NB-{booking.Id:D6}";
        var guestName = $"{booking.User.FirstName} {booking.User.LastName}".Trim();
        if (string.IsNullOrWhiteSpace(guestName))
        {
            guestName = booking.User.Email;
        }

        var hotelName = booking.Room?.Hotel?.Name ?? "Отель";
        var roomType = booking.Room?.RoomType?.Name ?? "Номер";

        await emailService.SendBookingReminderAsync(
            booking.User.Email,
            guestName,
            bookingCode,
            hotelName,
            roomType,
            booking.CheckInDate,
            booking.CheckOutDate,
            daysBefore);

        var daysLabel = daysBefore switch
        {
            7 => "неделю",
            3 => "3 дня",
            _ => "завтра"
        };

        await notificationService.AddAsync(
            booking.UserId,
            "Напоминание о бронировании",
            $"До заезда в {hotelName} осталось {daysLabel}. Код бронирования: {bookingCode}.",
            $"/bookings?bookingCode={Uri.EscapeDataString(bookingCode)}",
            NotificationType.Booking);
    }
}
