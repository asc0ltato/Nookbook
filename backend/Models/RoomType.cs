namespace NookBook.API.Models;

public class RoomType
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int MaxGuests { get; set; }
    public int BedCount { get; set; }
    public decimal Size { get; set; }

    public ICollection<Room> Rooms { get; set; } = new List<Room>();
    public ICollection<RoomTypeImage> Images { get; set; } = new List<RoomTypeImage>();
}
