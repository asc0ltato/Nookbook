namespace NookBook.API.Models;

public class BlockHistory
{
    public int Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public bool IsBlocked { get; set; }
    public string? Reason { get; set; }
    public int ChangedByUserId { get; set; }
    public User ChangedByUser { get; set; } = null!;
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}
