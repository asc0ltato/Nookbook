namespace NookBook.API.Models;

public class City
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }    
    public ICollection<Hotel> Hotels { get; set; } = new List<Hotel>();
}
