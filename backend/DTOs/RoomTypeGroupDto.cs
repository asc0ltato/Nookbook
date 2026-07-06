namespace NookBook.API.DTOs;

public class RoomTypeGroupDto
{
    public int RoomTypeId { get; set; }
    public string RoomTypeName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal MinPrice { get; set; }
    public int MaxGuests { get; set; }
    public int BedCount { get; set; }
    public decimal Size { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public List<string> Images { get; set; } = new();
    public int AvailableCount { get; set; }
    public List<string> Amenities { get; set; } = new();
    public List<RoomMealOptionDto> MealOptions { get; set; } = new();
}
