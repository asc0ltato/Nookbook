namespace NookBook.API.Models;

public enum BookingStatusEnum
{
    Pending = 0,
    Confirmed = 1,
    CheckedIn = 2,
    Completed = 3,
    Cancelled = 4
}

public class BookingStatus
{
    public int Id { get; set; }
    public BookingStatusEnum Status { get; set; } = BookingStatusEnum.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int? StatusBy { get; set; }
    public User? StatusByUser { get; set; } = null!;
    public int BookingId { get; set; }
    public Booking Booking { get; set; } = null!;
}
