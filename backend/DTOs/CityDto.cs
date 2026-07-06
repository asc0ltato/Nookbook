namespace NookBook.API.DTOs;

public class CityDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Image { get; set; } = string.Empty;
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}

public class CityWithHotelsDto : CityDto
{
    public List<HotelDto> Hotels { get; set; } = new();
}
