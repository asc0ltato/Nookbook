using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using NookBook.API.Data;
using NookBook.API.DTOs;
using NookBook.API.Models;
using NookBook.API.Repositories.Abstractions;
using NookBook.API.Services;
using NookBook.API.Services.Abstractions;
using NookBook.API.Tests.Helpers;
using NookBook.API.Validators;
using NUnit.Framework;

namespace NookBook.API.Tests.Services;

[TestFixture]
public class ReviewServiceTests
{
    private Mock<IUnitOfWork> _uow = null!;
    private ApplicationDbContext _db = null!;
    private ReviewService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _db = TestDbContextFactory.Create();
        _uow = new Mock<IUnitOfWork>();
        var config = TestConfiguration.Create();
        var notifications = new Mock<INotificationService>();

        _service = new ReviewService(
            _uow.Object,
            _db,
            new CreateReviewValidator(),
            new CommentModerationService(),
            notifications.Object,
            new EmailService(config, NullLogger<EmailService>.Instance));
    }

    [TearDown]
    public void TearDown() => _db.Dispose();

    [Test]
    public async Task CreateReviewAsync_BookingNotFound_ReturnsError()
    {
        _uow.Setup(u => u.Bookings.GetBookingWithDetailsAsync(1)).ReturnsAsync((Booking?)null);

        var result = await _service.CreateReviewAsync(new CreateReviewDto
        {
            BookingId = 1,
            Rating = 8,
            Comment = "Отличное проживание, все понравилось"
        });

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("не найдено");
    }

    [Test]
    public async Task CreateReviewAsync_NotCompletedBooking_ReturnsError()
    {
        var booking = new Booking
        {
            Id = 1,
            UserId = 1,
            BookingStatuses = new List<BookingStatus>
            {
                new() { Status = BookingStatusEnum.Pending, CreatedAt = DateTime.UtcNow }
            }
        };

        _uow.Setup(u => u.Bookings.GetBookingWithDetailsAsync(1)).ReturnsAsync(booking);

        var result = await _service.CreateReviewAsync(new CreateReviewDto
        {
            BookingId = 1,
            Rating = 8,
            Comment = "Отличное проживание, все понравилось"
        });

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("завершения");
    }

    [Test]
    public async Task CreateReviewAsync_DuplicateReview_ReturnsError()
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
        _uow.Setup(u => u.Reviews.GetReviewByBookingAsync(1)).ReturnsAsync(new Review { Id = 5 });

        var result = await _service.CreateReviewAsync(new CreateReviewDto
        {
            BookingId = 1,
            Rating = 9,
            Comment = "Отличное проживание, все понравилось"
        });

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("уже оставили");
    }

    [Test]
    public async Task CreateReviewAsync_ValidationError_ReturnsError()
    {
        var result = await _service.CreateReviewAsync(new CreateReviewDto
        {
            BookingId = 0,
            Rating = 15,
            Comment = "коротко"
        });

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("валидации");
    }
}
