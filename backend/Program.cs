using Microsoft.EntityFrameworkCore;
using NookBook.API.Data;
using NookBook.API.Repositories;
using NookBook.API.Services;
using FluentValidation;
using NookBook.API.DTOs;
using NookBook.API.Validators;
using NookBook.API.Services.Abstractions;
using NookBook.API.Repositories.Abstractions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using NookBook.API.Models;
using System.Net;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddMemoryCache();
builder.Services.AddHttpClient();

builder.Services.AddScoped<EmailService>();

var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "your-secret-key-min-32-characters-long-for-security";
var key = Encoding.UTF8.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "NookBookAPI",
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "NookBookClient",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
    options.Events = new JwtBearerEvents
    {
        OnChallenge = context =>
        {
            context.HandleResponse();
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";
            return context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = "Не авторизован",
                errors = new[] { "Authentication required" }
            });
        },
        OnForbidden = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";
            return context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = "Доступ запрещен",
                errors = new[] { "Insufficient permissions" }
            });
        }
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

if (builder.Environment.IsEnvironment("Testing"))
{
    var testDbName = builder.Configuration["TestDatabaseName"] ?? $"NookBookTestDb_{Guid.NewGuid():N}";
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseInMemoryDatabase(testDbName));
}
else
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseNpgsql(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            npgsqlOptions => npgsqlOptions.EnableRetryOnFailure()));
}

builder.Services.AddScoped<IHotelRepository, HotelRepository>();
builder.Services.AddScoped<ICityRepository, CityRepository>();
builder.Services.AddScoped<IRoomRepository, RoomRepository>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<IFavoriteRepository, FavoriteRepository>();
builder.Services.AddScoped<IManagerRepository, ManagerRepository>();
builder.Services.AddScoped<IReviewCommentRepository, ReviewCommentRepository>();
builder.Services.AddScoped<IReviewComplaintRepository, ReviewComplaintRepository>();
builder.Services.AddScoped<IBlockHistoryRepository, BlockHistoryRepository>();
builder.Services.AddScoped<IRepository<BookingStatus>, Repository<BookingStatus>>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

builder.Services.AddScoped<IHotelService, HotelService>();
builder.Services.AddScoped<ICityService, CityService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IRoomService, RoomService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRecommendationService, RecommendationService>();
builder.Services.AddSingleton<INotificationService, NotificationService>();
builder.Services.AddSingleton<CommentModerationService>();
if (!builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddHostedService<BookingCancellationService>();
    builder.Services.AddHostedService<BookingReminderService>();
}

builder.Services.AddScoped<IValidator<CreateHotelDto>, CreateHotelValidator>();
builder.Services.AddScoped<IValidator<CreateBookingDto>, CreateBookingValidator>();
builder.Services.AddScoped<IValidator<CreateReviewDto>, CreateReviewValidator>();
builder.Services.AddScoped<IValidator<RegisterUserDto>, RegisterUserValidator>();
builder.Services.AddScoped<IValidator<CreateRoomDto>, CreateRoomValidator>();

//builder.Services.AddEndpointsApiExplorer();
//builder.Services.AddSwaggerGen(c =>
//{
//    c.SwaggerDoc("v1", new() 
//    { 
//        Title = "NookBook Hotels API", 
//        Version = "v1",
//        Description = "API для бронирования отелей в Беларуси",
//        Contact = new()
//        {
//            Name = "NookBook",
//            Email = "support@nookbook.by"
//        }
//    });
//});

var app = builder.Build();

app.UseCors("AllowAll");

if (!app.Environment.IsEnvironment("Testing"))
{
app.UseExceptionHandler(options =>
{
    options.Run(async context =>
    {
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
        context.Response.ContentType = "application/json";

        var exception = context.Features.Get<IExceptionHandlerFeature>();
        if (exception != null)
        {
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                message = "Произошла ошибка",
                errors = new[] { exception.Error.Message }
            });
        }
    });
});
}

if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Testing"))
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

var configuredAssetsRoot = app.Configuration["Uploads:AssetsRoot"];
var assetsCandidates = new[]
{
    configuredAssetsRoot,
    Path.Combine(app.Environment.ContentRootPath, "assets"),
    Path.Combine(app.Environment.ContentRootPath, "..", "frontend", "public", "assets"),
};
string? assetsRoot = null;
foreach (var candidate in assetsCandidates)
{
    if (string.IsNullOrWhiteSpace(candidate))
    {
        continue;
    }

    var fullPath = Path.GetFullPath(candidate);
    if (Directory.Exists(fullPath))
    {
        assetsRoot = fullPath;
        break;
    }
}

if (assetsRoot != null)
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(assetsRoot),
        RequestPath = "/api/assets",
        ServeUnknownFileTypes = true,
    });
}

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        context.Database.EnsureCreated();

        if (!app.Environment.IsEnvironment("Testing"))
        {
            EnsureBookingStatusSchemaUpdates(context);
            EnsureBrestCatalogSeed(context);
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while setting up the database.");
    }
}

app.Run();

static void EnsureBrestCatalogSeed(ApplicationDbContext context)
{
    const int brestCityId = 2;
    var existingBrestHotelCount = context.Hotels.Count(h => h.CityId == brestCityId);
    if (existingBrestHotelCount >= 9)
    {
        return;
    }

    var templates = new[]
    {
        new { Name = "Брест Палас", Description = "Современный отель в центре Бреста", Stars = 4, Address = "ул. Ленина, 12", Lat = 52.0940m, Lon = 23.7280m, RoomTypeId = 1, Price = 135m, MaxGuests = 2, BedCount = 1, Size = 21m },
        new { Name = "Западный Берег", Description = "Уютный отель рядом с набережной", Stars = 3, Address = "ул. Набережная, 8", Lat = 52.0905m, Lon = 23.7310m, RoomTypeId = 2, Price = 145m, MaxGuests = 2, BedCount = 2, Size = 24m },
        new { Name = "Крепость Парк", Description = "Отель возле Брестской крепости", Stars = 4, Address = "пр-т Машерова, 5", Lat = 52.0870m, Lon = 23.7215m, RoomTypeId = 3, Price = 165m, MaxGuests = 2, BedCount = 1, Size = 27m },
        new { Name = "Лазурный", Description = "Спокойный отдых в зеленой зоне города", Stars = 3, Address = "ул. Пионерская, 22", Lat = 52.0985m, Lon = 23.7420m, RoomTypeId = 1, Price = 120m, MaxGuests = 2, BedCount = 2, Size = 20m },
        new { Name = "Старый Брест", Description = "Бутик-отель в историческом районе", Stars = 4, Address = "ул. Советская, 44", Lat = 52.0915m, Lon = 23.7350m, RoomTypeId = 4, Price = 210m, MaxGuests = 3, BedCount = 2, Size = 34m },
        new { Name = "Ривьера", Description = "Семейный отель с просторными номерами", Stars = 3, Address = "ул. Московская, 73", Lat = 52.1020m, Lon = 23.7495m, RoomTypeId = 5, Price = 180m, MaxGuests = 4, BedCount = 3, Size = 31m },
        new { Name = "Сити Брест", Description = "Деловой отель рядом с транспортным узлом", Stars = 4, Address = "ул. Орджоникидзе, 3", Lat = 52.0955m, Lon = 23.7450m, RoomTypeId = 2, Price = 150m, MaxGuests = 2, BedCount = 2, Size = 23m }
    };

    foreach (var template in templates)
    {
        var exists = context.Hotels.Any(h => h.CityId == brestCityId && h.Name == template.Name);
        if (exists)
        {
            continue;
        }

        var hotel = new Hotel
        {
            Name = template.Name,
            Description = template.Description,
            Stars = template.Stars,
            CityId = brestCityId,
            Address = template.Address,
            Latitude = template.Lat,
            Longitude = template.Lon,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        context.Hotels.Add(hotel);
        context.SaveChanges();

        context.HotelImages.Add(new HotelImage
        {
            HotelId = hotel.Id,
            Image = $"/assets/hotels/hotel{(hotel.Id % 5) + 1}.jpg",
            IsMain = true
        });
        context.SaveChanges();

        context.Rooms.Add(new Room
        {
            RoomNumber = "101",
            HotelId = hotel.Id,
            RoomTypeId = template.RoomTypeId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });
        context.SaveChanges();
    }
}

static void EnsureBookingStatusSchemaUpdates(ApplicationDbContext context)
{
    context.Database.ExecuteSqlRaw("""
        ALTER TABLE "BookingStatuses"
        DROP COLUMN IF EXISTS "PaymentStatus";
        """);
}

static void EnsureRoomTypeImageSeedFallback(ApplicationDbContext context)
{
    if (context.RoomTypeImages.Any())
    {
        return;
    }

    var id = 10001;
    for (var rtId = 1; rtId <= 6; rtId++)
    {
        var urls = ApplicationDbContext.RoomTypeSeedGalleryUrls(rtId);
        for (var i = 0; i < urls.Length; i++)
        {
            context.RoomTypeImages.Add(new RoomTypeImage
            {
                Id = id++,
                RoomTypeId = rtId,
                Image = urls[i],
                IsMain = i == 0
            });
        }
    }

    context.SaveChanges();
    context.Database.ExecuteSqlRaw(
        """SELECT setval(pg_get_serial_sequence('"RoomTypeImages"', 'Id'), (SELECT COALESCE(MAX("Id"), 1) FROM "RoomTypeImages"));""");
}

public partial class Program { }
