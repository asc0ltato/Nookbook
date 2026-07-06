using System.Collections.Concurrent;
using NookBook.API.DTOs;
using NookBook.API.Services.Abstractions;

namespace NookBook.API.Services;

public class NotificationService : INotificationService
{
    private readonly ConcurrentDictionary<int, List<NotificationDto>> _notificationsByUser = new();

    public Task AddAsync(int userId, string title, string message, string link = "", NotificationType type = NotificationType.System)
    {
        var list = _notificationsByUser.GetOrAdd(userId, _ => new List<NotificationDto>());
        lock (list)
        {
            list.Insert(0, new NotificationDto
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title,
                Message = message,
                Link = link,
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                Type = type
            });

            if (list.Count > 100)
            {
                list.RemoveRange(100, list.Count - 100);
            }
        }

        return Task.CompletedTask;
    }

    public Task<IReadOnlyCollection<NotificationDto>> GetByUserAsync(int userId, int limit = 30)
    {
        if (!_notificationsByUser.TryGetValue(userId, out var list))
        {
            return Task.FromResult((IReadOnlyCollection<NotificationDto>)Array.Empty<NotificationDto>());
        }

        lock (list)
        {
            return Task.FromResult((IReadOnlyCollection<NotificationDto>)list.Take(limit).ToList());
        }
    }

    public Task MarkAsReadAsync(int userId, Guid notificationId)
    {
        if (_notificationsByUser.TryGetValue(userId, out var list))
        {
            lock (list)
            {
                var item = list.FirstOrDefault(x => x.Id == notificationId);
                if (item != null)
                {
                    item.IsRead = true;
                }
            }
        }

        return Task.CompletedTask;
    }
}
