using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NookBook.API.DTOs;
using NookBook.API.Services.Abstractions;
using NookBook.API.Repositories.Abstractions;
using System.Security.Claims;

namespace NookBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly IUnitOfWork _unitOfWork;

    public BookingsController(IBookingService bookingService, IUnitOfWork unitOfWork)
    {
        _bookingService = bookingService;
        _unitOfWork = unitOfWork;
    }

    [HttpGet("user/{userId}")]
    [Authorize]
    public async Task<IActionResult> GetUserBookings(int userId, [FromQuery] string? hotelNameSearch = null)
    {
        var result = await _bookingService.GetUserBookingsAsync(userId, hotelNameSearch);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{bookingId}")]
    [Authorize]
    public async Task<IActionResult> GetBookingById(int bookingId)
    {
        var result = await _bookingService.GetBookingByIdAsync(bookingId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto createDto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var currentUserId = int.TryParse(userIdClaim, out var id) ? id : (int?)null;
        
        if (currentUserId.HasValue)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(currentUserId.Value);
            if (user != null)
            {
                if (user.RoleId == 3)
                {
                    if (createDto.UserId <= 0)
                    {
                        return BadRequest(new { success = false, message = "Укажите клиента для бронирования" });
                    }

                    if (!createDto.HotelId.HasValue || createDto.HotelId.Value <= 0)
                    {
                        return BadRequest(new { success = false, message = "Укажите отель для бронирования" });
                    }

                    var managers = await _unitOfWork.Managers.FindAsync(m => m.UserId == currentUserId.Value);
                    var managerHotelIds = managers.Select(m => m.HotelId).ToHashSet();
                    if (!managerHotelIds.Contains(createDto.HotelId.Value))
                    {
                        return BadRequest(new { success = false, message = "Менеджер может создавать бронирования только для своего отеля" });
                    }
                }
                else if (user.RoleId != 2 && user.RoleId != 4)
                {
                    return BadRequest(new { success = false, message = "Недостаточно прав для создания бронирования" });
                }
            }
        }
        
        var result = await _bookingService.CreateBookingAsync(createDto);
        return result.Success ? CreatedAtAction(nameof(GetBookingById), new { bookingId = result.Data?.Id }, result) : BadRequest(result);
    }

    [HttpPut("{bookingId}")]
    [Authorize]
    public async Task<IActionResult> UpdateBooking(int bookingId, [FromBody] UpdateBookingDto updateDto)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var currentUserId = int.TryParse(userIdClaim, out var id) ? id : (int?)null;
        var result = await _bookingService.UpdateBookingAsync(bookingId, updateDto, currentUserId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("{bookingId}/cancel")]
    [Authorize]
    public async Task<IActionResult> CancelBooking(int bookingId, [FromQuery] int userId)
    {
        var result = await _bookingService.CancelBookingAsync(bookingId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAllBookings()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var currentUserId = int.TryParse(userIdClaim, out var id) ? id : (int?)null;
        
        var result = await _bookingService.GetAllBookingsAsync();
        
        // If user is a manager, filter to only their hotel's bookings
        if (currentUserId.HasValue && result.Success && result.Data != null)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(currentUserId.Value);
            if (user != null && user.RoleId == 3) // Manager role
            {
                var managers = await _unitOfWork.Managers.FindAsync(m => m.UserId == currentUserId.Value);
                var managerAssignment = managers.FirstOrDefault();
                if (managerAssignment != null)
                {
                    var filteredBookings = result.Data.Where(b => b.HotelId == managerAssignment.HotelId).ToList();
                    result.Data = filteredBookings;
                }
            }
        }
        
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("hotel/{hotelId}")]
    [Authorize]
    public async Task<IActionResult> GetBookingsByHotel(int hotelId)
    {
        var result = await _bookingService.GetBookingsByHotelAsync(hotelId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{bookingId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteBooking(int bookingId)
    {
        var result = await _bookingService.DeleteBookingAsync(bookingId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("{bookingId}/reminder")]
    [Authorize]
    public async Task<IActionResult> SendReminder(int bookingId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var managerUserId = int.TryParse(userIdClaim, out var id) ? id : 0;
        var result = await _bookingService.SendBookingReminderAsync(bookingId, managerUserId);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}