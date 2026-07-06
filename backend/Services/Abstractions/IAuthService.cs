using NookBook.API.DTOs;
using NookBook.API.Models;

namespace NookBook.API.Services.Abstractions;

public interface IAuthService
{
    Task<(string Token, User User)> LoginAsync(LoginDto loginDto);
    Task<(string Token, User User)> RegisterAsync(RegisterUserDto registerDto);
    Task<(string Token, User User)> RegisterManagerAsync(RegisterManagerDto dto, int currentUserId);
    Task<User?> GetUserByTokenAsync(string token);
    Task<User?> GetUserByIdAsync(int userId);
    Task<string?> RefreshAccessTokenAsync(string refreshToken);
    string GenerateJwtToken(User user);
    Task<(string Token, User User)> GoogleOAuthCallbackAsync(string code);
    Task<(string Token, User User)> MailruOAuthCallbackAsync(string code, string? state);
    Task<ApiResponse<bool>> SendLoginCodeAsync(string email);
    Task<(string Token, User User)> LoginByCodeAsync(string email, string code);
    Task<ApiResponse<bool>> ForgotPasswordAsync(string email);
    Task<ApiResponse<string>> VerifyResetCodeAsync(string email, string code);
    Task<ApiResponse<bool>> ResetPasswordAsync(string resetToken, string newPassword);
}
