using NookBook.API.DTOs;
using NookBook.API.Models;

namespace NookBook.API.Services.Abstractions;

public interface IUserService
{
    Task<ApiResponse<UserDto>> GetUserByIdAsync(int id);
    Task<ApiResponse<UserDto>> GetUserByEmailAsync(string email);
    Task<ApiResponse<UserDto>> RegisterUserAsync(RegisterUserDto registerDto);
    Task<ApiResponse<UserDto>> LoginUserAsync(LoginUserDto loginDto);
    Task<ApiResponse<UserDto>> UpdateUserAsync(int id, UpdateUserDto updateDto);
    Task<ApiResponse<bool>> ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto);
    Task<ApiResponse<IEnumerable<HotelDto>>> GetUserFavoritesAsync(int userId);
    Task<ApiResponse<bool>> AddToFavoritesAsync(int userId, int hotelId);
    Task<ApiResponse<bool>> RemoveFromFavoritesAsync(int userId, int hotelId);
    Task<ApiResponse<bool>> BlockUserAsync(int userId, string? reason = null);
    Task<ApiResponse<bool>> UnblockUserAsync(int userId);
    Task<ApiResponse<bool>> SetManagerAsync(int userId, bool isManager);
    Task<ApiResponse<bool>> AssignManagerToHotelAsync(int userId, int hotelId);
    Task<ApiResponse<IEnumerable<UserDto>>> GetManagersAsync();
    Task<ApiResponse<IEnumerable<UserDto>>> GetAllUsersAsync();
    Task<ApiResponse<UserDto>> SetUserRoleAsync(int userId, int roleId);
    Task<ApiResponse<bool>> DeleteUserAsync(int userId);
}
