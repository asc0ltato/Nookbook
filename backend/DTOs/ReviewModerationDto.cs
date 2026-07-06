namespace NookBook.API.DTOs;

public class ReviewModerationQueryDto
{
    public int? HotelId { get; set; }
    public string Tab { get; set; } = "needs_reply";
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public decimal? MinRating { get; set; }
    public decimal? MaxRating { get; set; }
    public string? Status { get; set; }
    public string? RoomTypeName { get; set; }
    public string? AuthorSearch { get; set; }
    public string? HotelSearch { get; set; }
    public string Sort { get; set; } = "date_desc";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class ReviewModerationListDto
{
    public List<ReviewModerationItemDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public ReviewModerationTabCountsDto TabCounts { get; set; } = new();
}

public class ReviewModerationTabCountsDto
{
    public int All { get; set; }
    public int Pending { get; set; }
    public int Approved { get; set; }
    public int Rejected { get; set; }
    public int Hidden { get; set; }
    public int Complaints { get; set; }
    public int NeedsReply { get; set; }
    public int Replied { get; set; }
}

public class ReviewModerationItemDto : ReviewDto
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string HotelName { get; set; } = string.Empty;
    public DateTime? CheckInDate { get; set; }
    public DateTime? CheckOutDate { get; set; }
    public int ComplaintCount { get; set; }
    public List<ReviewComplaintDto> Complaints { get; set; } = new();
    public bool HasManagerReply { get; set; }
    public string? ManagerResponse { get; set; }
    public DateTime? ManagerResponseAt { get; set; }
}
