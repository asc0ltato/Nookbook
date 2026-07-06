using System.Net.Http.Json;
using System.Text.Json;

namespace NookBook.API.Tests.Integration;

public abstract class IntegrationTestBase
{
    protected static async Task<string> LoginAsync(HttpClient client, string email, string password)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        response.EnsureSuccessStatusCode();
        var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("data").GetProperty("token").GetString()!;
    }

    protected static async Task<(string Token, int UserId)> RegisterUserAsync(HttpClient client)
    {
        var email = $"user_{Guid.NewGuid():N}@test.by";
        const string password = "Password1";

        var registerResponse = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password,
            firstName = "Test",
            lastName = "Client"
        });
        registerResponse.EnsureSuccessStatusCode();

        var token = await LoginAsync(client, email, password);
        var meResponse = await client.SendAsync(new HttpRequestMessage(HttpMethod.Get, "/api/auth/me")
        {
            Headers = { Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token) }
        });
        meResponse.EnsureSuccessStatusCode();
        var meDoc = JsonDocument.Parse(await meResponse.Content.ReadAsStringAsync());
        var userId = meDoc.RootElement.GetProperty("data").GetProperty("id").GetInt32();

        return (token, userId);
    }

    protected static void SetBearerToken(HttpClient client, string token)
    {
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
    }
}
