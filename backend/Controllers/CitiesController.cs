using Microsoft.AspNetCore.Mvc;
using NookBook.API.Services.Abstractions;

namespace NookBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CitiesController : ControllerBase
{
    private readonly ICityService _cityService;

    public CitiesController(ICityService cityService)
    {
        _cityService = cityService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllCities()
    {
        var result = await _cityService.GetAllCitiesAsync();
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCityById(int id)
    {
        var result = await _cityService.GetCityByIdAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("{id}/hotels")]
    public async Task<IActionResult> GetCityWithHotels(int id)
    {
        var result = await _cityService.GetCityWithHotelsAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}