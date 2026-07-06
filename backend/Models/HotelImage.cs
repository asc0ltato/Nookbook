namespace NookBook.API.Models;

public class HotelImage
{
    public int Id { get; set; }
    public string Image { get; set; } = string.Empty;
    public int HotelId { get; set; }
    public Hotel Hotel { get; set; } = null!;
    public bool IsMain { get; set; } = false;
}
