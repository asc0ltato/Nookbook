using Microsoft.AspNetCore.Mvc;
using NookBook.API.DTOs;

namespace NookBook.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UploadsController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _configuration;

    public UploadsController(IWebHostEnvironment env, IConfiguration configuration)
    {
        _env = env;
        _configuration = configuration;
    }

    private string ResolveAssetsSubDirectory(string subFolder)
    {
        var configuredRoot = _configuration["Uploads:AssetsRoot"];
        var candidates = new[]
        {
            configuredRoot,
            Path.Combine(_env.ContentRootPath, "assets"),
            Path.Combine(_env.ContentRootPath, "..", "frontend", "public", "assets"),
        };

        string? assetsRoot = null;
        foreach (var candidate in candidates)
        {
            if (string.IsNullOrWhiteSpace(candidate))
            {
                continue;
            }

            var fullPath = Path.GetFullPath(candidate);
            if (Directory.Exists(fullPath) || candidate == configuredRoot || fullPath.EndsWith("assets", StringComparison.OrdinalIgnoreCase))
            {
                assetsRoot = fullPath;
                break;
            }
        }

        assetsRoot ??= Path.GetFullPath(Path.Combine(_env.ContentRootPath, "..", "frontend", "public", "assets"));
        Directory.CreateDirectory(assetsRoot);

        var targetDir = Path.Combine(assetsRoot, subFolder);
        Directory.CreateDirectory(targetDir);
        return targetDir;
    }

    private static string BuildUniqueFileName(string originalFileName)
    {
        var extension = Path.GetExtension(originalFileName);
        return $"{Guid.NewGuid():N}{extension}";
    }

    [HttpPost("hotels")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> UploadHotelImage([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            var error = ApiResponse<string>.ErrorResponse("Файл не получен");
            return BadRequest(error);
        }

        var originalFileName = Path.GetFileName(file.FileName);
        if (string.IsNullOrWhiteSpace(originalFileName))
        {
            var error = ApiResponse<string>.ErrorResponse("Некорректное имя файла");
            return BadRequest(error);
        }

        var hotelsDir = ResolveAssetsSubDirectory("hotels");
        var storedFileName = BuildUniqueFileName(originalFileName);
        var filePath = Path.Combine(hotelsDir, storedFileName);
        await using (var stream = System.IO.File.Create(filePath))
        {
            await file.CopyToAsync(stream);
        }

        var publicPath = $"/assets/hotels/{storedFileName}";
        var response = ApiResponse<string>.SuccessResponse(publicPath, "Файл успешно загружен");
        return Ok(response);
    }

    [HttpPost("rooms")]
    [RequestSizeLimit(10_000_000)]
    public async Task<IActionResult> UploadRoomImage([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            var error = ApiResponse<string>.ErrorResponse("Файл не получен");
            return BadRequest(error);
        }

        var originalFileName = Path.GetFileName(file.FileName);
        if (string.IsNullOrWhiteSpace(originalFileName))
        {
            var error = ApiResponse<string>.ErrorResponse("Некорректное имя файла");
            return BadRequest(error);
        }

        var roomsDir = ResolveAssetsSubDirectory("rooms");
        var storedFileName = BuildUniqueFileName(originalFileName);
        var filePath = Path.Combine(roomsDir, storedFileName);
        await using (var stream = System.IO.File.Create(filePath))
        {
            await file.CopyToAsync(stream);
        }

        var publicPath = $"/assets/rooms/{storedFileName}";
        var response = ApiResponse<string>.SuccessResponse(publicPath, "Файл успешно загружен");
        return Ok(response);
    }

    [HttpPost("avatars")]
    [RequestSizeLimit(5_000_000)]
    public async Task<IActionResult> UploadAvatarImage([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            var error = ApiResponse<string>.ErrorResponse("Файл не получен");
            return BadRequest(error);
        }

        if (!file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            var error = ApiResponse<string>.ErrorResponse("Допустимы только изображения");
            return BadRequest(error);
        }

        var originalFileName = Path.GetFileName(file.FileName);
        if (string.IsNullOrWhiteSpace(originalFileName))
        {
            var error = ApiResponse<string>.ErrorResponse("Некорректное имя файла");
            return BadRequest(error);
        }

        var avatarsDir = ResolveAssetsSubDirectory("avatars");
        var storedFileName = BuildUniqueFileName(originalFileName);
        var filePath = Path.Combine(avatarsDir, storedFileName);
        await using (var stream = System.IO.File.Create(filePath))
        {
            await file.CopyToAsync(stream);
        }

        var publicPath = $"/assets/avatars/{storedFileName}";
        var response = ApiResponse<string>.SuccessResponse(publicPath, "Аватар успешно загружен");
        return Ok(response);
    }
}