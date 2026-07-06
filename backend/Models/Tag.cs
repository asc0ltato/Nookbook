namespace NookBook.API.Models;

public class Tag
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public ICollection<ReviewTag> ReviewLinks { get; set; } = new List<ReviewTag>();
}
