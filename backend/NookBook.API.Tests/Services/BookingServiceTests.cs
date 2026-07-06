using FluentAssertions;
using FluentValidation;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NookBook.API.DTOs;
using NookBook.API.Models;
using NookBook.API.Repositories.Abstractions;
using NookBook.API.Services;
using NookBook.API.Services.Abstractions;
using NookBook.API.Validators;
using NUnit.Framework;

namespace NookBook.API.Tests.Services;

[TestFixture]
public class BookingServiceTests
{
    private Mock<IUnitOfWork> _uow = null!;
    private BookingService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _uow = new Mock<IUnitOfWork>();
        var config = Helpers.TestConfiguration.Create();
        var notifications = new Mock<INotificationService>();

        _service = new BookingService(
            _uow.Object,
            new CreateBookingValidator(),
            new EmailService(config, NullLogger<EmailService>.Instance),
            notifications.Object,
            config);
    }

    private static Room SampleRoom(int maxGuests = 2, decimal price = 100m) => new()
    {
        Id = 1,
        HotelId = 1,
        RoomTypeId = 1,
        Price = price,
        RoomType = new RoomType { MaxGuests = maxGuests, Name = "Стандарт", Description = "" }
    };

    [Test]
    public async Task CreateBookingAsync_UserNotFound_ReturnsError()
    {
        _uow.Setup(u => u.Users.GetByIdAsync(99)).ReturnsAsync((User?)null);

        var result = await _service.CreateBookingAsync(new CreateBookingDto
        {
            UserId = 99,
            RoomId = 1,
            CheckInDate = DateTime.Today.AddDays(1),
            CheckOutDate = DateTime.Today.AddDays(3),
            GuestCount = 2
        });

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Пользователь");
    }

    [Test]
    public async Task CreateBookingAsync_RoomNotFound_ReturnsError()
    {
        _uow.Setup(u => u.Users.GetByIdAsync(1)).ReturnsAsync(new User { Id = 1, RoleId = 2 });
        _uow.Setup(u => u.Rooms.GetRoomWithDetailsAsync(1)).ReturnsAsync((Room?)null);

        var result = await _service.CreateBookingAsync(new CreateBookingDto
        {
            UserId = 1,
            RoomId = 1,
            CheckInDate = DateTime.Today.AddDays(1),
            CheckOutDate = DateTime.Today.AddDays(3),
            GuestCount = 2
        });

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Номер не найден");
    }

    [Test]
    public async Task CreateBookingAsync_RoomBlocked_ReturnsError()
    {
        var room = SampleRoom();
        _uow.Setup(u => u.Users.GetByIdAsync(1)).ReturnsAsync(new User { Id = 1, RoleId = 2 });
        _uow.Setup(u => u.Rooms.GetRoomWithDetailsAsync(1)).ReturnsAsync(room);
        _uow.Setup(u => u.BlockHistory.IsEntityBlockedAsync("Room", 1)).ReturnsAsync(true);

        var result = await _service.CreateBookingAsync(new CreateBookingDto
        {
            UserId = 1,
            RoomId = 1,
            CheckInDate = DateTime.Today.AddDays(1),
            CheckOutDate = DateTime.Today.AddDays(3),
            GuestCount = 2
        });

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("заблокирован");
    }

    [Test]
    public async Task CreateBookingAsync_RoomNotAvailable_ReturnsError()
    {
        var room = SampleRoom();
        _uow.Setup(u => u.Users.GetByIdAsync(1)).ReturnsAsync(new User { Id = 1, RoleId = 2 });
        _uow.Setup(u => u.Rooms.GetRoomWithDetailsAsync(1)).ReturnsAsync(room);
        _uow.Setup(u => u.BlockHistory.IsEntityBlockedAsync("Room", 1)).ReturnsAsync(false);
        _uow.Setup(u => u.Bookings.IsRoomAvailableAsync(1, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(false);

        var result = await _service.CreateBookingAsync(new CreateBookingDto
        {
            UserId = 1,
            RoomId = 1,
            CheckInDate = DateTime.Today.AddDays(1),
            CheckOutDate = DateTime.Today.AddDays(3),
            GuestCount = 2
        });

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("недоступен");
    }

    [Test]
    public async Task CreateBookingAsync_TooManyGuests_ReturnsError()
    {
        var room = SampleRoom(maxGuests: 1);
        _uow.Setup(u => u.Users.GetByIdAsync(1)).ReturnsAsync(new User { Id = 1, RoleId = 2 });
        _uow.Setup(u => u.Rooms.GetRoomWithDetailsAsync(1)).ReturnsAsync(room);
        _uow.Setup(u => u.BlockHistory.IsEntityBlockedAsync("Room", 1)).ReturnsAsync(false);

        var result = await _service.CreateBookingAsync(new CreateBookingDto
        {
            UserId = 1,
            RoomId = 1,
            CheckInDate = DateTime.Today.AddDays(1),
            CheckOutDate = DateTime.Today.AddDays(3),
            GuestCount = 3
        });

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("гост");
    }

    [Test]
    public async Task CreateBookingAsync_ValidRequest_CalculatesTotalPrice()
    {
        var room = SampleRoom(price: 50m);
        Booking? captured = null;

        _uow.Setup(u => u.Users.GetByIdAsync(1)).ReturnsAsync(new User { Id = 1, RoleId = 2 });
        _uow.Setup(u => u.Rooms.GetRoomWithDetailsAsync(1)).ReturnsAsync(room);
        _uow.Setup(u => u.BlockHistory.IsEntityBlockedAsync("Room", 1)).ReturnsAsync(false);
        _uow.Setup(u => u.Bookings.IsRoomAvailableAsync(1, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(true);
        _uow.Setup(u => u.Bookings.AddAsync(It.IsAny<Booking>()))
            .Callback<Booking>(b => { captured = b; b.Id = 10; })
            .Returns(Task.CompletedTask);
        _uow.Setup(u => u.BookingStatuses.AddAsync(It.IsAny<BookingStatus>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
        _uow.Setup(u => u.Bookings.GetBookingWithDetailsAsync(10))
            .ReturnsAsync(() => captured);

        var checkIn = DateTime.Today.AddDays(1);
        var checkOut = DateTime.Today.AddDays(4); // 3 nights

        await _service.CreateBookingAsync(new CreateBookingDto
        {
            UserId = 1,
            RoomId = 1,
            CheckInDate = checkIn,
            CheckOutDate = checkOut,
            GuestCount = 2
        });

        captured.Should().NotBeNull();
        captured!.TotalPrice.Should().Be(150m);
    }

    [Test]
    public async Task CancelBookingAsync_CompletedStatus_ReturnsError()
    {
        var booking = new Booking
        {
            Id = 1,
            UserId = 1,
            BookingStatuses = new List<BookingStatus>
            {
                new() { Status = BookingStatusEnum.Completed, CreatedAt = DateTime.UtcNow }
            }
        };

        _uow.Setup(u => u.Bookings.GetBookingWithDetailsAsync(1)).ReturnsAsync(booking);

        var result = await _service.CancelBookingAsync(1, 1);

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Отмена невозможна");
    }

    [Test]
    public async Task CancelBookingAsync_NotOwner_ReturnsError()
    {
        var booking = new Booking
        {
            Id = 1,
            UserId = 2,
            BookingStatuses = new List<BookingStatus>
            {
                new() { Status = BookingStatusEnum.Pending, CreatedAt = DateTime.UtcNow }
            }
        };

        _uow.Setup(u => u.Bookings.GetBookingWithDetailsAsync(1)).ReturnsAsync(booking);
        _uow.Setup(u => u.Users.GetByIdAsync(1)).ReturnsAsync(new User { Id = 1, RoleId = 2 });

        var result = await _service.CancelBookingAsync(1, 1);

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("прав");
    }
}
