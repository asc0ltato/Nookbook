namespace NookBook.API.DTOs;

public class ReviewDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int HotelId { get; set; }
    public string HotelName { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string UserAvatar { get; set; } = string.Empty;
    public int? BookingId { get; set; }
    public decimal Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public string ModerationReason { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; }
    public int? RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public string RoomDescription { get; set; } = string.Empty;
    public int? NightsStayed { get; set; }
    public List<string> PositiveTags { get; set; } = new();
    public List<string> NegativeTags { get; set; } = new();
    public List<ReviewCommentDto> Comments { get; set; } = new();
    public bool HasUserComplaint { get; set; }
    public string? ManagerResponse { get; set; }
    public DateTime? ManagerResponseAt { get; set; }
    public string? ManagerResponseAuthor { get; set; }
}

public class ReviewCommentDto
{
    public int Id { get; set; }
    public int ReviewId { get; set; }
    public int UserId { get; set; }
    public string Comment { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public int? RoleId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateReviewDto
{
    public int BookingId { get; set; }
    public decimal Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public List<string> PositiveTags { get; set; } = new();
    public List<string> NegativeTags { get; set; } = new();
}

public class UpdateReviewDto
{
    public decimal? Rating { get; set; }
    public string? Comment { get; set; }
    public List<string>? PositiveTags { get; set; }
    public List<string>? NegativeTags { get; set; }
}
