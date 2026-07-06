namespace NookBook.API.Models;

public class ReviewTag
{
    public int Id { get; set; }
    public int ReviewId { get; set; }
    public Review Review { get; set; } = null!;
    public int TagId { get; set; }
    public Tag Tag { get; set; } = null!;
}
