namespace NookBook.API.DTOs;

public class CreateReviewCommentDto
{
    public int ReviewId { get; set; }
    public string Comment { get; set; } = string.Empty;
}
