namespace NookBook.API.DTOs;

public class RoomMealOptionDto
{
    public int MealType { get; set; }
    public string MealLabel { get; set; } = string.Empty;
    public int AvailableCount { get; set; }
    public decimal Price { get; set; }
    public int RoomId { get; set; }
}
