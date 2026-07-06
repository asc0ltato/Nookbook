using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Collections.Concurrent;
using Microsoft.IdentityModel.Tokens;
using NookBook.API.Data;
using NookBook.API.DTOs;
using NookBook.API.Models;
using NookBook.API.Services.Abstractions;
using NookBook.API.Repositories.Abstractions;
using Microsoft.EntityFrameworkCore;

namespace NookBook.API.Services;

public class AuthService : IAuthService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;
    private readonly EmailService _emailService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IUnitOfWork _unitOfWork;
    private static readonly ConcurrentDictionary<string, (string Code, DateTime Expiry)> _loginCodes = new();
    private static readonly ConcurrentDictionary<string, (string Email, string Code, DateTime Expiry)> _resetCodes = new();

    public AuthService(ApplicationDbContext context, IConfiguration configuration, ILogger<AuthService> logger, EmailService emailService, IHttpClientFactory httpClientFactory, IUnitOfWork unitOfWork)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _emailService = emailService;
        _httpClientFactory = httpClientFactory;
        _unitOfWork = unitOfWork;
    }

    public async Task<(string Token, User User)> LoginAsync(LoginDto loginDto)
    {
        try
        {
            if (_context == null)
            {
                throw new InvalidOperationException("Database context не инициализирован");
            }

            if (_configuration == null)
            {
                throw new InvalidOperationException("Configuration не инициализирован");
            }

            if (loginDto == null || string.IsNullOrEmpty(loginDto.Email))
            {
                throw new ArgumentException("Email обязателен");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginDto.Email);

            if (user == null || !VerifyPassword(loginDto.Password, user.PasswordHash))
            {
                throw new UnauthorizedAccessException("Неверный email или пароль");
            }

            var isBlocked = await _unitOfWork.BlockHistory.IsEntityBlockedAsync("User", user.Id);
            if (isBlocked)
            {
                throw new UnauthorizedAccessException("Ваш аккаунт заблокирован");
            }

            var token = GenerateJwtToken(user);
            return (token, user);
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Unexpected error during login for email: {Email}", loginDto?.Email);
            throw new InvalidOperationException("Ошибка при входе", ex);
        }
    }

    public async Task<(string Token, User User)> RegisterAsync(RegisterUserDto registerDto)
    {
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == registerDto.Email);
        if (existingUser != null)
        {
            throw new InvalidOperationException("Пользователь с данной почтой уже существует");
        }

        var user = new User
        {
            Email = registerDto.Email,
            PasswordHash = HashPassword(registerDto.Password),
            FirstName = registerDto.FirstName ?? string.Empty,
            LastName = registerDto.LastName ?? string.Empty,
            PhoneNumber = registerDto.PhoneNumber ?? string.Empty,
            RoleId = 2, // User role
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        return (token, user);
    }

    public async Task<(string Token, User User)> RegisterManagerAsync(RegisterManagerDto dto, int currentUserId)
    {
        // Check if current user is admin
        var currentUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == currentUserId);
        if (currentUser == null || (currentUser.RoleId != 1 && currentUser.RoleId != 4))
        {
            throw new InvalidOperationException("Только администратор может регистрировать менеджеров");
        }

        if (string.IsNullOrWhiteSpace(dto.PhoneNumber))
        {
            throw new InvalidOperationException("Телефон обязателен");
        }

        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        User user;

        if (existingUser != null)
        {
            if (existingUser.RoleId == 3)
            {
                throw new InvalidOperationException("Пользователь уже является менеджером");
            }

            if (existingUser.RoleId is 1 or 4)
            {
                throw new InvalidOperationException("Нельзя назначить менеджером этого пользователя");
            }

            existingUser.PasswordHash = HashPassword(dto.Password);
            if (!string.IsNullOrWhiteSpace(dto.FirstName))
                existingUser.FirstName = dto.FirstName;
            if (!string.IsNullOrWhiteSpace(dto.LastName))
                existingUser.LastName = dto.LastName;
            existingUser.PhoneNumber = dto.PhoneNumber ?? string.Empty;
            existingUser.RoleId = 3;
            existingUser.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            user = existingUser;
        }
        else
        {
            user = new User
            {
                Email = dto.Email,
                PasswordHash = HashPassword(dto.Password),
                FirstName = dto.FirstName ?? string.Empty,
                LastName = dto.LastName ?? string.Empty,
                PhoneNumber = dto.PhoneNumber ?? string.Empty,
                RoleId = 3,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        if (dto.HotelId.HasValue)
        {
            var hotel = await _context.Hotels.FirstOrDefaultAsync(h => h.Id == dto.HotelId.Value);
            if (hotel == null)
            {
                throw new InvalidOperationException("Отель не найден");
            }

            var alreadyAssigned = await _context.Managers
                .AnyAsync(m => m.UserId == user.Id && m.HotelId == dto.HotelId.Value);
            if (!alreadyAssigned)
            {
                _context.Managers.Add(new Manager
                {
                    UserId = user.Id,
                    HotelId = dto.HotelId.Value
                });
                await _context.SaveChangesAsync();
            }
        }

        var token = GenerateJwtToken(user);
        return (token, user);
    }


    public async Task<User?> GetUserByTokenAsync(string token)
    {
        try
        {
            var userId = ValidateJwtAndGetUserId(token, validateLifetime: true);
            return userId.HasValue
                ? await GetUserByIdAsync(userId.Value)
                : null;
        }
        catch
        {
            return null;
        }
    }

    public async Task<User?> GetUserByIdAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return null;
        }

        var isBlocked = await _unitOfWork.BlockHistory.IsEntityBlockedAsync("User", user.Id);
        return isBlocked ? null : user;
    }

    public async Task<string?> RefreshAccessTokenAsync(string refreshToken)
    {
        try
        {
            var userId = ValidateJwtAndGetUserId(refreshToken, validateLifetime: false);
            if (!userId.HasValue)
            {
                return null;
            }

            var user = await GetUserByIdAsync(userId.Value);
            return user == null ? null : GenerateJwtToken(user);
        }
        catch
        {
            return null;
        }
    }

    public string GenerateJwtToken(User user)
    {
        if (user == null)
        {
            throw new ArgumentNullException(nameof(user));
        }

        if (_configuration == null)
        {
            throw new InvalidOperationException("Configuration не инициализирован");
        }

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"] ?? "your-secret-key-min-32-characters");

        // Role navigation is often not loaded; derive claim from RoleId so [Authorize(Roles=...)] works.
        var roleName = !string.IsNullOrWhiteSpace(user.Role?.Name)
            ? user.Role!.Name!.Trim()
            : user.RoleId switch
            {
                1 => "Guest",
                2 => "User",
                3 => "Manager",
                4 => "Admin",
                _ => "User"
            };

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim("userId", user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
            new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new Claim(ClaimTypes.Role, roleName)
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7),
            Issuer = _configuration["Jwt:Issuer"] ?? "NookBook",
            Audience = _configuration["Jwt:Audience"] ?? "NookBook",
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    private int? ValidateJwtAndGetUserId(string token, bool validateLifetime)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Secret"] ?? "your-secret-key-min-32-characters");

        tokenHandler.ValidateToken(token, new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = _configuration["Jwt:Issuer"] ?? "NookBookAPI",
            ValidateAudience = true,
            ValidAudience = _configuration["Jwt:Audience"] ?? "NookBookClient",
            ValidateLifetime = validateLifetime,
            ClockSkew = TimeSpan.Zero
        }, out SecurityToken validatedToken);

        var jwtToken = (JwtSecurityToken)validatedToken;
        var userIdClaim = jwtToken.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier)?.Value
            ?? jwtToken.Claims.FirstOrDefault(x => x.Type == "userId")?.Value;

        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    private bool VerifyPassword(string password, string hash)
    {
        if (string.IsNullOrEmpty(hash))
        {
            return false;
        }

        if (hash.StartsWith("$2"))
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }

        using var sha256 = SHA256.Create();
        var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        var legacyHash = Convert.ToBase64String(hashedBytes);

        if (legacyHash == hash)
        {
            try
            {
                var user = _context.Users.FirstOrDefault(u => u.PasswordHash == hash);
                if (user != null)
                {
                    user.PasswordHash = HashPassword(password);
                    user.UpdatedAt = DateTime.UtcNow;
                    _context.SaveChanges();
                }
            }
            catch
            {
            }

            return true;
        }

        return false;
    }


    public async Task<(string Token, User User)> GoogleOAuthCallbackAsync(string code)
    {
        if (_httpClientFactory == null)
        {
            throw new InvalidOperationException("HttpClientFactory не инициализирован");
        }

        var oauthConfig = _configuration.GetSection("OAuth:Google");
        if (oauthConfig == null)
        {
            throw new InvalidOperationException("Google OAuth не настроен: конфигурация отсутствует");
        }
        var clientId = oauthConfig["ClientId"];
        var clientSecret = oauthConfig["ClientSecret"];
        var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:3000";
        var redirectUri = $"{frontendUrl}/api/auth/callback/google";

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
        {
            throw new InvalidOperationException("Google OAuth не настроен: отсутствует ClientId или ClientSecret");
        }

        _logger.LogInformation("Google OAuth callback: RedirectUri = {RedirectUri}", redirectUri);

        var httpClient = _httpClientFactory.CreateClient();

        var tokenRequest = new Dictionary<string, string>
        {
            { "code", code },
            { "client_id", clientId },
            { "client_secret", clientSecret },
            { "redirect_uri", redirectUri },
            { "grant_type", "authorization_code" }
        };

        var tokenResponse = await httpClient.PostAsync("https://oauth2.googleapis.com/token",
            new FormUrlEncodedContent(tokenRequest));

        var tokenResponseContent = await tokenResponse.Content.ReadAsStringAsync();
        
        if (!tokenResponse.IsSuccessStatusCode)
        {
            _logger.LogError("Google token exchange failed: Status {Status}, Response: {Response}, RedirectUri: {RedirectUri}, Code: {Code}", 
                tokenResponse.StatusCode, tokenResponseContent, redirectUri, code.Substring(0, Math.Min(20, code.Length)));

            try
            {
                var errorData = JsonSerializer.Deserialize<JsonElement>(tokenResponseContent);
                if (errorData.TryGetProperty("error_description", out var errorDesc))
                {
                    throw new InvalidOperationException($"Google OAuth ошибка: {errorDesc.GetString()}");
                }
                if (errorData.TryGetProperty("error", out var error))
                {
                    throw new InvalidOperationException($"Google OAuth ошибка: {error.GetString()}");
                }
            }
            catch
            {
            }
            
            throw new InvalidOperationException($"Не удалось обменять код на токен Google. Проверьте redirect_uri в Google Console: {redirectUri}");
        }

        var tokenData = JsonSerializer.Deserialize<JsonElement>(tokenResponseContent);
        
        if (!tokenData.TryGetProperty("access_token", out var accessTokenElement))
        {
            _logger.LogError("Google response missing access_token: {Response}", tokenResponseContent);
            throw new InvalidOperationException("Ответ от Google не содержит access_token");
        }
        
        var accessToken = accessTokenElement.GetString();

        if (string.IsNullOrEmpty(accessToken))
        {
            throw new InvalidOperationException("Не удалось получить access token от Google");
        }

        var userInfoResponse = await httpClient.GetAsync($"https://www.googleapis.com/oauth2/v2/userinfo?access_token={accessToken}");
        
        if (!userInfoResponse.IsSuccessStatusCode)
        {
            throw new InvalidOperationException("Не удалось получить информацию о пользователе от Google");
        }

        var userInfoContent = await userInfoResponse.Content.ReadAsStringAsync();
        var userInfoData = JsonSerializer.Deserialize<JsonElement>(userInfoContent);
        
        if (!userInfoData.TryGetProperty("email", out var emailElement))
        {
            _logger.LogError("Google userinfo missing email: {Response}", userInfoContent);
            throw new InvalidOperationException("Ответ от Google не содержит email");
        }
        
        var email = emailElement.GetString();
        var firstName = userInfoData.TryGetProperty("given_name", out var fn) ? fn.GetString() : string.Empty;
        var lastName = userInfoData.TryGetProperty("family_name", out var ln) ? ln.GetString() : string.Empty;
        var picture = NormalizeOAuthPictureUrl(
            userInfoData.TryGetProperty("picture", out var pic) ? pic.GetString() : string.Empty);

        if (string.IsNullOrEmpty(email))
        {
            throw new InvalidOperationException("Email не получен от Google");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        
        if (user == null)
        {
            user = new User
            {
                Email = email,
                PasswordHash = string.Empty,
                FirstName = firstName ?? string.Empty,
                LastName = lastName ?? string.Empty,
                PhoneNumber = string.Empty,
                Avatar = picture ?? string.Empty,
                RoleId = 2, // User role
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        else if (ShouldUpdateAvatarFromOAuth(user.Avatar, picture))
        {
            user.Avatar = picture!;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        var isBlocked = await _unitOfWork.BlockHistory.IsEntityBlockedAsync("User", user.Id);
        if (isBlocked)
        {
            throw new InvalidOperationException("Неверный email или пароль");
        }

        var token = GenerateJwtToken(user);
        return (token, user);
    }

    public async Task<(string Token, User User)> MailruOAuthCallbackAsync(string code, string? state)
    {
        if (_httpClientFactory == null)
        {
            throw new InvalidOperationException("HttpClientFactory не инициализирован");
        }

        var oauthConfig = _configuration.GetSection("OAuth:Mailru");
        if (oauthConfig == null)
        {
            throw new InvalidOperationException("Mail.ru OAuth не настроен: конфигурация отсутствует");
        }
        var clientId = oauthConfig["ClientId"];
        var clientSecret = oauthConfig["ClientSecret"];
        var redirectUri = $"{_configuration["FrontendUrl"] ?? "http://localhost:3000"}/api/auth/callback/mailru";

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
        {
            throw new InvalidOperationException("Mail.ru OAuth не настроен: отсутствует ClientId или ClientSecret");
        }

        var httpClient = _httpClientFactory.CreateClient();

        httpClient.DefaultRequestHeaders.Add("User-Agent", "NookBook/1.0");

        var tokenRequest = new Dictionary<string, string>
        {
            { "client_id", clientId },
            { "client_secret", clientSecret },
            { "code", code },
            { "grant_type", "authorization_code" },
            { "redirect_uri", redirectUri }
        };
   
        if (!string.IsNullOrEmpty(state))
        {
            tokenRequest.Add("state", state);
        }

        _logger.LogInformation("Mail.ru token request: RedirectUri={RedirectUri}, HasState={HasState}", redirectUri, !string.IsNullOrEmpty(state));

        var tokenResponse = await httpClient.PostAsync("https://oauth.mail.ru/token",
            new FormUrlEncodedContent(tokenRequest));

        var tokenResponseContent = await tokenResponse.Content.ReadAsStringAsync();
        
        _logger.LogInformation("Mail.ru token exchange response: Status {Status}, Response: {Response}", 
            tokenResponse.StatusCode, tokenResponseContent);

        JsonElement tokenData;
        string accessToken;
        
        try
        {
            tokenData = JsonSerializer.Deserialize<JsonElement>(tokenResponseContent);
            
            if (tokenData.TryGetProperty("error", out var errorElement))
            {
                var error = errorElement.GetString();
                var errorDescription = tokenData.TryGetProperty("error_description", out var desc) ? desc.GetString() : "Неизвестная ошибка";
                _logger.LogError("Mail.ru returned error: {Error}, Description: {Description}, Full response: {Response}", 
                    error, errorDescription, tokenResponseContent);
                throw new InvalidOperationException($"Ошибка Mail.ru: {errorDescription} ({error})");
            }

            var keys = tokenData.EnumerateObject().Select(p => p.Name).ToList();
            _logger.LogInformation("Mail.ru token response keys: {Keys}", string.Join(", ", keys));
            
            if (!tokenResponse.IsSuccessStatusCode)
            {
                _logger.LogError("Mail.ru token exchange failed: Status {Status}, Response: {Response}, RedirectUri: {RedirectUri}", 
                    tokenResponse.StatusCode, tokenResponseContent, redirectUri);
                throw new InvalidOperationException($"Не удалось обменять код на токен Mail.ru: {tokenResponseContent}");
            }

            if (tokenData.TryGetProperty("access_token", out var at1))
            {
                accessToken = at1.GetString() ?? string.Empty;
            }
            else if (tokenData.TryGetProperty("token", out var at2))
            {
                accessToken = at2.GetString() ?? string.Empty;
            }
            else
            {
                _logger.LogError("Mail.ru response missing access_token. Available keys: {Keys}, Full response: {Response}", 
                    string.Join(", ", keys), tokenResponseContent);
                throw new InvalidOperationException($"Ответ от Mail.ru не содержит access_token. Доступные ключи: {string.Join(", ", keys)}. Полный ответ: {tokenResponseContent}");
            }
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse Mail.ru token response as JSON: {Response}", tokenResponseContent);
            throw new InvalidOperationException($"Не удалось распарсить ответ Mail.ru как JSON. Ответ: {tokenResponseContent}");
        }
        
        if (string.IsNullOrEmpty(accessToken))
        {
            _logger.LogError("Mail.ru access_token is empty. Full response: {Response}", tokenResponseContent);
            throw new InvalidOperationException($"Access token от Mail.ru пустой. Полный ответ: {tokenResponseContent}");
        }
        
        _logger.LogInformation("Successfully extracted access_token from Mail.ru response");

        var userInfoHttpClient = _httpClientFactory.CreateClient();
        userInfoHttpClient.DefaultRequestHeaders.Add("User-Agent", "NookBook/1.0");
        var userInfoResponse = await userInfoHttpClient.GetAsync($"https://oauth.mail.ru/userinfo?access_token={accessToken}");
        
        if (!userInfoResponse.IsSuccessStatusCode)
        {
            var errorContent = await userInfoResponse.Content.ReadAsStringAsync();
            _logger.LogError("Mail.ru userinfo failed: Status {Status}, Response: {Response}", 
                userInfoResponse.StatusCode, errorContent);
            throw new InvalidOperationException($"Не удалось получить информацию о пользователе от Mail.ru: {errorContent}");
        }

        var userInfoContent = await userInfoResponse.Content.ReadAsStringAsync();
        var userInfoData = JsonSerializer.Deserialize<JsonElement>(userInfoContent);
        
        string? email = null;
        if (userInfoData.TryGetProperty("email", out var emailElement))
        {
            email = emailElement.GetString();
        }
        else if (userInfoData.TryGetProperty("mail", out var mailElement))
        {
            email = mailElement.GetString();
        }
        
        if (string.IsNullOrEmpty(email))
        {
            _logger.LogError("Mail.ru userinfo missing email: {Response}", userInfoContent);
            throw new InvalidOperationException("Ответ от Mail.ru не содержит email");
        }
        
        var firstName = userInfoData.TryGetProperty("first_name", out var fn) ? fn.GetString() : 
                       (userInfoData.TryGetProperty("name", out var name) ? name.GetString() : string.Empty);
        var lastName = userInfoData.TryGetProperty("last_name", out var ln) ? ln.GetString() : string.Empty;
        var picture = NormalizeOAuthPictureUrl(
            userInfoData.TryGetProperty("image", out var pic) ? pic.GetString() :
            (userInfoData.TryGetProperty("pic", out var pic2) ? pic2.GetString() : string.Empty));

        if (string.IsNullOrEmpty(email))
        {
            throw new InvalidOperationException("Email не получен от Mail.ru");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        
        if (user == null)
        {
            user = new User
            {
                Email = email,
                PasswordHash = string.Empty,
                FirstName = firstName ?? string.Empty,
                LastName = lastName ?? string.Empty,
                PhoneNumber = string.Empty,
                Avatar = picture ?? string.Empty,
                RoleId = 2, // User role
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        else if (ShouldUpdateAvatarFromOAuth(user.Avatar, picture))
        {
            user.Avatar = picture!;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        var isBlocked = await _unitOfWork.BlockHistory.IsEntityBlockedAsync("User", user.Id);
        if (isBlocked)
        {
            throw new InvalidOperationException("Неверный email или пароль");
        }

        var token = GenerateJwtToken(user);
        return (token, user);
    }

    private static string NormalizeOAuthPictureUrl(string? picture)
    {
        if (string.IsNullOrWhiteSpace(picture)) return string.Empty;

        var trimmed = picture.Trim();
        if (trimmed.StartsWith("//", StringComparison.Ordinal))
        {
            return $"https:{trimmed}";
        }

        if (trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return trimmed;
        }

        if (trimmed.Contains("googleusercontent.com", StringComparison.OrdinalIgnoreCase)
            || trimmed.Contains("ggpht.com", StringComparison.OrdinalIgnoreCase)
            || trimmed.Contains("mail.ru", StringComparison.OrdinalIgnoreCase))
        {
            return $"https://{trimmed.TrimStart('/')}";
        }

        return trimmed;
    }

    private static bool ShouldUpdateAvatarFromOAuth(string? currentAvatar, string? oauthPicture)
    {
        if (string.IsNullOrWhiteSpace(oauthPicture)) return false;
        if (string.IsNullOrWhiteSpace(currentAvatar)) return true;
        if (currentAvatar.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || currentAvatar.StartsWith("https://", StringComparison.OrdinalIgnoreCase)
            || currentAvatar.StartsWith("//", StringComparison.Ordinal))
        {
            return false;
        }
        if (currentAvatar.StartsWith("/assets/", StringComparison.OrdinalIgnoreCase)
            || currentAvatar.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase)
            || currentAvatar.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return true;
    }

    public async Task<ApiResponse<bool>> SendLoginCodeAsync(string email)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
            {
                return ApiResponse<bool>.ErrorResponse("Пользователь с данной почтой не найден");
            }

            var isBlocked = await _unitOfWork.BlockHistory.IsEntityBlockedAsync("User", user.Id);
            if (isBlocked)
            {
                return ApiResponse<bool>.ErrorResponse("Пользователь заблокирован");
            }

            var random = new Random();
            var code = random.Next(100000, 999999).ToString();

            _loginCodes[email] = (code, DateTime.UtcNow.AddMinutes(10));

            await _emailService.SendLoginCodeAsync(email, code);

            return ApiResponse<bool>.SuccessResponse(true, "Код отправлен на указанный email");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending login code to {Email}", email);
            return ApiResponse<bool>.ErrorResponse("Ошибка отправки кода", new List<string> { ex.Message });
        }
    }

    public async Task<(string Token, User User)> LoginByCodeAsync(string email, string code)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            throw new UnauthorizedAccessException("Неверный email или код");
        }

        var isBlocked = await _unitOfWork.BlockHistory.IsEntityBlockedAsync("User", user.Id);
        if (isBlocked)
        {
            throw new UnauthorizedAccessException("Пользователь заблокирован");
        }

        if (!_loginCodes.TryGetValue(email, out var info))
        {
            throw new UnauthorizedAccessException("Неверный email или код");
        }

        if (info.Expiry < DateTime.UtcNow)
        {
            _loginCodes.TryRemove(email, out _);
            throw new UnauthorizedAccessException("Срок действия кода истек");
        }

        if (!string.Equals(info.Code, code, StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("Неверный код");
        }

        _loginCodes.TryRemove(email, out _);

        var token = GenerateJwtToken(user);
        return (token, user);
    }

    public async Task<ApiResponse<bool>> ForgotPasswordAsync(string email)
    {
        try
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null)
            {
                return ApiResponse<bool>.ErrorResponse("Пользователь с данной почтой не найден");
            }

            var isBlocked = await _unitOfWork.BlockHistory.IsEntityBlockedAsync("User", user.Id);
            if (isBlocked)
            {
                return ApiResponse<bool>.ErrorResponse("Пользователь заблокирован");
            }

            var resetToken = Guid.NewGuid().ToString("N");
            var code = new Random().Next(100000, 999999).ToString();

            _resetCodes[resetToken] = (email, code, DateTime.UtcNow.AddMinutes(10));
            await _emailService.SendPasswordResetCodeAsync(email, code);

            return ApiResponse<bool>.SuccessResponse(true, "Код для восстановления пароля отправлен на email");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during forgot password for {Email}", email);
            return ApiResponse<bool>.ErrorResponse("Ошибка отправки кода", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<string>> VerifyResetCodeAsync(string email, string code)
    {
        try
        {
            var entry = _resetCodes.FirstOrDefault(kvp => kvp.Value.Email == email);
            if (string.IsNullOrEmpty(entry.Key))
            {
                return ApiResponse<string>.ErrorResponse("Неверный код");
            }

            var info = entry.Value;
            if (info.Expiry < DateTime.UtcNow)
            {
                _resetCodes.TryRemove(entry.Key, out _);
                return ApiResponse<string>.ErrorResponse("Срок действия кода истек");
            }

            if (!string.Equals(info.Code, code, StringComparison.Ordinal))
            {
                return ApiResponse<string>.ErrorResponse("Неверный код");
            }

            return ApiResponse<string>.SuccessResponse(entry.Key, "Код подтвержден");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying reset code for {Email}", email);
            return ApiResponse<string>.ErrorResponse("Ошибка проверки кода", new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<bool>> ResetPasswordAsync(string resetToken, string newPassword)
    {
        try
        {
            if (!_resetCodes.TryGetValue(resetToken, out var info))
            {
                return ApiResponse<bool>.ErrorResponse("Недействительный или просроченный токен");
            }

            if (info.Expiry < DateTime.UtcNow)
            {
                _resetCodes.TryRemove(resetToken, out _);
                return ApiResponse<bool>.ErrorResponse("Недействительный или просроченный токен");
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == info.Email);
            if (user == null)
            {
                _resetCodes.TryRemove(resetToken, out _);
                return ApiResponse<bool>.ErrorResponse("Пользователь с данной почтой не найден");
            }

            var isBlocked = await _unitOfWork.BlockHistory.IsEntityBlockedAsync("User", user.Id);
            if (isBlocked)
            {
                return ApiResponse<bool>.ErrorResponse("Пользователь заблокирован");
            }

            user.PasswordHash = HashPassword(newPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            _resetCodes.TryRemove(resetToken, out _);

            return ApiResponse<bool>.SuccessResponse(true, "Пароль успешно изменен");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password");
            return ApiResponse<bool>.ErrorResponse("Ошибка сброса пароля", new List<string> { ex.Message });
        }
    }
}
