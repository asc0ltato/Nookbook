using System.Net;
using FluentAssertions;
using NUnit.Framework;

namespace NookBook.API.Tests.Integration;

[TestFixture]
public class UploadsApiTests
{
    private CustomWebApplicationFactory _factory = null!;
    private HttpClient _client = null!;

    [SetUp]
    public void SetUp()
    {
        _factory = new CustomWebApplicationFactory();
        _client = _factory.CreateClient();
    }

    [TearDown]
    public void TearDown()
    {
        _client.Dispose();
        _factory.Dispose();
    }

    [Test]
    public async Task UploadHotelImage_WithFile_ReturnsOk()
    {
        using var content = new MultipartFormDataContent();
        var bytes = new byte[] { 0x01, 0x02, 0x03, 0x04 };
        content.Add(new ByteArrayContent(bytes), "file", "hotel-test.jpg");

        var response = await _client.PostAsync("/api/uploads/hotels", content);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task UploadRoomImage_WithoutFile_ReturnsBadRequest()
    {
        using var content = new MultipartFormDataContent();
        var response = await _client.PostAsync("/api/uploads/rooms", content);

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
