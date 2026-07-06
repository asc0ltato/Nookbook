using System.Net;
using FluentAssertions;
using NUnit.Framework;

namespace NookBook.API.Tests.Integration;

[TestFixture]
public class NotificationsApiTests : IntegrationTestBase
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
    public async Task GetMyNotifications_WithToken_ReturnsOk()
    {
        var token = await LoginAsync(_client, "admin@nookbook.com", "admin123");
        SetBearerToken(_client, token);

        var response = await _client.GetAsync("/api/notifications/me");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Test]
    public async Task MarkAsRead_WithToken_ReturnsOk()
    {
        var token = await LoginAsync(_client, "admin@nookbook.com", "admin123");
        SetBearerToken(_client, token);

        var response = await _client.PostAsync($"/api/notifications/{Guid.NewGuid()}/read", null);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
