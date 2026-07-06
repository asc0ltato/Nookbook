namespace NookBook.API.Models;

public class RoomTypeImage
{
    public int Id { get; set; }
    public string Image { get; set; } = string.Empty;
    public int RoomTypeId { get; set; }
    public RoomType RoomType { get; set; } = null!;
    public bool IsMain { get; set; }
}
