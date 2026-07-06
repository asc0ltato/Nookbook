using NookBook.API.DTOs;
using NookBook.API.Models;
using NookBook.API.Repositories.Abstractions;
using NookBook.API.Services.Abstractions;

namespace NookBook.API.Services;

public class CityService : ICityService
{
    private const string DefaultHotelImage = "/assets/hotels/block.jpg";

    private readonly IUnitOfWork _unitOfWork;

    public CityService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<IEnumerable<CityDto>>> GetAllCitiesAsync()
    {
        try
        {
            var cities = await _unitOfWork.Cities.GetAllAsync();
            var cityDtos = cities.Select(MapToDto).ToList();
            return ApiResponse<IEnumerable<CityDto>>.SuccessResponse(cityDtos);
        }
        catch (Exception ex)
        {
            return ApiResponse<IEnumerable<CityDto>>.ErrorResponse(
                "Ошибка при получении списка городов",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<CityDto>> GetCityByIdAsync(int id)
    {
        try
        {
            var city = await _unitOfWork.Cities.GetByIdAsync(id);
            if (city == null)
            {
                return ApiResponse<CityDto>.ErrorResponse("Город не найден");
            }

            var cityDto = MapToDto(city);
            return ApiResponse<CityDto>.SuccessResponse(cityDto);
        }
        catch (Exception ex)
        {
            return ApiResponse<CityDto>.ErrorResponse(
                "Ошибка при получении города",
                new List<string> { ex.Message });
        }
    }

    public async Task<ApiResponse<CityWithHotelsDto>> GetCityWithHotelsAsync(int id)
    {
        try
        {
            var city = await _unitOfWork.Cities.GetByIdAsync(id);
            if (city == null)
            {
                return ApiResponse<CityWithHotelsDto>.ErrorResponse("Город не найден");
            }

            var hotels = await _unitOfWork.Hotels.GetHotelsByCityAsync(city.Id);
            var visibleHotels = new List<Hotel>();
            
            foreach (var hotel in hotels)
            {
                var isBlocked = await _unitOfWork.BlockHistory.IsEntityBlockedAsync("Hotel", hotel.Id);
                if (!isBlocked)
                {
                    visibleHotels.Add(hotel);
                }
            }

            var hotelTasks = visibleHotels.Select(async h => {
                var approvedReviews = (await _unitOfWork.Reviews.GetReviewsByHotelAsync(h.Id, true)).ToList();
                var rating = approvedReviews.Any() ? (decimal)approvedReviews.Average(r => (double)r.Rating) : 0m;
                var reviewCount = approvedReviews.Count;
                var price = h.Rooms?.Any() == true ? h.Rooms.Min(r => r.Price) : 0m;

                return new HotelDto
                {
                    Id = h.Id,
                    Name = h.Name,
                    Description = h.Description,
                    Stars = h.Stars,
                    Rating = rating,
                    ReviewCount = reviewCount,
                    Price = price,
                    Images = BuildHotelImageList(h.Images),
                    City = city.Name,
                    Address = h.Address,
                    DistanceToCenter = 0,
                    Latitude = h.Latitude,
                    Longitude = h.Longitude,
                    Amenities = h.HotelAmenities.Select(ha => ha.HotelAmenityType.Name).ToList()
                };
            });

            var hotelDtos = await Task.WhenAll(hotelTasks);

            var cityDto = new CityWithHotelsDto
            {
                Id = city.Id,
                Name = city.Name,
                Image = city.Image,
                Hotels = hotelDtos.ToList()
            };

            return ApiResponse<CityWithHotelsDto>.SuccessResponse(cityDto);
        }
        catch (Exception ex)
        {
            return ApiResponse<CityWithHotelsDto>.ErrorResponse(
                "Ошибка при получении города с отелями",
                new List<string> { ex.Message });
        }
    }

    private CityDto MapToDto(City city)
    {
        return new CityDto
        {
            Id = city.Id,
            Name = city.Name,
            Image = city.Image,
            Latitude = city.Latitude,
            Longitude = city.Longitude
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
