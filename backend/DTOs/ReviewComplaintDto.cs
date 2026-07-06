namespace NookBook.API.DTOs;

public class ReviewComplaintDto
{
    public int Id { get; set; }
    public int ReviewId { get; set; }
    public string ComplaintType { get; set; } = "other";
    public string? Comment { get; set; }
    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public DateTime? ResolvedAt { get; set; }
    public string ReviewText { get; set; } = string.Empty;
    public string ReviewStatus { get; set; } = string.Empty;
    public int? HotelId { get; set; }
    public string HotelName { get; set; } = string.Empty;
}

public class CreateReviewComplaintDto
{
    public int ReviewId { get; set; }
    public string ComplaintType { get; set; } = "other";
    public string? Comment { get; set; }
}

public class ResolveComplaintDto
{
    public bool Approve { get; set; }
}

public class AppealReviewDto
{
    public string? Comment { get; set; }
}
