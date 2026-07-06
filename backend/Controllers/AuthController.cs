using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NookBook.API.DTOs;
using NookBook.API.Services.Abstractions;

namespace NookBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    private static string SanitizeAvatarForResponse(string? avatar) =>
        string.IsNullOrEmpty(avatar) || avatar.StartsWith("data:", StringComparison.OrdinalIgnoreCase)
            ? string.Empty
            : avatar;

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        try
        {
            var (token, user) = await _authService.LoginAsync(loginDto);

            var roleName = user.RoleId switch
            {
                1 => "guest",
                2 => "user",
                3 => "manager",
                4 => "admin",
                _ => "user"
            };

            return Ok(new
            {
                success = true,
                message = "Вход выполнен успешно",
                data = new
                {
                    token,
                    user = new
                    {
                        id = user.Id,
                        name = $"{user.FirstName} {user.LastName}",
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        email = user.Email,
                        role = roleName,
                        phoneNumber = user.PhoneNumber,
                        avatar = SanitizeAvatarForResponse(user.Avatar),
                        createdAt = user.CreatedAt
                    }
                },
                errors = new string[] { }
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new
            {
                success = false,
                message = ex.Message,
                data = (object?)null,
                errors = new[] { ex.Message }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return StatusCode(500, new
            {
                success = false,
                message = "Ошибка при входе",
                data = (object?)null,
                errors = new[] { ex.Message }
            });
        }
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterUserDto registerDto)
    {
        try
        {
            var (token, user) = await _authService.RegisterAsync(registerDto);

            var roleName = user.RoleId switch
            {
                1 => "guest",
                2 => "user",
                3 => "manager",
                4 => "admin",
                _ => "user"
            };

            return Ok(new
            {
                success = true,
                message = "Регистрация успешна",
                data = new
                {
                    token,
                    user = new
                    {
                        id = user.Id,
                        name = $"{user.FirstName} {user.LastName}",
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        email = user.Email,
                        role = roleName,
                        phoneNumber = user.PhoneNumber,
                        avatar = SanitizeAvatarForResponse(user.Avatar),
                        createdAt = user.CreatedAt
                    }
                },
                errors = new string[] { }
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                success = false,
                message = ex.Message,
                data = (object?)null,
                errors = new[] { ex.Message }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration");
            return StatusCode(500, new
            {
                success = false,
                message = "Ошибка при регистрации",
                data = (object?)null,
                errors = new[] { ex.Message }
            });
        }
    }


    [Authorize]
    [NonAction]
    public async Task<IActionResult> GetCurrentUserLegacy()
    {
        try
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader))
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Отсутствует токен авторизации",
                    data = (object?)null,
                    errors = new[] { "Missing authorization header" }
                });
            }

            var token = authHeader.Replace("Bearer ", "");
            if (string.IsNullOrEmpty(token))
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Отсутствует токен",
                    data = (object?)null,
                    errors = new[] { "Missing token" }
                });
            }

            var user = await _authService.GetUserByTokenAsync(token);

            if (user == null)
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Неверный токен",
                    data = (object?)null,
                    errors = new[] { "Invalid token" }
                });
            }

            var roleName = user.RoleId switch
            {
                1 => "guest",
                2 => "user",
                3 => "manager",
                4 => "admin",
                _ => "user"
            };

            return Ok(new
            {
                success = true,
                message = "Пользователь получен",
                data = new
                {
                    id = user.Id,
                    name = $"{user.FirstName} {user.LastName}",
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    email = user.Email,
                    role = roleName,
                    phoneNumber = user.PhoneNumber,
                    avatar = SanitizeAvatarForResponse(user.Avatar),
                    createdAt = user.CreatedAt
                },
                errors = new string[] { }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(500, new
            {
                success = false,
                message = "Ошибка получения пользователя",
                data = (object?)null,
                errors = new[] { ex.Message }
            });
        }
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("userId")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Не удалось определить пользователя",
                    data = (object?)null,
                    errors = new[] { "Missing user id claim" }
                });
            }

            var user = await _authService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return Unauthorized(new
                {
                    success = false,
                    message = "Пользователь не найден или недоступен",
                    data = (object?)null,
                    errors = new[] { "User not found" }
                });
            }

            var roleName = user.RoleId switch
            {
                1 => "guest",
                2 => "user",
                3 => "manager",
                4 => "admin",
                _ => "user"
            };

            return Ok(new
            {
                success = true,
                message = "Пользователь получен",
                data = new
                {
                    id = user.Id,
                    name = $"{user.FirstName} {user.LastName}",
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    email = user.Email,
                    role = roleName,
                    phoneNumber = user.PhoneNumber,
                    avatar = SanitizeAvatarForResponse(user.Avatar),
                    createdAt = user.CreatedAt
                },
                errors = new string[] { }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user");
            return StatusCode(500, new
            {
                success = false,
                message = "Ошибка получения пользователя",
                data = (object?)null,
                errors = new[] { ex.Message }
            });
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto dto)
    {
        var token = await _authService.RefreshAccessTokenAsync(dto.RefreshToken);
        if (string.IsNullOrWhiteSpace(token))
        {
            return Unauthorized(new
            {
                success = false,
                message = "Неверный refresh token",
                data = (object?)null,
                errors = new[] { "Invalid refresh token" }
            });
        }

        return Ok(new
        {
            success = true,
            message = "Token refreshed",
            data = new { token },
            errors = new string[] { }
        });
    }

    [HttpPost("send-login-code")]
    public async Task<IActionResult> SendLoginCode([FromBody] ForgotPasswordDto dto)
    {
        try
        {
            var result = await _authService.SendLoginCodeAsync(dto.Email);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending login code");
            var error = ApiResponse<bool>.ErrorResponse("Ошибка отправки кода", new List<string> { ex.Message });
            return StatusCode(500, error);
        }
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        try
        {
            var result = await _authService.ForgotPasswordAsync(dto.Email);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during forgot password");
            var error = ApiResponse<bool>.ErrorResponse("Ошибка отправки кода", new List<string> { ex.Message });
            return StatusCode(500, error);
        }
    }

    [HttpPost("verify-code")]
    public async Task<IActionResult> VerifyCode([FromBody] VerifyCodeDto dto)
    {
        try
        {
            var result = await _authService.VerifyResetCodeAsync(dto.Email, dto.Code);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(new
            {
                success = true,
                message = result.Message,
                data = new { resetToken = result.Data },
                errors = result.Errors
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying reset code");
            var error = ApiResponse<string>.ErrorResponse("Ошибка проверки кода", new List<string> { ex.Message });
            return StatusCode(500, error);
        }
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        try
        {
            var result = await _authService.ResetPasswordAsync(dto.ResetToken, dto.NewPassword);
            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password");
            var error = ApiResponse<bool>.ErrorResponse("Ошибка сброса пароля", new List<string> { ex.Message });
            return StatusCode(500, error);
        }
    }

    [HttpPost("login-by-code")]
    public async Task<IActionResult> LoginByCode([FromBody] VerifyCodeDto dto)
    {
        try
        {
            var (token, user) = await _authService.LoginByCodeAsync(dto.Email, dto.Code);

            var roleName = user.RoleId switch
            {
                1 => "guest",
                2 => "user",
                3 => "manager",
                4 => "admin",
                _ => "user"
            };

            return Ok(new
            {
                success = true,
                message = "Вход выполнен успешно",
                data = new
                {
                    token,
                    user = new
                    {
                        id = user.Id,
                        name = $"{user.FirstName} {user.LastName}",
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        email = user.Email,
                        role = roleName,
                        phoneNumber = user.PhoneNumber,
                        avatar = SanitizeAvatarForResponse(user.Avatar),
                        createdAt = user.CreatedAt
                    }
                },
                errors = new string[] { }
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new
            {
                success = false,
                message = ex.Message,
                data = (object?)null,
                errors = new[] { ex.Message }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login by code");
            return StatusCode(500, new
            {
                success = false,
                message = "Ошибка при входе по коду",
                data = (object?)null,
                errors = new[] { ex.Message }
            });
        }
    }

    [HttpPost("google/callback")]
    public async Task<IActionResult> GoogleCallback([FromBody] OAuthCallbackDto dto)
    {
        try
        {
            var (token, user) = await _authService.GoogleOAuthCallbackAsync(dto.Code);

            var roleName = user.RoleId switch
            {
                1 => "guest",
                2 => "user",
                3 => "manager",
                4 => "admin",
                _ => "user"
            };

            return Ok(new
            {
                success = true,
                message = "Вход через Google выполнен успешно",
                data = new
                {
                    token,
                    user = new
                    {
                        id = user.Id,
                        name = $"{user.FirstName} {user.LastName}",
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        email = user.Email,
                        role = roleName,
                        phoneNumber = user.PhoneNumber,
                        avatar = SanitizeAvatarForResponse(user.Avatar),
                        createdAt = user.CreatedAt
                    }
                },
                errors = new string[] { }
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                success = false,
                message = ex.Message,
                data = (object?)null,
                errors = new[] { ex.Message }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Google OAuth callback");
            return StatusCode(500, new
            {
                success = false,
                message = "Ошибка при входе через Google",
                data = (object?)null,
                errors = new[] { ex.Message }
            });
        }
    }

    [HttpPost("mailru/callback")]
    public async Task<IActionResult> MailruCallback([FromBody] OAuthCallbackDto dto)
    {
        try
        {
            var (token, user) = await _authService.MailruOAuthCallbackAsync(dto.Code, dto.State);

            var roleName = user.RoleId switch
            {
                1 => "guest",
                2 => "user",
                3 => "manager",
                4 => "admin",
                _ => "user"
            };

            return Ok(new
            {
                success = true,
                message = "Вход через Mail.ru выполнен успешно",
                data = new
                {
                    token,
                    user = new
                    {
                        id = user.Id,
                        name = $"{user.FirstName} {user.LastName}",
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        email = user.Email,
                        role = roleName,
                        phoneNumber = user.PhoneNumber,
                        avatar = SanitizeAvatarForResponse(user.Avatar),
                        createdAt = user.CreatedAt
                    }
                },
                errors = new string[] { }
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                success = false,
                message = ex.Message,
                data = (object?)null,
                errors = new[] { ex.Message }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Mail.ru OAuth callback");
            return StatusCode(500, new
            {
                success = false,
                message = "Ошибка при входе через Mail.ru",
                data = (object?)null,
                errors = new[] { ex.Message }
            });
        }
    }

    [Authorize]
    [HttpPost("register-manager")]
    public async Task<IActionResult> RegisterManager([FromBody] RegisterManagerDto dto)
    {
        try
        {
            var currentUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

            var (token, user) = await _authService.RegisterManagerAsync(dto, currentUserId);

            return Ok(new
            {
                success = true,
                message = dto.HotelId.HasValue
                    ? "Менеджер успешно зарегистрирован и назначен на отель"
                    : "Менеджер успешно зарегистрирован без привязки к отелю",
                data = new
                {
                    token,
                    user = new
                    {
                        id = user.Id,
                        name = $"{user.FirstName} {user.LastName}",
                        email = user.Email,
                        role = "manager",
                        phoneNumber = user.PhoneNumber,
                        createdAt = user.CreatedAt
                    }
                },
                errors = new string[] { }
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                success = false,
                message = ex.Message,
                data = (object?)null,
                errors = new[] { ex.Message }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during manager registration");
            return StatusCode(500, new
            {
                success = false,
                message = "Ошибка при регистрации менеджера",
                data = (object?)null,
                errors = new[] { ex.Message }
            });
        }
    }
}

public class RefreshTokenDto
{
    public string RefreshToken { get; set; } = string.Empty;
}
