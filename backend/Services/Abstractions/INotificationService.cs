using NookBook.API.DTOs;

namespace NookBook.API.Services.Abstractions;

public interface INotificationService
{
    Task AddAsync(int userId, string title, string message, string link = "", NotificationType type = NotificationType.System);
    Task<IReadOnlyCollection<NotificationDto>> GetByUserAsync(int userId, int limit = 30);
    Task MarkAsReadAsync(int userId, Guid notificationId);
}
