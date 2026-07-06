namespace NookBook.API.Models;

public class Booking
{
    public int Id { get; set; }
    public int GuestCount { get; set; }
    public decimal TotalPrice { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public string SpecialRequests { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int RoomId { get; set; }
    public Room Room { get; set; } = null!;
    public ICollection<BookingStatus> BookingStatuses { get; set; } = new List<BookingStatus>();
}
