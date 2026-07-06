using NookBook.API.DTOs;

namespace NookBook.API.Services.Abstractions;

public interface IReviewService
{
    Task<ApiResponse<IEnumerable<ReviewDto>>> GetHotelReviewsAsync(int hotelId, int? currentUserId = null);
    Task<ApiResponse<IEnumerable<ReviewDto>>> GetUserReviewsAsync(int userId);
    Task<ApiResponse<ReviewDto>> CreateReviewAsync(CreateReviewDto createDto);
    Task<ApiResponse<ReviewDto>> UpdateReviewAsync(int reviewId, UpdateReviewDto updateDto);
    Task<ApiResponse<bool>> DeleteReviewAsync(int reviewId, int userId, bool isAdmin = false);
    Task<ApiResponse<bool>> ApproveReviewAsync(int reviewId);
    Task<ApiResponse<bool>> RejectReviewAsync(int reviewId);
    Task<ApiResponse<IEnumerable<ReviewDto>>> GetPendingReviewsAsync();
    Task<ApiResponse<bool>> AddReviewCommentAsync(CreateReviewCommentDto dto, int userId);
    Task<ApiResponse<ReviewComplaintDto>> CreateComplaintAsync(CreateReviewComplaintDto dto, int userId);
    Task<ApiResponse<bool>> ResolveComplaintAsync(int complaintId, ResolveComplaintDto dto, int resolverId);
    Task<ApiResponse<bool>> HideReviewAsync(int reviewId, int adminUserId);
    Task<ApiResponse<bool>> RejectComplaintsForReviewAsync(int reviewId, int adminUserId);
    Task<ApiResponse<ReviewModerationListDto>> GetComplaintsModerationAsync(ReviewModerationQueryDto query);
    Task<ApiResponse<bool>> AppealReviewAsync(int reviewId, int userId, string? reason = null);
    Task<ApiResponse<IEnumerable<ReviewComplaintDto>>> GetPendingComplaintsAsync();
    Task<ApiResponse<IEnumerable<ReviewComplaintDto>>> GetComplaintsByUserAsync(int userId);
    Task<ApiResponse<ReviewModerationListDto>> GetReviewsModerationAsync(ReviewModerationQueryDto query, int? managerUserId = null);
}
