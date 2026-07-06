using FluentAssertions;
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
public class UserServiceTests
{
    private Mock<IUnitOfWork> _uow = null!;
    private UserService _service = null!;

    [SetUp]
    public void SetUp()
    {
        _uow = new Mock<IUnitOfWork>();
        var notifications = new Mock<INotificationService>();
        _service = new UserService(_uow.Object, new RegisterUserValidator(), notifications.Object);
    }

    [Test]
    public async Task BlockUserAsync_AdminUser_ReturnsError()
    {
        _uow.Setup(u => u.Users.GetByIdAsync(1)).ReturnsAsync(new User { Id = 1, RoleId = 4 });

        var result = await _service.BlockUserAsync(1);

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("администратор");
    }

    [Test]
    public async Task BlockUserAsync_RegularUser_Succeeds()
    {
        _uow.Setup(u => u.Users.GetByIdAsync(2)).ReturnsAsync(new User { Id = 2, RoleId = 2 });
        _uow.Setup(u => u.BlockHistory.SetEntityBlockStatusAsync("User", 2, true, It.IsAny<string>(), 1))
            .Returns(Task.CompletedTask);
        _uow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.BlockUserAsync(2, "Тест");

        result.Success.Should().BeTrue();
    }

    [Test]
    public async Task AddToFavoritesAsync_HotelNotFound_ReturnsError()
    {
        _uow.Setup(u => u.Users.GetByIdAsync(1)).ReturnsAsync(new User { Id = 1 });
        _uow.Setup(u => u.Hotels.GetByIdAsync(99)).ReturnsAsync((Hotel?)null);

        var result = await _service.AddToFavoritesAsync(1, 99);

        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Отель не найден");
    }

    [Test]
    public async Task AddToFavoritesAsync_NewFavorite_Succeeds()
    {
        _uow.Setup(u => u.Users.GetByIdAsync(1)).ReturnsAsync(new User { Id = 1 });
        _uow.Setup(u => u.Hotels.GetByIdAsync(1)).ReturnsAsync(new Hotel { Id = 1, Name = "H" });
        _uow.Setup(u => u.Favorites.GetUserFavoriteAsync(1, 1)).ReturnsAsync((Favorite?)null);
        _uow.Setup(u => u.Favorites.AddAsync(It.IsAny<Favorite>())).Returns(Task.CompletedTask);
        _uow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.AddToFavoritesAsync(1, 1);

        result.Success.Should().BeTrue();
    }

    [Test]
    public async Task RemoveFromFavoritesAsync_ExistingFavorite_Succeeds()
    {
        var favorite = new Favorite { Id = 1, UserId = 1, HotelId = 1 };
        _uow.Setup(u => u.Favorites.GetUserFavoriteAsync(1, 1)).ReturnsAsync(favorite);
        _uow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);

        var result = await _service.RemoveFromFavoritesAsync(1, 1);

        result.Success.Should().BeTrue();
        _uow.Verify(u => u.Favorites.Remove(favorite), Times.Once);
    }

    [Test]
    public async Task SetUserRoleAsync_UserNotFound_ReturnsError()
    {
        _uow.Setup(u => u.Users.GetByIdAsync(99)).ReturnsAsync((User?)null);

        var result = await _service.SetUserRoleAsync(99, 3);

        result.Success.Should().BeFalse();
    }

    [Test]
    public async Task SetUserRoleAsync_ValidUser_UpdatesRole()
    {
        var user = new User { Id = 2, RoleId = 2, Email = "u@test.by", FirstName = "A", LastName = "B" };
        _uow.Setup(u => u.Users.GetByIdAsync(2)).ReturnsAsync(user);
        _uow.Setup(u => u.SaveChangesAsync()).ReturnsAsync(1);
        _uow.Setup(u => u.BlockHistory.IsEntityBlockedAsync("User", 2)).ReturnsAsync(false);

        var result = await _service.SetUserRoleAsync(2, 3);

        result.Success.Should().BeTrue();
        user.RoleId.Should().Be(3);
    }
}
