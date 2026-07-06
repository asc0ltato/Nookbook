using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NookBook.API.DTOs;
using NookBook.API.Services.Abstractions;
using NookBook.API.Models;
using System.Security.Claims;

namespace NookBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    private int? GetCurrentUserId()
    {
        var v = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("userId")?.Value;
        return int.TryParse(v, out var id) ? id : null;
    }

    private bool CanAccessUserId(int userId)
    {
        var current = GetCurrentUserId();
        return current.HasValue && (current.Value == userId || User.IsInRole("Admin"));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetUserById(int id)
    {
        var result = await _userService.GetUserByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("email/{email}")]
    public async Task<IActionResult> GetUserByEmail(string email)
    {
        var result = await _userService.GetUserByEmailAsync(email);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterUserDto registerDto)
    {
        var result = await _userService.RegisterUserAsync(registerDto);
        return result.Success ? CreatedAtAction(nameof(GetUserById), new { id = result.Data?.Id }, result) : BadRequest(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginUserDto loginDto)
    {
        var result = await _userService.LoginUserAsync(loginDto);
        return result.Success ? Ok(result) : Unauthorized(result);
    }

    [Authorize]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto updateDto)
    {
        var result = await _userService.UpdateUserAsync(id, updateDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("{id}/change-password")]
    public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordDto changePasswordDto)
    {
        var result = await _userService.ChangePasswordAsync(id, changePasswordDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize]
    [HttpGet("{userId}/favorites")]
    public async Task<IActionResult> GetUserFavorites(int userId)
    {
        if (!CanAccessUserId(userId))
            return Forbid();

        var result = await _userService.GetUserFavoritesAsync(userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize]
    [HttpPost("{userId}/favorites/{hotelId}")]
    public async Task<IActionResult> AddToFavorites(int userId, int hotelId)
    {
        if (!CanAccessUserId(userId))
            return Forbid();

        var result = await _userService.AddToFavoritesAsync(userId, hotelId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize]
    [HttpDelete("{userId}/favorites/{hotelId}")]
    public async Task<IActionResult> RemoveFromFavorites(int userId, int hotelId)
    {
        if (!CanAccessUserId(userId))
            return Forbid();

        var result = await _userService.RemoveFromFavoritesAsync(userId, hotelId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAllUsers()
    {
        var result = await _userService.GetAllUsersAsync();
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{userId}/block")]
    public async Task<IActionResult> BlockUser(int userId, [FromBody] BlockUserRequest? request)
    {
        var result = await _userService.BlockUserAsync(userId, request?.Reason);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{userId}/unblock")]
    public async Task<IActionResult> UnblockUser(int userId)
    {
        var result = await _userService.UnblockUserAsync(userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{userId}/set-role")]
    public async Task<IActionResult> SetUserRole(int userId, [FromBody] SetRoleDto dto)
    {
        var result = await _userService.SetUserRoleAsync(userId, dto.RoleId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{userId}/set-manager")]
    public async Task<IActionResult> SetManager(int userId, [FromQuery] bool isManager = true)
    {
        var result = await _userService.SetManagerAsync(userId, isManager);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("{userId}/assign-hotel")]
    public async Task<IActionResult> AssignManagerToHotel(int userId, [FromBody] AssignHotelDto dto)
    {
        var result = await _userService.AssignManagerToHotelAsync(userId, dto.HotelId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpGet("managers")]
    public async Task<IActionResult> GetManagers()
    {
        var result = await _userService.GetManagersAsync();
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var currentUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        var isAdmin = User.IsInRole("Admin");
        
        if (id != currentUserId && !isAdmin)
        {
            return Forbid("Вы можете удалить только свой профиль");
        }

        var result = await _userService.DeleteUserAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}

public class BlockUserRequest
{
    public string? Reason { get; set; }
}