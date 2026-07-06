using Microsoft.EntityFrameworkCore;
using NookBook.API.Data;
using NookBook.API.Models;

namespace NookBook.API.Tests.Helpers;

public static class TestDbContextFactory
{
    public static ApplicationDbContext Create(string? databaseName = null)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName ?? Guid.NewGuid().ToString())
            .Options;

        var context = new ApplicationDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }

    public static void SeedBasicCatalog(ApplicationDbContext context)
    {
        if (context.Cities.Any())
        {
            return;
        }

        context.Roles.AddRange(
            new Role { Id = 1, Name = "Guest" },
            new Role { Id = 2, Name = "User" },
            new Role { Id = 3, Name = "Manager" },
            new Role { Id = 4, Name = "Admin" });

        context.Cities.Add(new City
        {
            Id = 1,
            Name = "Минск",
            Image = "/assets/cities/minsk.jpg",
            Latitude = 53.9m,
            Longitude = 27.5m
        });

        context.RoomTypes.Add(new RoomType
        {
            Id = 1,
            Name = "Стандарт",
            Description = "Стандартный номер",
            MaxGuests = 2,
            BedCount = 1,
            Size = 20
        });

        context.Hotels.Add(new Hotel
        {
            Id = 1,
            Name = "Тест Отель",
            Description = "Описание",
            Stars = 4,
            CityId = 1,
            Address = "ул. Тестовая, 1",
            Latitude = 53.9m,
            Longitude = 27.5m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        context.Rooms.Add(new Room
        {
            Id = 1,
            RoomNumber = "101",
            HotelId = 1,
            RoomTypeId = 1,
            Price = 100m,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        context.SaveChanges();
    }

    public static User SeedUser(
        ApplicationDbContext context,
        string email,
        string password,
        int roleId = 2,
        int? id = null)
    {
        var user = new User
        {
            Id = id ?? context.Users.Count() + 1,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            FirstName = "Test",
            LastName = "User",
            PhoneNumber = "+375291234567",
            RoleId = roleId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Users.Add(user);
        context.SaveChanges();
        return user;
    }
}
