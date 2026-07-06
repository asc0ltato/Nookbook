using Microsoft.EntityFrameworkCore;
using NookBook.API.Constants;
using NookBook.API.Data;
using NookBook.API.DTOs;
using NookBook.API.Models;
using FluentValidation;
using NookBook.API.Services.Abstractions;
using NookBook.API.Repositories.Abstractions;

namespace NookBook.API.Services;

public class ReviewService : IReviewService
{
    private const string TagsPrefix = "__NB_TAGS__:";
    private readonly IUnitOfWork _unitOfWork;
    private readonly ApplicationDbContext _db;
    private readonly IValidator<CreateReviewDto> _createValidator;
    private readonly CommentModerationService _commentModerationService;
    private readonly INotificationService _notificationService;
    private readonly EmailService _emailService;

    public ReviewService(
        IUnitOfWork unitOfWork,
        ApplicationDbContext db,
        IValidator<CreateReviewDto> createValidator,
        CommentModerationService commentModerationService,
        INotificationService notificationService,
        EmailService emailService)
    {
        _unitOfWork = unitOfWork;
        _db = db;
        _createValidator = createValidator;
        _commentModerationService = commentModerationService;
        _notificationService = notificationService;
        _emailService = emailService;
    }

    private async Task<(int? roomId, string roomType, string roomDescription, int? nightsStayed)> GetBookingInfoForReview(int userId, int hotelId, DateTime reviewCreatedAt)
    {
        try
        {
            var bookings = await _unitOfWork.Bookings.GetBookingsByUserAsync(userId);
            var completedBooking = bookings
                .Where(b => b.CheckOutDate <= reviewCreatedAt)
                .OrderByDescending(b => b.CheckOutDate)
                .FirstOrDefault();

            if (completedBooking != null && completedBooking.Room != null)
            {
                var nights = (completedBooking.CheckOutDate - completedBooking.CheckInDate).Days;
                return (
                    completedBooking.RoomId,
                    completedBooking.Room.RoomType?.Name ?? string.Empty,
                    completedBooking.Room.RoomType?.Description ?? string.Empty,
                    nights
                );
            }

            return (null, string.Empty, string.Empty, null);
        }
        catch
        {
            return (null, string.Empty, string.Empty, null);
        }
    }

    public async Task<ApiResponse<IEnumerable<ReviewDto>>> GetHotelReviewsAsync(int hotelId, int? currentUserId = null)
    {
        try
        {
            var reviews = await _unitOfWork.Reviews.GetReviewsByHotelAsync(hotelId, approvedOnly: true);
            var reviewDtos = new List<ReviewDto>();
            foreach (var review in reviews)
            {
                reviewDtos.Add(await MapToDtoAsync(review, currentUserId));
            }
            return ApiResponse<IEnumerable<ReviewDto>>.SuccessResponse(reviewDtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<ReviewDto>>.ErrorResponse(
                "Ошибка при получении отзывов",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<IEnumerable<ReviewDto>>> GetUserReviewsAsync(int userId)
    {
        try
        {
            var reviews = await _unitOfWork.Reviews.GetReviewsByUserAsync(userId);
            var reviewDtos = new List<ReviewDto>();
            foreach (var review in reviews)
            {
                reviewDtos.Add(await MapToDtoAsync(review, userId));
            }
            return ApiResponse<IEnumerable<ReviewDto>>.SuccessResponse(reviewDtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<ReviewDto>>.ErrorResponse(
                "Ошибка при получении отзывов пользователя",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<ReviewDto>> CreateReviewAsync(CreateReviewDto createDto)
    {
        try
        {
            var validationResult = await _createValidator.ValidateAsync(createDto);
            if (!validationResult.IsValid)
            {
                return ApiResponse<ReviewDto>.ErrorResponse(
                    "Ошибка валидации",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList());
            }

            var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(createDto.BookingId);
            if (booking == null)
            {
                return ApiResponse<ReviewDto>.ErrorResponse("Бронирование не найдено");
            }

            var latestStatus = booking.BookingStatuses
                .OrderByDescending(bs => bs.CreatedAt)
                .FirstOrDefault();
            
            if (latestStatus == null || latestStatus.Status != BookingStatusEnum.Completed)
            {
                return ApiResponse<ReviewDto>.ErrorResponse(
                    "Вы можете оставить отзыв только после завершения бронирования");
            }

            var existingReview = await _unitOfWork.Reviews.GetReviewByBookingAsync(createDto.BookingId);
            
            if (existingReview != null)
            {
                return ApiResponse<ReviewDto>.ErrorResponse(
                    "Вы уже оставили отзыв на это бронирование");
            }

            var normalizedPositiveTags = (createDto.PositiveTags ?? new List<string>())
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Select(t => t.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            var normalizedNegativeTags = (createDto.NegativeTags ?? new List<string>())
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Select(t => t.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            var cleanComment = (createDto.Comment ?? string.Empty).Trim();

            var review = new Review
            {
                BookingId = createDto.BookingId,
                Rating = createDto.Rating,
                Status = ReviewStatus.Pending
            };

            var moderation = _commentModerationService.Analyze(cleanComment);
            var sanitizedComment = moderation.SanitizedText;
            var moderationReasons = new List<string>();
            if (moderation.HasSpam) moderationReasons.Add(moderation.SpamReason);
            if (moderation.HasProfanity) moderationReasons.Add("обнаружен нецензурный язык");
            review.ModerationReason = string.Join("; ", moderationReasons);
            
            review.Comment = cleanComment;

            SetReviewStatus(
                review,
                moderation.HasSpam || moderation.HasProfanity ? ReviewStatus.Pending : ReviewStatus.Approved);

            await _unitOfWork.Reviews.AddAsync(review);
            await _unitOfWork.SaveChangesAsync();
            await SyncReviewTagsAsync(review.Id, normalizedPositiveTags, normalizedNegativeTags);

            review = await _unitOfWork.Reviews.GetByIdAsync(review.Id);
            var loadedReview = (await _unitOfWork.Reviews.FindAsync(r => r.Id == review!.Id)).FirstOrDefault();
            if (loadedReview != null)
            {
                review = loadedReview;
            }

            if (review.Status == ReviewStatus.Pending)
            {
                await NotifyAdminsAsync(
                    "Отзыв на модерации",
                    "Поступил отзыв, требующий проверки администратором.",
                    "/admin?tab=reviews",
                    NotificationType.Review);
                await NotifyReviewAuthorAsync(
                    review,
                    "Отзыв на проверке",
                    "Ваш отзыв отправлен на проверку администратором.",
                    "/my-reviews",
                    sendEmail: false);
            }

            if (review.Booking?.Room?.HotelId != null && review.Status == ReviewStatus.Approved)
            {
                await UpdateHotelRatingAsync(review.Booking.Room.HotelId);
                await NotifyHotelManagersAsync(
                    review,
                    "Новый отзыв опубликован",
                    "На странице отеля появился новый отзыв гостя. При необходимости ответьте на него.");
            }

            var reviewDto = await MapToDtoAsync(review!, null);
            return ApiResponse<ReviewDto>.SuccessResponse(reviewDto, "Отзыв успешно добавлен");
        }
        catch (Exception ex)
        {
            return ApiResponse<ReviewDto>.ErrorResponse(
                "Ошибка при создании отзыва",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<ReviewDto>> UpdateReviewAsync(int reviewId, UpdateReviewDto updateDto)
    {
        try
        {
            var review = await _unitOfWork.Reviews.GetByIdAsync(reviewId);
            if (review == null)
            {
                return ApiResponse<ReviewDto>.ErrorResponse("Отзыв не найден");
            }

            if (updateDto.Rating.HasValue)
            {
                if (updateDto.Rating.Value < 1 || updateDto.Rating.Value > 10)
                {
                    return ApiResponse<ReviewDto>.ErrorResponse("Рейтинг должен быть от 1 до 10");
                }
                review.Rating = updateDto.Rating.Value;
            }

            if (!string.IsNullOrEmpty(updateDto.Comment))
            {
                if (updateDto.Comment.Length < 10)
                {
                    return ApiResponse<ReviewDto>.ErrorResponse(
                        "Комментарий должен содержать минимум 10 символов");
                }
                var tagSnapshot = await GetReviewTagsAsync(review);
                var moderation = _commentModerationService.Analyze(updateDto.Comment.Trim());
                var updatedComment = moderation.SanitizedText;
                var positiveTags = updateDto.PositiveTags ?? tagSnapshot.positiveTags;
                var negativeTags = updateDto.NegativeTags ?? tagSnapshot.negativeTags;
                review.Comment = updatedComment;
                await SyncReviewTagsAsync(review.Id, positiveTags, negativeTags);
                var moderationReasons = new List<string>();
                if (moderation.HasSpam) moderationReasons.Add(moderation.SpamReason);
                if (moderation.HasProfanity) moderationReasons.Add("обнаружен нецензурный язык");
                review.ModerationReason = string.Join("; ", moderationReasons);
                SetReviewStatus(review, moderation.HasSpam || moderation.HasProfanity ? ReviewStatus.Pending : ReviewStatus.Approved);
            }
            else if (updateDto.PositiveTags != null || updateDto.NegativeTags != null)
            {
                var parsed = await GetReviewTagsAsync(review);
                await SyncReviewTagsAsync(
                    review.Id,
                    updateDto.PositiveTags ?? parsed.positiveTags,
                    updateDto.NegativeTags ?? parsed.negativeTags);
            }

            _unitOfWork.Reviews.Update(review);
            
            
            await _unitOfWork.SaveChangesAsync();

            if (review.Booking?.Room?.HotelId != null && review.Status == ReviewStatus.Approved)
            {
                await UpdateHotelRatingAsync(review.Booking.Room.HotelId);
            }

            var reviewDto = await MapToDtoAsync(review);
            return ApiResponse<ReviewDto>.SuccessResponse(reviewDto, "Отзыв успешно обновлен");
        }
        catch (Exception ex)
        {
            return ApiResponse<ReviewDto>.ErrorResponse(
                "Ошибка при обновлении отзыва",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> DeleteReviewAsync(int reviewId, int userId, bool isAdmin = false)
    {
        try
        {
            var review = await _unitOfWork.Reviews.GetByIdAsync(reviewId);
            if (review == null)
            {
                return ApiResponse<bool>.ErrorResponse("Отзыв не найден");
            }

            var currentUser = await _unitOfWork.Users.GetByIdAsync(userId);
            if (!isAdmin)
            {
                isAdmin = currentUser?.RoleId == 4;
            }

            if (review.Booking?.UserId != userId && !isAdmin)
            {
                return ApiResponse<bool>.ErrorResponse("У вас нет прав на удаление этого отзыва");
            }

            var isReviewOwner = review.Booking?.UserId == userId;
            if (isReviewOwner && !isAdmin)
            {
                var hoursSinceCreation = (DateTime.UtcNow - review.CreatedAt).TotalHours;
                if (hoursSinceCreation > 24)
                {
                    return ApiResponse<bool>.ErrorResponse("Клиент может удалить свой отзыв только в течение 24 часов");
                }
            }

            _unitOfWork.Reviews.Remove(review);
            await _unitOfWork.SaveChangesAsync();

            if (review.Booking?.UserId != null)
            {
                await _notificationService.AddAsync(
                    review.Booking.UserId,
                    "Ваш отзыв удален",
                    "Ваш отзыв был удален из системы.",
                    "/bookings",
                    NotificationType.Review);

                var reviewUser = await _unitOfWork.Users.GetByIdAsync(review.Booking.UserId);
                if (reviewUser != null && !string.IsNullOrWhiteSpace(reviewUser.Email))
                {
                    await _emailService.SendReviewNotificationAsync(
                        reviewUser.Email,
                        "Ваш отзыв удален",
                        "Ваш отзыв был удален из системы.");
                }
            }

            if (review.Booking?.Room?.HotelId != null)
            {
                await UpdateHotelRatingAsync(review.Booking.Room.HotelId);
            }

            return ApiResponse<bool>.SuccessResponse(true, "Отзыв удален");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse(
                "Ошибка при удалении отзыва",
                new List<string> { ex.Message });
        }
    }

    private async Task UpdateHotelRatingAsync(int hotelId)
    {
        await _unitOfWork.Reviews.GetReviewsByHotelAsync(hotelId, approvedOnly: true);
    }

    private async Task<ReviewModerationItemDto> MapModerationItemAsync(Review review)
    {
        var dto = await MapToDtoAsync(review);
        var first = review.Booking?.User?.FirstName ?? string.Empty;
        var last = review.Booking?.User?.LastName ?? string.Empty;
        var complaints = review.Complaints?.ToList() ?? new List<ReviewComplaint>();
        var managerComments = (review.ReviewComments ?? Enumerable.Empty<ReviewComment>())
            .Where(c => c.User?.RoleId is 3 or 4)
            .OrderBy(c => c.CreatedAt)
            .ToList();
        var hasManagerReply = managerComments.Count > 0;
        var latestManagerComment = managerComments.LastOrDefault();

        return new ReviewModerationItemDto
        {
            Id = dto.Id,
            UserId = dto.UserId,
            HotelId = dto.HotelId,
            UserName = dto.UserName,
            UserAvatar = dto.UserAvatar,
            BookingId = dto.BookingId,
            Rating = dto.Rating,
            Comment = dto.Comment,
            ModerationReason = dto.ModerationReason,
            Status = dto.Status,
            CreatedAt = dto.CreatedAt,
            RoomId = dto.RoomId,
            RoomName = dto.RoomName,
            RoomDescription = dto.RoomDescription,
            NightsStayed = dto.NightsStayed,
            PositiveTags = dto.PositiveTags,
            NegativeTags = dto.NegativeTags,
            Comments = dto.Comments,
            FirstName = first,
            LastName = last,
            HotelName = review.Booking?.Room?.Hotel?.Name ?? string.Empty,
            CheckInDate = review.Booking?.CheckInDate,
            CheckOutDate = review.Booking?.CheckOutDate,
            ComplaintCount = complaints.Count(c => c.Status == ComplaintStatus.Pending),
            Complaints = complaints.Select(MapComplaintToDto).ToList(),
            HasManagerReply = hasManagerReply,
            ManagerResponse = latestManagerComment?.Comment,
            ManagerResponseAt = latestManagerComment?.CreatedAt,
            ManagerResponseAuthor = latestManagerComment?.User != null
                ? $"{latestManagerComment.User.FirstName} {latestManagerComment.User.LastName}".Trim()
                : null
        };
    }

    private async Task<ReviewDto> MapToDtoAsync(Review review, int? currentUserId = null)
    {
        string userName = string.Empty;
        string userAvatar = string.Empty;
        if (review.Booking?.User != null)
        {
            var firstName = review.Booking.User.FirstName ?? string.Empty;
            var lastName = review.Booking.User.LastName ?? string.Empty;
            userName = $"{firstName} {lastName}".Trim();
            userAvatar = SanitizeUserAvatarForResponse(review.Booking.User.Avatar);
        }

        int? roomId = null;
        string roomName = string.Empty;
        string roomDescription = string.Empty;
        int? nightsStayed = null;

        if (review.Booking?.Room != null)
        {
            roomId = review.Booking.RoomId;
            roomName = review.Booking.Room.RoomType?.Name ?? string.Empty;
            roomDescription = review.Booking.Room.RoomType?.Description ?? string.Empty;
            nightsStayed = (review.Booking.CheckOutDate - review.Booking.CheckInDate).Days;
        }

        var parsedComment = await GetReviewTagsAsync(review);
        var managerComments = (review.ReviewComments ?? Enumerable.Empty<ReviewComment>())
            .Where(c => c.User?.RoleId is 3 or 4)
            .OrderBy(c => c.CreatedAt)
            .ToList();
        var latestManagerComment = managerComments.LastOrDefault();

        return new ReviewDto
        {
            Id = review.Id,
            UserId = review.Booking?.UserId ?? 0,
            HotelId = review.Booking?.Room?.HotelId ?? 0,
            HotelName = review.Booking?.Room?.Hotel?.Name ?? string.Empty,
            UserName = userName,
            UserAvatar = userAvatar,
            BookingId = review.BookingId,
            Rating = review.Rating,
            Comment = ParseStoredComment(review.Comment).comment,
            ModerationReason = review.ModerationReason,
            Status = review.Status.ToString(),
            CreatedAt = review.CreatedAt,
            RoomId = roomId,
            RoomName = roomName,
            RoomDescription = roomDescription,
            NightsStayed = nightsStayed,
            PositiveTags = parsedComment.positiveTags,
            NegativeTags = parsedComment.negativeTags,
            Comments = BuildCommentTree(review.ReviewComments),
            HasUserComplaint = currentUserId.HasValue &&
                (review.Complaints?.Any(c => c.UserId == currentUserId.Value) ?? false),
            ManagerResponse = latestManagerComment?.Comment,
            ManagerResponseAt = latestManagerComment?.CreatedAt,
            ManagerResponseAuthor = latestManagerComment?.User != null
                ? $"{latestManagerComment.User.FirstName} {latestManagerComment.User.LastName}".Trim()
                : null
        };
    }

    public async Task<ApiResponse<bool>> ApproveReviewAsync(int reviewId)
    {
        try
        {
            var review = await _unitOfWork.Reviews.GetByIdAsync(reviewId);
            if (review == null)
            {
                return ApiResponse<bool>.ErrorResponse("Отзыв не найден");
            }

            SetReviewStatus(review, ReviewStatus.Approved);
            _unitOfWork.Reviews.Update(review);
            await _unitOfWork.SaveChangesAsync();
            await NotifyReviewAuthorAsync(
                review,
                "Ваш отзыв одобрен",
                "Администратор одобрил ваш отзыв. Теперь он отображается на странице отеля.",
                "/my-reviews",
                sendEmail: false);
            if (review.Booking?.Room?.HotelId != null)
            {
                await UpdateHotelRatingAsync(review.Booking.Room.HotelId);
                await NotifyHotelManagersAsync(
                    review,
                    "Новый отзыв опубликован",
                    "На странице отеля появился новый отзыв гостя. При необходимости ответьте на него.");
            }

            return ApiResponse<bool>.SuccessResponse(true, "Отзыв одобрен");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse(
                "Ошибка при одобрении отзыва",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> RejectReviewAsync(int reviewId)
    {
        try
        {
            var review = await _unitOfWork.Reviews.GetByIdAsync(reviewId);
            if (review == null)
            {
                return ApiResponse<bool>.ErrorResponse("Отзыв не найден");
            }

            SetReviewStatus(review, ReviewStatus.Rejected);
            _unitOfWork.Reviews.Update(review);
            await _unitOfWork.SaveChangesAsync();
            await NotifyReviewAuthorAsync(
                review,
                "Ваш отзыв отклонен",
                "Администратор отклонил ваш отзыв.",
                "/my-reviews",
                sendEmail: false);
            if (review.Booking?.Room?.HotelId != null)
            {
                await UpdateHotelRatingAsync(review.Booking.Room.HotelId);
            }

            return ApiResponse<bool>.SuccessResponse(true, "Отзыв отклонен");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse(
                "Ошибка при отклонении отзыва",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<IEnumerable<ReviewDto>>> GetPendingReviewsAsync()
    {
        try
        {
            var reviews = await _unitOfWork.Reviews.FindAsync(r =>
                r.Status == ReviewStatus.Pending || r.Status == ReviewStatus.Hidden);
            
            if (reviews == null)
            {
                return ApiResponse<IEnumerable<ReviewDto>>.SuccessResponse(new List<ReviewDto>());
            }

            var reviewDtos = new List<ReviewDto>();
            foreach (var review in reviews)
            {
                try
                {
                    var dto = await MapToDtoAsync(review);
                    reviewDtos.Add(dto);
                }
                catch (Exception)
                {
                    continue;
                }
            }

            return ApiResponse<IEnumerable<ReviewDto>>.SuccessResponse(reviewDtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<ReviewDto>>.ErrorResponse(
                "Ошибка при получении отзывов на модерацию",
                new List<string> { ex.Message, ex.StackTrace ?? string.Empty });
        }
    }

    public async Task<ApiResponse<ReviewModerationListDto>> GetReviewsModerationAsync(
        ReviewModerationQueryDto query,
        int? managerUserId = null)
    {
        try
        {
            int? hotelFilter = query.HotelId;
            if (managerUserId.HasValue)
            {
                var managers = await _unitOfWork.Managers.FindAsync(m => m.UserId == managerUserId.Value);
                var managerHotelIds = managers.Select(m => m.HotelId).Distinct().ToList();
                if (!managerHotelIds.Any())
                {
                    return ApiResponse<ReviewModerationListDto>.ErrorResponse("Менеджер не привязан к отелю");
                }
                if (hotelFilter.HasValue && !managerHotelIds.Contains(hotelFilter.Value))
                {
                    return ApiResponse<ReviewModerationListDto>.ErrorResponse("Нет доступа к отзывам этого отеля");
                }
                if (!hotelFilter.HasValue)
                {
                    hotelFilter = managerHotelIds.First();
                }
            }

            var allReviews = (await _unitOfWork.Reviews.GetAllReviewsForModerationAsync(hotelFilter)).ToList();

            var tab = (query.Tab ?? (managerUserId.HasValue ? "needs_reply" : "moderation")).Trim().ToLowerInvariant();

            bool HasManagerReply(Review r) =>
                (r.ReviewComments ?? Enumerable.Empty<ReviewComment>())
                    .Any(c => c.User?.RoleId is 3 or 4);

            bool MatchesTab(Review r)
            {
                if (managerUserId.HasValue)
                {
                    if (r.Status != ReviewStatus.Approved)
                    {
                        return false;
                    }
                    return tab switch
                    {
                        "replied" or "with_reply" => HasManagerReply(r),
                        "needs_reply" or "without_reply" => !HasManagerReply(r),
                        _ => true
                    };
                }

                return tab switch
                {
                    "moderation" or "pending" => r.Status == ReviewStatus.Pending,
                    "approved" => r.Status == ReviewStatus.Approved,
                    "hidden" => r.Status == ReviewStatus.Hidden,
                    "rejected" => r.Status == ReviewStatus.Rejected,
                    "all" => true,
                    _ => r.Status == ReviewStatus.Pending
                };
            }

            var filtered = allReviews.Where(MatchesTab).AsEnumerable();

            var weekAgoDefault = DateTime.UtcNow.Date.AddDays(-7);
            if (managerUserId.HasValue && !query.DateFrom.HasValue && tab == "needs_reply")
            {
                filtered = filtered.Where(r => r.CreatedAt.Date >= weekAgoDefault);
            }

            if (query.DateFrom.HasValue)
            {
                var from = query.DateFrom.Value.Date;
                filtered = filtered.Where(r => r.CreatedAt.Date >= from);
            }
            if (query.DateTo.HasValue)
            {
                var to = query.DateTo.Value.Date;
                filtered = filtered.Where(r => r.CreatedAt.Date <= to);
            }
            if (query.MinRating.HasValue)
            {
                filtered = filtered.Where(r => r.Rating >= query.MinRating.Value);
            }
            if (query.MaxRating.HasValue)
            {
                filtered = filtered.Where(r => r.Rating <= query.MaxRating.Value);
            }
            if (!string.IsNullOrWhiteSpace(query.Status) &&
                Enum.TryParse<ReviewStatus>(query.Status, true, out var statusFilter))
            {
                filtered = filtered.Where(r => r.Status == statusFilter);
            }
            if (!string.IsNullOrWhiteSpace(query.RoomTypeName))
            {
                var roomType = query.RoomTypeName.Trim();
                filtered = filtered.Where(r =>
                    r.Booking?.Room?.RoomType?.Name != null &&
                    r.Booking.Room.RoomType.Name.Contains(roomType, StringComparison.OrdinalIgnoreCase));
            }
            if (!string.IsNullOrWhiteSpace(query.AuthorSearch))
            {
                var search = query.AuthorSearch.Trim().ToLowerInvariant();
                filtered = filtered.Where(r =>
                {
                    var first = r.Booking?.User?.FirstName?.ToLowerInvariant() ?? string.Empty;
                    var last = r.Booking?.User?.LastName?.ToLowerInvariant() ?? string.Empty;
                    return $"{first} {last}".Contains(search) || first.Contains(search) || last.Contains(search);
                });
            }

            var filteredList = filtered.ToList();
            filteredList = (query.Sort ?? "date_desc").ToLowerInvariant() switch
            {
                "date_asc" => filteredList.OrderBy(r => r.CreatedAt).ToList(),
                "rating_desc" => filteredList.OrderByDescending(r => r.Rating).ThenByDescending(r => r.CreatedAt).ToList(),
                "rating_asc" => filteredList.OrderBy(r => r.Rating).ThenByDescending(r => r.CreatedAt).ToList(),
                _ => filteredList.OrderByDescending(r => r.CreatedAt).ToList()
            };

            var page = query.Page < 1 ? 1 : query.Page;
            var pageSize = query.PageSize is < 1 or > 50 ? 10 : query.PageSize;
            var total = filteredList.Count;
            var pageItems = filteredList.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            var items = new List<ReviewModerationItemDto>();
            foreach (var review in pageItems)
            {
                items.Add(await MapModerationItemAsync(review));
            }

            var publishedForManager = allReviews.Where(r => r.Status == ReviewStatus.Approved).ToList();
            var tabCounts = new ReviewModerationTabCountsDto
            {
                All = managerUserId.HasValue ? publishedForManager.Count : allReviews.Count,
                Pending = allReviews.Count(r => r.Status == ReviewStatus.Pending),
                Approved = allReviews.Count(r => r.Status == ReviewStatus.Approved),
                Hidden = allReviews.Count(r => r.Status == ReviewStatus.Hidden),
                Rejected = allReviews.Count(r => r.Status == ReviewStatus.Rejected),
                Complaints = 0,
                NeedsReply = publishedForManager.Count(r => !HasManagerReply(r)),
                Replied = publishedForManager.Count(r => HasManagerReply(r))
            };

            return ApiResponse<ReviewModerationListDto>.SuccessResponse(new ReviewModerationListDto
            {
                Items = items,
                TotalCount = total,
                Page = page,
                PageSize = pageSize,
                TabCounts = tabCounts
            });
        }
        catch (Exception ex)
        {
            return ApiResponse<ReviewModerationListDto>.ErrorResponse(
                "Ошибка при получении отзывов",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> AddReviewCommentAsync(CreateReviewCommentDto dto, int userId)
    {
        try
        {
            var review = await _unitOfWork.Reviews.GetByIdAsync(dto.ReviewId);
            if (review == null)
            {
                return ApiResponse<bool>.ErrorResponse("Отзыв не найден");
            }

            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<bool>.ErrorResponse("Пользователь не найден");
            }

            if (user.RoleId != 3)
            {
                return ApiResponse<bool>.ErrorResponse("Только менеджеры могут отвечать на отзывы");
            }

            if (user.RoleId == 3)
            {
                var reviewHotelId = review.Booking?.Room?.HotelId;
                if (reviewHotelId.HasValue)
                {
                    var managers = await _unitOfWork.Managers.FindAsync(m => m.UserId == userId);
                    var managerAssignment = managers.FirstOrDefault();
                    if (managerAssignment == null || managerAssignment.HotelId != reviewHotelId.Value)
                    {
                        return ApiResponse<bool>.ErrorResponse("Менеджеры могут отвечать только на отзывы своего отеля");
                    }
                }
            }

            var existingComments = (await _unitOfWork.ReviewComments.FindAsync(c => c.ReviewId == dto.ReviewId)).ToList();
            var hasManagerComment = false;
            foreach (var existingComment in existingComments)
            {
                var author = await _unitOfWork.Users.GetByIdAsync(existingComment.UserId);
                if (author?.RoleId == 3 || author?.RoleId == 4)
                {
                    hasManagerComment = true;
                    break;
                }
            }
            if (hasManagerComment)
            {
                return ApiResponse<bool>.ErrorResponse("На этот отзыв уже есть ответ менеджера");
            }

            var comment = new ReviewComment
            {
                Comment = dto.Comment,
                ReviewId = dto.ReviewId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.ReviewComments.AddAsync(comment);
            await _unitOfWork.SaveChangesAsync();

            if (review.Booking?.UserId != null)
            {
                await _notificationService.AddAsync(
                    review.Booking.UserId,
                    "Ответ менеджера на отзыв",
                    "Менеджер ответил на ваш отзыв.",
                    "/my-reviews",
                    NotificationType.Review);
            }

            return ApiResponse<bool>.SuccessResponse(true, "Ответ на отзыв добавлен");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse(
                "Ошибка при добавлении ответа на отзыв",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<ReviewComplaintDto>> CreateComplaintAsync(CreateReviewComplaintDto dto, int userId)
    {
        try
        {
            var review = await _unitOfWork.Reviews.GetByIdAsync(dto.ReviewId);
            if (review == null)
            {
                return ApiResponse<ReviewComplaintDto>.ErrorResponse("Отзыв не найден");
            }

            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<ReviewComplaintDto>.ErrorResponse("Пользователь не найден");
            }

            if (user.RoleId != 2)
            {
                return ApiResponse<ReviewComplaintDto>.ErrorResponse("Только клиент может подать жалобу на отзыв другого клиента");
            }

            var reviewOwnerId = review.Booking?.UserId;
            if (user.RoleId == 2 && reviewOwnerId == userId)
            {
                return ApiResponse<ReviewComplaintDto>.ErrorResponse("Нельзя пожаловаться на собственный отзыв");
            }

            if (!reviewOwnerId.HasValue)
            {
                return ApiResponse<ReviewComplaintDto>.ErrorResponse("Невозможно определить автора отзыва");
            }

            var reviewOwner = await _unitOfWork.Users.GetByIdAsync(reviewOwnerId.Value);
            if (reviewOwner == null || reviewOwner.RoleId != 2)
            {
                return ApiResponse<ReviewComplaintDto>.ErrorResponse("Жалоба доступна только на отзыв клиента");
            }

            var existingComplaints = await _unitOfWork.ReviewComplaints.GetComplaintsByReviewAsync(dto.ReviewId);
            if (existingComplaints.Any(c => c.UserId == userId))
            {
                return ApiResponse<ReviewComplaintDto>.ErrorResponse("Вы уже отправляли жалобу на этот отзыв");
            }

            var complaint = new ReviewComplaint
            {
                ReviewId = dto.ReviewId,
                Comment = dto.Comment?.Trim() ?? string.Empty,
                ComplaintType = ParseComplaintType(dto.ComplaintType),
                Status = ComplaintStatus.Pending,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.ReviewComplaints.AddAsync(complaint);

            var pendingComplaintCount = existingComplaints.Count(c => c.Status == ComplaintStatus.Pending) + 1;

            await _unitOfWork.SaveChangesAsync();

            await _notificationService.AddAsync(
                userId,
                "Жалоба на рассмотрении",
                "Ваша жалоба передана администратору на рассмотрение.",
                "/my-reviews",
                NotificationType.Complaint);

            if (pendingComplaintCount >= ComplaintModerationThreshold)
            {
                if (reviewOwnerId.HasValue)
                {
                    await NotifyReviewAuthorAsync(
                        review,
                        "Жалобы на ваш отзыв",
                        "На ваш отзыв поступило несколько жалоб. Администратор рассматривает их.",
                        "/my-reviews",
                        sendEmail: false);
                }

                await NotifyAdminsAsync(
                    "Требуется рассмотрение жалоб",
                    $"На отзыв поступило {pendingComplaintCount} жалоб. Требуется рассмотрение.",
                    "/admin?tab=complaints",
                    NotificationType.Complaint);
            }

            var complaintDto = MapComplaintToDto(complaint);
            return ApiResponse<ReviewComplaintDto>.SuccessResponse(complaintDto, "Жалоба отправлена");
        }
        catch (Exception ex)
        {
            return ApiResponse<ReviewComplaintDto>.ErrorResponse(
                "Ошибка при отправке жалобы",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> ResolveComplaintAsync(int complaintId, ResolveComplaintDto dto, int resolverId)
    {
        try
        {
            var complaint = await _unitOfWork.ReviewComplaints.GetByIdAsync(complaintId);
            if (complaint == null)
            {
                return ApiResponse<bool>.ErrorResponse("Жалоба не найдена");
            }

            if (complaint.Status != ComplaintStatus.Pending)
            {
                return ApiResponse<bool>.ErrorResponse("Жалоба уже рассмотрена");
            }

            complaint.Status = dto.Approve ? ComplaintStatus.Resolved : ComplaintStatus.Rejected;
            complaint.ResolvedAt = DateTime.UtcNow;

            var review = await _unitOfWork.Reviews.GetByIdAsync(complaint.ReviewId);

            if (dto.Approve)
            {
                if (review != null)
                {
                    var allComplaints = await _unitOfWork.ReviewComplaints.GetComplaintsByReviewAsync(review.Id);
                    var approvedReasons = allComplaints
                        .Where(c => c.Status == ComplaintStatus.Resolved || c.Id == complaintId)
                        .Select(c => ComplaintTypeLabel(c.ComplaintType))
                        .Distinct()
                        .ToList();
                    var reasonsText = approvedReasons.Any()
                        ? string.Join(", ", approvedReasons)
                        : "нарушение правил";

                    SetReviewStatus(review, ReviewStatus.Hidden);
                    _unitOfWork.Reviews.Update(review);

                    await NotifyReviewAuthorAsync(
                        review,
                        "Отзыв скрыт",
                        $"Ваш отзыв скрыт администратором по жалобам: {reasonsText}.",
                        "/my-reviews",
                        sendEmail: false);

                    await _notificationService.AddAsync(
                        complaint.UserId,
                        "Жалоба одобрена",
                        "Ваша жалоба одобрена администратором.",
                        "/my-reviews",
                        NotificationType.Complaint);

                    if (review.Booking?.Room?.HotelId != null)
                    {
                        await UpdateHotelRatingAsync(review.Booking.Room.HotelId);
                    }
                }
            }
            else
            {
                await _notificationService.AddAsync(
                    complaint.UserId,
                    "Жалоба отклонена",
                    "Ваша жалоба отклонена администратором.",
                    "/my-reviews",
                    NotificationType.Complaint);
            }

            _unitOfWork.ReviewComplaints.Update(complaint);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, dto.Approve ? "Жалоба одобрена, отзыв скрыт" : "Жалоба отклонена");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse(
                "Ошибка при рассмотрении жалобы",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> HideReviewAsync(int reviewId, int adminUserId)
    {
        try
        {
            var review = await _unitOfWork.Reviews.GetByIdAsync(reviewId);
            if (review == null)
            {
                return ApiResponse<bool>.ErrorResponse("Отзыв не найден");
            }

            SetReviewStatus(review, ReviewStatus.Hidden);
            _unitOfWork.Reviews.Update(review);

            var complaints = await _unitOfWork.ReviewComplaints.GetComplaintsByReviewAsync(reviewId);
            foreach (var complaint in complaints.Where(c => c.Status == ComplaintStatus.Pending))
            {
                complaint.Status = ComplaintStatus.Resolved;
                complaint.ResolvedAt = DateTime.UtcNow;
                _unitOfWork.ReviewComplaints.Update(complaint);
            }

            await _unitOfWork.SaveChangesAsync();
            var reasons = complaints
                .Where(c => c.Status == ComplaintStatus.Resolved)
                .Select(c => ComplaintTypeLabel(c.ComplaintType))
                .Distinct()
                .ToList();
            var reasonsText = reasons.Any() ? string.Join(", ", reasons) : "нарушение правил";
            await NotifyReviewAuthorAsync(
                review,
                "Отзыв скрыт",
                $"Ваш отзыв скрыт администратором: {reasonsText}.",
                "/my-reviews",
                sendEmail: false);
            if (review.Booking?.Room?.HotelId != null)
            {
                await UpdateHotelRatingAsync(review.Booking.Room.HotelId);
            }

            return ApiResponse<bool>.SuccessResponse(true, "Отзыв скрыт, жалобы рассмотрены");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse("Ошибка при скрытии отзыва", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> RejectComplaintsForReviewAsync(int reviewId, int adminUserId)
    {
        try
        {
            var review = await _unitOfWork.Reviews.GetByIdAsync(reviewId);
            if (review == null)
            {
                return ApiResponse<bool>.ErrorResponse("Отзыв не найден");
            }

            if (review.Status != ReviewStatus.Approved && review.Status != ReviewStatus.Hidden)
            {
                SetReviewStatus(review, ReviewStatus.Approved);
                _unitOfWork.Reviews.Update(review);
            }

            var complaints = await _unitOfWork.ReviewComplaints.GetComplaintsByReviewAsync(reviewId);
            var pending = complaints.Where(c => c.Status == ComplaintStatus.Pending).ToList();
            if (!pending.Any())
            {
                return ApiResponse<bool>.ErrorResponse("Нет активных жалоб по этому отзыву");
            }

            foreach (var complaint in pending)
            {
                complaint.Status = ComplaintStatus.Rejected;
                complaint.ResolvedAt = DateTime.UtcNow;
                _unitOfWork.ReviewComplaints.Update(complaint);

                await _notificationService.AddAsync(
                    complaint.UserId,
                    "Жалоба отклонена",
                    "Ваша жалоба отклонена администратором.",
                    "/my-reviews",
                    NotificationType.Complaint);
            }

            await _unitOfWork.SaveChangesAsync();
            if (review.Booking?.Room?.HotelId != null)
            {
                await UpdateHotelRatingAsync(review.Booking.Room.HotelId);
            }

            return ApiResponse<bool>.SuccessResponse(true, "Жалобы отклонены, отзыв остается опубликованным");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse("Ошибка при отклонении жалоб", new List<string> { ex.Message });
        }
    }

    private const int ComplaintModerationThreshold = 3;

    private static List<ReviewComplaint> GetReviewComplaints(Review review) =>
        review.Complaints?.ToList() ?? new List<ReviewComplaint>();

    private static bool ReachedComplaintThreshold(Review review) =>
        GetReviewComplaints(review).Count >= ComplaintModerationThreshold;

    private static bool IsInActiveComplaintQueue(Review review) =>
        ReachedComplaintThreshold(review) &&
        GetReviewComplaints(review).Any(c => c.Status == ComplaintStatus.Pending);

    private static bool MatchesComplaintsModerationTab(Review review, string tab)
    {
        if (!ReachedComplaintThreshold(review))
        {
            return false;
        }

        var complaints = GetReviewComplaints(review);
        var hasPending = complaints.Any(c => c.Status == ComplaintStatus.Pending);
        var hasResolved = complaints.Any(c => c.Status == ComplaintStatus.Resolved);
        var hasRejected = complaints.Any(c => c.Status == ComplaintStatus.Rejected);

        return tab switch
        {
            "pending" => hasPending,
            "resolved" or "approved" => !hasPending && hasResolved,
            "rejected" => !hasPending && hasRejected,
            _ => true
        };
    }

    public async Task<ApiResponse<ReviewModerationListDto>> GetComplaintsModerationAsync(ReviewModerationQueryDto query)
    {
        try
        {
            var allReviews = (await _unitOfWork.Reviews.GetAllReviewsForModerationAsync(query.HotelId)).ToList();
            var eligibleReviews = allReviews.Where(ReachedComplaintThreshold).ToList();

            var tab = (query.Tab ?? "pending").Trim().ToLowerInvariant();
            var filtered = eligibleReviews.Where(r => MatchesComplaintsModerationTab(r, tab)).AsEnumerable();

            if (!string.IsNullOrWhiteSpace(query.AuthorSearch))
            {
                var search = query.AuthorSearch.Trim().ToLowerInvariant();
                filtered = filtered.Where(r =>
                {
                    var first = r.Booking?.User?.FirstName?.ToLowerInvariant() ?? string.Empty;
                    var last = r.Booking?.User?.LastName?.ToLowerInvariant() ?? string.Empty;
                    return $"{first} {last}".Contains(search) || first.Contains(search) || last.Contains(search);
                });
            }

            if (!string.IsNullOrWhiteSpace(query.HotelSearch))
            {
                var hotelSearch = query.HotelSearch.Trim().ToLowerInvariant();
                filtered = filtered.Where(r =>
                    (r.Booking?.Room?.Hotel?.Name ?? string.Empty)
                        .Contains(hotelSearch, StringComparison.OrdinalIgnoreCase));
            }

            if (query.DateFrom.HasValue)
            {
                var from = query.DateFrom.Value.Date;
                filtered = filtered.Where(r => r.CreatedAt.Date >= from);
            }
            if (query.DateTo.HasValue)
            {
                var to = query.DateTo.Value.Date;
                filtered = filtered.Where(r => r.CreatedAt.Date <= to);
            }

            var filteredList = filtered.ToList();
            filteredList = (query.Sort ?? "date_desc").ToLowerInvariant() switch
            {
                "date_asc" => filteredList.OrderBy(r => r.CreatedAt).ToList(),
                "rating_desc" => filteredList.OrderByDescending(r => r.Rating).ThenByDescending(r => r.CreatedAt).ToList(),
                "rating_asc" => filteredList.OrderBy(r => r.Rating).ThenByDescending(r => r.CreatedAt).ToList(),
                _ => filteredList
                    .OrderByDescending(r => r.Complaints!.Count(c => c.Status == ComplaintStatus.Pending))
                    .ThenByDescending(r => r.CreatedAt)
                    .ToList()
            };

            var page = query.Page < 1 ? 1 : query.Page;
            var pageSize = query.PageSize is < 1 or > 50 ? 10 : query.PageSize;
            var total = filteredList.Count;
            var pageItems = filteredList.Skip((page - 1) * pageSize).Take(pageSize).ToList();

            var items = new List<ReviewModerationItemDto>();
            foreach (var review in pageItems)
            {
                items.Add(await MapModerationItemAsync(review));
            }

            return ApiResponse<ReviewModerationListDto>.SuccessResponse(new ReviewModerationListDto
            {
                Items = items,
                TotalCount = total,
                Page = page,
                PageSize = pageSize,
                TabCounts = new ReviewModerationTabCountsDto
                {
                    All = eligibleReviews.Count,
                    Pending = eligibleReviews.Count(r => MatchesComplaintsModerationTab(r, "pending")),
                    Approved = eligibleReviews.Count(r => MatchesComplaintsModerationTab(r, "resolved")),
                    Rejected = eligibleReviews.Count(r => MatchesComplaintsModerationTab(r, "rejected")),
                    Complaints = eligibleReviews.Count(IsInActiveComplaintQueue)
                }
            });
        }
        catch (Exception ex)
        {
            return ApiResponse<ReviewModerationListDto>.ErrorResponse(
                "Ошибка при получении жалоб",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> AppealReviewAsync(int reviewId, int userId, string? reason = null)
    {
        return ApiResponse<bool>.ErrorResponse("Подача апелляций отключена");
    }

    public async Task<ApiResponse<IEnumerable<ReviewComplaintDto>>> GetPendingComplaintsAsync()
    {
        try
        {
            var complaints = await _unitOfWork.ReviewComplaints.GetPendingComplaintsAsync();
            var complaintDtos = complaints.Select(MapComplaintToDto);
            return ApiResponse<IEnumerable<ReviewComplaintDto>>.SuccessResponse(complaintDtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<ReviewComplaintDto>>.ErrorResponse(
                "Ошибка при получении жалоб",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<IEnumerable<ReviewComplaintDto>>> GetComplaintsByUserAsync(int userId)
    {
        try
        {
            var complaints = await _unitOfWork.ReviewComplaints.GetComplaintsByUserAsync(userId);
            var complaintDtos = complaints.Select(MapComplaintToDto);
            return ApiResponse<IEnumerable<ReviewComplaintDto>>.SuccessResponse(complaintDtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<ReviewComplaintDto>>.ErrorResponse(
                "Ошибка при получении жалоб пользователя",
                new List<string> { ex.Message });
        }
    }

    private ReviewComplaintDto MapComplaintToDto(ReviewComplaint complaint)
    {
        return new ReviewComplaintDto
        {
            Id = complaint.Id,
            ReviewId = complaint.ReviewId,
            Comment = complaint.Comment,
            ComplaintType = complaint.ComplaintType.ToString(),
            Status = complaint.Status.ToString(),
            CreatedAt = complaint.CreatedAt,
            UserId = complaint.UserId,
            UserName = complaint.User != null ? $"{complaint.User.FirstName} {complaint.User.LastName}" : string.Empty,
            ResolvedAt = complaint.ResolvedAt,
            ReviewText = ParseStoredComment(complaint.Review?.Comment).comment,
            ReviewStatus = complaint.Review?.Status.ToString() ?? string.Empty,
            HotelId = complaint.Review?.Booking?.Room?.HotelId,
            HotelName = complaint.Review?.Booking?.Room?.Hotel?.Name ?? string.Empty
        };
    }

    private static List<ReviewCommentDto> BuildCommentTree(IEnumerable<ReviewComment>? comments)
    {
        return (comments ?? Enumerable.Empty<ReviewComment>())
            .OrderBy(c => c.CreatedAt)
            .Select(c => new ReviewCommentDto
            {
                Id = c.Id,
                ReviewId = c.ReviewId,
                UserId = c.UserId,
                Comment = c.Comment,
                CreatedAt = c.CreatedAt,
                UserName = c.User != null ? $"{c.User.FirstName} {c.User.LastName}".Trim() : string.Empty,
                FirstName = c.User?.FirstName ?? string.Empty,
                LastName = c.User?.LastName ?? string.Empty,
                RoleId = c.User?.RoleId
            })
            .ToList();
    }

    private static string SanitizeUserAvatarForResponse(string? avatar)
    {
        if (string.IsNullOrWhiteSpace(avatar)) return string.Empty;
        if (avatar.StartsWith("data:", StringComparison.OrdinalIgnoreCase)) return string.Empty;
        if (avatar.StartsWith("//", StringComparison.Ordinal)) return $"https:{avatar}";
        return avatar;
    }

    private static void SetReviewStatus(Review review, ReviewStatus status)
    {
        review.Status = status;
        review.UpdatedAt = DateTime.UtcNow;
    }

    private async Task<(List<string> positiveTags, List<string> negativeTags)> GetReviewTagsAsync(Review review)
    {
        var links = review.ReviewTags?.ToList();
        if (links == null || links.Count == 0)
        {
            links = await _db.ReviewTags
                .Include(rt => rt.Tag)
                .Where(rt => rt.ReviewId == review.Id)
                .ToListAsync();
        }

        if (links.Count > 0)
        {
            var names = links.Select(l => l.Tag?.Name ?? string.Empty).Where(n => !string.IsNullOrWhiteSpace(n)).Distinct().ToList();
            return (
                names.Where(n => ReviewTagNames.PositiveSet.Contains(n)).ToList(),
                names.Where(n => ReviewTagNames.NegativeSet.Contains(n)).ToList()
            );
        }

        var legacy = ParseStoredComment(review.Comment);
        return (legacy.positiveTags, legacy.negativeTags);
    }

    private async Task SyncReviewTagsAsync(int reviewId, IReadOnlyCollection<string> positiveTags, IReadOnlyCollection<string> negativeTags)
    {
        var existing = await _db.ReviewTags.Where(rt => rt.ReviewId == reviewId).ToListAsync();
        if (existing.Count > 0)
        {
            _db.ReviewTags.RemoveRange(existing);
        }

        async Task AddTagNames(IEnumerable<string> names)
        {
            foreach (var name in names.Where(n => !string.IsNullOrWhiteSpace(n)).Select(n => n.Trim()).Distinct(StringComparer.OrdinalIgnoreCase))
            {
                var tag = await _db.Tags.FirstOrDefaultAsync(t => t.Name == name);
                if (tag == null)
                {
                    tag = new Tag { Name = name };
                    _db.Tags.Add(tag);
                    await _db.SaveChangesAsync();
                }

                _db.ReviewTags.Add(new ReviewTag
                {
                    ReviewId = reviewId,
                    TagId = tag.Id
                });
            }
        }

        await AddTagNames(positiveTags);
        await AddTagNames(negativeTags);
        await _db.SaveChangesAsync();
    }

    private static ComplaintType ParseComplaintType(string? complaintType)
    {
        if (string.IsNullOrWhiteSpace(complaintType))
        {
            return ComplaintType.Other;
        }

        return complaintType.Trim().ToLowerInvariant() switch
        {
            "spam" => ComplaintType.Spam,
            "оскорбления" => ComplaintType.OffensiveContent,
            "недостоверная информация" => ComplaintType.FalseInformation,
            "нецензурная лексика" => ComplaintType.Profanity,
            "реклама" => ComplaintType.Advertisement,
            "не по теме отеля" => ComplaintType.OffTopic,
            "конфликт интересов" => ComplaintType.ConflictOfInterest,
            "повторная отправка того же отзыва" => ComplaintType.DuplicateSubmission,
            "раскрытие личных данных сотрудников" => ComplaintType.PersonalDataDisclosure,
            "призывы к насилию" => ComplaintType.ViolenceThreats,
            "дискриминация" => ComplaintType.Discrimination,
            "фейковый отзыв от имени другого гостя" => ComplaintType.FakeReview,
            "угрозы в адрес отеля или персонала" => ComplaintType.Threats,
            "fakereview" or "fake" => ComplaintType.FakeReview,
            "offensivecontent" or "offensive" => ComplaintType.OffensiveContent,
            "falseinformation" => ComplaintType.FalseInformation,
            "profanity" => ComplaintType.Profanity,
            "advertisement" => ComplaintType.Advertisement,
            "offtopic" => ComplaintType.OffTopic,
            "conflictofinterest" => ComplaintType.ConflictOfInterest,
            "duplicatesubmission" => ComplaintType.DuplicateSubmission,
            "personaldatadisclosure" => ComplaintType.PersonalDataDisclosure,
            "violencethreats" => ComplaintType.ViolenceThreats,
            "discrimination" => ComplaintType.Discrimination,
            "threats" => ComplaintType.Threats,
            "other" => ComplaintType.Other,
            _ => Enum.TryParse<ComplaintType>(complaintType, true, out var parsed) ? parsed : ComplaintType.Other
        };
    }

    private static string ComplaintTypeLabel(ComplaintType type) => type switch
    {
        ComplaintType.Spam => "спам",
        ComplaintType.OffensiveContent => "оскорбления",
        ComplaintType.FalseInformation => "недостоверная информация",
        ComplaintType.Profanity => "нецензурная лексика",
        ComplaintType.Advertisement => "реклама",
        ComplaintType.OffTopic => "не по теме отеля",
        ComplaintType.ConflictOfInterest => "конфликт интересов",
        ComplaintType.DuplicateSubmission => "повторная отправка",
        ComplaintType.PersonalDataDisclosure => "личные данные",
        ComplaintType.ViolenceThreats => "призывы к насилию",
        ComplaintType.Discrimination => "дискриминация",
        ComplaintType.FakeReview => "фейковый отзыв",
        ComplaintType.Threats => "угрозы",
        _ => "другое"
    };

    private async Task NotifyReviewAuthorAsync(
        Review review,
        string title,
        string message,
        string link = "/my-reviews",
        bool sendEmail = true)
    {
        var authorId = review.Booking?.UserId;
        if (authorId.HasValue)
        {
            await _notificationService.AddAsync(authorId.Value, title, message, link, NotificationType.Review);

            if (sendEmail)
            {
                var reviewUser = await _unitOfWork.Users.GetByIdAsync(authorId.Value);
                if (reviewUser != null && !string.IsNullOrWhiteSpace(reviewUser.Email))
                {
                    await _emailService.SendReviewNotificationAsync(reviewUser.Email, title, message);
                }
            }
        }
    }

    private async Task NotifyHotelManagersAsync(Review review, string title, string message)
    {
        var hotelId = review.Booking?.Room?.HotelId;
        if (!hotelId.HasValue)
        {
            return;
        }

        var managers = await _unitOfWork.Managers.FindAsync(m => m.HotelId == hotelId.Value);
        foreach (var managerUserId in managers.Select(m => m.UserId).Distinct())
        {
            await _notificationService.AddAsync(
                managerUserId,
                title,
                message,
                $"/manager?tab=reviews&reviewId={review.Id}",
                NotificationType.Review);
        }
    }

    private async Task NotifyAdminsAsync(string title, string message, string link = "", NotificationType type = NotificationType.Appeal)
    {
        var admins = await _unitOfWork.Users.FindAsync(u => u.RoleId == 4);
        foreach (var adminId in admins.Select(u => u.Id).Distinct())
        {
            await _notificationService.AddAsync(adminId, title, message, link, type);
        }
    }

    private static string BuildStoredComment(string comment, IReadOnlyCollection<string> positiveTags, IReadOnlyCollection<string> negativeTags)
    {
        var normalizedPositive = positiveTags
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Select(t => t.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        var normalizedNegative = negativeTags
            .Where(t => !string.IsNullOrWhiteSpace(t))
            .Select(t => t.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (!normalizedPositive.Any() && !normalizedNegative.Any())
        {
            return comment;
        }

        var tagsPayload = $"{string.Join(",", normalizedPositive)}|{string.Join(",", normalizedNegative)}";
        return $"{TagsPrefix}{tagsPayload}::{comment}";
    }

    private static (string comment, List<string> positiveTags, List<string> negativeTags) ParseStoredComment(string? storedComment)
    {
        var raw = storedComment ?? string.Empty;
        if (!raw.StartsWith(TagsPrefix, StringComparison.Ordinal))
        {
            return (raw, new List<string>(), new List<string>());
        }

        var separatorIndex = raw.IndexOf("::", StringComparison.Ordinal);
        if (separatorIndex < 0)
        {
            return (raw, new List<string>(), new List<string>());
        }

        var payload = raw.Substring(TagsPrefix.Length, separatorIndex - TagsPrefix.Length);
        var comment = raw[(separatorIndex + 2)..];
        var parts = payload.Split('|');

        var positive = parts.ElementAtOrDefault(0)?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList() ?? new List<string>();
        var negative = parts.ElementAtOrDefault(1)?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList() ?? new List<string>();

        return (comment, positive, negative);
    }
}