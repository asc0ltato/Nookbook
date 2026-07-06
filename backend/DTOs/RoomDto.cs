namespace NookBook.API.DTOs;

public class RoomDto
{
    public int Id { get; set; }
    public int HotelId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int MaxGuests { get; set; }
    public int BedCount { get; set; }
    public decimal Size { get; set; }
    public string Image { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public List<string> Images { get; set; } = new();
    public string RoomType { get; set; } = string.Empty;
    public int RoomTypeId { get; set; }
    public List<string> Amenities { get; set; } = new();
    public bool IsBlocked { get; set; }
    public string? BlockReason { get; set; }
    public int MealType { get; set; }
    public string MealLabel { get; set; } = string.Empty;
}

public class CreateRoomDto
{
    public int HotelId { get; set; }
    public int RoomTypeId { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Description { get; set; }
    public int? Price { get; set; }
    public int? MaxGuests { get; set; }
    public int? BedCount { get; set; }
    public decimal? Size { get; set; }
    public List<int> AmenityTypeIds { get; set; } = new();
    public string? Image { get; set; }
    public List<string> Images { get; set; } = new();
    public int? MealType { get; set; }
}

public class UpdateRoomDto
{
    public string? RoomNumber { get; set; }
    public string? Name { get; set; }
    public int? RoomTypeId { get; set; }
    public string? Description { get; set; }
    public int? Price { get; set; }
    public int? MealType { get; set; }
    public int? MaxGuests { get; set; }
    public int? BedCount { get; set; }
    public decimal? Size { get; set; }
    public List<int>? AmenityTypeIds { get; set; }
    public string? Image { get; set; }
    public List<string>? Images { get; set; }
}
