namespace NookBook.API.DTOs;

public class HotelManagerDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
}

public class HotelDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Stars { get; set; }
    public decimal Rating { get; set; }
    public int ReviewCount { get; set; }
    public decimal Price { get; set; }
    public List<string> Images { get; set; } = new();
    public string City { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public decimal DistanceToCenter { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public int? ManagerId { get; set; }
    public List<HotelManagerDto> Managers { get; set; } = new();
    public List<string> Amenities { get; set; } = new();
    public bool IsBlocked { get; set; }
    public string? BlockReason { get; set; }
    public bool HasActiveBookings { get; set; }
}

public class HotelDetailDto : HotelDto
{
    public List<RoomDto> Rooms { get; set; } = new();
    public List<ReviewDto> Reviews { get; set; } = new();
}

public class CreateHotelDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int Stars { get; set; }
    public int CityId { get; set; }
    public string Address { get; set; } = string.Empty;
    public List<int> AmenityIds { get; set; } = new();
    public string? ManagerEmail { get; set; }
    public List<string>? ManagerEmails { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public List<string> Images { get; set; } = new();
}

public class UpdateHotelDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public int? Stars { get; set; }
    public int? CityId { get; set; }
    public string? Address { get; set; }
    public List<int>? AmenityIds { get; set; }
    public string? ManagerEmail { get; set; }
    public List<string>? ManagerEmails { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public List<string>? Images { get; set; }
}
