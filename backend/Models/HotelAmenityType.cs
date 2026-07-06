namespace NookBook.API.Models;

public class HotelAmenityType
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    
    public ICollection<HotelAmenity> HotelAmenities { get; set; } = new List<HotelAmenity>();
}