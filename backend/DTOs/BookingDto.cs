namespace NookBook.API.DTOs;

public class BookingDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string HotelName { get; set; } = string.Empty;
    public string CityName { get; set; } = string.Empty;
    public int HotelId { get; set; }
    public int RoomId { get; set; }
    public string RoomName { get; set; } = string.Empty;
    public string RoomType { get; set; } = string.Empty;
    public string RoomImageUrl { get; set; } = string.Empty;
    public List<string> RoomImageUrls { get; set; } = new();
    public string BookingCode { get; set; } = string.Empty;
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int GuestCount { get; set; }
    public decimal TotalPrice { get; set; }
    public string SpecialRequests { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string Status { get; set; } = "pending";
    public string StatusBy { get; set; } = string.Empty;
}

public class CreateBookingDto
{
    public int UserId { get; set; }
    public int? HotelId { get; set; }
    public int? RoomId { get; set; }
    public int? RoomTypeId { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public int GuestCount { get; set; }
    public string? SpecialRequests { get; set; }
    public string? PhoneNumber { get; set; }
}

public class UpdateBookingDto
{
    public int? RoomId { get; set; }
    public DateTime? CheckInDate { get; set; }
    public DateTime? CheckOutDate { get; set; }
    public int? GuestCount { get; set; }
    public string? SpecialRequests { get; set; }
    public string? Status { get; set; }
}
