using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using NUnit.Framework;

namespace NookBook.API.Tests.Integration;

[TestFixture]
public class HotelsApiTests
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
    public async Task GetHotels_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/hotels");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task GetHotelById_Existing_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/hotels/1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task SearchHotels_WithCityFilter_ReturnsOk()
    {
        var response = await _client.PostAsJsonAsync("/api/hotels/search", new
        {
            cityId = 1,
            checkInDate = DateTime.Today.AddDays(1),
            checkOutDate = DateTime.Today.AddDays(3),
            guestCount = 2
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task GetHotelsByCity_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/hotels/city/1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
