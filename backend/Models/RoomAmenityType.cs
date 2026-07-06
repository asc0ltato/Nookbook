namespace NookBook.API.Models;

public class RoomAmenityType
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public ICollection<RoomAmenity> RoomAmenities { get; set; } = new List<RoomAmenity>();
}

