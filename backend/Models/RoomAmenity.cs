namespace NookBook.API.Models;

public class RoomAmenity
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public Room Room { get; set; } = null!;
    
    public int RoomAmenityTypeId { get; set; }
    public RoomAmenityType RoomAmenityType { get; set; } = null!;
}

