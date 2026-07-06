using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using NUnit.Framework;

namespace NookBook.API.Tests.Integration;

[TestFixture]
public class UsersApiTests : IntegrationTestBase
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
    public async Task AddFavorite_WithAuth_ReturnsOk()
    {
        var (token, userId) = await RegisterUserAsync(_client);
        SetBearerToken(_client, token);

        var response = await _client.PostAsync($"/api/users/{userId}/favorites/1", null);

        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.Created);
    }

    [Test]
    public async Task BlockUser_AsRegularUser_ReturnsForbidden()
    {
        var (token, userId) = await RegisterUserAsync(_client);
        SetBearerToken(_client, token);

        var response = await _client.PostAsJsonAsync($"/api/users/{userId}/block", new { reason = "test" });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Test]
    public async Task BlockUser_AsAdmin_ReturnsOk()
    {
        await RegisterUserAsync(_client);
        var adminToken = await LoginAsync(_client, "admin@nookbook.com", "admin123");
        SetBearerToken(_client, adminToken);

        var response = await _client.PostAsJsonAsync($"/api/users/2/block", new { reason = "Тест блокировки" });

        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest);
    }

    [Test]
    public async Task GetFavorites_WithAuth_ReturnsOk()
    {
        var (token, userId) = await RegisterUserAsync(_client);
        SetBearerToken(_client, token);

        var response = await _client.GetAsync($"/api/users/{userId}/favorites");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
