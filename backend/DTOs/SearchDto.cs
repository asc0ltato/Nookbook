namespace NookBook.API.DTOs;

public class SearchHotelsDto
{
    public int? CityId { get; set; }
    public DateTime? CheckInDate { get; set; }
    public DateTime? CheckOutDate { get; set; }
    public int? GuestCount { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public int? MinStars { get; set; }
    public decimal? MinRating { get; set; }
    public List<int>? AmenityIds { get; set; }
    public List<string>? AmenityNames { get; set; }
}