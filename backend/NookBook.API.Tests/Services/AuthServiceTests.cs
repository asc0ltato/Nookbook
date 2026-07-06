using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using NookBook.API.Data;
using Moq;
using NookBook.API.DTOs;
using NookBook.API.Models;
using NookBook.API.Repositories.Abstractions;
using NookBook.API.Services;
using NookBook.API.Tests.Helpers;
using NUnit.Framework;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace NookBook.API.Tests.Services;

[TestFixture]
public class AuthServiceTests
{
    private ApplicationDbContext _context = null!;
    private AuthService _authService = null!;
    private Mock<IUnitOfWork> _unitOfWorkMock = null!;

    [SetUp]
    public void SetUp()
    {
        _context = TestDbContextFactory.Create();
        TestDbContextFactory.SeedBasicCatalog(_context);

        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _unitOfWorkMock
            .Setup(u => u.BlockHistory.IsEntityBlockedAsync("User", It.IsAny<int>()))
            .ReturnsAsync(false);

        var config = TestConfiguration.Create();
        var httpFactory = new Mock<IHttpClientFactory>();
        httpFactory.Setup(f => f.CreateClient(It.IsAny<string>())).Returns(new HttpClient());

        _authService = new AuthService(
            _context,
            config,
            NullLogger<AuthService>.Instance,
            new EmailService(config, NullLogger<EmailService>.Instance),
            httpFactory.Object,
            _unitOfWorkMock.Object);
    }

    [TearDown]
    public void TearDown() => _context.Dispose();

    [Test]
    public async Task RegisterAsync_DuplicateEmail_Throws()
    {
        TestDbContextFactory.SeedUser(_context, "dup@test.by", "Password1");

        var act = () => _authService.RegisterAsync(new RegisterUserDto
        {
            Email = "dup@test.by",
            Password = "Password1"
        });

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*уже существует*");
    }

    [Test]
    public async Task RegisterAsync_ValidUser_ReturnsToken()
    {
        var (token, user) = await _authService.RegisterAsync(new RegisterUserDto
        {
            Email = "new@test.by",
            Password = "Password1",
            FirstName = "New",
            LastName = "User"
        });

        token.Should().NotBeNullOrWhiteSpace();
        user.Email.Should().Be("new@test.by");
        user.RoleId.Should().Be(2);
    }

    [Test]
    public async Task LoginAsync_WrongPassword_ThrowsUnauthorized()
    {
        TestDbContextFactory.SeedUser(_context, "login@test.by", "Password1");

        var act = () => _authService.LoginAsync(new LoginDto
        {
            Email = "login@test.by",
            Password = "WrongPass1"
        });

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Test]
    public async Task LoginAsync_BlockedUser_ThrowsUnauthorized()
    {
        var user = TestDbContextFactory.SeedUser(_context, "blocked@test.by", "Password1");
        _unitOfWorkMock
            .Setup(u => u.BlockHistory.IsEntityBlockedAsync("User", user.Id))
            .ReturnsAsync(true);

        var act = () => _authService.LoginAsync(new LoginDto
        {
            Email = "blocked@test.by",
            Password = "Password1"
        });

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*заблокирован*");
    }

    [Test]
    public void GenerateJwtToken_UserRole_ContainsUserClaim()
    {
        var user = new User { Id = 5, Email = "u@test.by", RoleId = 2, FirstName = "A", LastName = "B" };

        var token = _authService.GenerateJwtToken(user);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        jwt.Claims.Should().Contain(c => (c.Type == ClaimTypes.Role || c.Type == "role") && c.Value == "User");
        jwt.Claims.Should().Contain(c => (c.Type == ClaimTypes.NameIdentifier || c.Type == "nameid") && c.Value == "5");
    }

    [Test]
    public void GenerateJwtToken_AdminRole_ContainsAdminClaim()
    {
        var user = new User { Id = 1, Email = "a@test.by", RoleId = 4, FirstName = "A", LastName = "B" };

        var token = _authService.GenerateJwtToken(user);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        jwt.Claims.Should().Contain(c => (c.Type == ClaimTypes.Role || c.Type == "role") && c.Value == "Admin");
    }

    [Test]
    public void GenerateJwtToken_ManagerRole_ContainsManagerClaim()
    {
        var user = new User { Id = 3, Email = "m@test.by", RoleId = 3, FirstName = "M", LastName = "G" };

        var token = _authService.GenerateJwtToken(user);
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);

        jwt.Claims.Should().Contain(c => (c.Type == ClaimTypes.Role || c.Type == "role") && c.Value == "Manager");
    }
}
