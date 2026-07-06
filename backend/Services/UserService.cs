using NookBook.API.DTOs;
using NookBook.API.Models;
using FluentValidation;
using System.Security.Cryptography;
using System.Text;
using NookBook.API.Services.Abstractions;
using NookBook.API.Repositories.Abstractions;
using System.Text.RegularExpressions;

namespace NookBook.API.Services;

public class UserService : IUserService
{
    private const string DefaultHotelImage = "/assets/hotels/block.jpg";

    private readonly IUnitOfWork _unitOfWork;
    private readonly IValidator<RegisterUserDto> _registerValidator;
    private readonly INotificationService _notificationService;

    public UserService(
        IUnitOfWork unitOfWork,
        IValidator<RegisterUserDto> registerValidator,
        INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _registerValidator = registerValidator;
        _notificationService = notificationService;
    }

    public async Task<ApiResponse<UserDto>> GetUserByIdAsync(int id)
    {
        try
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            if (user == null)
            {
                return ApiResponse<UserDto>.ErrorResponse("Пользователь не найден");
            }

            var userDto = await MapToDtoAsync(user);
            return ApiResponse<UserDto>.SuccessResponse(userDto);
        }
        catch (Exception ex)
        {
            return ApiResponse<UserDto>.ErrorResponse(
                "Ошибка при получении пользователя",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<UserDto>> GetUserByEmailAsync(string email)
    {
        try
        {
            var user = await _unitOfWork.Users.GetUserByEmailAsync(email);
            if (user == null)
            {
                return ApiResponse<UserDto>.ErrorResponse("Пользователь не найден");
            }

            var userDto = await MapToDtoAsync(user);
            return ApiResponse<UserDto>.SuccessResponse(userDto);
        }
        catch (Exception ex)
        {
            return ApiResponse<UserDto>.ErrorResponse(
                "Ошибка при получении пользователя",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<UserDto>> RegisterUserAsync(RegisterUserDto registerDto)
    {
        try
        {
            var validationResult = await _registerValidator.ValidateAsync(registerDto);
            if (!validationResult.IsValid)
            {
                return ApiResponse<UserDto>.ErrorResponse(
                    "Ошибка валидации",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList());
            }

            var existingUser = await _unitOfWork.Users.GetUserByEmailAsync(registerDto.Email);
            if (existingUser != null)
            {
                return ApiResponse<UserDto>.ErrorResponse("Email уже зарегистрирован");
            }

            var passwordHash = HashPassword(registerDto.Password);
            if (!NormalizeAndValidatePhone(registerDto.PhoneNumber, out var normalizedRegisterPhone, out var registerPhoneError))
            {
                return ApiResponse<UserDto>.ErrorResponse(registerPhoneError);
            }

            var user = new User
            {
                Email = registerDto.Email,
                PasswordHash = passwordHash,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                PhoneNumber = normalizedRegisterPhone,
                Avatar = GenerateAvatar(registerDto.FirstName, registerDto.LastName)
            };

            await _unitOfWork.Users.AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            var userDto = await MapToDtoAsync(user);
            return ApiResponse<UserDto>.SuccessResponse(userDto, "Регистрация успешно завершена");
        }
        catch (Exception ex)
        {
            return ApiResponse<UserDto>.ErrorResponse(
                "Ошибка при регистрации",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<UserDto>> LoginUserAsync(LoginUserDto loginDto)
    {
        try
        {
            if (string.IsNullOrEmpty(loginDto.Email) || string.IsNullOrEmpty(loginDto.Password))
            {
                return ApiResponse<UserDto>.ErrorResponse("Email и пароль обязательны");
            }

            var user = await _unitOfWork.Users.GetUserByEmailAsync(loginDto.Email);
            if (user == null)
            {
                return ApiResponse<UserDto>.ErrorResponse("Неверный email или пароль");
            }

            if (string.IsNullOrEmpty(user.PasswordHash))
            {
                return ApiResponse<UserDto>.ErrorResponse("Этот аккаунт использует вход через OAuth. Войдите через Google или Mail.ru, или установите пароль в профиле.");
            }

            if (!VerifyPassword(loginDto.Password, user.PasswordHash))
            {
                return ApiResponse<UserDto>.ErrorResponse("Неверный email или пароль");
            }

            var isBlocked = await _unitOfWork.BlockHistory.IsEntityBlockedAsync("User", user.Id);
            if (isBlocked)
            {
                return ApiResponse<UserDto>.ErrorResponse("Ваш аккаунт заблокирован");
            }

            var userDto = await MapToDtoAsync(user);
            return ApiResponse<UserDto>.SuccessResponse(userDto, "Вход выполнен успешно");
        }
        catch (Exception ex)
        {
            return ApiResponse<UserDto>.ErrorResponse(
                "Ошибка при входе",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<UserDto>> UpdateUserAsync(int id, UpdateUserDto updateDto)
    {
        try
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            if (user == null)
            {
                return ApiResponse<UserDto>.ErrorResponse("Пользователь не найден");
            }

            if (!string.IsNullOrEmpty(updateDto.FirstName))
                user.FirstName = updateDto.FirstName;

            if (!string.IsNullOrEmpty(updateDto.LastName))
                user.LastName = updateDto.LastName;

            if (!string.IsNullOrWhiteSpace(updateDto.PhoneNumber))
            {
                if (!NormalizeAndValidatePhone(updateDto.PhoneNumber, out var normalizedPhone, out var phoneError))
                {
                    return ApiResponse<UserDto>.ErrorResponse(phoneError);
                }
                user.PhoneNumber = normalizedPhone;
            }

            if (!string.IsNullOrEmpty(updateDto.Avatar))
            {
                if (updateDto.Avatar.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
                {
                    return ApiResponse<UserDto>.ErrorResponse(
                        "Некорректный формат аватара. Загрузите изображение как файл.");
                }
                user.Avatar = updateDto.Avatar;
            }

            user.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            var userDto = await MapToDtoAsync(user);
            return ApiResponse<UserDto>.SuccessResponse(userDto, "Профиль успешно обновлен");
        }
        catch (Exception ex)
        {
            return ApiResponse<UserDto>.ErrorResponse(
                "Ошибка при обновлении профиля",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<IEnumerable<HotelDto>>> GetUserFavoritesAsync(int userId)
    {
        try
        {
            var favorites = await _unitOfWork.Favorites.GetFavoritesByUserAsync(userId);
            var visibleFavorites = new List<Favorite>();

            foreach (var favorite in favorites)
            {
                if (favorite.Hotel != null)
                {
                    try
                    {
                        var isBlocked = await _unitOfWork.BlockHistory.IsEntityBlockedAsync("Hotel", favorite.Hotel.Id);
                        if (!isBlocked)
                        {
                            visibleFavorites.Add(favorite);
                        }
                    }
                    catch
                    {
                        visibleFavorites.Add(favorite);
                    }
                }
            }

            var hotelDtos = new List<HotelDto>();
            foreach (var f in visibleFavorites)
            {
                try
                {
                    var approvedReviews = (await _unitOfWork.Reviews.GetReviewsByHotelAsync(f.HotelId, true)).ToList();
                    var rating = approvedReviews.Any() ? (decimal)approvedReviews.Average(r => (double)r.Rating) : 0m;
                    var reviewCount = approvedReviews.Count;
                    var price = 0m;
                    if (f.Hotel.Rooms?.Any() == true)
                    {
                        price = f.Hotel.Rooms.Min(r => r.Price);
                    }
                    else
                    {
                        var rooms = await _unitOfWork.Rooms.GetRoomsByHotelAsync(f.HotelId);
                        if (rooms.Any())
                        {
                            price = rooms.Min(r => r.Price);
                        }
                    }

                    hotelDtos.Add(new HotelDto
                    {
                        Id = f.Hotel.Id,
                        Name = f.Hotel.Name,
                        Description = f.Hotel.Description,
                        Stars = f.Hotel.Stars,
                        Rating = rating,
                        ReviewCount = reviewCount,
                        Price = price,
                        Images = BuildHotelImageList(f.Hotel.Images),
                        City = f.Hotel.City?.Name ?? string.Empty,
                        Address = f.Hotel.Address,
                        DistanceToCenter = 0,
                        Latitude = f.Hotel.Latitude,
                        Longitude = f.Hotel.Longitude,
                        Amenities = f.Hotel.HotelAmenities.Select(ha => ha.HotelAmenityType.Name).ToList()
                    });
                }
                catch
                {
                    hotelDtos.Add(new HotelDto
                    {
                        Id = f.Hotel.Id,
                        Name = f.Hotel.Name,
                        Description = f.Hotel.Description,
                        Stars = f.Hotel.Stars,
                        Rating = 0,
                        ReviewCount = 0,
                        Price = 0,
                        Images = BuildHotelImageList(f.Hotel.Images),
                        City = f.Hotel.City?.Name ?? string.Empty,
                        Address = f.Hotel.Address,
                        DistanceToCenter = 0,
                        Latitude = f.Hotel.Latitude,
                        Longitude = f.Hotel.Longitude,
                        Amenities = f.Hotel.HotelAmenities.Select(ha => ha.HotelAmenityType.Name).ToList()
                    });
                }
            }

            return ApiResponse<IEnumerable<HotelDto>>.SuccessResponse(hotelDtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<HotelDto>>.ErrorResponse(
                "Ошибка при получении избранного",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> AddToFavoritesAsync(int userId, int hotelId)
    {
        try
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<bool>.ErrorResponse("Пользователь не найден");
            }

            var hotel = await _unitOfWork.Hotels.GetByIdAsync(hotelId);
            if (hotel == null)
            {
                return ApiResponse<bool>.ErrorResponse("Отель не найден");
            }

            var existingFavorite = await _unitOfWork.Favorites.GetUserFavoriteAsync(userId, hotelId);
            if (existingFavorite != null)
            {
                return ApiResponse<bool>.SuccessResponse(true, "Отель уже в избранном");
            }

            var favorite = new Favorite
            {
                UserId = userId,
                HotelId = hotelId
            };

            await _unitOfWork.Favorites.AddAsync(favorite);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Отель добавлен в избранное");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse(
                "Ошибка при добавлении в избранное",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> RemoveFromFavoritesAsync(int userId, int hotelId)
    {
        try
        {
            var favorite = await _unitOfWork.Favorites.GetUserFavoriteAsync(userId, hotelId);
            if (favorite == null)
            {
                return ApiResponse<bool>.SuccessResponse(true, "Уже удалено из избранного");
            }

            _unitOfWork.Favorites.Remove(favorite);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Отель удален из избранного");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse(
                "Ошибка при удалении из избранного",
                new List<string> { ex.Message });
        }
    }

    private UserDto MapToDto(User user)
    {
        var roleName = user.RoleId switch
        {
            1 => "guest",
            2 => "user",
            3 => "manager",
            4 => "admin",
            _ => "user"
        };

        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            PhoneNumber = user.PhoneNumber,
            Avatar = user.Avatar?.StartsWith("data:", StringComparison.OrdinalIgnoreCase) == true
                ? string.Empty
                : user.Avatar,
            Role = roleName,
            IsManager = roleName == "manager" || roleName == "admin",
            HasPassword = !string.IsNullOrEmpty(user.PasswordHash)
        };
    }

    private async Task<UserDto> MapToDtoAsync(User user)
    {
        var dto = MapToDto(user);
        dto.IsBlocked = await _unitOfWork.BlockHistory.IsEntityBlockedAsync("User", user.Id);
        return dto;
    }

    private string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashedBytes);
    }

    private bool VerifyPassword(string password, string hash)
    {
        var hashedInput = HashPassword(password);
        return hashedInput == hash;
    }

    private string GenerateAvatar(string firstName, string lastName)
    {
        var initials = $"{firstName[0]}{lastName[0]}".ToUpper();
        return initials;
    }

    private static List<string> BuildHotelImageList(IEnumerable<HotelImage>? hotelImages)
    {
        var images = hotelImages?
            .OrderByDescending(i => i.IsMain)
            .ThenBy(i => i.Id)
            .Select(i => i.Image.Trim())
            .Where(image => !string.IsNullOrWhiteSpace(image))
            .Where(image => !image.Contains("block.jpg", StringComparison.OrdinalIgnoreCase))
            .Distinct()
            .ToList() ?? new List<string>();

        if (images.Count == 0)
            return new List<string> { DefaultHotelImage };

        return images;
    }

    private bool NormalizeAndValidatePhone(string? rawPhone, out string normalizedPhone, out string error)
    {
        normalizedPhone = string.Empty;
        error = string.Empty;
        if (string.IsNullOrWhiteSpace(rawPhone))
        {
            return true;
        }

        var compact = Regex.Replace(rawPhone.Trim(), @"[\s\-\(\)]", string.Empty);
        var digitsPart = compact.StartsWith("+") ? compact[1..] : compact;

        if (digitsPart.StartsWith("80") && digitsPart.Length == 11)
        {
            digitsPart = $"375{digitsPart[2..]}";
        }
        else if (digitsPart.StartsWith("0") && digitsPart.Length == 10)
        {
            digitsPart = $"375{digitsPart[1..]}";
        }
        else if (digitsPart.Length == 9 && IsBelarusNationalNumber(digitsPart))
        {
            digitsPart = $"375{digitsPart}";
        }

        if (!digitsPart.All(char.IsDigit))
        {
            error = "Телефон должен содержать только цифры";
            return false;
        }

        var countryRules = new Dictionary<string, int>
        {
            ["375"] = 9,
            ["7"] = 10,
            ["380"] = 9,
            ["48"] = 9,
            ["1"] = 10
        };

        var matchedPrefix = countryRules.Keys
            .OrderByDescending(k => k.Length)
            .FirstOrDefault(prefix => digitsPart.StartsWith(prefix));

        if (matchedPrefix is null)
        {
            if (digitsPart.Length < 8 || digitsPart.Length > 15)
            {
                error = "Некорректная длина международного номера";
                return false;
            }
        }
        else
        {
            var expectedNationalLength = countryRules[matchedPrefix];
            var nationalPart = digitsPart[matchedPrefix.Length..];
            if (nationalPart.Length != expectedNationalLength)
            {
                error = $"Некорректная длина номера для кода +{matchedPrefix}";
                return false;
            }
        }

        normalizedPhone = $"+{digitsPart}";
        return true;
    }

    private static bool IsBelarusNationalNumber(string digits)
    {
        if (digits.Length != 9)
        {
            return false;
        }

        var operatorCode = digits[..2];
        return operatorCode is "25" or "29" or "33" or "44";
    }

    public async Task<ApiResponse<bool>> BlockUserAsync(int userId, string? reason = null)
    {
        try
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<bool>.ErrorResponse("Пользователь не найден");
            }

            if (user.RoleId == 4)
            {
                return ApiResponse<bool>.ErrorResponse("Нельзя блокировать администраторов");
            }

            await _unitOfWork.BlockHistory.SetEntityBlockStatusAsync(
                "User",
                userId,
                true,
                string.IsNullOrWhiteSpace(reason) ? "Заблокирован администратором" : reason,
                1);
            user.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            var blockedUserLink = user.RoleId == 3 ? "/managers" : "/profile";
            await _notificationService.AddAsync(
                userId,
                "Аккаунт заблокирован",
                "Ваш аккаунт был заблокирован администратором.",
                link: blockedUserLink,
                type: NotificationType.Block);

            var admins = await _unitOfWork.Users.FindAsync(u => u.RoleId == 4);
            foreach (var admin in admins)
            {
                await _notificationService.AddAsync(
                    admin.Id,
                    "Пользователь заблокирован",
                    $"Пользователь {user.Email} ({user.FirstName} {user.LastName}) заблокирован.",
                    link: "/admin",
                    type: NotificationType.Block);
            }

            return ApiResponse<bool>.SuccessResponse(true, "Пользователь заблокирован");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse(
                "Ошибка при блокировке пользователя",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> UnblockUserAsync(int userId)
    {
        try
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<bool>.ErrorResponse("Пользователь не найден");
            }

            await _unitOfWork.BlockHistory.SetEntityBlockStatusAsync("User", userId, false, string.Empty, 1);
            user.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            await _notificationService.AddAsync(
                userId,
                "Аккаунт разблокирован",
                "Ваш аккаунт был разблокирован администратором.",
                type: NotificationType.System);

            return ApiResponse<bool>.SuccessResponse(true, "Пользователь разблокирован");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse(
                "Ошибка при разблокировке пользователя",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> SetManagerAsync(int userId, bool isManager)
    {
        try
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<bool>.ErrorResponse("Пользователь не найден");
            }

            user.RoleId = isManager ? 3 : 2;
            user.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, isManager ? "Пользователь назначен менеджером" : "Права менеджера удалены");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse(
                "Ошибка при изменении прав пользователя",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> AssignManagerToHotelAsync(int userId, int hotelId)
    {
        try
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<bool>.ErrorResponse("Пользователь не найден");
            }

            var hotel = await _unitOfWork.Hotels.GetByIdAsync(hotelId);
            if (hotel == null)
            {
                return ApiResponse<bool>.ErrorResponse("Отель не найден");
            }

            if (user.RoleId != 3)
            {
                return ApiResponse<bool>.ErrorResponse("Пользователь не является менеджером");
            }

            var existingAssignment = await _unitOfWork.Managers.FindAsync(m => m.UserId == userId && m.HotelId == hotelId);
            if (existingAssignment.Any())
            {
                return ApiResponse<bool>.ErrorResponse("Менеджер уже назначен на этот отель");
            }

            var manager = new Manager { UserId = userId, HotelId = hotelId };
            await _unitOfWork.Managers.AddAsync(manager);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Менеджер успешно назначен на отель");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse(
                "Ошибка при назначении менеджера на отель",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<IEnumerable<UserDto>>> GetManagersAsync()
    {
        try
        {
            var managers = await _unitOfWork.Users.FindAsync(u => u.RoleId >= 3);
            var managerDtos = await Task.WhenAll(managers.Select(MapToDtoAsync));
            return ApiResponse<IEnumerable<UserDto>>.SuccessResponse(managerDtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<UserDto>>.ErrorResponse(
                "Ошибка при получении менеджеров",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<IEnumerable<UserDto>>> GetAllUsersAsync()
    {
        try
        {
            var users = (await _unitOfWork.Users.GetAllAsync()).ToList();
            var managerUserIds = (await _unitOfWork.Managers.GetAllAsync())
                .Select(m => m.UserId)
                .ToHashSet();
            var latestUserBlocks = (await _unitOfWork.BlockHistory.GetAllAsync())
                .Where(bh => bh.EntityType == "User")
                .GroupBy(bh => bh.EntityId)
                .ToDictionary(
                    g => g.Key,
                    g => g.OrderByDescending(bh => bh.ChangedAt).First());

            var userDtos = users.Select(user =>
            {
                var dto = MapToDto(user);
                dto.IsManager = dto.IsManager || managerUserIds.Contains(user.Id);
                dto.IsBlocked = latestUserBlocks.TryGetValue(user.Id, out var bh) && bh.IsBlocked;
                return dto;
            }).ToList();

            return ApiResponse<IEnumerable<UserDto>>.SuccessResponse(userDtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<UserDto>>.ErrorResponse(
                "Ошибка при получении пользователей",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto)
    {
        try
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<bool>.ErrorResponse("Пользователь не найден");
            }

            var hasPassword = !string.IsNullOrEmpty(user.PasswordHash);
            
            if (hasPassword)
            {
                if (string.IsNullOrEmpty(changePasswordDto.CurrentPassword))
                {
                    return ApiResponse<bool>.ErrorResponse("Текущий пароль обязателен для смены существующего пароля");
                }
                if (!VerifyPassword(changePasswordDto.CurrentPassword, user.PasswordHash))
                {
                    return ApiResponse<bool>.ErrorResponse("Неверный текущий пароль");
                }
            }

            var newPasswordHash = HashPassword(changePasswordDto.NewPassword);
            user.PasswordHash = newPasswordHash;
            user.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            var message = hasPassword ? "Пароль успешно изменен" : "Пароль успешно установлен";
            return ApiResponse<bool>.SuccessResponse(true, message);
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse(
                "Ошибка при изменении пароля",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<UserDto>> SetUserRoleAsync(int userId, int roleId)
    {
        try
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<UserDto>.ErrorResponse("Пользователь не найден");
            }

            user.RoleId = roleId;
            user.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            var userDto = await MapToDtoAsync(user);
            return ApiResponse<UserDto>.SuccessResponse(userDto, $"Роль пользователя изменена");
        }
        catch (Exception ex)
        {
            return ApiResponse<UserDto>.ErrorResponse(
                "Ошибка при изменении роли пользователя",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> DeleteUserAsync(int userId)
    {
        try
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user == null)
            {
                return ApiResponse<bool>.ErrorResponse("Пользователь не найден");
            }

            var bookings = await _unitOfWork.Bookings.FindAsync(b => b.UserId == userId);
            var userBookingIds = bookings.Select(b => b.Id).ToList();
            
            var reviews = await _unitOfWork.Reviews.FindAsync(r => r.BookingId.HasValue && userBookingIds.Contains(r.BookingId.Value));
            if (reviews.Any())
            {
                _unitOfWork.Reviews.RemoveRange(reviews);
            }
            
            if (bookings.Any())
            {
                _unitOfWork.Bookings.RemoveRange(bookings);
            }

            var favorites = await _unitOfWork.Favorites.FindAsync(f => f.UserId == userId);
            if (favorites.Any())
            {
                _unitOfWork.Favorites.RemoveRange(favorites);
            }

            _unitOfWork.Users.Remove(user);
            await _unitOfWork.SaveChangesAsync();

            return ApiResponse<bool>.SuccessResponse(true, "Пользователь успешно удален");
        }
        catch (Exception ex)
        {
            return ApiResponse<bool>.ErrorResponse(
                "Ошибка при удалении пользователя",
                new List<string> { ex.Message });
        }
    }
}
