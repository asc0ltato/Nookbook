using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NookBook.API.Services.Abstractions;

namespace NookBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyNotifications([FromQuery] int limit = 30)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        var data = await _notificationService.GetByUserAsync(userId, limit);
        return Ok(new { success = true, data });
    }

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        await _notificationService.MarkAsReadAsync(userId, id);
        return Ok(new { success = true });
    }
}
