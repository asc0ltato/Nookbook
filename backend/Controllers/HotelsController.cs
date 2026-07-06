using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NookBook.API.Data;
using NookBook.API.DTOs;
using NookBook.API.Services.Abstractions;

namespace NookBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HotelsController : ControllerBase
{
    private readonly IHotelService _hotelService;
    private readonly ApplicationDbContext _context;

    public HotelsController(IHotelService hotelService, ApplicationDbContext context)
    {
        _hotelService = hotelService;
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllHotels()
    {
        var result = await _hotelService.GetAllHotelsAsync();
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("amenity-types")]
    [AllowAnonymous]
    public async Task<IActionResult> GetHotelAmenityTypes()
    {
        try
        {
            var amenityTypes = await _context.HotelAmenityTypes
                .OrderBy(at => at.Name)
                .Select(at => new { at.Id, at.Name })
                .ToListAsync();

            return Ok(new { success = true, data = amenityTypes, message = "Hotel amenity types retrieved successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = $"Error retrieving hotel amenity types: {ex.Message}", data = (object?)null });
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetHotelById(int id)
    {
        var result = await _hotelService.GetHotelByIdAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("city/{cityId:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetHotelsByCity(int cityId)
    {
        int? userId = null;
        var userIdClaim = User.FindFirst("userId");
        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out var parsedUserId))
        {
            userId = parsedUserId;
        }

        var result = await _hotelService.GetHotelsByCityAsync(cityId, userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("search")]
    [AllowAnonymous]
    public async Task<IActionResult> SearchHotels([FromBody] SearchHotelsDto searchDto)
    {
        var result = await _hotelService.SearchHotelsAsync(searchDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("top-rated")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTopRatedHotels([FromQuery] int count = 10)
    {
        var result = await _hotelService.GetTopRatedHotelsAsync(count);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateHotel([FromBody] CreateHotelDto createDto)
    {
        var result = await _hotelService.CreateHotelAsync(createDto);
        return result.Success ? CreatedAtAction(nameof(GetHotelById), new { id = result.Data?.Id }, result) : BadRequest(result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateHotel(int id, [FromBody] UpdateHotelDto updateDto)
    {
        var result = await _hotelService.UpdateHotelAsync(id, updateDto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteHotel(int id)
    {
        var result = await _hotelService.DeleteHotelAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("{id}/block")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> BlockHotel(int id, [FromBody] BlockHotelRequest? request)
    {
        var result = await _hotelService.BlockHotelAsync(id, request?.Reason);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("{id}/unblock")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UnblockHotel(int id)
    {
        var result = await _hotelService.UnblockHotelAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("manager/{userId}")]
    [Authorize]
    public async Task<IActionResult> GetManagerHotels(int userId)
    {
        var currentUserId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        var currentRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

        if (currentRole == "Manager")
        {
            userId = currentUserId;
        }

        var result = await _hotelService.GetManagerHotelsAsync(userId);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}

public class BlockHotelRequest
{
    public string? Reason { get; set; }
}