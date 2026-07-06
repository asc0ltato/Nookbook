namespace NookBook.API.Models;

public class Manager
{
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public int HotelId { get; set; }
    public Hotel Hotel { get; set; } = null!;
}
