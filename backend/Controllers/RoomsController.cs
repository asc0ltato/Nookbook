using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NookBook.API.Data;
using NookBook.API.DTOs;
using NookBook.API.Services.Abstractions;
using NookBook.API.Repositories.Abstractions;
using System.Security.Claims;

namespace NookBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomsController : ControllerBase
{
    private readonly IRoomService _roomService;
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _unitOfWork;

    public RoomsController(IRoomService roomService, ApplicationDbContext context, IUnitOfWork unitOfWork)
    {
        _roomService = roomService;
        _context = context;
        _unitOfWork = unitOfWork;
    }

    [HttpGet("hotel/{hotelId}")]
    public async Task<IActionResult> GetRoomsByHotel(int hotelId)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var currentUserId = int.TryParse(userIdClaim, out var id) ? id : (int?)null;
        
        // If user is a manager, verify they can access this hotel
        if (currentUserId.HasValue)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(currentUserId.Value);
            if (user != null && user.RoleId == 3) // Manager role
            {
                var managers = await _unitOfWork.Managers.FindAsync(m => m.UserId == currentUserId.Value);
                var managerAssignment = managers.FirstOrDefault();
                // If manager has no hotel assigned yet, return empty list (not error)
                if (managerAssignment == null)
                {
                    return Ok(new { success = true, data = new List<object>(), message = "Нет назначенного отеля" });
                }
                if (managerAssignment.HotelId != hotelId)
                {
                    return Ok(new { success = true, data = new List<object>(), message = "Нет доступа к этому отелю" });
                }
            }
        }
        
        var result = await _roomService.GetRoomsByHotelAsync(hotelId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetRoomById(int id)
    {
        var result = await _roomService.GetRoomByIdAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("hotel/{hotelId}/available")]
    public async Task<IActionResult> GetAvailableRooms(int hotelId, [FromQuery] DateTime checkIn, [FromQuery] DateTime checkOut, [FromQuery] int? guests = null)
    {
        var result = await _roomService.GetAvailableRoomsAsync(hotelId, checkIn, checkOut, guests);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("hotel/{hotelId}/room-types")]
    public async Task<IActionResult> GetRoomTypeGroups(int hotelId, [FromQuery] DateTime? checkIn = null, [FromQuery] DateTime? checkOut = null, [FromQuery] int? guests = null)
    {
        var result = await _roomService.GetRoomTypeGroupsAsync(hotelId, checkIn, checkOut, guests);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateRoom([FromBody] CreateRoomDto createDto)
    {
        var result = await _roomService.CreateRoomAsync(createDto);
        if (result.Success)
        {
            return CreatedAtAction(nameof(GetRoomById), new { id = result.Data?.Id }, result);
        }
        return BadRequest(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRoom(int id, [FromBody] UpdateRoomDto updateDto)
    {
        var result = await _roomService.UpdateRoomAsync(id, updateDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRoom(int id)
    {
        var result = await _roomService.DeleteRoomAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("{id}/block")]
    public async Task<IActionResult> BlockRoom(int id, [FromBody] BlockRoomRequest? request)
    {
        var result = await _roomService.BlockRoomAsync(id, request?.Reason ?? string.Empty);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("{id}/unblock")]
    public async Task<IActionResult> UnblockRoom(int id)
    {
        var result = await _roomService.UnblockRoomAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("types")]
    public async Task<IActionResult> GetRoomTypes()
    {
        try
        {
            var roomTypes = await _context.RoomTypes
                .OrderBy(rt => rt.Name)
                .Select(rt => new { rt.Id, rt.Name, rt.Description, rt.MaxGuests, rt.BedCount, rt.Size })
                .ToListAsync();
            
            return Ok(new { success = true, data = roomTypes, message = "Room types retrieved successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = $"Error retrieving room types: {ex.Message}", data = (object?)null });
        }
    }

    [HttpGet("amenity-types")]
    public async Task<IActionResult> GetRoomAmenityTypes()
    {
        try
        {
            var amenityTypes = await _context.RoomAmenityTypes
                .OrderBy(at => at.Name)
                .Select(at => new { at.Id, at.Name })
                .ToListAsync();
            
            return Ok(new { success = true, data = amenityTypes, message = "Room amenity types retrieved successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = $"Error retrieving room amenity types: {ex.Message}", data = (object?)null });
        }
    }
}

public class BlockRoomRequest
{
    public string? Reason { get; set; }
}