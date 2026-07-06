using NookBook.API.DTOs;
using NookBook.API.Models;
using FluentValidation;
using NookBook.API.Services.Abstractions;
using NookBook.API.Repositories.Abstractions;

namespace NookBook.API.Services;

public class BookingService : IBookingService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<CreateBookingDto> _createValidator;
    private readonly EmailService _emailService;
    private readonly INotificationService _notificationService;
    private readonly IConfiguration _configuration;

    public BookingService(
        IUnitOfWork unitOfWork,
        IValidator<CreateBookingDto> createValidator,
        EmailService emailService,
        INotificationService notificationService,
        IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _createValidator = createValidator;
        _emailService = emailService;
        _notificationService = notificationService;
        _configuration = configuration;
    }

    public async Task<ApiResponse<IEnumerable<BookingDto>>> GetUserBookingsAsync(int userId, string? hotelNameSearch = null)
    {
        try
        {
            await CancelExpiredBookingsAsync();

            var bookings = await _unitOfWork.Bookings.GetBookingsByUserAsync(userId);
            var bookingDtos = new List<BookingDto>();
            foreach (var booking in bookings)
            {
                bookingDtos.Add(await MapToDto(booking));
            }

            if (!string.IsNullOrWhiteSpace(hotelNameSearch))
            {
                var searchLower = hotelNameSearch.ToLowerInvariant();
                bookingDtos = bookingDtos
                    .Where(b => b.HotelName != null && b.HotelName.ToLowerInvariant().Contains(searchLower))
                    .ToList();
            }

            return ApiResponse<IEnumerable<BookingDto>>.SuccessResponse(bookingDtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<BookingDto>>.ErrorResponse(
                "Ошибка при получении бронирований",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<BookingDto>> GetBookingByIdAsync(int bookingId)
    {
        try
        {
            await CancelExpiredBookingsAsync();
            
            var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);
            if (booking == null)
            {
                return ApiResponse<BookingDto>.ErrorResponse("Бронирование не найдено");
            }

            var bookingDto = await MapToDto(booking);
            return ApiResponse<BookingDto>.SuccessResponse(bookingDto);
        }
        catch (Exception ex)
        {
            return ApiResponse<BookingDto>.ErrorResponse(
                "Ошибка при получении бронирования",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<BookingDto>> CreateBookingAsync(CreateBookingDto createDto)
    {
        try
        {
            var normalizedCheckIn = createDto.CheckInDate.Date;
            var normalizedCheckOut = createDto.CheckOutDate.Date;

            createDto.CheckInDate = DateTime.SpecifyKind(normalizedCheckIn, DateTimeKind.Utc);
            createDto.CheckOutDate = DateTime.SpecifyKind(normalizedCheckOut, DateTimeKind.Utc);

            var validationResult = await _createValidator.ValidateAsync(createDto);
            if (!validationResult.IsValid)
            {
                return ApiResponse<BookingDto>.ErrorResponse(
                    "Ошибка валидации",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList());
            }

            var user = await _unitOfWork.Users.GetByIdAsync(createDto.UserId);
            if (user == null)
            {
                return ApiResponse<BookingDto>.ErrorResponse("Пользователь не найден");
            }

            if (user.RoleId == 3 || user.RoleId == 4)
            {
                return ApiResponse<BookingDto>.ErrorResponse("Менеджеры и администраторы не могут бронировать отели");
            }

            if (!string.IsNullOrWhiteSpace(createDto.PhoneNumber))
            {
                try
                {
                    var normalized = NormalizeBookingPhone(createDto.PhoneNumber);
                    if (!string.IsNullOrEmpty(normalized) && !string.Equals(user.PhoneNumber, normalized, StringComparison.Ordinal))
                    {
                        user.PhoneNumber = normalized;
                        user.UpdatedAt = DateTime.UtcNow;
                        _unitOfWork.Users.Update(user);
                        await _unitOfWork.SaveChangesAsync();
                    }
                }
                catch
                {
                }
            }

            Room room;

            if (createDto.RoomId.HasValue)
            {
                room = await _unitOfWork.Rooms.GetRoomWithDetailsAsync(createDto.RoomId.Value);
                if (room == null)
                {
                    return ApiResponse<BookingDto>.ErrorResponse("Номер не найден");
                }

                if (createDto.HotelId.HasValue && room.HotelId != createDto.HotelId.Value)
                {
                    return ApiResponse<BookingDto>.ErrorResponse("Выбранный номер не относится к указанному отелю");
                }
            }
            else if (createDto.RoomTypeId.HasValue && createDto.HotelId.HasValue)
            {
                var availableRooms = await _unitOfWork.Rooms.GetAvailableRoomsByTypeAsync(
                    createDto.HotelId.Value,
                    createDto.RoomTypeId.Value,
                    createDto.CheckInDate,
                    createDto.CheckOutDate,
                    createDto.GuestCount);

                if (availableRooms == null || !availableRooms.Any())
                {
                    return ApiResponse<BookingDto>.ErrorResponse("Нет доступных номеров выбранного типа на указанные даты");
                }

                room = availableRooms.First();
            }
            else
            {
                return ApiResponse<BookingDto>.ErrorResponse("Необходимо указать отель и тип номера");
            }

            var roomCapacity = room.RoomType?.MaxGuests ?? 0;
            if (roomCapacity < createDto.GuestCount)
            {
                return ApiResponse<BookingDto>.ErrorResponse(
                    $"Номер рассчитан максимум на {roomCapacity} гостей");
            }

            if (await _unitOfWork.BlockHistory.IsEntityBlockedAsync("Room", room.Id))
            {
                return ApiResponse<BookingDto>.ErrorResponse("Номер временно заблокирован");
            }

            var isAvailable = await _unitOfWork.Bookings.IsRoomAvailableAsync(
                room.Id,
                createDto.CheckInDate,
                createDto.CheckOutDate);

            if (!isAvailable)
            {
                return ApiResponse<BookingDto>.ErrorResponse(
                    "Номер недоступен на выбранные даты");
            }

            var nights = (createDto.CheckOutDate - createDto.CheckInDate).Days;
            var roomPrice = room.Price > 0 ? room.Price : 0;
            var totalPrice = roomPrice * nights;

            var booking = new Booking
            {
                UserId = createDto.UserId,
                RoomId = room.Id,
                Room = room,
                CheckInDate = createDto.CheckInDate,
                CheckOutDate = createDto.CheckOutDate,
                GuestCount = createDto.GuestCount,
                TotalPrice = totalPrice,
                SpecialRequests = createDto.SpecialRequests ?? string.Empty
            };

            await _unitOfWork.Bookings.AddAsync(booking);
            await _unitOfWork.SaveChangesAsync();

            var bookingStatus = new BookingStatus
            {
                Status = BookingStatusEnum.Pending,
                CreatedAt = DateTime.UtcNow,
                StatusBy = createDto.UserId,
                BookingId = booking.Id
            };

            await _unitOfWork.BookingStatuses.AddAsync(bookingStatus);
            await _unitOfWork.SaveChangesAsync();

            booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(booking.Id);

            var bookingDto = await MapToDto(booking!);
            return ApiResponse<BookingDto>.SuccessResponse(bookingDto, "Бронирование успешно создано");
        }
        catch (Exception ex)
        {
            return ApiResponse<BookingDto>.ErrorResponse(
                "Ошибка при создании бронирования",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<BookingDto>> UpdateBookingAsync(int bookingId, UpdateBookingDto updateDto, int? currentUserId = null)
    {
        try
        {
            var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);
            if (booking == null)
            {
                return ApiResponse<BookingDto>.ErrorResponse("Бронирование не найдено");
            }

            var checkInDate = updateDto.CheckInDate ?? booking.CheckInDate;
            var checkOutDate = updateDto.CheckOutDate ?? booking.CheckOutDate;
            var roomId = updateDto.RoomId ?? booking.RoomId;
            var guestCount = updateDto.GuestCount ?? booking.GuestCount;

            var normalizedCheckIn = checkInDate.Date;
            var normalizedCheckOut = checkOutDate.Date;
            checkInDate = DateTime.SpecifyKind(normalizedCheckIn, DateTimeKind.Utc);
            checkOutDate = DateTime.SpecifyKind(normalizedCheckOut, DateTimeKind.Utc);

            if (checkInDate >= checkOutDate)
            {
                return ApiResponse<BookingDto>.ErrorResponse("Дата выезда должна быть позже даты заезда");
            }

            var belarusToday = GetBelarusToday();
            var checkInLocalDate = GetBookingCheckInLocalDate(checkInDate);
            if (checkInLocalDate < belarusToday)
            {
                return ApiResponse<BookingDto>.ErrorResponse("Дата заезда не может быть в прошлом");
            }

            var room = await _unitOfWork.Rooms.GetByIdAsync(roomId);
            if (room == null)
            {
                return ApiResponse<BookingDto>.ErrorResponse("Номер не найден");
            }

            var roomCapacity = room.RoomType?.MaxGuests ?? 0;
            if (roomCapacity < guestCount)
            {
                return ApiResponse<BookingDto>.ErrorResponse(
                    $"Номер рассчитан максимум на {roomCapacity} гостей");
            }

            var conflictingBookings = await _unitOfWork.Bookings.GetAllAsync();
            var hasConflict = conflictingBookings
                .Where(b => b.Id != bookingId && 
                           b.RoomId == roomId &&
                           (b.CheckInDate.Date < checkOutDate.Date && b.CheckOutDate.Date > checkInDate.Date))
                .Any(b =>
                {
                    var latestStatus = b.BookingStatuses
                        .OrderByDescending(bs => bs.CreatedAt)
                        .FirstOrDefault()?.Status;

                    return latestStatus == BookingStatusEnum.Pending || latestStatus == BookingStatusEnum.Confirmed || latestStatus == BookingStatusEnum.CheckedIn;
                });

            if (hasConflict)
            {
                return ApiResponse<BookingDto>.ErrorResponse(
                    "Номер недоступен на выбранные даты (уже забронирован)");
            }

            var detailsWereChanged =
                booking.RoomId != roomId ||
                booking.CheckInDate.Date != checkInDate.Date ||
                booking.CheckOutDate.Date != checkOutDate.Date ||
                booking.GuestCount != guestCount ||
                (updateDto.SpecialRequests != null && booking.SpecialRequests != updateDto.SpecialRequests);

            booking.RoomId = roomId;
            booking.CheckInDate = checkInDate;
            booking.CheckOutDate = checkOutDate;
            booking.GuestCount = guestCount;
            
            if (updateDto.SpecialRequests != null)
            {
                booking.SpecialRequests = updateDto.SpecialRequests;
            }

            var nights = (checkOutDate - checkInDate).Days;
            var roomPrice = room.Price > 0 ? room.Price : 0;
            booking.TotalPrice = roomPrice * nights;
            booking.UpdatedAt = DateTime.UtcNow;

            var previousStatus = booking.BookingStatuses
                .OrderByDescending(bs => bs.CreatedAt)
                .FirstOrDefault()?.Status ?? BookingStatusEnum.Pending;
            BookingStatusEnum? changedStatus = null;

            if (!string.IsNullOrEmpty(updateDto.Status))
            {
                var s = updateDto.Status.Trim().ToLowerInvariant().Replace("_", "-");
                changedStatus = s switch
                {
                    "checked-in" or "checkedin" or "settled" => BookingStatusEnum.CheckedIn,
                    "pending" => BookingStatusEnum.Pending,
                    "confirmed" => BookingStatusEnum.Confirmed,
                    "completed" => BookingStatusEnum.Completed,
                    "cancelled" => BookingStatusEnum.Cancelled,
                    _ => null
                };
                if (changedStatus == null)
                {
                    return ApiResponse<BookingDto>.ErrorResponse($"Неизвестный статус: {updateDto.Status}");
                }

                if (changedStatus == BookingStatusEnum.CheckedIn && checkInLocalDate > belarusToday)
                {
                    return ApiResponse<BookingDto>.ErrorResponse("Заселение доступно в день заезда");
                }

                var bookingStatus = new BookingStatus
                {
                    Status = changedStatus.Value,
                    CreatedAt = DateTime.UtcNow,
                    StatusBy = currentUserId ?? booking.UserId
                };
                booking.BookingStatuses.Add(bookingStatus);
            }

            var statusChanged = changedStatus.HasValue && changedStatus.Value != previousStatus;

            if (statusChanged && booking.User != null)
            {
                var bookingCode = BuildBookingCode(booking);
                var frontendBase = _configuration["Frontend:BaseUrl"] ?? "http://localhost:3000";
                var encodedBookingCode = Uri.EscapeDataString(bookingCode);
                var bookingLink = $"/bookings?bookingCode={encodedBookingCode}";
                var cancelLink = $"{frontendBase}/bookings?action=cancel&bookingCode={encodedBookingCode}";
                var guestFullName = $"{booking.User.FirstName} {booking.User.LastName}".Trim();

                if (changedStatus == BookingStatusEnum.Confirmed)
                {
                    await _emailService.SendBookingConfirmationAsync(
                        booking.User.Email,
                        string.IsNullOrWhiteSpace(guestFullName) ? booking.User.Email : guestFullName,
                        bookingCode,
                        booking.Room?.Hotel?.Name ?? "Отель",
                        booking.Room?.RoomType?.Name ?? "Номер",
                        booking.CheckInDate,
                        booking.CheckOutDate,
                        booking.TotalPrice,
                        cancelLink);

                    await _notificationService.AddAsync(
                        booking.UserId,
                        "Бронирование подтверждено",
                        $"Ваше бронирование {bookingCode} подтверждено.",
                        bookingLink,
                        NotificationType.Booking);
                }
                else if (changedStatus == BookingStatusEnum.CheckedIn)
                {
                    await _emailService.SendBookingStatusChangedAsync(
                        booking.User.Email,
                        string.IsNullOrWhiteSpace(guestFullName) ? booking.User.Email : guestFullName,
                        bookingCode,
                        "Заселен");

                    await _notificationService.AddAsync(
                        booking.UserId,
                        "Гость заселен",
                        $"Бронирование {bookingCode}: статус изменен на \"Заселен\".",
                        bookingLink,
                        NotificationType.Booking);
                }
                else if (changedStatus == BookingStatusEnum.Completed)
                {
                    await _emailService.SendBookingStatusChangedAsync(
                        booking.User.Email,
                        string.IsNullOrWhiteSpace(guestFullName) ? booking.User.Email : guestFullName,
                        bookingCode,
                        "Завершено");

                    await _notificationService.AddAsync(
                        booking.UserId,
                        "Проживание завершено",
                        $"Бронирование {bookingCode}: статус изменен на \"Завершено\".",
                        bookingLink,
                        NotificationType.Booking);
                }
                else
                {
                    await _notificationService.AddAsync(
                        booking.UserId,
                        "Статус бронирования обновлен",
                        $"Бронирование {bookingCode}: новый статус \"{changedStatus}\".",
                        bookingLink,
                        NotificationType.Booking);
                }
            }
            else if (detailsWereChanged && booking.User != null)
            {
                var bookingCode = BuildBookingCode(booking);
                var encodedBookingCode = Uri.EscapeDataString(bookingCode);
                var bookingLink = $"/bookings?bookingCode={encodedBookingCode}";

                await _notificationService.AddAsync(
                    booking.UserId,
                    "Бронирование обновлено",
                    $"Параметры бронирования {bookingCode} изменены.",
                    bookingLink,
                    NotificationType.Booking);
            }

            _unitOfWork.Bookings.Update(booking);
            await _unitOfWork.SaveChangesAsync();

            booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);

            var bookingDto = await MapToDto(booking!);
            return ApiResponse<BookingDto>.SuccessResponse(bookingDto, "Бронирование успешно обновлено");
        }
        catch (Exception ex)
        {
            return ApiResponse<BookingDto>.ErrorResponse(
                "Ошибка при обновлении бронирования",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> CancelBookingAsync(int bookingId, int userId)
    {
        try
        {
            var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);
            if (booking == null)
            {
                return ApiResponse<bool>.ErrorResponse("Бронирование не найдено");
            }

            var latestStatus = booking.BookingStatuses
                .OrderByDescending(bs => bs.CreatedAt)
                .FirstOrDefault();
            
            var currentStatus = latestStatus?.Status ?? BookingStatusEnum.Pending;

            if (currentStatus == BookingStatusEnum.CheckedIn || currentStatus == BookingStatusEnum.Completed || currentStatus == BookingStatusEnum.Cancelled)
            {
                return ApiResponse<bool>.ErrorResponse(
                    $"Отмена невозможна для бронирования со статусом: {currentStatus}");
            }

            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<bool>.ErrorResponse("Пользователь не найден");
            }

            var isManager = user.RoleId == 3 || user.RoleId == 4;
            var isOwner = booking.UserId == userId;

            if (!isManager && !isOwner)
            {
                return ApiResponse<bool>.ErrorResponse("У вас нет прав на отмену этого бронирования");
            }

            if (currentStatus == BookingStatusEnum.Confirmed && !isManager)
            {
                var hoursUntilCheckIn = (booking.CheckInDate - DateTime.UtcNow).TotalHours;
                if (hoursUntilCheckIn < 24)
                {
                    return ApiResponse<bool>.ErrorResponse(
                        "Отмена возможна минимум за 24 часа до заезда");
                }
            }

            var cancelledStatus = new BookingStatus
            {
                Status = BookingStatusEnum.Cancelled,
                CreatedAt = DateTime.UtcNow,
                StatusBy = userId
            };
            booking.BookingStatuses.Add(cancelledStatus);

            _unitOfWork.Bookings.Update(booking);
            await _unitOfWork.SaveChangesAsync();

            if (booking.User != null)
            {
                var bookingCode = BuildBookingCode(booking);
                var encodedBookingCode = Uri.EscapeDataString(bookingCode);
                var bookingLink = $"/bookings?bookingCode={encodedBookingCode}";
                var guestFullName = $"{booking.User.FirstName} {booking.User.LastName}".Trim();

                await _notificationService.AddAsync(
                    booking.UserId,
                    "Бронирование отменено",
                    $"Бронирование {bookingCode} отменено.",
                    bookingLink,
                    NotificationType.Booking);

                await _emailService.SendBookingStatusChangedAsync(
                    booking.User.Email,
                    string.IsNullOrWhiteSpace(guestFullName) ? booking.User.Email : guestFullName,
                    bookingCode,
                    "Отменено");
            }

            return ApiResponse<bool>.SuccessResponse(true, "Бронирование успешно отменено");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse(
                "Ошибка при отмене бронирования",
                new List<string> { ex.Message });
        }
    }

    private static string NormalizeBookingPhone(string? rawPhone)
    {
        if (string.IsNullOrWhiteSpace(rawPhone))
        {
            return string.Empty;
        }

        var digits = new string(rawPhone.Where(char.IsDigit).ToArray());
        if (digits.Length == 0)
        {
            return string.Empty;
        }

        if (digits.StartsWith("80") && digits.Length == 11)
        {
            digits = "375" + digits.Substring(2);
        }
        else if (digits.StartsWith("0") && digits.Length == 10)
        {
            digits = "375" + digits.Substring(1);
        }

        return "+" + digits;
    }

    private async Task CancelExpiredBookingsAsync()
    {
        try
        {
            var belarusTimeZone = GetBelarusTimeZone();
            var todayLocal = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, belarusTimeZone).Date;
            var allBookings = await _unitOfWork.Bookings.GetAllAsync();
            
            var bookingsToCancel = allBookings
                .Where(b => 
                {
                    var latestStatus = b.BookingStatuses
                        .OrderByDescending(bs => bs.CreatedAt)
                        .FirstOrDefault();
                    var currentStatus = latestStatus?.Status ?? BookingStatusEnum.Pending;
                    var checkInLocal = TimeZoneInfo.ConvertTimeFromUtc(b.CheckInDate, belarusTimeZone).Date;
                    return currentStatus == BookingStatusEnum.Pending && checkInLocal < todayLocal;
                })
                .ToList();

            if (bookingsToCancel.Any())
            {
                foreach (var booking in bookingsToCancel)
                {
                    var cancelledStatus = new BookingStatus
                    {
                        Status = BookingStatusEnum.Cancelled,
                        CreatedAt = DateTime.UtcNow,
                        StatusBy = null
                    };
                    booking.BookingStatuses.Add(cancelledStatus);
                    _unitOfWork.Bookings.Update(booking);
                }
                
                await _unitOfWork.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
        }
    }

    private static DateTime GetBelarusToday()
    {
        var belarusTimeZone = GetBelarusTimeZone();
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, belarusTimeZone).Date;
    }

    private static DateTime GetBookingCheckInLocalDate(DateTime checkInUtc)
    {
        var belarusTimeZone = GetBelarusTimeZone();
        return TimeZoneInfo.ConvertTimeFromUtc(checkInUtc, belarusTimeZone).Date;
    }

    private static TimeZoneInfo GetBelarusTimeZone()
    {
        foreach (var timeZoneId in new[] { "Europe/Minsk", "Belarus Standard Time", "Russian Standard Time" })
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
            }
            catch (TimeZoneNotFoundException)
            {
            }
            catch (InvalidTimeZoneException)
            {
            }
        }

        return TimeZoneInfo.CreateCustomTimeZone("Belarus UTC+3", TimeSpan.FromHours(3), "Belarus UTC+3", "Belarus UTC+3");
    }

    private static string BookingStatusToApiString(BookingStatusEnum status) => status switch
    {
        BookingStatusEnum.Pending => "pending",
        BookingStatusEnum.Confirmed => "confirmed",
        BookingStatusEnum.CheckedIn => "checked-in",
        BookingStatusEnum.Completed => "completed",
        BookingStatusEnum.Cancelled => "cancelled",
        _ => "pending"
    };

    private async Task<BookingDto> MapToDto(Booking booking)
    {
        var latestStatus = booking.BookingStatuses?.OrderByDescending(bs => bs.CreatedAt).FirstOrDefault();
        var cityName = booking.Room?.Hotel?.City?.Name ?? string.Empty;
        var roomImages = RoomImageUrlsFromRoom(booking.Room);
        if (!roomImages.Any())
        {
            roomImages = new List<string> { "/assets/rooms/block.jpg" };
        }
        var cityCode = cityName.ToLower() switch
        {
            "витебск" => "VTB",
            "минск" => "MSK",
            "брест" => "BST",
            "гомель" => "GML",
            "гродно" => "GRD",
            "могилев" => "MGV",
            _ => "UNK"
        };

        var isManager = latestStatus?.StatusByUser != null && await IsManagerOfHotel(latestStatus.StatusByUser.Id, booking.Room?.HotelId);

        return new BookingDto
        {
            Id = booking.Id,
            UserId = booking.UserId,
            UserName = $"{booking.User?.FirstName} {booking.User?.LastName}".Trim().Length > 0
                ? $"{booking.User?.FirstName} {booking.User?.LastName}".Trim()
                : booking.User?.Email ?? string.Empty,
            CityName = cityName,
            HotelName = booking.Room?.Hotel?.Name ?? string.Empty,
            HotelId = booking.Room?.HotelId ?? booking.Room?.Hotel?.Id ?? 0,
            RoomId = booking.RoomId,
            RoomName = booking.Room?.RoomNumber ?? string.Empty,
            RoomType = booking.Room?.RoomType?.Name ?? string.Empty,
            RoomImageUrl = roomImages.FirstOrDefault() ?? string.Empty,
            RoomImageUrls = roomImages,
            BookingCode = $"{cityCode}-{booking.Id:D3}",
            CheckInDate = booking.CheckInDate,
            CheckOutDate = booking.CheckOutDate,
            GuestCount = booking.GuestCount,
            TotalPrice = booking.TotalPrice,
            SpecialRequests = booking.SpecialRequests ?? string.Empty,
            CreatedAt = booking.CreatedAt,
            Status = BookingStatusToApiString(latestStatus?.Status ?? BookingStatusEnum.Pending),
            StatusBy = isManager ? $"{latestStatus.StatusByUser.FirstName} {latestStatus.StatusByUser.LastName}" : ""
        };
    }

    private async Task<bool> IsManagerOfHotel(int userId, int? hotelId)
    {
        if (!hotelId.HasValue || hotelId.Value == 0)
            return false;

        var managers = await _unitOfWork.Managers.FindAsync(m => m.UserId == userId && m.HotelId == hotelId.Value);
        return managers.Any();
    }

    private static string BuildBookingCode(Booking booking)
    {
        var cityName = booking.Room?.Hotel?.City?.Name ?? string.Empty;
        var cityCode = cityName.ToLower() switch
        {
            "витебск" => "VTB",
            "минск" => "MSK",
            "брест" => "BST",
            "гомель" => "GML",
            "гродно" => "GRD",
            "могилев" => "MGL",
            _ => "NBK"
        };
        return $"{cityCode}-{booking.Id:D3}";
    }

    public async Task<ApiResponse<IEnumerable<BookingDto>>> GetAllBookingsAsync()
    {
        try
        {
            await CancelExpiredBookingsAsync();

            var bookings = await _unitOfWork.Bookings.GetAllAsync();
            var bookingDtos = new List<BookingDto>();
            foreach (var booking in bookings)
            {
                bookingDtos.Add(await MapToDto(booking));
            }
            return ApiResponse<IEnumerable<BookingDto>>.SuccessResponse(bookingDtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<BookingDto>>.ErrorResponse(
                "Ошибка при получении бронирований",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<IEnumerable<BookingDto>>> GetBookingsByHotelAsync(int hotelId)
    {
        try
        {
            await CancelExpiredBookingsAsync();

            var bookings = await _unitOfWork.Bookings.GetBookingsByHotelAsync(hotelId);
            var bookingDtos = new List<BookingDto>();
            foreach (var booking in bookings)
            {
                bookingDtos.Add(await MapToDto(booking));
            }
            return ApiResponse<IEnumerable<BookingDto>>.SuccessResponse(bookingDtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<BookingDto>>.ErrorResponse(
                "Ошибка при получении бронирований для отеля",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> DeleteBookingAsync(int bookingId)
    {
        try
        {
            var booking = await _unitOfWork.Bookings.GetByIdAsync(bookingId);
            if (booking == null)
            {
                return ApiResponse<bool>.ErrorResponse("Бронирование не найдено");
            }

            _unitOfWork.Bookings.Remove(booking);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Бронирование успешно удалено");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse(
                "Ошибка при удалении бронирования",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> SendBookingReminderAsync(int bookingId, int managerUserId)
    {
        try
        {
            var booking = await _unitOfWork.Bookings.GetBookingWithDetailsAsync(bookingId);
            if (booking == null)
            {
                return ApiResponse<bool>.ErrorResponse("Бронирование не найдено");
            }

            var managerUser = await _unitOfWork.Users.GetByIdAsync(managerUserId);
            if (managerUser == null || (managerUser.RoleId != 3 && managerUser.RoleId != 4))
            {
                return ApiResponse<bool>.ErrorResponse("Недостаточно прав для отправки напоминания");
            }

            if (booking.User == null || string.IsNullOrWhiteSpace(booking.User.Email))
            {
                return ApiResponse<bool>.ErrorResponse("Email гостя не найден");
            }

            var latestStatus = booking.BookingStatuses
                .OrderByDescending(bs => bs.CreatedAt)
                .FirstOrDefault()?.Status;
            if (latestStatus != BookingStatusEnum.Confirmed)
            {
                return ApiResponse<bool>.ErrorResponse("Напоминание можно отправить только для подтвержденного бронирования");
            }

            var bookingCode = BuildBookingCode(booking);
            var guestFullName = $"{booking.User.FirstName} {booking.User.LastName}".Trim();
            await _emailService.SendBookingReminderAsync(
                booking.User.Email,
                string.IsNullOrWhiteSpace(guestFullName) ? booking.User.Email : guestFullName,
                bookingCode,
                booking.Room?.Hotel?.Name ?? "Отель",
                booking.Room?.RoomType?.Name ?? "Номер",
                booking.CheckInDate,
                booking.CheckOutDate);

            var encodedBookingCode = Uri.EscapeDataString(bookingCode);
            var bookingLink = $"/bookings?bookingCode={encodedBookingCode}";
            await _notificationService.AddAsync(
                booking.UserId,
                "Напоминание о бронировании",
                $"Менеджер отправил напоминание по бронированию {bookingCode}.",
                bookingLink,
                NotificationType.Booking);

            return ApiResponse<bool>.SuccessResponse(true, "Напоминание отправлено");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse(
                "Ошибка при отправке напоминания",
                new List<string> { ex.Message });
        }
    }

    private static List<string> RoomImageUrlsFromRoom(Room? room)
    {
        var imgs = room?.RoomType?.Images;
        if (imgs == null || imgs.Count == 0)
            return new List<string>();
        return imgs
            .OrderByDescending(i => i.IsMain)
            .ThenBy(i => i.Id)
            .Select(i => i.Image.Trim())
            .Where(u => !string.IsNullOrWhiteSpace(u))
            .Distinct()
            .ToList();
    }
}
