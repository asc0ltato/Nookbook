using System.Net;
using FluentAssertions;
using NUnit.Framework;

namespace NookBook.API.Tests.Integration;

[TestFixture]
public class CitiesApiTests
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
    public async Task GetCities_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/cities");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task GetCityById_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/cities/1");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task GetCityHotels_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/cities/1/hotels");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
