using System.Net;
using FluentAssertions;
using NUnit.Framework;

namespace NookBook.API.Tests.Integration;

[TestFixture]
public class RoomsApiTests
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
    public async Task GetRoomsByHotel_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/rooms/hotel/1");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task GetRoomById_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/rooms/1");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task GetRoomTypes_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/rooms/types");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task GetRoomAmenityTypes_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/rooms/amenity-types");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
