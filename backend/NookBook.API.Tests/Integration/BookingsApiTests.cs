using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using NUnit.Framework;

namespace NookBook.API.Tests.Integration;

[TestFixture]
public class BookingsApiTests : IntegrationTestBase
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
    public async Task CreateBooking_WithoutAuth_ReturnsUnauthorized()
    {
        var response = await _client.PostAsJsonAsync("/api/bookings", new
        {
            userId = 1,
            roomId = 1,
            checkInDate = DateTime.Today.AddDays(1),
            checkOutDate = DateTime.Today.AddDays(3),
            guestCount = 2
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Test]
    public async Task CreateBooking_WithAuth_ValidData_ReturnsCreated()
    {
        var (token, userId) = await RegisterUserAsync(_client);
        SetBearerToken(_client, token);

        var checkIn = DateTime.Today.AddDays(30);
        var checkOut = DateTime.Today.AddDays(33);
        var checkInStr = checkIn.ToString("yyyy-MM-dd");
        var checkOutStr = checkOut.ToString("yyyy-MM-dd");

        var availableResponse = await _client.GetAsync(
            $"/api/rooms/hotel/1/available?checkIn={checkInStr}&checkOut={checkOutStr}&guests=2");
        availableResponse.EnsureSuccessStatusCode();

        var availableDoc = JsonDocument.Parse(await availableResponse.Content.ReadAsStringAsync());
        var rooms = availableDoc.RootElement.GetProperty("data");
        rooms.GetArrayLength().Should().BeGreaterThan(0);
        var roomId = rooms[0].GetProperty("id").GetInt32();

        var response = await _client.PostAsJsonAsync("/api/bookings", new
        {
            userId,
            roomId,
            checkInDate = checkIn,
            checkOutDate = checkOut,
            guestCount = 2
        });

        response.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.OK);
    }

    [Test]
    public async Task CreateBooking_InvalidDates_ReturnsBadRequest()
    {
        var (token, userId) = await RegisterUserAsync(_client);
        SetBearerToken(_client, token);

        var response = await _client.PostAsJsonAsync("/api/bookings", new
        {
            userId,
            roomId = 1,
            checkInDate = DateTime.Today.AddDays(-2),
            checkOutDate = DateTime.Today.AddDays(-1),
            guestCount = 2
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Test]
    public async Task GetUserBookings_WithAuth_ReturnsOk()
    {
        var (token, userId) = await RegisterUserAsync(_client);
        SetBearerToken(_client, token);

        var response = await _client.GetAsync($"/api/bookings/user/{userId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
