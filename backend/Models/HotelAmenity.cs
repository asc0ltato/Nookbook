namespace NookBook.API.Models;

public class HotelAmenity
{
    public int Id { get; set; }
    public int HotelId { get; set; }
    public Hotel Hotel { get; set; } = null!;
    
    public int HotelAmenityTypeId { get; set; }
    public HotelAmenityType HotelAmenityType { get; set; } = null!;
}
