using System.Net;
using FluentAssertions;
using NUnit.Framework;

namespace NookBook.API.Tests.Integration;

[TestFixture]
public class RecommendationsApiTests
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
    public async Task GetPopularHotels_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/recommendations/popular-hotels?limit=5");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task GetPopularDestinations_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/recommendations/popular-destinations?limit=3");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task GetSimilarHotels_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/recommendations/similar/1?limit=4");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
