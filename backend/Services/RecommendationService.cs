using NookBook.API.Models;
using NookBook.API.Repositories.Abstractions;
using NookBook.API.Services.Abstractions;

namespace NookBook.API.Services;

public class RecommendationService : IRecommendationService
{
    private readonly IUnitOfWork _unitOfWork;

    public RecommendationService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<Hotel>> GetPopularHotelsAsync(int limit = 10)
    {
        var stats = await BuildCompletedBookingStatsAsync();
        var allHotels = await _unitOfWork.Hotels.GetAllAsync();

        var ranked = new List<(Hotel Hotel, int BookingCount)>();

        foreach (var hotel in allHotels)
        {
            if (!stats.CompletedCountByHotelId.TryGetValue(hotel.Id, out var bookingCount) || bookingCount < 1)
            {
                continue;
            }

            if (await _unitOfWork.BlockHistory.IsEntityBlockedAsync("Hotel", hotel.Id))
            {
                continue;
            }

            ranked.Add((hotel, bookingCount));
        }

        return ranked
            .OrderByDescending(x => x.BookingCount)
            .ThenByDescending(x => x.Hotel.Id)
            .Take(limit)
            .Select(x => x.Hotel);
    }

    public async Task<IEnumerable<City>> GetPopularDestinationsAsync(int limit = 6)
    {
        var stats = await BuildCompletedBookingStatsAsync();
        var cities = await _unitOfWork.Cities.GetAllAsync();

        var ranked = new List<(City City, int BookingCount)>();

        foreach (var city in cities)
        {
            if (!stats.CompletedCountByCityId.TryGetValue(city.Id, out var bookingCount) || bookingCount < 1)
            {
                continue;
            }

            ranked.Add((city, bookingCount));
        }

        return ranked
            .OrderByDescending(x => x.BookingCount)
            .ThenByDescending(x => x.City.Name)
            .Take(limit)
            .Select(x => x.City);
    }

    public async Task<IEnumerable<Hotel>> GetSimilarHotelsAsync(int hotelId, int limit = 6)
    {
        var targetHotel = await _unitOfWork.Hotels.GetByIdAsync(hotelId);
        if (targetHotel == null)
        {
            return Enumerable.Empty<Hotel>();
        }

        var stats = await BuildCompletedBookingStatsAsync();
        var allHotels = await _unitOfWork.Hotels.GetAllAsync();
        var takeLimit = Math.Clamp(limit, 4, 6);

        var candidates = new List<(Hotel Hotel, int BookingCount, double AvgRating)>();

        foreach (var hotel in allHotels.Where(h => h.Id != hotelId && h.CityId == targetHotel.CityId))
        {
            if (await _unitOfWork.BlockHistory.IsEntityBlockedAsync("Hotel", hotel.Id))
            {
                continue;
            }

            stats.CompletedCountByHotelId.TryGetValue(hotel.Id, out var bookingCount);
            var reviews = await _unitOfWork.Reviews.GetReviewsByHotelAsync(hotel.Id, approvedOnly: true);
            var avgRating = reviews.Any() ? (double)reviews.Average(r => r.Rating) : 0d;

            candidates.Add((hotel, bookingCount, avgRating));
        }

        return candidates
            .OrderByDescending(x => x.BookingCount)
            .ThenByDescending(x => x.AvgRating)
            .ThenByDescending(x => x.Hotel.Id)
            .Take(takeLimit)
            .Select(x => x.Hotel);
    }

    private static BookingStatusEnum? GetLatestStatus(Booking booking)
    {
        return booking.BookingStatuses
            .OrderByDescending(bs => bs.CreatedAt)
            .FirstOrDefault()
            ?.Status;
    }

    private async Task<CompletedBookingStats> BuildCompletedBookingStatsAsync()
    {
        var completedCountByHotelId = new Dictionary<int, int>();
        var completedCountByCityId = new Dictionary<int, int>();

        var bookings = await _unitOfWork.Bookings.GetAllAsync();
        foreach (var booking in bookings)
        {
            if (GetLatestStatus(booking) != BookingStatusEnum.Completed)
            {
                continue;
            }

            var hotelId = booking.Room?.HotelId ?? 0;
            if (hotelId <= 0)
            {
                continue;
            }

            completedCountByHotelId[hotelId] = completedCountByHotelId.GetValueOrDefault(hotelId) + 1;

            var cityId = booking.Room?.Hotel?.CityId ?? 0;
            if (cityId > 0)
            {
                completedCountByCityId[cityId] = completedCountByCityId.GetValueOrDefault(cityId) + 1;
            }
        }

        return new CompletedBookingStats(completedCountByHotelId, completedCountByCityId);
    }

    private sealed record CompletedBookingStats(
        Dictionary<int, int> CompletedCountByHotelId,
        Dictionary<int, int> CompletedCountByCityId);
}
