namespace NookBook.API.DTOs;

public enum NotificationType
{
    Booking = 0,
    Review = 1,
    Complaint = 2,
    Appeal = 3,
    System = 4,
    Block = 5
}

public class NotificationDto
{
    public Guid Id { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public NotificationType Type { get; set; } = NotificationType.System;
}
