namespace NookBook.API.Models;

public enum ComplaintStatus
{
    Pending = 0,
    Resolved = 1,
    Rejected = 2
}

public enum ComplaintType
{
    Spam = 0,
    OffensiveContent = 1,
    FalseInformation = 2,
    Profanity = 3,
    Advertisement = 4,
    OffTopic = 5,
    ConflictOfInterest = 6,
    DuplicateSubmission = 7,
    PersonalDataDisclosure = 8,
    ViolenceThreats = 9,
    Discrimination = 10,
    FakeReview = 11,
    Threats = 12,
    Other = 13
}

public class ReviewComplaint
{
    public int Id { get; set; }
    public ComplaintType ComplaintType { get; set; } = ComplaintType.Other;
    public string Comment { get; set; } = string.Empty;
    public ComplaintStatus Status { get; set; } = ComplaintStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int ReviewId { get; set; }
    public Review Review { get; set; } = null!;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime? ResolvedAt { get; set; }
}
