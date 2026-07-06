using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NookBook.API.DTOs;
using NookBook.API.Services.Abstractions;
using NookBook.API.Repositories.Abstractions;
using System.Security.Claims;

namespace NookBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;
    private readonly IUnitOfWork _unitOfWork;

    public ReviewsController(IReviewService reviewService, IUnitOfWork unitOfWork)
    {
        _reviewService = reviewService;
        _unitOfWork = unitOfWork;
    }

    [HttpGet("hotel/{hotelId}")]
    public async Task<IActionResult> GetHotelReviews(int hotelId)
    {
        int? userId = null;
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(idClaim, out var parsed))
        {
            userId = parsed;
        }

        var result = await _reviewService.GetHotelReviewsAsync(hotelId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserReviews(int userId)
    {
        var result = await _reviewService.GetUserReviewsAsync(userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto createDto)
    {
        var result = await _reviewService.CreateReviewAsync(createDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("{reviewId}")]
    public async Task<IActionResult> UpdateReview(int reviewId, [FromBody] UpdateReviewDto updateDto)
    {
        var result = await _reviewService.UpdateReviewAsync(reviewId, updateDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize]
    [HttpDelete("{reviewId}")]
    public async Task<IActionResult> DeleteReview(int reviewId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("userId")?.Value;
        if (!int.TryParse(userIdClaim, out var userId) || userId <= 0)
        {
            return Unauthorized(new { success = false, message = "Не авторизован" });
        }

        var isAdmin = User.IsInRole("Admin");
        var result = await _reviewService.DeleteReviewAsync(reviewId, userId, isAdmin);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{reviewId}/approve")]
    public async Task<IActionResult> ApproveReview(int reviewId)
    {
        var result = await _reviewService.ApproveReviewAsync(reviewId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{reviewId}/reject")]
    public async Task<IActionResult> RejectReview(int reviewId)
    {
        var result = await _reviewService.RejectReviewAsync(reviewId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPendingReviews()
    {
        var result = await _reviewService.GetPendingReviewsAsync();
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Manager")]
    [HttpGet("moderation/manager")]
    public async Task<IActionResult> GetManagerReviewsModeration([FromQuery] ReviewModerationQueryDto query)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var result = await _reviewService.GetReviewsModerationAsync(query, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("moderation/admin")]
    public async Task<IActionResult> GetAdminReviewsModeration([FromQuery] ReviewModerationQueryDto query)
    {
        var result = await _reviewService.GetReviewsModerationAsync(query);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Manager")]
    [HttpPost("{reviewId}/comment")]
    public async Task<IActionResult> AddReviewComment(int reviewId, [FromBody] CreateReviewCommentDto dto)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        dto.ReviewId = reviewId;
        var result = await _reviewService.AddReviewCommentAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize]
    [HttpDelete("comments/{commentId}")]
    public async Task<IActionResult> DeleteReviewComment(int commentId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var currentUserId = int.TryParse(userIdClaim, out var id) ? id : (int?)null;
        
        if (!currentUserId.HasValue)
        {
            return BadRequest(new { success = false, message = "Не авторизован" });
        }

        var comment = await _unitOfWork.ReviewComments.GetByIdAsync(commentId);
        if (comment == null)
        {
            return NotFound(new { success = false, message = "Комментарий не найден" });
        }

        var user = await _unitOfWork.Users.GetByIdAsync(currentUserId.Value);
        if (user == null)
        {
            return BadRequest(new { success = false, message = "Пользователь не найден" });
        }

        var isAdmin = user.RoleId == 4 || User.IsInRole("Admin");

        // Clients and managers can delete only their own comment; admins can delete any comment.
        if (!isAdmin && comment.UserId != currentUserId.Value)
        {
            return BadRequest(new { success = false, message = "Можно удалять только свой комментарий" });
        }

        if (!isAdmin && (user.RoleId == 2 || user.RoleId == 3))
        {
            var hoursSinceCreation = (DateTime.UtcNow - comment.CreatedAt).TotalHours;
            if (hoursSinceCreation > 24)
            {
                return BadRequest(new { success = false, message = "Удалить комментарий можно только в течение 24 часов после публикации" });
            }
        }

        _unitOfWork.ReviewComments.Delete(comment);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new { success = true, message = "Комментарий удален" });
    }

    [Authorize]
    [HttpPost("{reviewId}/complaint")]
    public async Task<IActionResult> CreateComplaint(int reviewId, [FromBody] CreateReviewComplaintDto dto)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        dto.ReviewId = reviewId;
        var result = await _reviewService.CreateComplaintAsync(dto, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("complaints/{complaintId}/resolve")]
    public async Task<IActionResult> ResolveComplaint(int complaintId, [FromBody] ResolveComplaintDto dto)
    {
        var resolverId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        var result = await _reviewService.ResolveComplaintAsync(complaintId, dto, resolverId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize]
    [HttpPost("{reviewId}/appeal")]
    public async Task<IActionResult> AppealReview(int reviewId, [FromBody] AppealReviewDto? dto)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        var result = await _reviewService.AppealReviewAsync(reviewId, userId, dto?.Comment);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("complaints/pending")]
    public async Task<IActionResult> GetPendingComplaints()
    {
        var result = await _reviewService.GetPendingComplaintsAsync();
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("moderation/complaints/admin")]
    public async Task<IActionResult> GetAdminComplaintsModeration([FromQuery] ReviewModerationQueryDto query)
    {
        var result = await _reviewService.GetComplaintsModerationAsync(query);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{reviewId}/hide")]
    public async Task<IActionResult> HideReview(int reviewId)
    {
        var adminId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var result = await _reviewService.HideReviewAsync(reviewId, adminId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{reviewId}/complaints/reject-all")]
    public async Task<IActionResult> RejectAllComplaints(int reviewId)
    {
        var adminId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var result = await _reviewService.RejectComplaintsForReviewAsync(reviewId, adminId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize]
    [HttpGet("complaints/user/{userId}")]
    public async Task<IActionResult> GetUserComplaints(int userId)
    {
        var result = await _reviewService.GetComplaintsByUserAsync(userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}