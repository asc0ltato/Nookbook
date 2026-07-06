using Microsoft.AspNetCore.Mvc;
using NookBook.API.Models;
using NookBook.API.Repositories.Abstractions;
using NookBook.API.Services.Abstractions;

namespace NookBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecommendationsController : ControllerBase
{
    private const string DefaultHotelImage = "/assets/hotels/block.jpg";

    private readonly IRecommendationService _recommendationService;
    private readonly IUnitOfWork _unitOfWork;

    public RecommendationsController(
        IRecommendationService recommendationService,
        IUnitOfWork unitOfWork)
    {
        _recommendationService = recommendationService;
        _unitOfWork = unitOfWork;
    }

    [HttpGet("popular-hotels")]
    public async Task<ActionResult<IEnumerable<object>>> GetPopularHotels([FromQuery] int limit = 10)
    {
        var popularHotels = await _recommendationService.GetPopularHotelsAsync(limit);
        var result = new List<object>();
        foreach (var hotel in popularHotels)
        {
            result.Add(await MapToDtoAsync(hotel));
        }
        return Ok(result);
    }

    [HttpGet("popular-destinations")]
    public async Task<ActionResult<IEnumerable<object>>> GetPopularDestinations([FromQuery] int limit = 6)
    {
        var popularDestinations = await _recommendationService.GetPopularDestinationsAsync(limit);
        return Ok(popularDestinations.Select(city => new
        {
            city.Id,
            city.Name,
            Image = city.Image,
            ImageUrl = city.Image,
            city.Latitude,
            city.Longitude
        }));
    }

    [HttpGet("similar/{hotelId}")]
    public async Task<ActionResult<IEnumerable<object>>> GetSimilarHotels(int hotelId, [FromQuery] int limit = 6)
    {
        var similarHotels = await _recommendationService.GetSimilarHotelsAsync(hotelId, limit);
        var result = new List<object>();
        foreach (var hotel in similarHotels)
        {
            result.Add(await MapToDtoAsync(hotel));
        }
        return Ok(result);
    }

    private async Task<object> MapToDtoAsync(Hotel hotel)
    {
        var reviews = await _unitOfWork.Reviews.GetReviewsByHotelAsync(hotel.Id, approvedOnly: true);
        var reviewCount = reviews.Count();
        var rating = reviewCount > 0 ? reviews.Average(r => r.Rating) : 0;

        return new
        {
            hotel.Id,
            hotel.Name,
            hotel.Description,
            hotel.Stars,
            Images = BuildHotelImageList(hotel.Images),
            hotel.CityId,
            hotel.Address,
            hotel.Latitude,
            hotel.Longitude,
            hotel.CreatedAt,
            hotel.UpdatedAt,
            Price = hotel.Rooms.Any()
                ? hotel.Rooms.Min(r => r.Price)
                : 0,
            Rating = rating,
            ReviewCount = reviewCount,
            City = new
            {
                hotel.City.Id,
                hotel.City.Name,
                hotel.City.Image
            }
        };
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
}
