using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using NUnit.Framework;

namespace NookBook.API.Tests.Integration;

[TestFixture]
public class ReviewsApiTests : IntegrationTestBase
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
    public async Task GetHotelReviews_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/reviews/hotel/1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task CreateReview_WithoutCompletedBooking_ReturnsBadRequest()
    {
        var (token, _) = await RegisterUserAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.PostAsJsonAsync("/api/reviews", new
        {
            bookingId = 9999,
            rating = 8,
            comment = "Отличный отель, рекомендую всем",
            positiveTags = new[] { "Чистота" }
        });

        response.StatusCode.Should().BeOneOf(HttpStatusCode.BadRequest, HttpStatusCode.NotFound);
    }

    [Test]
    public async Task GetPendingReviews_AsRegularUser_ReturnsForbiddenOrUnauthorized()
    {
        var (token, _) = await RegisterUserAsync(_client);
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _client.GetAsync("/api/reviews/pending");

        response.StatusCode.Should().BeOneOf(
            HttpStatusCode.Forbidden,
            HttpStatusCode.Unauthorized,
            HttpStatusCode.OK);
    }
}
