namespace NookBook.API.Models;

public class Room
{
    public int Id { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public MealType MealType { get; set; } = MealType.SelfCatering;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int RoomTypeId { get; set; }
    public RoomType RoomType { get; set; } = null!;
    public int HotelId { get; set; }
    public Hotel Hotel { get; set; } = null!;

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<RoomAmenity> RoomAmenities { get; set; } = new List<RoomAmenity>();
}
