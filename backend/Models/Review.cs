namespace NookBook.API.Models;

public enum ReviewStatus
{
    Pending = 0,
    Approved = 1,
    Hidden = 2,
    Rejected = 3
}

public class Review
{
    public int Id { get; set; }
    public string Comment { get; set; } = string.Empty;
    public decimal Rating { get; set; }
    public ReviewStatus Status { get; set; } = ReviewStatus.Pending;
    public string ModerationReason { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public int? BookingId { get; set; }
    public Booking? Booking { get; set; }

    public ICollection<ReviewComment> ReviewComments { get; set; } = new List<ReviewComment>();
    public ICollection<ReviewComplaint> Complaints { get; set; } = new List<ReviewComplaint>();
    public ICollection<ReviewTag> ReviewTags { get; set; } = new List<ReviewTag>();
}
