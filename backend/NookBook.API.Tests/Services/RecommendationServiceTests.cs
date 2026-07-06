using FluentAssertions;
using Moq;
using NookBook.API.Models;
using NookBook.API.Repositories.Abstractions;
using NookBook.API.Services;
using NookBook.API.Tests.Helpers;
using NUnit.Framework;

namespace NookBook.API.Tests.Services;

[TestFixture]
public class RecommendationServiceTests
{
    private Mock<IUnitOfWork> _uow = null!;
    private RecommendationService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _uow = new Mock<IUnitOfWork>();
        _service = new RecommendationService(_uow.Object);
    }

    [Test]
    public async Task GetPopularHotelsAsync_NoCompletedBookings_ReturnsEmpty()
    {
        _uow.Setup(u => u.Bookings.GetAllAsync()).ReturnsAsync(new List<Booking>());
        _uow.Setup(u => u.Hotels.GetAllAsync()).ReturnsAsync(new List<Hotel>
        {
            new() { Id = 1, Name = "H1", CityId = 1 }
        });

        var result = await _service.GetPopularHotelsAsync();

        result.Should().BeEmpty();
    }

    [Test]
    public async Task GetPopularHotelsAsync_WithCompletedBooking_ReturnsHotel()
    {
        var hotel = new Hotel { Id = 1, Name = "Popular", CityId = 1 };
        var room = new Room { Id = 1, HotelId = 1, Hotel = hotel, Price = 100 };
        var booking = new Booking
        {
            Id = 1,
            Room = room,
            RoomId = 1,
            BookingStatuses = new List<BookingStatus>
            {
                new() { Status = BookingStatusEnum.Completed, CreatedAt = DateTime.UtcNow }
            }
        };

        _uow.Setup(u => u.Bookings.GetAllAsync()).ReturnsAsync(new List<Booking> { booking });
        _uow.Setup(u => u.Hotels.GetAllAsync()).ReturnsAsync(new List<Hotel> { hotel });
        _uow.Setup(u => u.BlockHistory.IsEntityBlockedAsync("Hotel", 1)).ReturnsAsync(false);

        var result = (await _service.GetPopularHotelsAsync()).ToList();

        result.Should().HaveCount(1);
        result[0].Id.Should().Be(1);
    }

    [Test]
    public async Task GetPopularHotelsAsync_BlockedHotel_Excluded()
    {
        var hotel = new Hotel { Id = 1, Name = "Blocked", CityId = 1 };
        var room = new Room { Id = 1, HotelId = 1, Hotel = hotel };
        var booking = new Booking
        {
            Id = 1,
            Room = room,
            BookingStatuses = new List<BookingStatus>
            {
                new() { Status = BookingStatusEnum.Completed, CreatedAt = DateTime.UtcNow }
            }
        };

        _uow.Setup(u => u.Bookings.GetAllAsync()).ReturnsAsync(new List<Booking> { booking });
        _uow.Setup(u => u.Hotels.GetAllAsync()).ReturnsAsync(new List<Hotel> { hotel });
        _uow.Setup(u => u.BlockHistory.IsEntityBlockedAsync("Hotel", 1)).ReturnsAsync(true);

        var result = await _service.GetPopularHotelsAsync();

        result.Should().BeEmpty();
    }

    [Test]
    public async Task GetSimilarHotelsAsync_UnknownHotel_ReturnsEmpty()
    {
        _uow.Setup(u => u.Hotels.GetByIdAsync(999)).ReturnsAsync((Hotel?)null);

        var result = await _service.GetSimilarHotelsAsync(999);

        result.Should().BeEmpty();
    }

    [Test]
    public async Task GetPopularDestinationsAsync_WithCompletedBooking_ReturnsCity()
    {
        var city = new City { Id = 1, Name = "Минск", Image = "/img.jpg" };
        var hotel = new Hotel { Id = 1, CityId = 1, City = city, Name = "H" };
        var room = new Room { Id = 1, HotelId = 1, Hotel = hotel };
        var booking = new Booking
        {
            Id = 1,
            Room = room,
            BookingStatuses = new List<BookingStatus>
            {
                new() { Status = BookingStatusEnum.Completed, CreatedAt = DateTime.UtcNow }
            }
        };

        _uow.Setup(u => u.Bookings.GetAllAsync()).ReturnsAsync(new List<Booking> { booking });
        _uow.Setup(u => u.Cities.GetAllAsync()).ReturnsAsync(new List<City> { city });

        var result = (await _service.GetPopularDestinationsAsync()).ToList();

        result.Should().HaveCount(1);
        result[0].Name.Should().Be("Минск");
    }
}
