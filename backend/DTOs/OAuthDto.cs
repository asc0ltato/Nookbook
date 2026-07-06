namespace NookBook.API.DTOs;

public class OAuthCallbackDto
{
    public string Code { get; set; } = string.Empty;
    public string? State { get; set; }
}

