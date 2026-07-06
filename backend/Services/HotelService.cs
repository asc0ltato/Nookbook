using NookBook.API.DTOs;
using NookBook.API.Models;
using FluentValidation;
using NookBook.API.Services.Abstractions;
using NookBook.API.Repositories.Abstractions;

namespace NookBook.API.Services;

public class HotelService : IHotelService
{
    private const string DefaultHotelImage = "/assets/hotels/block.jpg";
    private static readonly BookingStatusEnum[] BlockingBookingStatuses =
        [BookingStatusEnum.Pending, BookingStatusEnum.Confirmed, BookingStatusEnum.CheckedIn];

    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<CreateHotelDto> _createValidator;
    private readonly INotificationService _notificationService;

    public HotelService(
        IUnitOfWork unitOfWork,
        IValidator<CreateHotelDto> createValidator,
        INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _createValidator = createValidator;
        _notificationService = notificationService;
    }

    public async Task<ApiResponse<IEnumerable<HotelDto>>> GetAllHotelsAsync()
    {
        try
        {
            var hotels = await _unitOfWork.Hotels.GetAllAsync();
            var hotelDtos = await BuildHotelDtosAsync(hotels);
            return ApiResponse<IEnumerable<HotelDto>>.SuccessResponse(hotelDtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<HotelDto>>.ErrorResponse(
                "Ошибка при получении списка отелей",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<HotelDetailDto>> GetHotelByIdAsync(int id)
    {
        try
        {
            var hotel = await _unitOfWork.Hotels.GetHotelWithDetailsAsync(id);
            
            if (hotel == null)
            {
                return ApiResponse<HotelDetailDto>.ErrorResponse("Отель не найден");
            }

            var reviewStats = await GetReviewStatsAsync(new[] { hotel });
            var hotelDto = MapToDetailDto(hotel, reviewStats);
            return ApiResponse<HotelDetailDto>.SuccessResponse(hotelDto);
        }
        catch (Exception ex)
        {
            return ApiResponse<HotelDetailDto>.ErrorResponse(
                "Ошибка при получении отеля",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<IEnumerable<HotelDto>>> GetHotelsByCityAsync(int cityId, int? userId = null)
    {
        try
        {
            var hotels = await _unitOfWork.Hotels.GetHotelsByCityAsync(cityId);
            
            if (!hotels.Any())
            {
                var cities = await _unitOfWork.Cities.GetAllAsync();
                var city = cities.FirstOrDefault(c => c.Id == cityId);
                if (city == null)
                {
                    return ApiResponse<IEnumerable<HotelDto>>.ErrorResponse("Город не найден");
                }
            }

            var hotelDtos = await BuildHotelDtosAsync(hotels);
            return ApiResponse<IEnumerable<HotelDto>>.SuccessResponse(hotelDtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<HotelDto>>.ErrorResponse(
                "Ошибка при получении отелей города",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<IEnumerable<HotelDto>>> SearchHotelsAsync(SearchHotelsDto searchDto)
    {
        try
        {
            if (searchDto.CityId == null || searchDto.CityId <= 0)
            {
                return ApiResponse<IEnumerable<HotelDto>>.ErrorResponse("Необходимо указать город");
            }

            if (searchDto.CheckInDate.HasValue && searchDto.CheckOutDate.HasValue)
            {
                if (searchDto.CheckInDate >= searchDto.CheckOutDate)
                {
                    return ApiResponse<IEnumerable<HotelDto>>.ErrorResponse(
                        "Дата выезда должна быть позже даты заезда");
                }

                if (searchDto.CheckInDate < DateTime.Today)
                {
                    return ApiResponse<IEnumerable<HotelDto>>.ErrorResponse(
                        "Дата заезда не может быть в прошлом");
                }
            }

            var hotels = await _unitOfWork.Hotels.SearchHotelsAsync(
                searchDto.CityId.Value,
                searchDto.CheckInDate,
                searchDto.CheckOutDate,
                searchDto.GuestCount);

            var filteredHotels = hotels.AsEnumerable();

            if (searchDto.MinPrice.HasValue)
            {
                filteredHotels = filteredHotels.Where(h =>
                    h.Rooms.Any() &&
                    h.Rooms.Min(r => r.Price) >= searchDto.MinPrice.Value);
            }

            if (searchDto.MaxPrice.HasValue)
            {
                filteredHotels = filteredHotels.Where(h =>
                    h.Rooms.Any() &&
                    h.Rooms.Min(r => r.Price) <= searchDto.MaxPrice.Value);
            }

            if (searchDto.MinStars.HasValue)
            {
                filteredHotels = filteredHotels.Where(h => h.Stars >= searchDto.MinStars.Value);
            }

            if (searchDto.AmenityIds != null && searchDto.AmenityIds.Any())
            {
                filteredHotels = filteredHotels.Where(h =>
                    searchDto.AmenityIds.All(amenityId =>
                        h.HotelAmenities.Any(ha => ha.HotelAmenityTypeId == amenityId)));
            }

            if (searchDto.AmenityNames != null && searchDto.AmenityNames.Any())
            {
                filteredHotels = filteredHotels.Where(h =>
                    searchDto.AmenityNames.All(amenityName =>
                        h.HotelAmenities.Any(ha => 
                            ha.HotelAmenityType.Name.Equals(amenityName, StringComparison.OrdinalIgnoreCase))));
            }

            var hotelDtos = await BuildHotelDtosAsync(filteredHotels);
            return ApiResponse<IEnumerable<HotelDto>>.SuccessResponse(hotelDtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<HotelDto>>.ErrorResponse(
                "Ошибка при поиске отелей",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<HotelDto>> CreateHotelAsync(CreateHotelDto createDto)
    {
        try
        {
            var validationResult = await _createValidator.ValidateAsync(createDto);
            if (!validationResult.IsValid)
            {
                return ApiResponse<HotelDto>.ErrorResponse(
                    "Ошибка валидации",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList());
            }

            var city = await _unitOfWork.Cities.GetByIdAsync(createDto.CityId);
            if (city == null)
            {
                return ApiResponse<HotelDto>.ErrorResponse("Город не найден");
            }

            var createManagerEmails = NormalizeManagerEmails(createDto.ManagerEmails, createDto.ManagerEmail);
            foreach (var email in createManagerEmails)
            {
                var managerUser = await _unitOfWork.Users.GetUserByEmailAsync(email);
                if (managerUser == null)
                {
                    return ApiResponse<HotelDto>.ErrorResponse($"Менеджер с email {email} не найден");
                }
            }

            var hotel = new Hotel
            {
                Name = createDto.Name,
                Description = createDto.Description,
                Stars = createDto.Stars,
                CityId = createDto.CityId,
                Address = createDto.Address,
                Latitude = createDto.Latitude,
                Longitude = createDto.Longitude
            };

            await _unitOfWork.Hotels.AddAsync(hotel);
            await _unitOfWork.SaveChangesAsync();

            if (createDto.Images != null && createDto.Images.Any())
            {
                for (int i = 0; i < createDto.Images.Count; i++)
                {
                    hotel.Images.Add(new HotelImage
                    {
                        HotelId = hotel.Id,
                        Image = createDto.Images[i],
                        IsMain = i == 0
                    });
                }
                await _unitOfWork.SaveChangesAsync();
            }

            if (createDto.AmenityIds.Any())
            {
                foreach (var amenityTypeId in createDto.AmenityIds)
                {
                    hotel.HotelAmenities.Add(new HotelAmenity
                    {
                        HotelId = hotel.Id,
                        HotelAmenityTypeId = amenityTypeId
                    });
                }
                await _unitOfWork.SaveChangesAsync();
            }

            await SetHotelManagersAsync(hotel.Id, createManagerEmails);

            _unitOfWork.Hotels.InvalidateCityCache(hotel.CityId);
            
            var hotelWithDetails = await _unitOfWork.Hotels.GetHotelWithDetailsAsync(hotel.Id);
            var hotelDto = hotelWithDetails != null ? MapToDto(hotelWithDetails) : MapToDto(hotel);
            return ApiResponse<HotelDto>.SuccessResponse(hotelDto, "Отель успешно создан");
        }
        catch (Exception ex)
        {
            return ApiResponse<HotelDto>.ErrorResponse(
                "Ошибка при создании отеля",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<HotelDto>> UpdateHotelAsync(int id, UpdateHotelDto updateDto)
    {
        try
        {
            var hotel = await _unitOfWork.Hotels.GetHotelWithDetailsAsync(id);
            if (hotel == null)
            {
                return ApiResponse<HotelDto>.ErrorResponse("Отель не найден");
            }

            if (!string.IsNullOrEmpty(updateDto.Name))
                hotel.Name = updateDto.Name;
            
            if (!string.IsNullOrEmpty(updateDto.Description))
                hotel.Description = updateDto.Description;
            
            if (updateDto.Stars.HasValue)
                hotel.Stars = updateDto.Stars.Value;

            if (!string.IsNullOrEmpty(updateDto.Address))
                hotel.Address = updateDto.Address;

            if (updateDto.Latitude.HasValue)
                hotel.Latitude = updateDto.Latitude.Value;

            if (updateDto.Longitude.HasValue)
                hotel.Longitude = updateDto.Longitude.Value;

            if (updateDto.Images != null)
            {
                await ReplaceHotelImagesAsync(hotel, updateDto.Images);
            }

            if (updateDto.ManagerEmails != null)
            {
                var updateEmails = NormalizeManagerEmails(updateDto.ManagerEmails, null);
                foreach (var email in updateEmails)
                {
                    var managerUser = await _unitOfWork.Users.GetUserByEmailAsync(email);
                    if (managerUser == null)
                    {
                        return ApiResponse<HotelDto>.ErrorResponse($"Менеджер с email {email} не найден");
                    }
                }

                await SetHotelManagersAsync(hotel.Id, updateEmails);
            }
            else if (updateDto.ManagerEmail != null)
            {
                var single = string.IsNullOrWhiteSpace(updateDto.ManagerEmail)
                    ? new List<string>()
                    : new List<string> { updateDto.ManagerEmail.Trim() };
                foreach (var email in single)
                {
                    var managerUser = await _unitOfWork.Users.GetUserByEmailAsync(email);
                    if (managerUser == null)
                    {
                        return ApiResponse<HotelDto>.ErrorResponse($"Менеджер с email {email} не найден");
                    }
                }

                await SetHotelManagersAsync(hotel.Id, single);
            }

            if (updateDto.AmenityIds != null)
            {
                var existingAmenities = hotel.HotelAmenities.ToList();
                foreach (var amenity in existingAmenities)
                {
                    hotel.HotelAmenities.Remove(amenity);
                }
                await _unitOfWork.SaveChangesAsync();

                foreach (var amenityTypeId in updateDto.AmenityIds)
                {
                    hotel.HotelAmenities.Add(new HotelAmenity
                    {
                        HotelId = hotel.Id,
                        HotelAmenityTypeId = amenityTypeId
                    });
                }
            }

            int? oldCityId = null;
            if (updateDto.CityId.HasValue && updateDto.CityId.Value > 0 && updateDto.CityId.Value != hotel.CityId)
            {
                oldCityId = hotel.CityId;
                var newCity = await _unitOfWork.Cities.GetByIdAsync(updateDto.CityId.Value);
                if (newCity == null)
                {
                    return ApiResponse<HotelDto>.ErrorResponse("Город не найден");
                }
                hotel.CityId = updateDto.CityId.Value;
            }

            hotel.UpdatedAt = DateTime.UtcNow;

            var cityId = hotel.CityId;
            _unitOfWork.Hotels.Update(hotel);
            await _unitOfWork.SaveChangesAsync();

            _unitOfWork.Hotels.InvalidateCityCache(cityId);

            var hotelWithDetails = await _unitOfWork.Hotels.GetHotelWithDetailsAsync(hotel.Id);
            var hotelDto = hotelWithDetails != null ? MapToDto(hotelWithDetails) : MapToDto(hotel);
            return ApiResponse<HotelDto>.SuccessResponse(hotelDto, "Отель успешно обновлен");
        }
        catch (Exception ex)
        {
            return ApiResponse<HotelDto>.ErrorResponse(
                "Ошибка при обновлении отеля",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> DeleteHotelAsync(int id)
    {
        try
        {
            var hotel = await _unitOfWork.Hotels.GetHotelWithDetailsAsync(id);
            if (hotel == null)
            {
                return ApiResponse<bool>.ErrorResponse("Отель не найден");
            }

            var bookings = await _unitOfWork.Bookings.GetBookingsByHotelAsync(id);
            var pendingBookings = bookings.ToList();
            if (pendingBookings.Any())
            {
                return ApiResponse<bool>.ErrorResponse(
                    $"Невозможно удалить отель. Есть {pendingBookings.Count} ожидающих бронирований. Сначала завершите или отмените все бронирования.");
            }

            var cityId = hotel.CityId;

            _unitOfWork.Hotels.Remove(hotel);
            await _unitOfWork.SaveChangesAsync();

            _unitOfWork.Hotels.InvalidateCityCache(cityId);
            return ApiResponse<bool>.SuccessResponse(true, "Отель успешно удален");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse(
                "Ошибка при удалении отеля",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<IEnumerable<HotelDto>>> GetTopRatedHotelsAsync(int count = 10)
    {
        try
        {
            var hotels = await _unitOfWork.Hotels.GetTopRatedHotelsAsync(count);
            var hotelDtos = await BuildHotelDtosAsync(hotels);
            return ApiResponse<IEnumerable<HotelDto>>.SuccessResponse(hotelDtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<HotelDto>>.ErrorResponse(
                "Ошибка при получении топ отелей",
                new List<string> { ex.Message });
        }
    }

    private static string GetMealLabel(MealType mealType) => mealType switch
    {
        MealType.Breakfast => "завтрак включен",
        MealType.HalfBoard => "завтрак и ужин включены",
        _ => "с собственной кухней"
    };

    private HotelDto MapToDto(
        Hotel hotel,
        IReadOnlyDictionary<int, (decimal rating, int reviewCount)>? reviewStats = null,
        Dictionary<int, BlockHistory>? latestBlocks = null,
        Dictionary<int, string?>? lastBlockReasons = null)
    {
        var rating = reviewStats != null && reviewStats.TryGetValue(hotel.Id, out var stats) ? stats.rating : 0m;
        var reviewCount = reviewStats != null && reviewStats.TryGetValue(hotel.Id, out stats) ? stats.reviewCount : 0;

        var price = hotel.Rooms?.Any() == true
            ? hotel.Rooms.Min(r => r.Price)
            : 0m;
        var images = BuildHotelImageList(hotel.Images);
        var amenities = hotel.HotelAmenities?.Select(ha => ha.HotelAmenityType.Name).ToList() ?? new List<string>();
        var managers = MapHotelManagers(hotel);

        var blockEntry = latestBlocks != null && latestBlocks.TryGetValue(hotel.Id, out var bh) ? bh : null;
        var isBlocked = blockEntry?.IsBlocked ?? false;
        var displayBlockReason = isBlocked ? blockEntry?.Reason : null;

        return new HotelDto
        {
            Id = hotel.Id,
            Name = hotel.Name,
            Description = hotel.Description,
            Stars = hotel.Stars,
            Rating = rating,
            ReviewCount = reviewCount,
            Price = price,
            Images = images,
            City = hotel.City?.Name ?? string.Empty,
            Address = hotel.Address,
            DistanceToCenter = 0,
            Latitude = hotel.Latitude,
            Longitude = hotel.Longitude,
            ManagerId = managers.FirstOrDefault()?.UserId,
            Managers = managers,
            Amenities = amenities,
            IsBlocked = isBlocked,
            BlockReason = displayBlockReason
        };
    }

    private HotelDetailDto MapToDetailDto(Hotel hotel, IReadOnlyDictionary<int, (decimal rating, int reviewCount)>? reviewStats = null)
    {
        var baseDto = MapToDto(hotel, reviewStats);
        return new HotelDetailDto
        {
            Id = baseDto.Id,
            Name = baseDto.Name,
            Description = baseDto.Description,
            Stars = baseDto.Stars,
            Rating = baseDto.Rating,
            ReviewCount = baseDto.ReviewCount,
            Price = baseDto.Price,
            Images = baseDto.Images,
            City = baseDto.City,
            Address = baseDto.Address,
            DistanceToCenter = baseDto.DistanceToCenter,
            ManagerId = baseDto.ManagerId,
            Managers = baseDto.Managers,
            Amenities = baseDto.Amenities,
            IsBlocked = baseDto.IsBlocked,
            BlockReason = baseDto.BlockReason,
            Latitude = baseDto.Latitude,
            Longitude = baseDto.Longitude,
            Rooms = hotel.Rooms?.Select(r => {
                var roomImages = RoomTypeGalleryUrls(r.RoomType);
                return new RoomDto
                {
                    Id = r.Id,
                    HotelId = r.HotelId,
                    RoomNumber = r.RoomNumber,
                    Description = r.RoomType?.Description ?? string.Empty,
                    Price = r.Price,
                    MaxGuests = r.RoomType?.MaxGuests ?? 0,
                    BedCount = r.RoomType?.BedCount ?? 0,
                    Size = r.RoomType?.Size ?? 0,
                    Image = roomImages.FirstOrDefault() ?? string.Empty,
                    ImageUrl = roomImages.FirstOrDefault() ?? string.Empty,
                    Images = roomImages,
                    RoomType = r.RoomType?.Name ?? "",
                    RoomTypeId = r.RoomTypeId,
                    Amenities = r.RoomAmenities?.Select(ra => ra.RoomAmenityType.Name).ToList() ?? new List<string>(),
                    MealType = (int)r.MealType,
                    MealLabel = GetMealLabel(r.MealType)
                };
            }).ToList() ?? new List<RoomDto>(),
            Reviews = new List<ReviewDto>()
        };
    }

    private static List<string> NormalizeManagerEmails(IReadOnlyList<string>? many, string? single)
    {
        var result = new List<string>();
        if (many != null && many.Count > 0)
        {
            foreach (var e in many)
            {
                var t = e?.Trim() ?? string.Empty;
                if (t.Length == 0) continue;
                if (result.Contains(t, StringComparer.OrdinalIgnoreCase)) continue;
                result.Add(t);
            }
        }
        else if (!string.IsNullOrWhiteSpace(single))
        {
            result.Add(single.Trim());
        }

        return result;
    }

    private static List<HotelManagerDto> MapHotelManagers(Hotel hotel)
    {
        if (hotel.Managers == null || hotel.Managers.Count == 0)
            return new List<HotelManagerDto>();

        return hotel.Managers
            .OrderBy(m => m.UserId)
            .Select(m => new HotelManagerDto
            {
                UserId = m.UserId,
                Email = m.User?.Email ?? string.Empty,
                FirstName = m.User?.FirstName,
                LastName = m.User?.LastName
            })
            .ToList();
    }

    private async Task SetHotelManagersAsync(int hotelId, IReadOnlyList<string> emails)
    {
        var existingManagers = (await _unitOfWork.Managers.FindAsync(m => m.HotelId == hotelId)).ToList();
        foreach (var existingManager in existingManagers)
        {
            _unitOfWork.Managers.Delete(existingManager);
        }

        foreach (var email in emails)
        {
            var user = await _unitOfWork.Users.GetUserByEmailAsync(email);
            if (user != null)
            {
                await _unitOfWork.Managers.AddAsync(new Manager
                {
                    UserId = user.Id,
                    HotelId = hotelId
                });
            }
        }

        await _unitOfWork.SaveChangesAsync();
    }

    private async Task ReplaceHotelImagesAsync(Hotel hotel, List<string> imageUrls)
    {
        var existing = (await _unitOfWork.HotelImages.FindAsync(i => i.HotelId == hotel.Id)).ToList();
        if (existing.Count > 0)
            _unitOfWork.HotelImages.RemoveRange(existing);

        hotel.Images.Clear();

        var list = imageUrls
            .Where(img => !string.IsNullOrWhiteSpace(img))
            .Select(img => img.Trim())
            .Select(NormalizeStoredImagePath)
            .Where(img => !img.Contains("block.jpg", StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToList();

        for (var i = 0; i < list.Count; i++)
        {
            var image = new HotelImage
            {
                HotelId = hotel.Id,
                Image = list[i],
                IsMain = i == 0
            };
            await _unitOfWork.HotelImages.AddAsync(image);
            hotel.Images.Add(image);
        }
    }

    private static string NormalizeStoredImagePath(string imageUrl)
    {
        if (Uri.TryCreate(imageUrl, UriKind.Absolute, out var absolute))
            return absolute.AbsolutePath;

        return imageUrl;
    }

    private static List<string> BuildHotelImageList(IEnumerable<HotelImage>? hotelImages)
    {
        var images = hotelImages?
            .OrderByDescending(i => i.IsMain)
            .ThenBy(i => i.Id)
            .Select(i => i.Image.Trim())
            .Where(image => !string.IsNullOrWhiteSpace(image))
            .Where(image => !image.Contains("block.jpg", StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList() ?? new List<string>();

        if (images.Count == 0)
            return new List<string> { DefaultHotelImage };

        return images;
    }

    private async Task<ApiResponse<bool>> SetHotelBlockStatusAsync(
        int id,
        bool isBlocked,
        string successMessage,
        string errorMessage,
        string? reason = null)
    {
        try
        {
            var hotel = await _unitOfWork.Hotels.GetByIdAsync(id);
            if (hotel == null)
            {
                return ApiResponse<bool>.ErrorResponse("Отель не найден");
            }

            if (isBlocked)
            {
                var hotelBookings = await _unitOfWork.Bookings.GetBookingsByHotelAsync(id);
                var hasActiveBookings = hotelBookings.Any(b =>
                {
                    var latestStatus = b.BookingStatuses
                        .OrderByDescending(bs => bs.CreatedAt)
                        .FirstOrDefault()?.Status;
                    return latestStatus.HasValue && BlockingBookingStatuses.Contains(latestStatus.Value);
                });

                if (hasActiveBookings)
                {
                    return ApiResponse<bool>.ErrorResponse(
                        "Есть активные бронирования (не завершенные и не отмененные). Сначала завершите или отмените их.");
                }
            }

            await _unitOfWork.BlockHistory.SetEntityBlockStatusAsync(
                "Hotel",
                id,
                isBlocked,
                isBlocked ? reason : null,
                1);

            if (isBlocked)
            {
                var blockReason = string.IsNullOrWhiteSpace(reason) ? "Отель заблокирован" : reason;
                var hotelManagers = await _unitOfWork.Managers.FindAsync(m => m.HotelId == id);
                foreach (var manager in hotelManagers)
                {
                    await _unitOfWork.BlockHistory.SetEntityBlockStatusAsync(
                        "User",
                        manager.UserId,
                        true,
                        blockReason,
                        1);
                    await _notificationService.AddAsync(
                        manager.UserId,
                        "Аккаунт заблокирован",
                        "Отель заблокирован. Ваш аккаунт менеджера также заблокирован.",
                        link: "/managers",
                        type: NotificationType.Block);
                }
            }

            hotel.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Hotels.Update(hotel);
            await _unitOfWork.SaveChangesAsync();

            _unitOfWork.Hotels.InvalidateCityCache(hotel.CityId);
            return ApiResponse<bool>.SuccessResponse(true, successMessage);
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse(errorMessage, new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> BlockHotelAsync(int id, string? reason = null)
    {
        return await SetHotelBlockStatusAsync(id, true, "Отель заблокирован", "Ошибка при блокировке отеля", reason);
    }

    public async Task<ApiResponse<bool>> UnblockHotelAsync(int id)
    {
        return await SetHotelBlockStatusAsync(id, false, "Отель разблокирован", "Ошибка при разблокировке отеля");
    }

    public async Task<ApiResponse<IEnumerable<HotelDto>>> GetManagerHotelsAsync(int userId)
    {
        try
        {
            var managers = await _unitOfWork.Managers.FindAsync(m => m.UserId == userId);
            var hotelIds = managers.Select(m => m.HotelId).ToList();
            
            if (hotelIds.Count == 0)
            {
                return ApiResponse<IEnumerable<HotelDto>>.SuccessResponse(new List<HotelDto>());
            }

            var hotels = await _unitOfWork.Hotels.GetAllAsync();
            var managerHotels = hotels.Where(h => hotelIds.Contains(h.Id)).ToList();
            var hotelDtos = await BuildHotelDtosAsync(managerHotels);
            
            return ApiResponse<IEnumerable<HotelDto>>.SuccessResponse(hotelDtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<HotelDto>>.ErrorResponse(
                "Ошибка при получении отелей менеджера",
                new List<string> { ex.Message });
        }
    }

    private static (Dictionary<int, BlockHistory> Latest, Dictionary<int, string?> LastBlockReasons) BuildHotelBlockMaps(
        IEnumerable<BlockHistory> histories)
    {
        var grouped = histories
            .Where(bh => bh.EntityType == "Hotel")
            .GroupBy(bh => bh.EntityId);

        var latest = grouped.ToDictionary(
            g => g.Key,
            g => g.OrderByDescending(bh => bh.ChangedAt).First());

        var lastReasons = grouped.ToDictionary(
            g => g.Key,
            g =>
            {
                var reason = g
                    .Where(bh => bh.IsBlocked && !string.IsNullOrWhiteSpace(bh.Reason))
                    .OrderByDescending(bh => bh.ChangedAt)
                    .Select(bh => bh.Reason)
                    .FirstOrDefault();
                return string.IsNullOrWhiteSpace(reason) ? null : reason;
            });

        return (latest, lastReasons);
    }

    private async Task<List<HotelDto>> BuildHotelDtosAsync(IEnumerable<Hotel> hotels)
    {
        var hotelsList = hotels.ToList();
        var reviewStats = await GetReviewStatsAsync(hotelsList);
        var (latestBlocks, lastBlockReasons) = BuildHotelBlockMaps(await _unitOfWork.BlockHistory.GetAllAsync());
        var activeBookingsMap = await GetHotelActiveBookingsMapAsync(hotelsList.Select(h => h.Id));
        return hotelsList
            .Select(hotel =>
            {
                var dto = MapToDto(hotel, reviewStats, latestBlocks, lastBlockReasons);
                dto.HasActiveBookings = activeBookingsMap.GetValueOrDefault(hotel.Id);
                return dto;
            })
            .ToList();
    }

    private async Task<Dictionary<int, bool>> GetHotelActiveBookingsMapAsync(IEnumerable<int> hotelIds)
    {
        var result = new Dictionary<int, bool>();
        foreach (var hotelId in hotelIds.Distinct())
        {
            var hotelBookings = await _unitOfWork.Bookings.GetBookingsByHotelAsync(hotelId);
            result[hotelId] = hotelBookings.Any(b =>
            {
                var latestStatus = b.BookingStatuses
                    .OrderByDescending(bs => bs.CreatedAt)
                    .FirstOrDefault()?.Status;
                return latestStatus.HasValue && BlockingBookingStatuses.Contains(latestStatus.Value);
            });
        }
        return result;
    }

    private async Task<Dictionary<int, (decimal rating, int reviewCount)>> GetReviewStatsAsync(IEnumerable<Hotel> hotels)
    {
        var hotelIds = hotels.Select(h => h.Id).Distinct().ToList();
        var result = new Dictionary<int, (decimal rating, int reviewCount)>();

        foreach (var hotelId in hotelIds)
        {
            var reviews = (await _unitOfWork.Reviews.GetReviewsByHotelAsync(hotelId, approvedOnly: true)).ToList();
            if (!reviews.Any())
            {
                result[hotelId] = (0m, 0);
                continue;
            }

            var averageRating = Math.Round(reviews.Average(r => r.Rating), 1, MidpointRounding.AwayFromZero);
            result[hotelId] = (averageRating, reviews.Count);
        }

        return result;
    }

    private static List<string> RoomTypeGalleryUrls(RoomType? roomType)
    {
        if (roomType?.Images == null || roomType.Images.Count == 0)
            return new List<string> { "/assets/rooms/block.jpg" };

        var images = roomType.Images
            .OrderByDescending(i => i.IsMain)
            .ThenBy(i => i.Id)
            .Select(i => i.Image.Trim())
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Where(s => !s.Contains("block.jpg", StringComparison.OrdinalIgnoreCase))
            .Distinct()
            .ToList();

        return images.Count > 0 ? images : new List<string> { "/assets/rooms/block.jpg" };
    }
}
